import { spawn } from 'node:child_process'
import { buildFallbackDraft } from './render.js'

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
    const jsonText = extractFirstJsonObject(candidate)
    if (!jsonText) continue
    try {
      const parsed = JSON.parse(jsonText)
      return normalizeDraft(parsed, rawSummary, lang)
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error('Codex returned no parseable report JSON.')
}

export function normalizeDraft(value, rawSummary, lang = 'zh-CN') {
  const fallback = buildFallbackDraft(rawSummary, { lang, status: 'draft' })
  return {
    ...fallback,
    ...value,
    schemaVersion: 1,
    status: value.status || 'draft',
    lang: value.lang || lang,
    date: value.date || rawSummary.date,
    generatedAt: value.generatedAt || new Date().toISOString(),
    rawSummary,
    evidence: {
      ...fallback.evidence,
      ...(value.evidence || {}),
      sessionIds: value.evidence?.sessionIds || fallback.evidence.sessionIds,
    },
  }
}

function buildPrompt(rawSummary, lang) {
  return `You are generating a local Codex daily work report.

Return ONLY one valid JSON object. Do not include Markdown fences.

Language: ${lang}
Date: ${rawSummary.date}

Required JSON shape:
{
  "schemaVersion": 1,
  "status": "draft",
  "lang": "${lang}",
  "date": "${rawSummary.date}",
  "title": "...",
  "overview": "...",
  "projects": [
    {
      "project": "...",
      "summary": "...",
      "completed": ["..."],
      "todos": ["..."],
      "ideas": ["..."],
      "evidence": { "sessionIds": ["..."], "filesModified": ["..."] }
    }
  ],
  "completed": ["..."],
  "todos": [{ "text": "...", "project": "...", "sourceSessionIds": ["..."] }],
  "tomorrow": ["..."],
  "ideas": [{ "text": "...", "project": "...", "sourceSessionIds": ["..."] }],
  "risks": ["..."],
  "evidence": { "sessionCount": 0, "sessionIds": ["..."] }
}

Use the raw summary as evidence. Extract practical todos, tomorrow tasks, and ideas.

Raw summary:
${JSON.stringify(rawSummary, null, 2)}`
}

function runCodex(codexBin, prompt, options) {
  const args = ['exec', '--json', '--skip-git-repo-check', '--ephemeral', '-']
  return new Promise((resolve, reject) => {
    const child = spawn(codexBin, args, {
      cwd: options.cwd || process.cwd(),
      stdio: 'pipe',
      env: process.env,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      stdout += chunk
    })
    child.stderr.on('data', chunk => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`codex exec failed (${code}): ${stderr || stdout}`))
        return
      }
      resolve({ stdout, stderr })
    })
    child.stdin.write(prompt)
    child.stdin.end()
  })
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
