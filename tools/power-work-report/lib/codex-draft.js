import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { normalizeReportShape } from './render.js'

export async function generateDraftWithCodex(rawSummary, options = {}) {
  const codexBin = options.codexBin || process.env.POWER_WORK_REPORT_CODEX_BIN || 'codex'
  const prompt = buildPrompt(rawSummary, options.lang || 'zh-CN')
  const result = await runCodex(codexBin, prompt, options)
  return parseDraftJson(result.stdout, rawSummary, options.lang || 'zh-CN')
}

export function parseDraftJson(stdout, rawSummary, lang = 'zh-CN') {
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
        return normalizeDraft(JSON.parse(parsed.item.text), rawSummary, lang)
      }
      if (parsed?.schemaVersion || parsed?.metadata || parsed?.overview) {
        return normalizeDraft(parsed, rawSummary, lang)
      }
    } catch {
      const jsonText = extractFirstJsonObject(candidate)
      if (!jsonText) continue
      try {
        const parsed = JSON.parse(jsonText)
        if (parsed?.type === 'item.completed' && parsed.item?.type === 'agent_message') {
          return normalizeDraft(JSON.parse(parsed.item.text), rawSummary, lang)
        }
        if (parsed?.schemaVersion || parsed?.metadata || parsed?.overview) {
          return normalizeDraft(parsed, rawSummary, lang)
        }
      } catch {
        // Try the next candidate.
      }
    }
  }

  throw new Error('Codex returned no parseable report JSON.')
}

export function normalizeDraft(value, rawSummary, lang = 'zh-CN') {
  return normalizeReportShape(value, rawSummary, lang)
}

function buildPrompt(rawSummary, lang) {
  return `You are generating a local Codex daily work report.

Return ONLY one valid JSON object. Do not include Markdown fences.

Language: ${lang}
Date: ${rawSummary.date}

Required JSON shape:
{
  "schemaVersion": 2,
  "status": "draft",
  "lang": "${lang}",
  "date": "${rawSummary.date}",
  "generatedAt": "ISO-8601 timestamp",
  "metadata": {
    "date": "${rawSummary.date}",
    "status": "draft",
    "projectCount": ${rawSummary.projects.length},
    "sessionCount": ${rawSummary.sessionCount},
    "title": "Codex 工作日报 · ${rawSummary.date}",
    "lead": "one concise lead paragraph",
    "routeSteps": ["Issue Contract", "Bounded /goal", "Verifier Evidence", "Markdown-first Report"]
  },
  "overview": {
    "overview": "one readable overview paragraph",
    "readingFocus": "one sentence naming what to read first"
  },
  "outcomes": [
    { "title": "short outcome title", "body": "concrete outcome detail" }
  ],
  "decisions": [
    { "icon": "short symbol", "title": "short decision title", "body": "decision detail" }
  ],
  "tasks": {
    "tomorrowPriority": [
      { "text": "task", "project": "project path", "sourceSessionIds": ["..."] }
    ],
    "backlog": [
      { "text": "task", "project": "project path", "sourceSessionIds": ["..."] }
    ]
  },
  "projectSections": [
    {
      "project": "display name",
      "path": "project path",
      "badge": "short badge",
      "results": ["..."],
      "pending": ["..."],
      "ideas": ["..."],
      "evidence": { "sessionIds": ["..."], "filesModified": ["..."] }
    }
  ],
  "riskGroups": {
    "blocked": ["..."],
    "watch": ["..."],
    "limit": ["..."]
  },
  "ideas": {
    "chips": [
      { "text": "idea", "project": "project path", "sourceSessionIds": ["..."] }
    ]
  },
  "appendix": {
    "sessionIds": ["..."],
    "filesModified": ["..."]
  }
}

Use the raw summary as evidence. Preserve local paths when useful. Keep Markdown order compatible with:
今日概览, 关键成果, 关键决策, 明日优先, 后续待办, 项目进展, 风险与阻塞, 想法与灵感, 附录：证据索引.
Split tasks into tomorrowPriority and backlog. Put only concrete ideas into ideas.chips.
rawSummary.sessions/projects are today's event-derived data after timezone date filtering.
rawSummary.context is historical background only. Use it for continuity, but do not count it as today's completed work, today's sessions, or today's files.
tasks.tomorrowPriority and tasks.backlog are top-level human attention surfaces. Include only project-level or cross-project priorities there.
Keep local-file, one-off operational, or narrow implementation details out of top-level tasks. If still useful, place them under the relevant projectSections[].pending item instead.

Raw summary:
${JSON.stringify(rawSummary, null, 2)}`
}

async function runCodex(codexBin, prompt, options) {
  const args = ['exec', '--json', '--skip-git-repo-check', '--ephemeral', '-']
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pwr-codex-'))
  const stdoutPath = path.join(tempDir, 'stdout.jsonl')
  const stderrPath = path.join(tempDir, 'stderr.log')
  const stdoutHandle = await fs.open(stdoutPath, 'w')
  const stderrHandle = await fs.open(stderrPath, 'w')

  try {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(codexBin, args, {
        cwd: options.cwd || process.cwd(),
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
