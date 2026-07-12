import crypto from 'node:crypto'
import path from 'node:path'
import { constants as fsConstants, promises as defaultFs } from 'node:fs'
import { resolveGlobalInstructionsPath, resolveProjectInstructionsPath } from './paths.js'

const SCHEMA_VERSION = 1
const DEFAULT_MAX_BYTES = 32 * 1024
const REGION_START = '<!-- power-work-report:instructions:start -->'
const REGION_END = '<!-- power-work-report:instructions:end -->'
const FORBIDDEN = [
  /\bcodex_failed\b/i,
  /\b(?:todo|to-do)\b/i,
  /\b(?:issue|pr|pull request)\s*#?\d+\b/i,
  /\b(?:today|tonight|tomorrow|yesterday|temporary|currently)\b/i,
  /(?:今天|今晚|明天|昨天|临时|当前)(?:状态|进度|任务|待办)?/,
  /(?:待办|未经验证|猜测|issue\s*进度|pr\s*进度)/i,
]

export const INSTRUCTION_ERROR_CODES = Object.freeze([
  'invalid_candidate',
  'candidate_unconfirmed',
  'invalid_action',
  'ambiguous_target',
  'nested_scope',
  'override_present',
  'conflict',
  'size_limit',
  'permission_denied',
  'codex_failed',
  'forbidden_content',
  'managed_entry_missing',
  'managed_region_invalid',
  'invalid_proposal',
  'proposal_integrity',
  'candidate_integrity',
  'target_drift',
  'atomic_write_failed',
])

export class InstructionChangeError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'InstructionChangeError'
    this.code = code
    this.details = details
  }
}

export async function planInstructionChange(options = {}) {
  const fs = options.fs || defaultFs
  const candidate = normalizeCandidate(options.candidate)
  const action = normalizeAction(options.action)
  const sourceReport = requiredString(options.sourceReport || candidate.sourceReport, 'sourceReport')
  assertCandidateAllowed(candidate, options)

  const target = await resolveTarget({ ...options, candidate, fs })
  await assertSafeTarget({ ...options, target, candidate, fs })
  const beforeContent = await readOptional(fs, target.path)
  const afterContent = buildAfterContent({ beforeContent, candidate, action })
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  if (Buffer.byteLength(afterContent) > maxBytes) {
    fail('size_limit', `Proposed AGENTS.md exceeds the ${maxBytes}-byte safety limit.`, { maxBytes })
  }

  const createdAt = timestamp(options.now)
  const base = {
    schemaVersion: SCHEMA_VERSION,
    candidateId: candidate.id,
    action,
    sourceReport,
    target: { scope: candidate.scope, path: target.path, exists: beforeContent !== null },
    beforeContent: beforeContent ?? '',
    afterContent,
    exactDiff: exactDiff(target.path, beforeContent ?? '', afterContent),
    beforeSha256: sha256(beforeContent ?? ''),
    afterSha256: sha256(afterContent),
    candidateSha256: candidateDigest({ candidateId: candidate.id, action, sourceReport, target: target.path, beforeContent: beforeContent ?? '', afterContent }),
    createdAt,
  }
  const proposalId = sha256(canonical(base)).slice(0, 24)
  const proposal = { ...base, proposalId }
  proposal.proposalSha256 = sha256(canonical(proposal))
  return proposal
}

export async function applyInstructionChange(options = {}) {
  const fs = options.fs || defaultFs
  const proposal = options.proposal
  assertProposal(proposal)
  if (proposal.proposalSha256 !== sha256(canonical(without(proposal, 'proposalSha256')))) {
    fail('proposal_integrity', 'Instruction proposal digest does not match its contents.')
  }
  const proposalBase = without(without(proposal, 'proposalSha256'), 'proposalId')
  if (proposal.proposalId !== sha256(canonical(proposalBase)).slice(0, 24)
    || proposal.beforeSha256 !== sha256(proposal.beforeContent)
    || proposal.afterSha256 !== sha256(proposal.afterContent)
    || proposal.exactDiff !== exactDiff(proposal.target.path, proposal.beforeContent, proposal.afterContent)) {
    fail('proposal_integrity', 'Instruction proposal fields are not internally consistent.')
  }
  const expectedCandidate = candidateDigest({
    candidateId: proposal.candidateId,
    action: proposal.action,
    sourceReport: proposal.sourceReport,
    target: proposal.target.path,
    beforeContent: proposal.beforeContent,
    afterContent: proposal.afterContent,
  })
  if (proposal.candidateSha256 !== expectedCandidate) {
    fail('candidate_integrity', 'Instruction candidate digest does not match the proposed managed entry.')
  }
  if (options.candidate) {
    const candidate = normalizeCandidate(options.candidate)
    const proposedEntry = entryText(proposal.action === 'remove' ? proposal.beforeContent : proposal.afterContent, proposal.candidateId)
    const candidateEntry = proposal.action === 'remove' ? proposedEntry : renderEntry(candidate)
    if (candidate.id !== proposal.candidateId || candidate.scope !== proposal.target.scope || candidateEntry !== proposedEntry) {
      fail('candidate_integrity', 'The confirmed candidate does not match the proposal.')
    }
  }

  const current = await readOptional(fs, proposal.target.path)
  const currentContent = current ?? ''
  if (sha256(currentContent) !== proposal.beforeSha256 || currentContent !== proposal.beforeContent) {
    fail('target_drift', 'AGENTS.md changed after the proposal was created; generate and confirm a new diff.')
  }
  if (await statOptional(fs, path.join(path.dirname(proposal.target.path), 'AGENTS.override.md'))) {
    fail('override_present', 'AGENTS.override.md appeared after confirmation; generate a new plan after human review.')
  }
  await assertWritable(fs, proposal.target.path, current !== null)
  await atomicWrite(fs, proposal.target.path, proposal.beforeContent, proposal.afterContent, options)
  const written = await readOptional(fs, proposal.target.path)
  if (written !== proposal.afterContent || sha256(written ?? '') !== proposal.afterSha256) {
    fail('atomic_write_failed', 'AGENTS.md did not contain the confirmed bytes after the atomic write.')
  }
  return {
    proposalId: proposal.proposalId,
    candidateId: proposal.candidateId,
    action: proposal.action,
    targetPath: proposal.target.path,
    beforeSha256: proposal.beforeSha256,
    afterSha256: proposal.afterSha256,
    sourceReport: proposal.sourceReport,
    appliedAt: timestamp(options.now),
  }
}

function normalizeCandidate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid_candidate', 'Exactly one confirmed instruction candidate is required.')
  const id = requiredString(value.id || value.candidateId, 'candidate.id')
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)) fail('invalid_candidate', 'Candidate id must be a stable URL-safe identifier.')
  const scopeValue = typeof value.scope === 'object' ? value.scope.type : value.scope
  const scope = requiredString(scopeValue, 'candidate.scope').toLowerCase()
  if (scope !== 'global' && scope !== 'project') fail('ambiguous_target', 'Candidate scope must be exactly global or project.')
  const instruction = String(value.instruction ?? value.content ?? value.recommendation ?? '').trim()
  return { ...value, id, scope, instruction }
}

function normalizeAction(value) {
  if (!['add', 'update', 'remove'].includes(value)) fail('invalid_action', 'Instruction action must be add, update, or remove.')
  return value
}

function assertCandidateAllowed(candidate, options) {
  if (candidate.confirmed !== true && options.confirmed !== true) fail('candidate_unconfirmed', 'The instruction candidate has not been confirmed.')
  if (!candidate.instruction && options.action !== 'remove') fail('invalid_candidate', 'Add and update candidates require instruction text.')
  if (/codex_failed/i.test(JSON.stringify(candidate))) {
    fail('codex_failed', 'A codex_failed report or candidate cannot authorize a persistent instruction.')
  }
  if (FORBIDDEN.some(pattern => pattern.test(candidate.instruction))) {
    fail('forbidden_content', 'Temporary, progress, todo, speculative, or codex_failed content cannot become a persistent instruction.')
  }
  if (candidate.nestedScope || candidate.scopePath || options.nestedScope) fail('nested_scope', 'A nested AGENTS.md scope requires an explicit human decision.')
  if (candidate.conflict || options.conflict) fail('conflict', 'The candidate conflicts with an existing instruction and cannot be applied automatically.')
}

async function resolveTarget(options) {
  if (options.targetPath) fail('ambiguous_target', 'Arbitrary target paths are not accepted.')
  if (options.candidate.scope === 'global') {
    if (options.projectRoot || options.candidate.projectRoot) fail('ambiguous_target', 'A global candidate cannot also select a project root.')
    return { path: resolveGlobalInstructionsPath(options.codexHome), root: path.dirname(resolveGlobalInstructionsPath(options.codexHome)) }
  }
  const rootValue = options.projectRoot || options.candidate.projectRoot
  if (!rootValue) fail('ambiguous_target', 'Project instructions require an explicit Git repository root.')
  if (options.projectRoot && options.candidate.projectRoot && path.resolve(options.projectRoot) !== path.resolve(options.candidate.projectRoot)) {
    fail('ambiguous_target', 'Candidate and request specify different project roots.')
  }
  const root = path.resolve(rootValue)
  const git = await statOptional(options.fs, path.join(root, '.git'))
  if (!git) fail('ambiguous_target', 'The explicit project root is not a Git repository root.')
  return { path: resolveProjectInstructionsPath(root), root }
}

async function assertSafeTarget(options) {
  if (await statOptional(options.fs, path.join(options.target.root, 'AGENTS.override.md'))) {
    fail('override_present', 'AGENTS.override.md is present at the selected scope; pause for a human decision.')
  }
  const existing = await readOptional(options.fs, options.target.path)
  if (existing !== null) {
    assertManagedStructure(existing)
    await assertWritable(options.fs, options.target.path, true)
  } else {
    await assertWritable(options.fs, options.target.path, false)
  }
}

function buildAfterContent({ beforeContent, candidate, action }) {
  const before = beforeContent ?? ''
  assertManagedStructure(before)
  const bounds = entryBounds(before, candidate.id)
  if (action === 'add') {
    if (bounds) fail('conflict', `Managed instruction ${candidate.id} already exists; use update.`)
    if (containsOutsideManaged(before, candidate.instruction)) fail('conflict', 'An equivalent human-authored instruction already exists outside the managed entry.')
    return addEntry(before, renderEntry(candidate))
  }
  if (!bounds) fail('managed_entry_missing', `Managed instruction ${candidate.id} does not exist.`)
  if (action === 'update') return before.slice(0, bounds.start) + renderEntry(candidate) + before.slice(bounds.end)
  return removeEntry(before, bounds)
}

function renderEntry(candidate) {
  return `<!-- power-work-report:entry:${candidate.id}:start -->\n${candidate.instruction}\n<!-- power-work-report:entry:${candidate.id}:end -->`
}

function addEntry(before, entry) {
  const region = regionBounds(before)
  if (region) return before.slice(0, region.endMarker) + `\n${entry}\n` + before.slice(region.endMarker)
  return `${before}${REGION_START}\n${entry}\n${REGION_END}\n`
}

function removeEntry(before, bounds) {
  let start = bounds.start
  let end = bounds.end
  if (before[end] === '\n') end += 1
  const result = before.slice(0, start) + before.slice(end)
  const region = regionBounds(result)
  if (!region) return result
  const inside = result.slice(region.contentStart, region.endMarker).trim()
  if (inside) return result
  start = region.start
  end = region.end
  if (result[end] === '\n') end += 1
  return result.slice(0, start) + result.slice(end)
}

function assertManagedStructure(content) {
  const starts = occurrences(content, REGION_START)
  const ends = occurrences(content, REGION_END)
  if (starts.length !== ends.length || starts.length > 1) fail('managed_region_invalid', 'The report-owned AGENTS.md region is malformed or duplicated.')
  if (starts.length === 1 && starts[0] > ends[0]) fail('managed_region_invalid', 'The report-owned AGENTS.md region is malformed.')
  const region = starts.length ? regionBounds(content) : null
  const marker = /<!-- power-work-report:entry:([A-Za-z0-9][A-Za-z0-9._-]{0,127}):(start|end) -->/g
  const counts = new Map()
  for (const match of content.matchAll(marker)) {
    if (!region || match.index < region.contentStart || match.index >= region.endMarker) {
      fail('managed_region_invalid', 'A report-owned instruction marker appears outside the managed region.')
    }
    const value = counts.get(match[1]) || { start: [], end: [] }
    value[match[2]].push(match.index)
    counts.set(match[1], value)
  }
  for (const value of counts.values()) {
    if (value.start.length !== 1 || value.end.length !== 1 || value.start[0] >= value.end[0]) {
      fail('managed_region_invalid', 'A report-owned instruction entry is malformed or duplicated.')
    }
  }
}

function entryBounds(content, id) {
  const startMarker = `<!-- power-work-report:entry:${id}:start -->`
  const endMarker = `<!-- power-work-report:entry:${id}:end -->`
  const start = content.indexOf(startMarker)
  const endAt = content.indexOf(endMarker)
  if (start < 0 && endAt < 0) return null
  if (start < 0 || endAt < start) fail('managed_region_invalid', `Managed instruction ${id} is malformed.`)
  return { start, end: endAt + endMarker.length }
}

function regionBounds(content) {
  const start = content.indexOf(REGION_START)
  if (start < 0) return null
  const endMarker = content.indexOf(REGION_END, start)
  if (endMarker < 0) fail('managed_region_invalid', 'The report-owned AGENTS.md region is incomplete.')
  return { start, contentStart: start + REGION_START.length, endMarker, end: endMarker + REGION_END.length }
}

function containsOutsideManaged(content, instruction) {
  const region = regionBounds(content)
  const outside = region ? content.slice(0, region.start) + content.slice(region.end) : content
  return normalizeText(outside).includes(normalizeText(instruction))
}

async function assertWritable(fs, targetPath, exists) {
  try {
    await fs.access(exists ? targetPath : path.dirname(targetPath), fsConstants.W_OK)
  } catch (error) {
    fail('permission_denied', `No write permission for ${targetPath}.`, { causeCode: error?.code })
  }
}

async function atomicWrite(fs, targetPath, beforeContent, content, options) {
  const tempPath = `${targetPath}.power-work-report-${options.atomicNonce || crypto.randomBytes(6).toString('hex')}.tmp`
  try {
    await fs.writeFile(tempPath, content, { encoding: 'utf8', flag: 'wx' })
    if (options.beforeRename) await options.beforeRename({ tempPath, targetPath })
    const latest = await readOptional(fs, targetPath)
    if ((latest ?? '') !== beforeContent) fail('target_drift', 'AGENTS.md changed while applying the proposal; generate and confirm a new diff.')
    await fs.rename(tempPath, targetPath)
  } catch (error) {
    try { await fs.unlink(tempPath) } catch {}
    if (error instanceof InstructionChangeError) throw error
    fail('atomic_write_failed', `Atomic AGENTS.md write failed: ${error.message}`, { causeCode: error?.code })
  }
}

function assertProposal(value) {
  const fields = ['schemaVersion', 'proposalId', 'candidateId', 'action', 'sourceReport', 'target', 'beforeContent', 'afterContent', 'exactDiff', 'beforeSha256', 'afterSha256', 'candidateSha256', 'createdAt', 'proposalSha256']
  if (!value || typeof value !== 'object' || fields.some(field => !(field in value))) fail('invalid_proposal', 'Instruction proposal is incomplete.')
  if (value.schemaVersion !== SCHEMA_VERSION) fail('invalid_proposal', 'Instruction proposal schema version is unsupported.')
}

function candidateDigest(value) {
  const beforeEntry = entryText(value.beforeContent, value.candidateId)
  const afterEntry = entryText(value.afterContent, value.candidateId)
  return sha256(canonical({ candidateId: value.candidateId, action: value.action, sourceReport: value.sourceReport, target: value.target, beforeEntry, afterEntry }))
}

function entryText(content, id) {
  const bounds = entryBounds(content, id)
  return bounds ? content.slice(bounds.start, bounds.end) : ''
}

function exactDiff(filePath, before, after) {
  const oldLines = before ? before.split('\n') : []
  const newLines = after ? after.split('\n') : []
  return [`--- ${filePath}`, `+++ ${filePath}`, `@@ -1,${oldLines.length} +1,${newLines.length} @@`, ...oldLines.map(line => `-${line}`), ...newLines.map(line => `+${line}`)].join('\n')
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}

function without(value, key) {
  return Object.fromEntries(Object.entries(value).filter(([name]) => name !== key))
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function timestamp(now) {
  const value = typeof now === 'function' ? now() : now || new Date()
  return new Date(value).toISOString()
}

function requiredString(value, field) {
  const result = String(value || '').trim()
  if (!result) fail('invalid_candidate', `${field} is required.`)
  return result
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function occurrences(content, value) {
  const result = []
  let offset = 0
  while ((offset = content.indexOf(value, offset)) >= 0) {
    result.push(offset)
    offset += value.length
  }
  return result
}

async function readOptional(fs, filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    if (error?.code === 'EACCES' || error?.code === 'EPERM') fail('permission_denied', `Cannot read ${filePath}.`, { causeCode: error.code })
    throw error
  }
}

async function statOptional(fs, filePath) {
  try {
    return await fs.stat(filePath)
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

function fail(code, message, details) {
  throw new InstructionChangeError(code, message, details)
}
