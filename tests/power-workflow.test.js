import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

test('power-gan grills unresolved decisions naturally and delivers adaptively', async () => {
  const skill = await read('power-gan/SKILL.md')

  assert.match(skill, /`ALIGN_ONLY`/)
  assert.match(skill, /`DELIVER`/)
  assert.match(skill, /`FAST`/)
  assert.match(skill, /`DEEP`/)
  assert.match(skill, /Keep any required skill announcement to one brief clause/i)
  assert.match(skill, /direct request to implement authorizes reversible source changes/i)
  assert.match(skill, /ask only whether the user wants implementation/i)
  const mainHeadings = ['Goal', 'Success', 'Constraints', 'Decision Rules', 'Validation', 'Stop Rules']
  for (const heading of mainHeadings) {
    assert.match(skill, new RegExp(`^## ${heading}$`, 'm'))
  }
  assert.deepEqual(skill.match(/^## .+$/gm), mainHeadings.map(heading => `## ${heading}`))
  assert.match(skill, /Run The Grill Loop/i)
  assert.match(skill, /make each grill turn do this/i)
  assert.match(skill, /Ask one to three highest-leverage unresolved questions/i)
  assert.match(skill, /Ask one question when later questions depend on its answer/i)
  assert.match(skill, /Ask two or three only when they belong to the same decision layer/i)
  assert.match(skill, /If the user answers only part of a batch, keep the unanswered questions unresolved/i)
  assert.match(skill, /Stop and wait for the user's answer/i)
  assert.match(skill, /Use one short paragraph of context, not a bullet list/i)
  assert.match(skill, /Do not announce interview phases, mode transitions, or a future sequence of questions/i)
  assert.match(skill, /Do not front-load a design baseline, list downstream decisions/i)
  assert.match(skill, /assumption about a material user-owned boundary as unresolved/i)
  assert.match(skill, /Treat verified repository facts as facts/i)
  assert.match(skill, /keep agent-owned reversible implementation assumptions outside the user confirmation loop/i)
  assert.match(skill, /“先设计” authorizes the interview, not a full design written on the user's behalf/i)
  assert.match(skill, /If the previous turn made an unconfirmed recommendation, keep it in the next question batch/i)
  assert.match(skill, /do not output a design draft, acceptance criteria, a multi-bullet decision list, or numbered alternatives/i)
  assert.match(skill, /State one recommendation for each current question/i)
  assert.match(skill, /Inspect Before Asking/i)
  assert.match(skill, /Resolve observable product and state semantics before interface syntax or compatibility mechanics/i)
  assert.match(skill, /Be relentless about unresolved boundaries, not about filling fields/i)
  assert.match(skill, /Accept concise confirmation when the immediately preceding question makes its scope unambiguous/i)
  assert.match(skill, /Do not manufacture alternatives, force symmetry, use a routine A\/B\/C template/i)
  assert.match(skill, /do not ask the user to choose reversible implementation mechanics/i)
  assert.match(skill, /repository-derived assumption may guide non-material, reversible implementation as a visible working default/i)
  assert.match(skill, /does not resolve a material user-owned boundary/i)
  assert.match(skill, /material boundary as resolved only by an explicit user decision or an explicit not-applicable conclusion/i)
  assert.doesNotMatch(skill, /repository-derived assumption the user has not disputed/i)
  assert.doesNotMatch(skill, /do not call or depend on `grill-me`/i)
  assert.doesNotMatch(skill, /generic reply such as “可以”, “确认”, or “应用”/i)
  assert.doesNotMatch(skill, /strongest credible argument against/i)
  assert.match(skill, /durable subsystem, runtime, deployment, storage, or data-ownership boundary/i)
  assert.match(skill, /shared contract across modules or teams/i)
  assert.match(skill, /Do not escalate a local signature or replaceable abstraction/i)
  assert.match(skill, /Materiality alone does not authorize hosted mutation or force creation of an Issue/i)
  assert.match(skill, /Treat the user's direct implementation request as launch authorization/i)
  assert.match(skill, /Wait only when implementation would introduce an unresolved material commitment/i)
  assert.match(skill, /mention alternatives only when they are genuinely viable/i)
  assert.doesNotMatch(skill, /Wait once for explicit launch authorization/i)
  assert.doesNotMatch(skill, /discuss at least shrinking, splitting, or continuing/i)
  assert.match(skill, /Treat comments as history and evidence/i)
  assert.match(skill, /code to commit, commit to PR\/MR, PR\/MR to Decision Issue/i)
  assert.match(skill, /references\/issue-persistence\.md/)
  assert.match(skill, /references\/delivery-evidence\.md/)
  assert.match(skill, /Use a fresh non-implementation context when independence matters/i)
  assert.match(skill, /CHECK_REQUIRED/)
  assert.doesNotMatch(skill, /current main agent announces and selects/i)
  assert.doesNotMatch(skill, /this skill does not call another skill/i)
  assert.doesNotMatch(skill, /Task Contract|Execution Blueprint|Agent Dispatch Plan/)
  assert.doesNotMatch(skill, /Ask exactly one highest-leverage unresolved question/i)
})

test('power-gan question batching stays consistent across workflow guidance', async () => {
  const [skill, readme, spec] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  assert.match(skill, /one to three highest-leverage unresolved questions/i)
  assert.match(readme, /focused rounds of one to three questions/i)
  assert.match(spec, /每轮必须提出一至三个最高杠杆问题/)
  assert.match(spec, /同一决策层的独立问题/)
  assert.doesNotMatch(spec, /Deep Grill 必须一次只问一个问题/)
})

test('power-check is read-only and checks only current decisions and final evidence', async () => {
  const skill = await read('power-check/SKILL.md')

  assert.match(skill, /materially affects or creates credible production risk/i)
  assert.match(skill, /production persistent state/i)
  assert.match(skill, /external or cross-version compatibility commitments/i)
  assert.match(skill, /concurrency correctness/i)
  assert.match(skill, /Merely touching related code, configuration, tests, caches, fixtures, or compatibility logic is insufficient/i)
  assert.match(skill, /A small diff can still be material/i)
  assert.match(skill, /backward-compatible optional configuration field/i)
  assert.doesNotMatch(skill, /when delivery risk involves security, privacy, permissions, persistent state/i)
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

test('power-check materiality trigger stays consistent across workflow guidance', async () => {
  const [check, gan, readme, spec] = await Promise.all([
    read('power-check/SKILL.md'),
    read('power-gan/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  for (const text of [check, gan, readme]) {
    assert.match(text, /materially affects or creates credible production risk/i)
    assert.match(text, /production persistent state/i)
    assert.match(text, /external or cross-version compatibility/i)
    assert.match(text, /concurrency correctness/i)
  }
  assert.match(spec, /材料影响或可信生产风险/)
  assert.match(spec, /外部或跨版本兼容/)
  assert.match(spec, /仅触碰相关代码、配置、测试、缓存、fixture 或兼容逻辑不足以触发独立检查/)
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
  assert.match(reference, /When a Decision Issue is the canonical source for the delivery/i)
  assert.match(reference, /Alternative not chosen: <include only when/i)
  assert.match(reference, /Do not invent alternatives to complete the template/i)
  assert.doesNotMatch(reference, /rejected: <main alternative>/i)
  assert.doesNotMatch(reference, /New evidence or objection/i)
  for (const field of ['Change', 'Reason / evidence', 'Confirmed decision', 'Rationale', 'Confirmed by']) {
    assert.match(reference, new RegExp(field, 'i'))
  }
})

test('decision revisions remain optional and repository-defined', async () => {
  const [skill, reference, readme, spec] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('power-gan/references/issue-persistence.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  assert.match(skill, /If the repository uses decision revisions/i)
  assert.match(reference, /omit when the repository does not use revisions/i)
  assert.match(readme, /a revision only when the repository uses one/i)
  assert.match(spec, /仅在仓库采用 revision 时记录 revision/)
  assert.doesNotMatch(readme, /status, revision, outcome/i)
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
