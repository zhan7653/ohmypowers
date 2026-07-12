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
  const io = options.fs || fs
  await io.mkdir(path.dirname(filePath), { recursive: true })
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
    await io.writeFile(tempPath, serializedBytes, { flag: 'wx' })
    if (options.expectedMode !== null && options.expectedMode !== undefined) {
      await io.chmod(tempPath, options.expectedMode)
    }
    if (options.beforeCommit) await options.beforeCommit({ tempPath, filePath })

    if (options.expectedExists) {
      try {
        await io.rename(filePath, quarantinePath)
        quarantined = true
      } catch (error) {
        if (error?.code === 'ENOENT') throw memoryWriteError('memory_drift', 'Memory disappeared before the audit could be committed.')
        throw memoryWriteError('memory_atomic_write_failed', `Could not quarantine memory before commit: ${error.message}`)
      }
      const currentBytes = await io.readFile(quarantinePath)
      const quarantineMode = (await io.stat(quarantinePath)).mode
      if (!Buffer.isBuffer(options.expectedBytes) || !currentBytes.equals(options.expectedBytes)) {
        try {
          await restoreQuarantinedMemory(io, quarantinePath, filePath, currentBytes, quarantineMode)
        } catch (recoveryError) {
          throw memoryRecoveryError('Memory changed and its quarantined bytes could not be safely restored.', {
            installError: errorEvidence(memoryWriteError('memory_drift', 'Quarantined memory differs from expected bytes.')),
            recoveryError: errorEvidence(recoveryError),
            quarantinePath,
            expectedSha256: digest(currentBytes),
            currentSha256: await currentDigest(io, filePath),
          })
        }
        quarantined = false
        throw memoryWriteError('memory_drift', 'Memory changed before the audit could be committed.')
      }
    } else if (await pathExists(io, filePath)) {
      throw memoryWriteError('memory_drift', 'Memory was created before the audit could be committed.')
    }

    try {
      await installMemoryNoReplace(io, tempPath, filePath, serializedBytes, options.expectedMode)
    } catch (installError) {
      if (installError?.code === 'memory_drift') throw installError
      if (quarantined) {
        try {
          const quarantineMode = (await io.stat(quarantinePath)).mode
          await restoreQuarantinedMemory(io, quarantinePath, filePath, options.expectedBytes, quarantineMode)
          quarantined = false
        } catch (recoveryError) {
          throw memoryRecoveryError('Memory install failed and the prior quarantined bytes could not be safely restored.', {
            installError: errorEvidence(installError),
            recoveryError: errorEvidence(recoveryError),
            quarantinePath,
            expectedSha256: digest(options.expectedBytes),
            currentSha256: await currentDigest(io, filePath),
          })
        }
        throw memoryWriteError('memory_atomic_write_failed', 'Memory install failed; the exact prior bytes were restored.', {
          installError: errorEvidence(installError),
          targetRestored: true,
          beforeSha256: digest(options.expectedBytes),
        })
      }
      throw memoryWriteError('memory_atomic_write_failed', 'Memory no-replace install failed.', {
        installError: errorEvidence(installError),
      })
    }
    if (options.afterInstall) await options.afterInstall({ tempPath, filePath })
    const installedBytes = await io.readFile(filePath)
    if (!installedBytes.equals(serializedBytes)) {
      throw memoryWriteError('memory_drift', 'Memory changed immediately after the audit was installed.', {
        quarantinePath: quarantined ? quarantinePath : undefined,
      })
    }
    await io.unlink(tempPath)
    if (quarantined) {
      await io.unlink(quarantinePath)
      quarantined = false
    }
  } finally {
    try {
      await io.unlink(tempPath)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
}

async function restoreQuarantinedMemory(io, quarantinePath, filePath, rawBytes, mode) {
  await installMemoryNoReplace(io, quarantinePath, filePath, rawBytes, mode)
  const restored = await io.readFile(filePath)
  if (!restored.equals(rawBytes)) throw memoryWriteError('memory_atomic_write_failed', 'Restored memory bytes failed verification.')
  await io.unlink(quarantinePath)
}

async function installMemoryNoReplace(io, sourcePath, filePath, rawBytes, mode) {
  let linkError
  try {
    await io.link(sourcePath, filePath)
    return
  } catch (error) {
    if (error?.code === 'EEXIST') throw memoryWriteError('memory_drift', 'A concurrent memory file appeared and was preserved.')
    linkError = error
  }
  try {
    await io.writeFile(filePath, rawBytes, { flag: 'wx', mode })
    const installed = await io.readFile(filePath)
    if (!installed.equals(rawBytes)) throw Object.assign(new Error('Exclusive memory copy verification failed.'), { code: 'EVERIFY' })
  } catch (copyError) {
    if (copyError?.code === 'EEXIST') throw memoryWriteError('memory_drift', 'A concurrent memory file appeared during exclusive-copy commit and was preserved.')
    const error = new Error('Memory hard-link and exclusive-copy installation both failed.')
    error.name = 'MemoryNoReplaceInstallError'
    error.code = 'MEMORY_NO_REPLACE_INSTALL_FAILED'
    error.details = { linkError: errorEvidence(linkError), copyError: errorEvidence(copyError) }
    throw error
  }
}

function memoryRecoveryError(message, details) {
  return memoryWriteError('memory_recovery_failed', message, details)
}

function errorEvidence(error) {
  return {
    name: error?.name || 'Error',
    code: error?.code || null,
    message: error?.message || String(error),
    details: safeJson(error?.details),
  }
}

function safeJson(value) {
  if (value == null) return null
  try { return JSON.parse(JSON.stringify(value)) } catch { return String(value) }
}

function digest(value) {
  if (!Buffer.isBuffer(value)) return null
  return crypto.createHash('sha256').update(value).digest('hex')
}

async function currentDigest(io, filePath) {
  try {
    return digest(await io.readFile(filePath))
  } catch (error) {
    return error?.code === 'ENOENT' ? null : `unreadable:${error?.code || 'error'}`
  }
}

async function pathExists(io, filePath) {
  try {
    await io.stat(filePath)
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
