import crypto from 'node:crypto'
import path from 'node:path'
import { constants as fsConstants, promises as defaultFs } from 'node:fs'
import { resolveGlobalInstructionsPath, resolveProjectInstructionsPath } from './paths.js'

const SCHEMA_VERSION = 1
const DEFAULT_MAX_BYTES = 32 * 1024
const REGION_START = '<!-- power-work-report:instructions:start -->'
const REGION_END = '<!-- power-work-report:instructions:end -->'
const CANDIDATE_SNAPSHOT_FIELDS = [
  'id', 'type', 'scope', 'recommendation', 'instruction', 'evidenceCount', 'dates', 'projects', 'evidence',
  'rationale', 'expectedBenefit', 'provenance', 'confirmationStatus', 'conflict', 'nestedScope', 'scopePath', 'safetyReasons',
]
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
  'recovery_failed',
  'audit_persistence_failed',
  'rollback_failed',
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
  const candidateSnapshot = snapshotCandidate(candidate)
  assertCandidateSnapshot(candidateSnapshot, 'invalid_candidate')
  const base = {
    schemaVersion: SCHEMA_VERSION,
    candidateId: candidate.id,
    candidateSnapshot,
    action,
    sourceReport,
    target: { scope: candidate.scope, path: target.path, exists: beforeContent !== null },
    beforeContent: beforeContent ?? '',
    afterContent,
    exactDiff: exactDiff(target.path, beforeContent ?? '', afterContent),
    beforeSha256: sha256(beforeContent ?? ''),
    afterSha256: sha256(afterContent),
    candidateSha256: candidateDigest({ candidateSnapshot, action, sourceReport, target: target.path, beforeContent: beforeContent ?? '', afterContent }),
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
    || proposal.exactDiff !== exactDiff(proposal.target.path, proposal.beforeContent, proposal.afterContent)
    || proposal.candidateId !== proposal.candidateSnapshot?.id
    || proposal.target.scope !== proposal.candidateSnapshot?.scope) {
    fail('proposal_integrity', 'Instruction proposal fields are not internally consistent.')
  }
  const expectedCandidate = candidateDigest({
    candidateSnapshot: proposal.candidateSnapshot,
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
    if (canonical(snapshotCandidate(candidate)) !== canonical(proposal.candidateSnapshot)) {
      fail('candidate_integrity', 'The confirmed candidate does not match the proposal.')
    }
  }

  const current = await readOptional(fs, proposal.target.path)
  const currentContent = current ?? ''
  if ((current !== null) !== proposal.target.exists || sha256(currentContent) !== proposal.beforeSha256 || currentContent !== proposal.beforeContent) {
    fail('target_drift', 'AGENTS.md changed after the proposal was created; generate and confirm a new diff.')
  }
  if (await statOptional(fs, path.join(path.dirname(proposal.target.path), 'AGENTS.override.md'))) {
    fail('override_present', 'AGENTS.override.md appeared after confirmation; generate a new plan after human review.')
  }
  await assertWritable(fs, proposal.target.path, current !== null)
  await atomicWrite(fs, proposal.target.path, proposal.target.exists, proposal.beforeContent, proposal.afterContent, options)
  const written = await readOptional(fs, proposal.target.path)
  if (written !== proposal.afterContent || sha256(written ?? '') !== proposal.afterSha256) {
    fail('atomic_write_failed', 'AGENTS.md did not contain the confirmed bytes after the atomic write.')
  }
  const audit = {
    proposalId: proposal.proposalId,
    candidateId: proposal.candidateId,
    action: proposal.action,
    targetPath: proposal.target.path,
    beforeSha256: proposal.beforeSha256,
    afterSha256: proposal.afterSha256,
    sourceReport: proposal.sourceReport,
    appliedAt: timestamp(options.now),
  }
  if (options.persistAudit) {
    try {
      await options.persistAudit(audit)
    } catch (auditError) {
      try {
        await rollbackInstructionChange({ fs, proposal, options })
      } catch (rollbackError) {
        fail('rollback_failed', 'Instruction audit persistence failed and the target could not be safely restored.', {
          auditError: errorEvidence(auditError),
          rollbackError: errorEvidence(rollbackError),
          targetPath: proposal.target.path,
          expectedAfterSha256: proposal.afterSha256,
          currentSha256: await currentDigest(fs, proposal.target.path),
        })
      }
      fail('audit_persistence_failed', 'Instruction audit persistence failed; the target was restored to its exact prior state.', {
        auditError: errorEvidence(auditError),
        targetPath: proposal.target.path,
        restoredExists: proposal.target.exists,
        restoredSha256: proposal.beforeSha256,
      })
    }
  }
  return audit
}

async function rollbackInstructionChange({ fs, proposal, options }) {
  const current = await readOptional(fs, proposal.target.path)
  if (current !== proposal.afterContent) {
    fail('target_drift', 'AGENTS.md changed after instruction application; audit rollback will not overwrite it.')
  }
  const nonce = `${options.atomicNonce || crypto.randomBytes(6).toString('hex')}-rollback`
  const quarantinePath = `${proposal.target.path}.power-work-report-${nonce}.applied`
  const restorePath = `${proposal.target.path}.power-work-report-${nonce}.restore`
  if (options.beforeRollbackRename) await options.beforeRollbackRename({ targetPath: proposal.target.path, quarantinePath })
  try {
    await fs.rename(proposal.target.path, quarantinePath)
  } catch (error) {
    fail('atomic_write_failed', `Could not quarantine the applied AGENTS.md during rollback: ${error.message}`, { causeCode: error?.code })
  }
  const quarantined = await readOptional(fs, quarantinePath)
  if (quarantined !== proposal.afterContent) {
    await restoreQuarantinedTarget(fs, quarantinePath, proposal.target.path)
    fail('target_drift', 'AGENTS.md changed while rollback began; the concurrent bytes were preserved.')
  }
  try {
    if (proposal.target.exists) {
      const appliedStat = await statOptional(fs, quarantinePath)
      await fs.writeFile(restorePath, proposal.beforeContent, { encoding: 'utf8', flag: 'wx', mode: appliedStat?.mode })
      await installNoReplace(fs, {
        sourcePath: restorePath,
        targetPath: proposal.target.path,
        content: proposal.beforeContent,
        mode: appliedStat?.mode,
      })
      await fs.unlink(restorePath)
      if (await readOptional(fs, proposal.target.path) !== proposal.beforeContent) {
        fail('atomic_write_failed', 'Rollback did not restore the exact prior AGENTS.md bytes.')
      }
    } else {
      if (options.beforeRollbackRemove) await options.beforeRollbackRemove({ targetPath: proposal.target.path, quarantinePath })
      if (await readOptional(fs, proposal.target.path) !== null) {
        fail('target_drift', 'A new AGENTS.md appeared while restoring the target to its absent state.')
      }
    }
    await fs.unlink(quarantinePath)
  } catch (error) {
    try { await fs.unlink(restorePath) } catch {}
    if (error instanceof InstructionChangeError) throw error
    fail('atomic_write_failed', `Could not restore the prior AGENTS.md state: ${error.message}`, {
      causeCode: error?.code,
      quarantinePath,
    })
  }
}

async function restoreQuarantinedTarget(fs, quarantinePath, targetPath) {
  const content = await readOptional(fs, quarantinePath)
  const stat = await statOptional(fs, quarantinePath)
  try {
    await installNoReplace(fs, {
      sourcePath: quarantinePath,
      targetPath,
      content: content ?? '',
      mode: stat?.mode,
    })
    await fs.unlink(quarantinePath)
  } catch (error) {
    throw error
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
  return {
    ...value,
    id,
    type: String(value.type || `${scope}-instruction`).trim(),
    scope,
    recommendation: String(value.recommendation ?? instruction).trim(),
    instruction,
    evidenceCount: Number.isFinite(Number(value.evidenceCount)) ? Number(value.evidenceCount) : 0,
    dates: stringArray(value.dates),
    projects: stringArray(value.projects),
    evidence: Array.isArray(value.evidence) ? jsonValue(value.evidence, []) : [],
    rationale: String(value.rationale || '').trim(),
    expectedBenefit: String(value.expectedBenefit || '').trim(),
    provenance: jsonValue(value.provenance, null),
    confirmationStatus: String(value.confirmationStatus || (value.confirmed === true ? 'confirmed' : '')).trim(),
    conflict: value.conflict === true,
    nestedScope: value.nestedScope === true,
    scopePath: value.scopePath == null ? null : String(value.scopePath),
    safetyReasons: stringArray(value.safetyReasons),
  }
}

function snapshotCandidate(candidate) {
  return {
    id: candidate.id,
    type: candidate.type,
    scope: candidate.scope,
    recommendation: candidate.recommendation,
    instruction: candidate.instruction,
    evidenceCount: candidate.evidenceCount,
    dates: candidate.dates,
    projects: candidate.projects,
    evidence: candidate.evidence,
    rationale: candidate.rationale,
    expectedBenefit: candidate.expectedBenefit,
    provenance: candidate.provenance,
    confirmationStatus: candidate.confirmationStatus,
    conflict: candidate.conflict,
    nestedScope: candidate.nestedScope,
    scopePath: candidate.scopePath,
    safetyReasons: candidate.safetyReasons,
  }
}

function normalizeAction(value) {
  if (!['add', 'update', 'remove'].includes(value)) fail('invalid_action', 'Instruction action must be add, update, or remove.')
  return value
}

function assertCandidateAllowed(candidate, options) {
  if (candidate.confirmationStatus !== 'confirmed' && options.confirmed !== true) fail('candidate_unconfirmed', 'The instruction candidate has not been confirmed.')
  if (!candidate.instruction && options.action !== 'remove') fail('invalid_candidate', 'Add and update candidates require instruction text.')
  if (/codex_failed/i.test(JSON.stringify(candidate))) {
    fail('codex_failed', 'A codex_failed report or candidate cannot authorize a persistent instruction.')
  }
  if (FORBIDDEN.some(pattern => pattern.test(candidate.instruction))) {
    fail('forbidden_content', 'Temporary, progress, todo, speculative, or codex_failed content cannot become a persistent instruction.')
  }
  if (candidate.instruction.includes('<!-- power-work-report:')) {
    fail('forbidden_content', 'Instruction text cannot contain report-owned management markers.')
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
  const stack = []
  for (const match of content.matchAll(marker)) {
    if (!region || match.index < region.contentStart || match.index >= region.endMarker) {
      fail('managed_region_invalid', 'A report-owned instruction marker appears outside the managed region.')
    }
    const value = counts.get(match[1]) || { start: [], end: [] }
    value[match[2]].push(match.index)
    counts.set(match[1], value)
    if (match[2] === 'start') {
      if (stack.length) fail('managed_region_invalid', 'Report-owned instruction entries may not overlap or nest.')
      stack.push(match[1])
    } else {
      if (stack.pop() !== match[1]) fail('managed_region_invalid', 'Report-owned instruction entry intervals are crossed or unmatched.')
    }
  }
  if (stack.length) fail('managed_region_invalid', 'A report-owned instruction entry is not closed.')
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

async function atomicWrite(fs, targetPath, expectedExists, beforeContent, content, options) {
  const nonce = options.atomicNonce || crypto.randomBytes(6).toString('hex')
  const tempPath = `${targetPath}.power-work-report-${nonce}.tmp`
  const quarantinePath = `${targetPath}.power-work-report-${nonce}.before`
  const existingStat = expectedExists ? await statOptional(fs, targetPath) : null
  try {
    await fs.writeFile(tempPath, content, { encoding: 'utf8', flag: 'wx' })
    if (existingStat?.mode != null && fs.chmod) await fs.chmod(tempPath, existingStat.mode & 0o7777)
    if (options.beforeRename) await options.beforeRename({ tempPath, targetPath })
    const latest = await readOptional(fs, targetPath)
    if ((latest !== null) !== expectedExists || (latest ?? '') !== beforeContent) fail('target_drift', 'AGENTS.md changed while applying the proposal; generate and confirm a new diff.')
    if (!expectedExists) {
      if (options.beforeInstallLink) await options.beforeInstallLink({ tempPath, targetPath, quarantinePath: null })
      await installNoReplace(fs, { sourcePath: tempPath, targetPath, content, mode: existingStat?.mode })
      if (await readOptional(fs, targetPath) !== content) fail('atomic_write_failed', 'Installed AGENTS.md bytes changed before commit verification.')
      await fs.unlink(tempPath)
      return
    }

    await fs.rename(targetPath, quarantinePath)
    const quarantined = await readOptional(fs, quarantinePath)
    if (quarantined !== beforeContent) {
      try {
        await restoreQuarantinedTarget(fs, quarantinePath, targetPath)
      } catch (recoveryError) {
        fail('recovery_failed', 'Concurrent AGENTS.md bytes were quarantined but could not be safely restored.', {
          installError: { name: 'TargetDrift', code: 'target_drift', message: 'Quarantined bytes differ from the planned target.' },
          recoveryError: errorEvidence(recoveryError),
          quarantinePath,
          expectedSha256: sha256(quarantined ?? ''),
          currentSha256: await currentDigest(fs, targetPath),
        })
      }
      fail('target_drift', 'AGENTS.md changed during compare-and-commit; concurrent bytes were preserved.')
    }
    if (options.beforeInstallLink) await options.beforeInstallLink({ tempPath, targetPath, quarantinePath })
    try {
      await installNoReplace(fs, { sourcePath: tempPath, targetPath, content, mode: existingStat?.mode })
    } catch (installError) {
      if (installError instanceof InstructionChangeError) throw installError
      try {
        await restoreQuarantinedTarget(fs, quarantinePath, targetPath)
      } catch (recoveryError) {
        fail('recovery_failed', 'AGENTS.md install failed and the quarantined prior target could not be safely restored.', {
          installError: errorEvidence(installError),
          recoveryError: errorEvidence(recoveryError),
          quarantinePath,
          expectedSha256: sha256(beforeContent),
          currentSha256: await currentDigest(fs, targetPath),
        })
      }
      fail('atomic_write_failed', 'AGENTS.md install failed; the exact prior target was restored.', {
        installError: errorEvidence(installError),
        targetRestored: true,
        beforeSha256: sha256(beforeContent),
      })
    }
    if (await readOptional(fs, targetPath) !== content) {
      fail('atomic_write_failed', 'Installed AGENTS.md bytes changed before commit verification.', { quarantinePath })
    }
    await fs.unlink(tempPath)
    await fs.unlink(quarantinePath)
  } catch (error) {
    try { await fs.unlink(tempPath) } catch {}
    if (error instanceof InstructionChangeError) throw error
    fail('atomic_write_failed', `Atomic AGENTS.md write failed: ${error.message}`, { causeCode: error?.code })
  }
}

async function installNoReplace(fs, { sourcePath, targetPath, content, mode }) {
  let linkError
  try {
    await fs.link(sourcePath, targetPath)
    return 'link'
  } catch (error) {
    if (error?.code === 'EEXIST') {
      fail('target_drift', 'A concurrent AGENTS.md appeared before commit; it was preserved.')
    }
    linkError = error
  }
  try {
    await fs.writeFile(targetPath, content, { encoding: 'utf8', flag: 'wx', mode })
    if (await readOptional(fs, targetPath) !== content) {
      throw Object.assign(new Error('Exclusive copy verification failed.'), { code: 'EVERIFY' })
    }
    return 'copy'
  } catch (copyError) {
    if (copyError?.code === 'EEXIST') {
      fail('target_drift', 'A concurrent AGENTS.md appeared before exclusive-copy commit; it was preserved.')
    }
    const error = new Error('No-replace hard-link and exclusive-copy installation both failed.')
    error.name = 'NoReplaceInstallError'
    error.code = 'NO_REPLACE_INSTALL_FAILED'
    error.details = { linkError: errorEvidence(linkError), copyError: errorEvidence(copyError) }
    throw error
  }
}

function assertProposal(value) {
  const fields = ['schemaVersion', 'proposalId', 'candidateId', 'candidateSnapshot', 'action', 'sourceReport', 'target', 'beforeContent', 'afterContent', 'exactDiff', 'beforeSha256', 'afterSha256', 'candidateSha256', 'createdAt', 'proposalSha256']
  if (!value || typeof value !== 'object' || fields.some(field => !(field in value))) fail('invalid_proposal', 'Instruction proposal is incomplete.')
  if (value.schemaVersion !== SCHEMA_VERSION) fail('invalid_proposal', 'Instruction proposal schema version is unsupported.')
  assertCandidateSnapshot(value.candidateSnapshot)
}

function assertCandidateSnapshot(value, code = 'invalid_proposal') {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || canonical(Object.keys(value).sort()) !== canonical([...CANDIDATE_SNAPSHOT_FIELDS].sort())) {
    fail(code, 'Instruction proposal candidate snapshot is incomplete or contains unknown fields.')
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.id)
    || !['global', 'project'].includes(value.scope)
    || value.confirmationStatus !== 'confirmed'
    || !Number.isFinite(value.evidenceCount)
    || value.evidenceCount < 0
    || !Array.isArray(value.dates)
    || !Array.isArray(value.projects)
    || !Array.isArray(value.evidence)
    || !Array.isArray(value.safetyReasons)
    || typeof value.conflict !== 'boolean'
    || typeof value.nestedScope !== 'boolean'
    || (value.scopePath !== null && typeof value.scopePath !== 'string')) {
    fail(code, 'Instruction proposal candidate snapshot has invalid field values.')
  }
  for (const field of ['type', 'recommendation', 'instruction', 'rationale', 'expectedBenefit']) {
    if (typeof value[field] !== 'string') fail(code, `Instruction proposal candidate snapshot field ${field} must be a string.`)
  }
}

function candidateDigest(value) {
  const candidateId = value.candidateSnapshot.id
  const beforeEntry = entryText(value.beforeContent, candidateId)
  const afterEntry = entryText(value.afterContent, candidateId)
  return sha256(canonical({
    candidateSnapshot: value.candidateSnapshot,
    action: value.action,
    sourceReport: value.sourceReport,
    target: value.target,
    beforeSha256: sha256(value.beforeContent),
    afterSha256: sha256(value.afterContent),
    beforeEntry,
    afterEntry,
  }))
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

function stringArray(value) {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item).trim()).filter(Boolean)
}

function jsonValue(value, fallback) {
  if (value === undefined) return fallback
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    fail('invalid_candidate', 'Candidate evidence and provenance must be serializable.')
  }
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

async function currentDigest(fs, filePath) {
  try {
    const content = await readOptional(fs, filePath)
    return content === null ? null : sha256(content)
  } catch (error) {
    return `unreadable:${error?.code || error?.name || 'error'}`
  }
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

function fail(code, message, details) {
  throw new InstructionChangeError(code, message, details)
}
