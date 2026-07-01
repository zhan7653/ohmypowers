import path from 'node:path'
import { promises as fs } from 'node:fs'
import { sessionDirForDate } from './paths.js'

const USER_LIMIT = 1200
const ASSISTANT_LIMIT = 1200

export async function collectDay({ date, codexHome }) {
  const sessionDir = sessionDirForDate(codexHome, date)
  const files = await findRolloutFiles(sessionDir)
  const sessions = []

  for (const filePath of files) {
    sessions.push(await summarizeRollout(filePath))
  }

  const projects = groupProjects(sessions)
  return {
    schemaVersion: 1,
    date,
    generatedAt: new Date().toISOString(),
    codexHome,
    sessionDir,
    sessionCount: sessions.length,
    projects,
    sessions,
  }
}

export async function writeRawSummary({ date, codexHome, outDir }) {
  const summary = await collectDay({ date, codexHome })
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
    if (error?.code === 'ENOENT') return []
    throw error
  }

  const files = entries
    .filter(entry => entry.isFile() && /^rollout-.*\.jsonl$/.test(entry.name))
    .map(entry => path.join(sessionDir, entry.name))
    .sort()
  return files
}

async function summarizeRollout(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  const events = []
  let malformedLines = 0

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      events.push(JSON.parse(line))
    } catch {
      malformedLines += 1
    }
  }

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
    malformedLines,
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
  if (!summary.cwd) summary.cwd = '(unknown project)'
  if (!summary.title) summary.title = summary.userMessages[0]?.text?.slice(0, 80) || sessionId
  return summary
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
