import assert from 'node:assert/strict'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import test from 'node:test'
import { applyInstructionChange, planInstructionChange } from '../../power-work-report/scripts/power-work-report/lib/instructions.js'
import { pathsForDate } from '../../power-work-report/scripts/power-work-report/lib/paths.js'

const NOW = '2026-07-12T06:00:00.000Z'

test('daily paths expose stable memo and instruction proposal artifacts', () => {
  const paths = pathsForDate({ date: '2026-07-12', outDir: '/tmp/reports' })
  assert.equal(paths.memoPath, '/tmp/reports/2026-07-12/draft/personal-memo.json')
  assert.equal(paths.instructionProposalPath, '/tmp/reports/2026-07-12/draft/instruction-change.proposed.json')
  assert.equal(paths.instructionDiffPath, '/tmp/reports/2026-07-12/draft/instruction-change.diff')
})

test('global add planning is deterministic and non-mutating, then applies exact bytes', async t => {
  const tmp = await sandbox(t)
  const target = path.join(tmp, 'codex', 'AGENTS.md')
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, '# Human rules\n\nKeep this exact.\n')
  const options = base({ scope: 'global', codexHome: path.dirname(target), instruction: 'Run focused tests before claiming completion.' })

  const proposal = await planInstructionChange(options)
  assert.equal(await fs.readFile(target, 'utf8'), '# Human rules\n\nKeep this exact.\n')
  assert.equal(proposal.target.path, target)
  assert.equal(proposal.target.exists, true)
  assert.match(proposal.exactDiff, /^--- /)
  assert.ok(proposal.proposalSha256)

  const audit = await applyInstructionChange({ proposal, now: NOW, atomicNonce: 'add' })
  assert.equal(await fs.readFile(target, 'utf8'), proposal.afterContent)
  assert.equal(audit.proposalId, proposal.proposalId)
  assert.equal(audit.afterSha256, proposal.afterSha256)
  assert.ok(proposal.afterContent.startsWith('# Human rules\n\nKeep this exact.\n'))
})

test('project create resolves only an explicit Git root', async t => {
  const tmp = await sandbox(t)
  const repo = path.join(tmp, 'repo')
  await fs.mkdir(path.join(repo, '.git'), { recursive: true })
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Use repository validation before completion.' }))
  assert.equal(proposal.target.path, path.join(repo, 'AGENTS.md'))
  assert.equal(proposal.target.exists, false)
  await applyInstructionChange({ proposal, atomicNonce: 'create' })
  assert.equal(await fs.readFile(path.join(repo, 'AGENTS.md'), 'utf8'), proposal.afterContent)
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: path.join(repo, 'nested'), instruction: 'Use tests.' })), error('ambiguous_target'))
})

test('revision and removal preserve all bytes outside the owned entry', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  const prefix = '# Human\n\nDo not alter spacing.  \n\n'
  const suffix = '\nHuman tail without newline'
  await fs.writeFile(target, prefix + suffix)
  const first = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run test A.' }))
  await applyInstructionChange({ proposal: first, atomicNonce: 'first' })

  const update = await planInstructionChange(base({ action: 'update', scope: 'project', projectRoot: repo, instruction: 'Run test B.' }))
  await applyInstructionChange({ proposal: update, atomicNonce: 'update' })
  const updated = await fs.readFile(target, 'utf8')
  assert.ok(updated.startsWith(prefix + suffix))
  assert.match(updated, /Run test B\./)

  const remove = await planInstructionChange(base({ action: 'remove', scope: 'project', projectRoot: repo, instruction: '' }))
  await applyInstructionChange({ proposal: remove, atomicNonce: 'remove' })
  assert.equal(await fs.readFile(target, 'utf8'), prefix + suffix)
})

test('target drift invalidates a confirmed proposal', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  await fs.writeFile(target, 'human\n')
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.' }))
  await fs.writeFile(target, 'changed\n')
  await assert.rejects(applyInstructionChange({ proposal }), error('target_drift'))
  assert.equal(await fs.readFile(target, 'utf8'), 'changed\n')
})

test('proposal and candidate digests reject tampering', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.' }))
  await assert.rejects(applyInstructionChange({ proposal: { ...proposal, afterContent: `${proposal.afterContent}tamper` } }), error('proposal_integrity'))
  const candidateTamper = { ...proposal, candidateSha256: '0'.repeat(64) }
  candidateTamper.proposalSha256 = proposal.proposalSha256
  await assert.rejects(applyInstructionChange({ proposal: candidateTamper }), error('proposal_integrity'))
  await assert.rejects(applyInstructionChange({
    proposal,
    candidate: { id: 'validation-rule', scope: 'project', instruction: 'A different confirmed rule.' },
  }), error('candidate_integrity'))
})

test('override, nested scope, conflict, size, and forbidden content refuse without mutation', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  await fs.writeFile(target, 'human\n')
  await fs.writeFile(path.join(repo, 'AGENTS.override.md'), 'override\n')
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.' })), error('override_present'))
  await fs.unlink(path.join(repo, 'AGENTS.override.md'))
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.', nestedScope: true })), error('nested_scope'))
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.', conflict: true })), error('conflict'))
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'x'.repeat(100), maxBytes: 20 })), error('size_limit'))
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Today finish Issue #29.' })), error('forbidden_content'))
  await assert.rejects(planInstructionChange({ ...base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.' }), candidate: { ...base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.' }).candidate, sourceStatus: 'codex_failed' } }), error('codex_failed'))
  assert.equal(await fs.readFile(target, 'utf8'), 'human\n')

  await fs.writeFile(target, 'Run tests.\n')
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.' })), error('conflict'))
  await fs.writeFile(target, '<!-- power-work-report:entry:validation-rule:start -->\nRun tests.\n<!-- power-work-report:entry:validation-rule:end -->')
  await assert.rejects(planInstructionChange(base({ action: 'update', scope: 'project', projectRoot: repo, instruction: 'Run focused tests.' })), error('managed_region_invalid'))
})

test('permission refusal and atomic failure are typed and non-mutating', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  await fs.writeFile(target, 'human\n')
  const deniedFs = { ...fs, access: async () => { const value = new Error('denied'); value.code = 'EACCES'; throw value } }
  await assert.rejects(planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.', fs: deniedFs })), error('permission_denied'))
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run tests.' }))
  const failedFs = { ...fs, rename: async () => { throw new Error('rename failed') } }
  await assert.rejects(applyInstructionChange({ proposal, fs: failedFs, atomicNonce: 'fail' }), error('atomic_write_failed'))
  assert.equal(await fs.readFile(target, 'utf8'), 'human\n')

  await assert.rejects(applyInstructionChange({
    proposal,
    atomicNonce: 'race',
    beforeRename: () => fs.writeFile(target, 'raced\n'),
  }), error('target_drift'))
  assert.equal(await fs.readFile(target, 'utf8'), 'raced\n')
})

test('audit failure rolls existing add and update targets back to exact prior bytes', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  const human = '# Human rules\n\nPreserve trailing spaces.  '
  await fs.writeFile(target, human)
  const add = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run focused tests.' }))
  await assert.rejects(applyInstructionChange({
    proposal: add,
    atomicNonce: 'audit-add',
    persistAudit: async () => { throw new Error('memory write failed') },
  }), value => value?.code === 'audit_persistence_failed' && value.details.restoredExists === true)
  assert.equal(await fs.readFile(target, 'utf8'), human)

  await applyInstructionChange({ proposal: add, atomicNonce: 'seed' })
  const managedBeforeUpdate = await fs.readFile(target, 'utf8')
  const update = await planInstructionChange(base({ action: 'update', scope: 'project', projectRoot: repo, instruction: 'Run the focused validation command.' }))
  await assert.rejects(applyInstructionChange({
    proposal: update,
    atomicNonce: 'audit-update',
    persistAudit: async () => { throw new Error('memory write failed') },
  }), error('audit_persistence_failed'))
  assert.equal(await fs.readFile(target, 'utf8'), managedBeforeUpdate)
  assert.ok((await fs.readFile(target, 'utf8')).startsWith(human))
})

test('audit failure removes a target created from an absent proposal', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run focused tests.' }))
  await assert.rejects(applyInstructionChange({
    proposal,
    atomicNonce: 'audit-create',
    persistAudit: async () => { throw new Error('audit unavailable') },
  }), value => value?.code === 'audit_persistence_failed' && value.details.restoredExists === false)
  await assert.rejects(fs.stat(target), value => value?.code === 'ENOENT')
})

test('audit persistence is awaited before success and receives the final audit', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run focused tests.' }))
  let persisted = false
  const audit = await applyInstructionChange({
    proposal,
    atomicNonce: 'audit-success',
    persistAudit: async value => {
      await Promise.resolve()
      assert.equal(value.proposalId, proposal.proposalId)
      assert.equal(await fs.readFile(proposal.target.path, 'utf8'), proposal.afterContent)
      persisted = true
    },
  })
  assert.equal(persisted, true)
  assert.equal(audit.afterSha256, proposal.afterSha256)
})

test('post-apply drift makes audit rollback fail safely with both errors recorded', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  await fs.writeFile(target, 'human\n')
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run focused tests.' }))
  await assert.rejects(applyInstructionChange({
    proposal,
    atomicNonce: 'audit-drift',
    persistAudit: async () => {
      await fs.writeFile(target, 'concurrent owner bytes\n')
      throw new Error('memory write failed')
    },
  }), value => {
    assert.equal(value?.code, 'rollback_failed')
    assert.equal(value.details.auditError.message, 'memory write failed')
    assert.equal(value.details.rollbackError.code, 'target_drift')
    return true
  })
  assert.equal(await fs.readFile(target, 'utf8'), 'concurrent owner bytes\n')
})

test('rollback detects a race immediately before restoring an existing target', async t => {
  const tmp = await sandbox(t)
  const repo = await gitRepo(tmp)
  const target = path.join(repo, 'AGENTS.md')
  await fs.writeFile(target, 'human\n')
  const proposal = await planInstructionChange(base({ scope: 'project', projectRoot: repo, instruction: 'Run focused tests.' }))
  await assert.rejects(applyInstructionChange({
    proposal,
    atomicNonce: 'rollback-race',
    persistAudit: async () => { throw new Error('memory write failed') },
    beforeRollbackRename: () => fs.writeFile(target, 'rollback race bytes\n'),
  }), value => value?.code === 'rollback_failed' && value.details.rollbackError.code === 'target_drift')
  assert.equal(await fs.readFile(target, 'utf8'), 'rollback race bytes\n')
})

function base(overrides = {}) {
  const candidate = {
    id: 'validation-rule',
    scope: overrides.scope,
    instruction: overrides.instruction,
    projectRoot: overrides.projectRoot,
    nestedScope: overrides.nestedScope,
    conflict: overrides.conflict,
    confirmed: true,
  }
  return {
    candidate,
    action: overrides.action || 'add',
    sourceReport: '/reports/2026-07-12/final/report.json',
    codexHome: overrides.codexHome,
    projectRoot: overrides.projectRoot,
    maxBytes: overrides.maxBytes,
    fs: overrides.fs,
    now: NOW,
  }
}

async function sandbox(t) {
  const tmp = await fs.mkdtemp('/tmp/pwr-instructions-')
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  return tmp
}

async function gitRepo(tmp) {
  const repo = path.join(tmp, 'repo')
  await fs.mkdir(path.join(repo, '.git'), { recursive: true })
  return repo
}

function error(code) {
  return value => value?.code === code
}
