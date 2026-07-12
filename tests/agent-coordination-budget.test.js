import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixturePath = path.join(root, 'tests', 'fixtures', 'agent-coordination-budget', 'cases.json')

function allocate(input) {
  const availableSubagentSlots = Math.max(0, input.hostSlots - 1)
  const reviewCeiling = input.deliveryLane === 'HIGH' ? 2 : 1
  const needsHuman = input.requiredReviewers > reviewCeiling || input.requiredReviewers > availableSubagentSlots
  const reservedReviewSlots = needsHuman ? 0 : input.requiredReviewers
  const implementationSubagents = 0
  const waitHardStop = reservedReviewSlots
  return {
    implementationSubagents,
    reservedReviewSlots,
    totalDistinctSubagents: implementationSubagents + reservedReviewSlots,
    waitHardStop,
    needsHuman,
  }
}

test('implementation stays on the main agent while decoupled final reviewers use bounded parallel slots', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  assert.equal(fixture.schema, 'agent-coordination-budget-cases/v1')
  for (const scenario of fixture.cases) {
    assert.deepEqual(allocate(scenario.input), scenario.expected, scenario.id)
  }
})

test('Issue 29 wait baseline is stopped before repeated polling dominates the main session', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  const baseline = fixture.issue29Baseline
  assert.ok(baseline.expectedHighRiskHardStop < baseline.waitAgentCalls)
  assert.ok(1 - baseline.expectedHighRiskHardStop / baseline.waitAgentCalls > 0.98)
  assert.equal(baseline.targetWaitTokenRatio, 0.05)
  assert.equal(baseline.targetUsefulWaitRatio, 0.80)
})

test('loop artifacts prohibit implementation subagents and bound parallel review waits', async () => {
  const files = [
    'power-loop/SKILL.md',
    'power-loop/assets/execution-blueprint.md',
    'power-loop/assets/agent-dispatch-plan-inherited.md',
    'power-loop/assets/agent-dispatch-plan-strict.md',
    'power-loop/assets/pr-evidence-template.md',
  ]
  const contents = await Promise.all(files.map(file => readFile(path.join(root, file), 'utf8')))
  const combined = contents.join('\n')

  assert.match(combined, /wait_agent/)
  assert.match(combined, /Implementation subagent (?:budget|ceiling): `0`/i)
  assert.match(combined, /one for `LIGHT` or `STANDARD`|1 for LIGHT or STANDARD/i)
  assert.match(combined, /two for `HIGH`|2 for HIGH/i)
  assert.match(combined, /one no-information timeout|first no-information timeout/i)
  assert.match(combined, /no 1-, 10-, 20-, or 30-second/i)
  assert.match(combined, /fork_turns: none/)
  assert.match(combined, /substantive follow-up limit: `0`|no substantive follow-up/i)
  assert.match(combined, /same frozen|same stable snapshot/i)
  assert.match(combined, /independent|decoupled/i)
  assert.match(combined, /useful_wait_ratio/)
  assert.match(combined, /wait_token_ratio/)
  assert.match(combined, /never assume completed threads release capacity|Do not assume a completed thread releases capacity/i)
})
