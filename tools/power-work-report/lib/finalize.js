import path from 'node:path'
import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'

export async function finalizeReport({ paths, allowFallback = false, force = false }) {
  const draftReportPath = path.join(paths.draftDir, 'report.json')
  const proposalPath = path.join(paths.draftDir, 'memory-update.proposed.json')
  const report = await readRequiredJson(draftReportPath)
  const proposal = await readRequiredJson(proposalPath)

  if (report.status === 'codex_failed' && !allowFallback) {
    throw new Error('Refusing to finalize codex_failed draft without --allow-fallback.')
  }

  if (!force && (await exists(paths.reportMdFile))) {
    throw new Error(`Refusing to overwrite existing report without --force: ${paths.reportMdFile}`)
  }

  await fs.mkdir(paths.dayDir, { recursive: true })
  await fs.copyFile(path.join(paths.draftDir, 'report.md'), paths.reportMdFile)

  const memory = await readJson(paths.memoryFile, { schemaVersion: 1, todos: [], ideas: [], reports: [] })
  const now = new Date().toISOString()
  memory.schemaVersion = 1
  memory.todos = mergeItems(memory.todos || [], proposal.todos || [], now)
  memory.ideas = mergeItems(memory.ideas || [], proposal.ideas || [], now)
  memory.reports = upsertReport(memory.reports || [], proposal.report, paths.reportMdFile, now)
  await fs.mkdir(path.dirname(paths.memoryFile), { recursive: true })
  await fs.writeFile(paths.memoryFile, `${JSON.stringify(memory, null, 2)}\n`, 'utf8')

  return {
    reportMdFile: paths.reportMdFile,
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

function upsertReport(existing, report, reportMdFile, now) {
  if (!report) return existing
  const next = existing.filter(item => item.date !== report.date)
  next.push({
    ...report,
    reportMdFile,
    finalizedAt: now,
  })
  return next.sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

async function exists(filePath) {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
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
