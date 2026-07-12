import crypto from 'node:crypto'
import path from 'node:path'
import { promises as fs } from 'node:fs'

export function emptyMemory() {
  return { schemaVersion: 1, todos: [], ideas: [], reports: [], instructionChanges: [] }
}

export async function readMemory(filePath) {
  return (await readMemorySnapshot(filePath)).memory
}

export async function readMemorySnapshot(filePath) {
  let rawBytes
  try {
    rawBytes = await fs.readFile(filePath)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { memory: emptyMemory(), exists: false, rawBytes: null, mode: null }
    }
    throw new Error(`Memory JSON is missing or invalid: ${filePath}: ${error.message}`)
  }
  let value
  try {
    value = JSON.parse(rawBytes.toString('utf8'))
  } catch (error) {
    throw new Error(`Memory JSON is missing or invalid: ${filePath}: ${error.message}`)
  }
  const stat = await fs.stat(filePath)
  return { memory: normalizeMemory(value), exists: true, rawBytes, mode: stat.mode }
}

export async function writeMemoryAtomically(filePath, memory, options = {}) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const serializedBytes = Buffer.from(`${JSON.stringify(normalizeMemory(memory), null, 2)}\n`, 'utf8')
  const nonce = options.nonce || crypto.randomBytes(6).toString('hex')
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.power-work-report-${nonce}.tmp`,
  )
  const quarantinePath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.power-work-report-${nonce}.previous`,
  )
  let quarantined = false
  try {
    await fs.writeFile(tempPath, serializedBytes, { flag: 'wx' })
    if (options.expectedMode !== null && options.expectedMode !== undefined) {
      await fs.chmod(tempPath, options.expectedMode)
    }
    if (options.beforeCommit) await options.beforeCommit({ tempPath, filePath })

    if (options.expectedExists) {
      try {
        await fs.rename(filePath, quarantinePath)
        quarantined = true
      } catch (error) {
        if (error?.code === 'ENOENT') throw memoryWriteError('memory_drift', 'Memory disappeared before the audit could be committed.')
        throw memoryWriteError('memory_atomic_write_failed', `Could not quarantine memory before commit: ${error.message}`)
      }
      const currentBytes = await fs.readFile(quarantinePath)
      if (!Buffer.isBuffer(options.expectedBytes) || !currentBytes.equals(options.expectedBytes)) {
        await restoreQuarantinedMemory(quarantinePath, filePath)
        quarantined = false
        throw memoryWriteError('memory_drift', 'Memory changed before the audit could be committed.')
      }
    } else if (await pathExists(filePath)) {
      throw memoryWriteError('memory_drift', 'Memory was created before the audit could be committed.')
    }

    try {
      await fs.link(tempPath, filePath)
    } catch (error) {
      if (error?.code === 'EEXIST') {
        throw memoryWriteError('memory_drift', 'Memory changed while the audit was being committed.', {
          quarantinePath: quarantined ? quarantinePath : undefined,
        })
      }
      throw memoryWriteError('memory_atomic_write_failed', `Could not install committed memory: ${error.message}`, {
        quarantinePath: quarantined ? quarantinePath : undefined,
      })
    }
    if (options.afterInstall) await options.afterInstall({ tempPath, filePath })
    const installedBytes = await fs.readFile(filePath)
    if (!installedBytes.equals(serializedBytes)) {
      throw memoryWriteError('memory_drift', 'Memory changed immediately after the audit was installed.', {
        quarantinePath: quarantined ? quarantinePath : undefined,
      })
    }
    await fs.unlink(tempPath)
    if (quarantined) {
      await fs.unlink(quarantinePath)
      quarantined = false
    }
  } finally {
    try {
      await fs.unlink(tempPath)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
}

async function restoreQuarantinedMemory(quarantinePath, filePath) {
  try {
    await fs.link(quarantinePath, filePath)
    await fs.unlink(quarantinePath)
  } catch (error) {
    throw memoryWriteError(
      'memory_atomic_write_failed',
      'Concurrent memory bytes were quarantined but could not be restored without overwriting another file.',
      { causeCode: error?.code, quarantinePath },
    )
  }
}

async function pathExists(filePath) {
  try {
    await fs.stat(filePath)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

function memoryWriteError(code, message, details = {}) {
  const error = new Error(message)
  error.code = code
  error.details = details
  return error
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
