import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

test('power-gan keeps decisions firm and implementation adaptive', async () => {
  const skill = await read('power-gan/SKILL.md')

  assert.match(skill, /`ALIGN_ONLY`/)
  assert.match(skill, /`DELIVER`/)
  assert.match(skill, /`FAST`/)
  assert.match(skill, /`DEEP`/)
  assert.match(skill, /ask only whether they want alignment or delivery/i)
  assert.match(skill, /one question at a time/i)
  assert.match(skill, /do not call or depend on `grill-me`/i)
  assert.match(skill, /generic reply such as “可以”, “确认”, or “应用”/i)
  assert.match(skill, /strongest credible argument against/i)
  assert.match(skill, /architecture or interface choice as material even when internal/i)
  assert.match(skill, /durable subsystem, runtime, deployment, storage, or data-ownership boundary/i)
  assert.match(skill, /shared contract across modules or teams/i)
  assert.match(skill, /Do not escalate local signatures or easily replaceable abstractions/i)
  assert.match(skill, /Working Strategy in the current session/i)
  assert.match(skill, /Autonomous Execution Boundary/i)
  assert.match(skill, /Stop pre-write investigation once there is enough evidence/i)
  assert.match(skill, /Align any unresolved architecture-significant choice/i)
  assert.match(skill, /Wait once for explicit launch authorization/i)
  assert.match(skill, /permits long-running autonomous work inside that boundary/i)
  assert.match(skill, /non-blocking progress/i)
  assert.match(skill, /no reply is needed/i)
  assert.match(skill, /execution is paused/i)
  assert.match(skill, /Do not pause merely because the Working Strategy changed/i)
  assert.match(skill, /Comments alone never add current obligations/i)
  assert.match(skill, /optional closest alternative not chosen/i)
  assert.match(skill, /Do not invent an alternative merely to fill the record/i)
  assert.match(skill, /read relevant comments only for re-alignment, decision conflict, revision change, or check provenance/i)
  assert.match(skill, /code to commit, commit to PR\/MR, PR\/MR to Decision Issue/i)
  assert.match(skill, /delivery PR\/MR for a material Decision Issue must link it explicitly/i)
  assert.match(skill, /references\/issue-persistence\.md/)
  assert.match(skill, /references\/delivery-evidence\.md/)
  assert.match(skill, /CHECK_REQUIRED/)
  assert.doesNotMatch(skill, /Task Contract|Execution Blueprint|Agent Dispatch Plan/)
})

test('power-check is read-only and checks only current decisions and final evidence', async () => {
  const skill = await read('power-check/SKILL.md')

  assert.match(skill, /without editing source, Git state, Issues, PRs, or comments/i)
  assert.match(skill, /current confirmed user decisions/i)
  assert.match(skill, /final implementation tree and diff/i)
  assert.match(skill, /Do not turn a Working Strategy, Blueprint, rejected option/i)
  assert.match(skill, /`PASS`/)
  assert.match(skill, /`PASS_WITH_NOTES`/)
  assert.match(skill, /`BLOCKED`/)
  assert.match(skill, /`NEEDS_HUMAN`/)
  assert.match(skill, /`CHECK_REQUIRED`/)
  assert.match(skill, /If the tree or diff changes afterward, the old result covers only the earlier content/i)
  for (const field of [
    'Decision source',
    'Final implementation identity',
    'Validation evidence',
    'Residual risk',
    'Smallest next action',
  ]) {
    assert.match(skill, new RegExp(field, 'i'))
  }
})

test('issue persistence supports verified GitHub and GitLab mutations without repo Markdown', async () => {
  const reference = await read('power-gan/references/issue-persistence.md')

  assert.match(reference, /\/tmp\/power-gan-decision-record\.md/)
  assert.match(reference, /explicitly requested or confirmed that mutation/i)
  assert.match(reference, /gh issue create .*--body-file/i)
  assert.match(reference, /gh issue edit .*--body-file/i)
  assert.match(reference, /gh issue view .*--json/i)
  assert.match(reference, /glab issue create .*<repository-or-full-url>/i)
  assert.match(reference, /glab issue update/i)
  assert.match(reference, /glab issue view/i)
  assert.match(reference, /full repository URL when required/i)
  assert.match(reference, /delivery PR\/MR must explicitly mention the Decision Issue/i)
  assert.match(reference, /Alternative not chosen: <include only when/i)
  assert.match(reference, /Do not invent alternatives to complete the template/i)
  assert.doesNotMatch(reference, /rejected: <main alternative>/i)
  for (const field of ['Change', 'New evidence or objection', 'Confirmed decision', 'Rationale', 'Confirmed by']) {
    assert.match(reference, new RegExp(field, 'i'))
  }
})

test('delivery evidence records final facts without recreating an implementation plan', async () => {
  const reference = await read('power-gan/references/delivery-evidence.md')

  for (const field of [
    'Decision source',
    'Delivered outcome',
    'Material deviations',
    'Validation',
    'Independent check',
    'Remaining risks or follow-up',
  ]) {
    assert.match(reference, new RegExp(field, 'i'))
  }
  assert.match(reference, /Record observed delivery facts, not the implementation plan/i)
  assert.match(reference, /Do not add Working Strategy/i)
  assert.doesNotMatch(reference, /Execution Blueprint|Agent Dispatch Plan|reviewer topology table/i)
})

test('critic and curator route material changes back to power-gan', async () => {
  const [critic, curator] = await Promise.all([
    read('power-critic/SKILL.md'),
    read('power-curator/SKILL.md'),
  ])

  assert.match(critic, /return it to `\$power-gan` for user alignment/i)
  assert.match(critic, /redirect to `\$power-check`/i)
  assert.match(curator, /Send material decision changes back through `\$power-gan`/i)
  assert.match(curator, /Comments are history and evidence only/i)
  assert.match(curator, /Do not keep a closed Issue synchronized/i)
  assert.match(curator, /Never collapse or supersede Issues from title similarity alone/i)
  assert.match(curator, /later tree or diff change invalidates the old result/i)
})

test('retired core skill directories are absent', async () => {
  for (const skill of ['power-think', 'power-grill', 'power-loop', 'power-verifier']) {
    await assert.rejects(access(path.join(root, skill, 'SKILL.md')))
  }
})
