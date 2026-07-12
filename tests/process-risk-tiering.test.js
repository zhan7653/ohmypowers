import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixturePath = path.join(root, 'tests', 'fixtures', 'process-risk-tiering', 'cases.json')

function assess(input) {
  const deliveryLane = input.highRiskBoundaries.length
    ? 'HIGH'
    : input.multiModuleOrCompatibilitySensitive
      ? 'STANDARD'
      : 'LIGHT'
  const recommendSplit = deliveryLane === 'HIGH'
    && input.independentOrdinaryValue
    && input.highRiskBoundarySeparable

  let result = 'READY'
  if (recommendSplit && input.splitDecision === 'missing') result = 'NEEDS_GRILL'
  if (recommendSplit && input.splitDecision === 'explicitly-declined-with-guarantees') {
    result = 'READY_WITH_STRICT_GATE'
  }

  return { deliveryLane, recommendSplit, result }
}

test('delivery-lane fixtures split Issue 29 before repository-aware planning', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  assert.equal(fixture.schema, 'process-risk-tiering-cases/v1')

  for (const scenario of fixture.cases) {
    const actual = assess(scenario.input)
    assert.deepEqual(actual, {
      deliveryLane: scenario.expected.deliveryLane,
      recommendSplit: scenario.expected.recommendSplit,
      result: scenario.expected.result,
    }, scenario.id)
  }

  const issue29 = fixture.cases.find(item => item.id === 'issue-29-report-insights-plus-agents-mutation')
  assert.deepEqual(issue29.expected.recommendedContracts, [
    'STANDARD: personal memo and reusable insight generation',
    'HIGH: confirmed AGENTS.md mutation lifecycle',
  ])
  assert.match(issue29.expected.saferReducedAlternative, /exact diff for manual application/)
})

test('grill and loop require explicit split and safety decisions instead of silently expanding safe', async () => {
  const [grill, loop, checklist, issueTemplate] = await Promise.all([
    readFile(path.join(root, 'power-grill', 'SKILL.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'SKILL.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'loop-readiness-checklist.md'), 'utf8'),
    readFile(path.join(root, 'power-grill', 'assets', 'issue-body.md'), 'utf8'),
  ])

  for (const content of [grill, loop, checklist, issueTemplate]) {
    assert.match(content, /LIGHT/)
    assert.match(content, /STANDARD/)
    assert.match(content, /HIGH/)
  }
  assert.match(grill, /independently useful `LIGHT` or `STANDARD` feature is bundled with a `HIGH`-risk mutation boundary/)
  assert.match(grill, /Do not silently select the strongest transaction, concurrency, audit, recovery, or rollback guarantee/)
  assert.match(loop, /Return `NEEDS_GRILL` when an independently valuable `LIGHT` or `STANDARD` outcome is bundled with a separable `HIGH`-risk boundary/)
  assert.match(checklist, /Broad terms such as “safe”, “atomic”, or “recoverable”/)
  assert.match(issueTemplate, /Required safety guarantees:/)
  assert.match(issueTemplate, /Stronger guarantees out of scope:/)
})

test('Task Contract is normative while planning artifacts are separate compact references', async () => {
  const [issueTemplate, blueprint, inherited, strict, patch, goal, verifier] = await Promise.all([
    readFile(path.join(root, 'power-grill', 'assets', 'issue-body.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'execution-blueprint.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'agent-dispatch-plan-inherited.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'agent-dispatch-plan-strict.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'issue-patch.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'codex-loop-goal.txt'), 'utf8'),
    readFile(path.join(root, 'power-verifier', 'SKILL.md'), 'utf8'),
  ])

  assert.match(issueTemplate, /The Task Contract is the sole normative contract/)
  assert.match(issueTemplate, /Artifact digest: `None`/)
  for (const plan of [blueprint, inherited, strict]) {
    assert.match(plan, /confirmed operational guidance/)
    assert.match(plan, /cannot add/)
  }
  assert.match(patch, /Compact Planning Reference Patch/)
  assert.match(patch, /Decision summary/)
  assert.match(patch, /Artifact digest: `sha256:/)
  assert.doesNotMatch(patch, /<all remaining filled Execution Blueprint fields and sections>/)
  assert.match(goal, /Treat only its Task Contract byte range as normative/)
  assert.match(verifier, /extract normative clauses only from the Task Contract/)
})
