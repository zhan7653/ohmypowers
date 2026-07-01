import path from 'node:path'
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'

export async function finalizeReport({ paths, allowFallback = false }) {
  const draftReportPath = path.join(paths.draftDir, 'report.json')
  const proposalPath = path.join(paths.draftDir, 'memory-update.proposed.json')
  const report = await readRequiredJson(draftReportPath)
  const proposal = await readRequiredJson(proposalPath)

  if (report.status === 'codex_failed' && !allowFallback) {
    throw new Error('Refusing to finalize codex_failed draft without --allow-fallback.')
  }

  await fs.mkdir(paths.finalDir, { recursive: true })
  for (const file of ['report.md', 'report.html', 'report.json']) {
    await fs.copyFile(path.join(paths.draftDir, file), path.join(paths.finalDir, file))
  }

  const memory = await readJson(paths.memoryFile, { schemaVersion: 1, todos: [], ideas: [], reports: [] })
  const now = new Date().toISOString()
  memory.schemaVersion = 1
  memory.todos = mergeItems(memory.todos || [], proposal.todos || [], now)
  memory.ideas = mergeItems(memory.ideas || [], proposal.ideas || [], now)
  memory.reports = upsertReport(memory.reports || [], proposal.report, paths.finalDir, now)
  await fs.mkdir(path.dirname(paths.memoryFile), { recursive: true })
  await fs.writeFile(paths.memoryFile, `${JSON.stringify(memory, null, 2)}\n`, 'utf8')

  return {
    finalDir: paths.finalDir,
    memoryFile: paths.memoryFile,
    report,
    memory,
  }
}

function mergeItems(existing, proposed, now) {
  const merged = existing.map(item => ({ ...item }))
  const byKey = new Map(merged.map((item, index) => [itemKey(item), index]))

  for (const item of proposed) {
    const normalized = normalizeText(item.text)
    if (!normalized) continue
    const key = itemKey(item)
    const index = byKey.get(key)
    if (index !== undefined) {
      const current = merged[index]
      current.sourceSessionIds = unique([...(current.sourceSessionIds || []), ...(item.sourceSessionIds || [])])
      current.sourceDates = unique([...(current.sourceDates || []), item.sourceDate].filter(Boolean))
      current.updatedAt = now
      continue
    }

    const created = {
      id: stableId(item.project || '', item.text || ''),
      text: item.text,
      project: item.project || '',
      sourceDate: item.sourceDate || '',
      sourceDates: item.sourceDate ? [item.sourceDate] : [],
      sourceSessionIds: unique(item.sourceSessionIds || []),
      status: item.status || 'open',
      createdAt: now,
      updatedAt: now,
    }
    byKey.set(key, merged.length)
    merged.push(created)
  }
  return merged
}

function upsertReport(existing, report, finalDir, now) {
  if (!report) return existing
  const next = existing.filter(item => item.date !== report.date)
  next.push({
    ...report,
    finalDir,
    finalizedAt: now,
  })
  return next.sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

async function readRequiredJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Required JSON file is missing or invalid: ${filePath}: ${error.message}`)
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function itemKey(item) {
  return `${item.project || ''}::${normalizeText(item.text)}`
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function stableId(project, text) {
  return crypto.createHash('sha1').update(`${project}\n${normalizeText(text)}`).digest('hex').slice(0, 16)
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}
