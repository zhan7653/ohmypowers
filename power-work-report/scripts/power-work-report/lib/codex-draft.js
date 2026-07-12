import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import { normalizeReportShape } from './render.js'
import {
  emptyReusableInsights,
  normalizeMemoInput,
  normalizePersonalReflection,
  normalizeReusableInsights,
} from './insights.js'

const DEFAULT_MODEL = 'gpt-5.6-luna'
const DEFAULT_REASONING_EFFORT = 'medium'
const REPORT_SCHEMA_PATH = fileURLToPath(new URL('../schemas/report.schema.json', import.meta.url))

export async function generateDraftWithCodex(rawSummary, options = {}) {
  const codexBin = options.codexBin || process.env.POWER_WORK_REPORT_CODEX_BIN || 'codex'
  const model = options.model || process.env.POWER_WORK_REPORT_MODEL || DEFAULT_MODEL
  const reasoningEffort =
    options.reasoningEffort || process.env.POWER_WORK_REPORT_REASONING_EFFORT || DEFAULT_REASONING_EFFORT
  const personalReflection = normalizeMemoInput(options.memo)
  const prompt = buildPrompt(rawSummary, options.lang || 'zh-CN', personalReflection)
  const result = await runCodex(codexBin, prompt, {
    ...options,
    model,
    reasoningEffort,
  })
  return parseDraftJson(result.stdout, rawSummary, options.lang || 'zh-CN', { personalReflection })
}

export function parseDraftJson(stdout, rawSummary, lang = 'zh-CN', options = {}) {
  const candidates = []
  for (const line of String(stdout || '').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('{')) continue
    try {
      const event = JSON.parse(trimmed)
      if (event.type === 'item.completed' && event.item?.type === 'agent_message') {
        candidates.push(String(event.item.text || ''))
      }
    } catch {
      candidates.push(trimmed)
    }
  }
  candidates.push(String(stdout || ''))

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed?.type === 'item.completed' && parsed.item?.type === 'agent_message') {
        return normalizeDraft(JSON.parse(parsed.item.text), rawSummary, lang, options)
      }
      if (parsed?.schemaVersion || parsed?.metadata || parsed?.overview) {
        return normalizeDraft(parsed, rawSummary, lang, options)
      }
    } catch {
      const jsonText = extractFirstJsonObject(candidate)
      if (!jsonText) continue
      try {
        const parsed = JSON.parse(jsonText)
        if (parsed?.type === 'item.completed' && parsed.item?.type === 'agent_message') {
          return normalizeDraft(JSON.parse(parsed.item.text), rawSummary, lang, options)
        }
        if (parsed?.schemaVersion || parsed?.metadata || parsed?.overview) {
          return normalizeDraft(parsed, rawSummary, lang, options)
        }
      } catch {
        // Try the next candidate.
      }
    }
  }

  throw new Error('Codex returned no parseable report JSON.')
}

export function normalizeDraft(value, rawSummary, lang = 'zh-CN', options = {}) {
  const report = normalizeReportShape(value, rawSummary, lang)
  const memoReflection = options.personalReflection || normalizeMemoInput(options.memo)
  const personalReflection = normalizePersonalReflection(value.personalReflection, memoReflection)
  const reusableInsights =
    report.status === 'codex_failed'
      ? emptyReusableInsights(['Codex fallback output is not valid reusable-insight evidence.'])
      : normalizeReusableInsights(value.reusableInsights, {
          rawSummary,
          personalReflection,
        })
  reusableInsights.warnings = Array.from(
    new Set([...(rawSummary.context?.warnings || []), ...reusableInsights.warnings]),
  ).sort()
  return { ...report, personalReflection, reusableInsights }
}

function buildPrompt(rawSummary, lang, personalReflection) {
  return `You are generating a local Codex daily work report.

Return only the JSON object required by the configured output schema. Do not include Markdown fences.

Language: ${lang}
Date: ${rawSummary.date}

Set schemaVersion to 2, status to draft, lang and date to the values above, metadata.projectCount to ${rawSummary.projects.length}, and metadata.sessionCount to ${rawSummary.sessionCount}. Use an ISO-8601 generatedAt value and metadata.routeSteps ["Issue Contract", "Bounded /goal", "Verifier Evidence", "Markdown-first Report"].

Use the raw summary as evidence. Preserve local paths when useful. Keep Markdown order compatible with:
今日概览, 关键成果, 关键决策, 明日优先, 后续待办, 项目进展, 风险与阻塞, 想法与灵感, 附录：证据索引.
Split tasks into tomorrowPriority and backlog. Put only concrete ideas into ideas.chips.
rawSummary.sessions/projects are today's event-derived data after timezone date filtering.
rawSummary.context is historical background only. Use it for continuity, but do not count it as today's completed work, today's sessions, or today's files.
tasks.tomorrowPriority and tasks.backlog are top-level human attention surfaces. Include only project-level or cross-project priorities there.
Keep local-file, one-off operational, or narrow implementation details out of top-level tasks. If still useful, place them under the relevant projectSections[].pending item instead.

Set personalReflection to the supplied normalized memo state. When it is provided, write a concise reviewable summary rather than inventing or expanding private details. When it is skipped or not provided, keep its summary empty and provenance none.
Set reusableInsights with all four candidate arrays and warnings. Compare today's evidence only with rawSummary.context.finalizedReports; each entry contains a parsed finalized report.json body, while rawSummary.context.recentReports is compatibility metadata only. Historical context is never today's work. Cite only session IDs/file paths from rawSummary.sessions, report sourceRef values from readable finalized context reports, or user-memo:${rawSummary.date} when the memo is provided.
Automatic candidates require at least two distinct valid evidence items. An automatic global_instruction candidate additionally requires evidence from at least two projects. A user-nominated candidate may use one user_memo evidence item, but must remain unconfirmed. Never use codex_failed, fallback, unfinalized draft, missing, or unreadable history as evidence. Do not turn temporary state, ordinary todos, Issue/PR progress, guesses, or purely historical descriptions into instruction candidates. Skill and automation entries are recommendations only.

Normalized personal memo state:
${JSON.stringify(personalReflection, null, 2)}

Raw summary:
${JSON.stringify(rawSummary, null, 2)}`
}

async function runCodex(codexBin, prompt, options) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pwr-codex-'))
  const args = buildCodexArgs({
    model: options.model,
    reasoningEffort: options.reasoningEffort,
    tempDir,
    schemaPath: options.schemaPath,
  })
  const stdoutPath = path.join(tempDir, 'stdout.jsonl')
  const stderrPath = path.join(tempDir, 'stderr.log')
  const stdoutHandle = await fs.open(stdoutPath, 'w')
  const stderrHandle = await fs.open(stderrPath, 'w')

  try {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(codexBin, args, {
        cwd: tempDir,
        stdio: ['pipe', stdoutHandle.fd, stderrHandle.fd],
        env: process.env,
      })
      child.on('error', reject)
      child.on('close', resolve)
      child.stdin.write(prompt)
      child.stdin.end()
    })
    await stdoutHandle.close()
    await stderrHandle.close()

    const stdout = await readText(stdoutPath)
    const stderr = await readText(stderrPath)
    if (code !== 0) throw new Error(`codex exec failed (${code}): ${stderr || stdout}`)
    return { stdout, stderr }
  } finally {
    await stdoutHandle.close().catch(() => {})
    await stderrHandle.close().catch(() => {})
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

export function buildCodexArgs({
  model = DEFAULT_MODEL,
  reasoningEffort = DEFAULT_REASONING_EFFORT,
  tempDir,
  schemaPath = REPORT_SCHEMA_PATH,
}) {
  return [
    'exec',
    '--json',
    '--skip-git-repo-check',
    '--ephemeral',
    '--model',
    model,
    '--sandbox',
    'read-only',
    '--config',
    `model_reasoning_effort="${reasoningEffort}"`,
    '--cd',
    tempDir,
    '--output-schema',
    schemaPath,
    '-',
  ]
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch {
    return ''
  }
}

function extractFirstJsonObject(text) {
  const source = String(text || '').trim()
  const start = source.indexOf('{')
  if (start === -1) return ''
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < source.length; i += 1) {
    const char = source[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  return ''
}
