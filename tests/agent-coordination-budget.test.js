import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixturePath = path.join(root, 'tests', 'fixtures', 'agent-coordination-budget', 'cases.json')

function allocate(input) {
  const availableSubagentSlots = Math.max(0, input.hostSlots - 1)
  const reservedReviewSlots = Math.min(input.requiredReviewers, availableSubagentSlots)
  const remaining = Math.max(0, availableSubagentSlots - reservedReviewSlots)
  const laneCeiling = input.deliveryLane === 'LIGHT' ? 0 : 1
  const implementationSubagents = Math.min(laneCeiling, remaining)
  const waitHardStop = input.deliveryLane === 'HIGH' ? 20 : input.deliveryLane === 'STANDARD' ? 12 : 8
  return {
    implementationSubagents,
    reservedReviewSlots,
    totalDistinctSubagents: implementationSubagents + reservedReviewSlots,
    waitHardStop,
  }
}

test('four-slot and constrained hosts preserve reviewer capacity before spawning implementation agents', async () => {
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
  assert.ok(1 - baseline.expectedHighRiskHardStop / baseline.waitAgentCalls > 0.88)
  assert.equal(baseline.targetWaitTokenRatio, 0.10)
  assert.equal(baseline.targetUsefulWaitRatio, 0.60)
})

test('loop artifacts enforce wait budgets, minimal contexts, follow-up limits, and measurable ratios', async () => {
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
  assert.match(combined, /warning threshold: `8`|Warn internally at eight total waits/i)
  assert.match(combined, /12 for STANDARD/)
  assert.match(combined, /20 for HIGH/)
  assert.match(combined, /three consecutive no-information timeouts|Consecutive no-information timeout stop: `3`/i)
  assert.match(combined, /no 1-, 10-, 20-, or 30-second/i)
  assert.match(combined, /fork_turns: none/)
  assert.match(combined, /substantive follow-up limit: `2`|at most two substantive follow-up/i)
  assert.match(combined, /useful_wait_ratio/)
  assert.match(combined, /wait_token_ratio/)
  assert.match(combined, /never assume completed threads release capacity|Do not assume a completed thread releases capacity/i)
})
