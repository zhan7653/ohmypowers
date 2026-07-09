import path from 'node:path'
import { promises as fs } from 'node:fs'
import { dateWindow, localDateForTimestamp, resolveTimezone } from './paths.js'
import { readMemory } from './memory.js'

const USER_LIMIT = 1200
const ASSISTANT_LIMIT = 1200
const DEFAULT_LOOKBACK_DAYS = 30

export async function collectDay({ date, codexHome, lookbackDays = DEFAULT_LOOKBACK_DAYS, timezone, memoryFile }) {
  const resolvedTimezone = resolveTimezone(timezone)
  const resolvedLookbackDays = normalizeLookbackDays(lookbackDays)
  const scanDirs = dateWindow({ codexHome, date, lookbackDays: resolvedLookbackDays, timezone: resolvedTimezone })
  const scan = {
    startDate: scanDirs[0]?.date || date,
    endDate: date,
    directories: [],
    files: [],
    scannedDirectoryCount: 0,
    scannedFileCount: 0,
  }
  const sessions = []
  const skippedEvents = emptySkippedEvents()
  const seenFiles = new Set()

  for (const dir of scanDirs) {
    const files = await findRolloutFiles(dir.path)
    scan.directories.push({
      date: dir.date,
      path: dir.path,
      exists: files.exists,
      fileCount: files.paths.length,
    })
    if (files.exists) scan.scannedDirectoryCount += 1

    for (const filePath of files.paths) {
      if (seenFiles.has(filePath)) continue
      seenFiles.add(filePath)
      scan.files.push(filePath)
      const result = await summarizeRollout(filePath, { targetDate: date, timezone: resolvedTimezone })
      addSkippedEvents(skippedEvents, result.skippedEvents)
      if (result.summary) sessions.push(result.summary)
    }
  }
  scan.scannedFileCount = scan.files.length

  const projects = groupProjects(sessions)
  const context = memoryFile ? await buildContext(memoryFile) : emptyContext()
  return {
    schemaVersion: 1,
    date,
    generatedAt: new Date().toISOString(),
    codexHome,
    timezone: resolvedTimezone,
    lookbackDays: resolvedLookbackDays,
    scan,
    skippedEvents,
    sessionDir: scanDirs.at(-1)?.path || '',
    sessionCount: sessions.length,
    context,
    projects,
    sessions,
  }
}

export async function writeRawSummary({ date, codexHome, outDir, lookbackDays, timezone, memoryFile }) {
  const summary = await collectDay({ date, codexHome, lookbackDays, timezone, memoryFile })
  await fs.mkdir(outDir, { recursive: true })
  const rawSummaryPath = path.join(outDir, 'raw-summary.json')
  await fs.writeFile(rawSummaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  return { summary, rawSummaryPath }
}

async function findRolloutFiles(sessionDir) {
  let entries
  try {
    entries = await fs.readdir(sessionDir, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return { exists: false, paths: [] }
    throw error
  }

  const files = entries
    .filter(entry => entry.isFile() && /^rollout-.*\.jsonl$/.test(entry.name))
    .map(entry => path.join(sessionDir, entry.name))
    .sort()
  return { exists: true, paths: files }
}

async function summarizeRollout(filePath, { targetDate, timezone }) {
  const raw = await fs.readFile(filePath, 'utf8')
  const events = []
  const fileMetadata = { cwd: '', title: '' }
  const skippedEvents = emptySkippedEvents()

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      const event = JSON.parse(line)
      const payload = event.payload || {}
      if (event.cwd && !fileMetadata.cwd) fileMetadata.cwd = String(event.cwd)
      if (payload.cwd && !fileMetadata.cwd) fileMetadata.cwd = String(payload.cwd)
      if (payload.title && !fileMetadata.title) fileMetadata.title = String(payload.title)
      const timestamp = typeof event.timestamp === 'string' ? event.timestamp : ''
      if (!timestamp) {
        skippedEvents.missingTimestamp += 1
        continue
      }
      const localDate = localDateForTimestamp(timestamp, timezone)
      if (!localDate) {
        skippedEvents.invalidTimestamp += 1
        continue
      }
      if (localDate !== targetDate) {
        skippedEvents.outsideTargetDate += 1
        continue
      }
      events.push(event)
    } catch {
      skippedEvents.malformedLines += 1
    }
  }

  if (!events.length) return { summary: null, skippedEvents }

  const sessionId = extractSessionId(filePath)
  const summary = {
    id: sessionId,
    filePath,
    startedAt: '',
    endedAt: '',
    cwd: '',
    title: '',
    userMessages: [],
    assistantMessages: [],
    commands: [],
    tools: {},
    filesModified: [],
    todos: [],
    ideas: [],
    malformedLines: skippedEvents.malformedLines,
    skippedEvents,
  }
  const filesModified = new Set()

  for (const event of events) {
    const timestamp = typeof event.timestamp === 'string' ? event.timestamp : ''
    if (timestamp && !summary.startedAt) summary.startedAt = timestamp
    if (timestamp) summary.endedAt = timestamp

    const payload = event.payload || {}

    if (event.cwd && !summary.cwd) summary.cwd = String(event.cwd)
    if (payload.cwd && !summary.cwd) summary.cwd = String(payload.cwd)
    if (payload.title && !summary.title) summary.title = String(payload.title)

    if (event.type === 'event_msg' && payload.type === 'user_message') {
      const text = sanitize(payload.message, USER_LIMIT)
      if (text) {
        summary.userMessages.push({ timestamp, text })
        collectTodoIdeas(text, summary, sessionId)
      }
      continue
    }

    if (event.type === 'event_msg' && payload.type === 'exec_command_end') {
      const command = Array.isArray(payload.command) ? payload.command.join(' ') : ''
      summary.commands.push({
        timestamp,
        command,
        exitCode: Number(payload.exit_code ?? 0),
        status: String(payload.status ?? ''),
      })
      continue
    }

    if (event.type !== 'response_item') continue

    if (payload.type === 'function_call' || payload.type === 'custom_tool_call') {
      const name = String(payload.name || payload.type)
      summary.tools[name] = (summary.tools[name] || 0) + 1
      if (name === 'apply_patch') {
        for (const file of parsePatchFiles(payload.arguments ?? payload.input)) {
          filesModified.add(file)
        }
      }
      continue
    }

    if (payload.type === 'message' && payload.role === 'assistant') {
      const text = sanitize(extractAssistantText(payload), ASSISTANT_LIMIT)
      if (text) {
        summary.assistantMessages.push({ timestamp, text })
        collectTodoIdeas(text, summary, sessionId)
      }
    }
  }

  summary.filesModified = Array.from(filesModified).sort()
  if (!summary.cwd) summary.cwd = fileMetadata.cwd
  if (!summary.title) summary.title = fileMetadata.title
  if (!summary.cwd) summary.cwd = '(unknown project)'
  if (!summary.title) summary.title = summary.userMessages[0]?.text?.slice(0, 80) || sessionId
  return { summary, skippedEvents }
}

function groupProjects(sessions) {
  const map = new Map()
  for (const session of sessions) {
    const key = session.cwd || '(unknown project)'
    if (!map.has(key)) {
      map.set(key, {
        project: key,
        sessionIds: [],
        sessionCount: 0,
        todos: [],
        ideas: [],
        filesModified: [],
      })
    }
    const project = map.get(key)
    project.sessionIds.push(session.id)
    project.sessionCount += 1
    project.todos.push(...session.todos)
    project.ideas.push(...session.ideas)
    project.filesModified.push(...session.filesModified)
  }

  return Array.from(map.values()).map(project => ({
    ...project,
    filesModified: Array.from(new Set(project.filesModified)).sort(),
  }))
}

function extractAssistantText(payload) {
  if (!Array.isArray(payload.content)) return ''
  return payload.content
    .map(part => {
      if (typeof part?.text === 'string') return part.text
      if (typeof part?.content === 'string') return part.content
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

function parsePatchFiles(rawPatch) {
  const files = []
  for (const line of String(rawPatch || '').split('\n')) {
    const match = /^\*\*\* (?:Update|Add|Delete) File: (.+)$/.exec(line)
    if (match?.[1]) files.push(match[1].trim())
  }
  return files
}

function collectTodoIdeas(text, summary, sessionId) {
  const lines = String(text || '').split(/\n|。|；|;/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (/(todo|待办|后续|明天|next step|follow[- ]?up)/i.test(line)) {
      summary.todos.push({ text: cleanListMarker(line), sourceSessionIds: [sessionId] })
    }
    if (/(idea|想法|灵感|可以考虑|值得尝试)/i.test(line)) {
      summary.ideas.push({ text: cleanListMarker(line), sourceSessionIds: [sessionId] })
    }
  }
}

function cleanListMarker(value) {
  return String(value).replace(/^[-*]\s*/, '').trim()
}

function sanitize(value, limit) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}...`
}

function extractSessionId(filePath) {
  return path.basename(filePath, '.jsonl').replace(/^rollout-/, '')
}

async function buildContext(memoryFile) {
  const memory = await readMemory(memoryFile)
  return {
    openTodos: (memory.todos || [])
      .filter(item => item.status === 'open')
      .map(item => ({
        id: item.id || '',
        text: item.text,
        project: item.project || '',
        status: item.status || 'open',
      })),
    recentReports: (memory.reports || []).slice(-10).map(item => ({
      date: item.date || '',
      title: item.title || '',
      status: item.status || '',
      generatedAt: item.generatedAt || '',
      sessionIds: Array.isArray(item.sessionIds) ? item.sessionIds : [],
    })),
  }
}

function emptyContext() {
  return { openTodos: [], recentReports: [] }
}

function emptySkippedEvents() {
  return {
    malformedLines: 0,
    missingTimestamp: 0,
    invalidTimestamp: 0,
    outsideTargetDate: 0,
  }
}

function addSkippedEvents(target, source) {
  for (const key of Object.keys(target)) {
    target[key] += Number(source?.[key] || 0)
  }
}

function normalizeLookbackDays(value) {
  const number = Number(value ?? DEFAULT_LOOKBACK_DAYS)
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`Invalid --lookback-days "${value}". Expected a non-negative integer.`)
  }
  return number
}
