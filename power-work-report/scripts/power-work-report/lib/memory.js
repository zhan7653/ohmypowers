import crypto from 'node:crypto'
import path from 'node:path'
import { promises as fs } from 'node:fs'

export function emptyMemory() {
  return { schemaVersion: 1, todos: [], ideas: [], reports: [], instructionChanges: [] }
}

export async function readMemory(filePath) {
  let value
  try {
    value = JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyMemory()
    throw new Error(`Memory JSON is missing or invalid: ${filePath}: ${error.message}`)
  }
  return normalizeMemory(value)
}

export async function writeMemoryAtomically(filePath, memory, options = {}) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.power-work-report-${options.nonce || crypto.randomBytes(6).toString('hex')}.tmp`,
  )
  try {
    await fs.writeFile(tempPath, `${JSON.stringify(normalizeMemory(memory), null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    })
    if (options.beforeCommit) await options.beforeCommit({ tempPath, filePath })
    await fs.rename(tempPath, filePath)
  } finally {
    try {
      await fs.unlink(tempPath)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
}

export function normalizeMemory(value) {
  const memory = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    ...memory,
    schemaVersion: 1,
    todos: normalizeTodos(memory.todos),
    ideas: Array.isArray(memory.ideas) ? memory.ideas.map(item => ({ ...item })) : [],
    reports: Array.isArray(memory.reports) ? memory.reports.map(item => ({ ...item })) : [],
    instructionChanges: normalizeInstructionChanges(memory.instructionChanges),
  }
}

export function appendInstructionChange(memory, audit) {
  const normalized = normalizeMemory(memory)
  const entry = normalizeInstructionChange(audit)
  if (!entry) throw new Error('Instruction change audit is incomplete.')
  const byIdentity = new Map(normalized.instructionChanges.map((item, index) => [instructionChangeIdentity(item), index]))
  const identity = instructionChangeIdentity(entry)
  const index = byIdentity.get(identity)
  if (index === undefined) normalized.instructionChanges.push(entry)
  else normalized.instructionChanges[index] = entry
  return normalized
}

export function normalizeInstructionChanges(items) {
  if (!Array.isArray(items)) return []
  const result = []
  const seen = new Set()
  for (const item of items) {
    const normalized = normalizeInstructionChange(item)
    if (!normalized) continue
    const identity = instructionChangeIdentity(normalized)
    if (seen.has(identity)) continue
    seen.add(identity)
    result.push(normalized)
  }
  return result
}

function normalizeInstructionChange(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const proposalId = String(value.proposalId || '').trim()
  const candidateId = String(value.candidateId || '').trim()
  const action = String(value.action || '').trim()
  const targetPath = String(value.targetPath || '').trim()
  if (!proposalId || !candidateId || !['add', 'update', 'remove'].includes(action) || !targetPath) return null
  return {
    ...value,
    changeId: String(value.changeId || proposalId).trim(),
    proposalId,
    candidateId,
    action,
    targetPath,
  }
}

function instructionChangeIdentity(value) {
  return value.changeId || value.proposalId || `${value.candidateId}::${value.action}::${value.targetPath}::${value.afterSha256 || ''}`
}

export function normalizeTodos(items) {
  if (!Array.isArray(items)) return []
  return items
    .map(item => {
      if (typeof item === 'string') return { text: item, project: '', status: 'open' }
      return {
        ...item,
        text: String(item?.text || '').trim(),
        project: item?.project || '',
        status: normalizeTodoStatus(item?.status),
      }
    })
    .filter(item => item.text)
}

export function normalizeTodoStatus(status) {
  if (status === 'done' || status === 'dropped') return status
  return 'open'
}

export function itemKey(item) {
  return `${item.project || ''}::${normalizeText(item.text)}`
}

export function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function stableId(project, text) {
  return crypto.createHash('sha1').update(`${project || ''}\n${normalizeText(text)}`).digest('hex').slice(0, 16)
}

export function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}
