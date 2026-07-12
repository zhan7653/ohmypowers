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
  if (recommendSplit && input.splitDecision === 'explicitly-declined-with-guarantees') result = 'READY'

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

  for (const content of [grill, loop, issueTemplate]) {
    assert.match(content, /LIGHT/)
    assert.match(content, /STANDARD/)
    assert.match(content, /HIGH/)
  }
  assert.match(grill, /independently useful `LIGHT` or `STANDARD` feature is bundled with a `HIGH`-risk mutation boundary/)
  assert.match(grill, /Do not silently select the strongest transaction, concurrency, audit, recovery, or rollback guarantee/)
  assert.match(loop, /Use the delivery lane already recorded in the Task Contract/)
  assert.match(checklist, /contradicts the recorded lane or split decision/i)
  assert.match(issueTemplate, /必须保证的安全性：/)
  assert.match(issueTemplate, /不在范围内的更强保证：/)
})

test('Task Contract is normative while Blueprint and runtime review evidence stay supplementary', async () => {
  const [issueTemplate, blueprint, finalReview, patch, verifier] = await Promise.all([
    readFile(path.join(root, 'power-grill', 'assets', 'issue-body.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'execution-blueprint.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'final-review-record.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'assets', 'issue-patch.md'), 'utf8'),
    readFile(path.join(root, 'power-verifier', 'SKILL.md'), 'utf8'),
  ])

  assert.match(issueTemplate, /任务合同是唯一规范性合同/)
  assert.match(issueTemplate, /产物 digest：`None`/)
  assert.match(blueprint, /非规范性执行指导/)
  assert.match(blueprint, /不得增加/)
  assert.match(finalReview, /补充证据/)
  assert.match(finalReview, /不得增加/)
  assert.match(patch, /精简 Blueprint 引用 Patch/)
  assert.doesNotMatch(patch, /Decision summary/)
  assert.match(patch, /产物 digest：`sha256:/)
  assert.match(patch, /任务合同 digest：`sha256:/)
  assert.doesNotMatch(patch, /<all remaining filled Execution Blueprint fields and sections>/)
  assert.match(verifier, /Extract every applicable obligation only from the Task Contract/)
})
