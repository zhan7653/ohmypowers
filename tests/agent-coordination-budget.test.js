import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixturePath = path.join(root, 'tests', 'fixtures', 'agent-coordination-budget', 'cases.json')

function allocate(input) {
  const availableSubagentSlots = Math.max(0, input.hostSlots - 1)
  const selectedReviewers = Math.max(2, input.requiredReviewers)
  const needsHuman = selectedReviewers > availableSubagentSlots
  const reviewers = needsHuman ? 0 : selectedReviewers
  const waitHardStop = needsHuman ? 0 : reviewers + 3
  return {
    reviewers,
    totalDistinctSubagents: reviewers,
    waitHardStop,
    needsHuman,
  }
}

test('final review capacity scales with decoupled capabilities instead of delivery-lane ceilings', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  assert.equal(fixture.schema, 'review-coordination-budget-cases/v2')
  for (const scenario of fixture.cases) {
    assert.deepEqual(allocate(scenario.input), scenario.expected, scenario.id)
  }
})

test('Issue 29 wait baseline is stopped before repeated polling dominates the main session', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  const baseline = fixture.issue29Baseline
  assert.ok(baseline.expectedThreeReviewerHardStop < baseline.waitAgentCalls)
  assert.ok(1 - baseline.expectedThreeReviewerHardStop / baseline.waitAgentCalls > 0.96)
  assert.equal(baseline.targetWaitTokenRatio, 0.10)
  assert.equal(baseline.targetUsefulWaitRatio, 0.60)
  assert.equal(baseline.reviewerGracePeriodSeconds, 180)
  assert.equal(baseline.waitTimeoutSeconds, 180)
  assert.equal(baseline.consecutiveNoInformationStop, 3)
})

test('loop artifacts require decoupled contract and code review with patient metered waiting', async () => {
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
  assert.doesNotMatch(combined, /Implementation subagent/i)
  assert.match(combined, /contract-conformance reviewer/i)
  assert.match(combined, /code reviewer/i)
  assert.match(combined, /additional.*reviewer|additional review capabilities/is)
  assert.match(combined, /180 seconds|three minutes/i)
  assert.match(combined, /three consecutive no-information timeouts/i)
  assert.match(combined, /launched reviewer count.*\+ 3|number of launched reviewers plus three/i)
  assert.match(combined, /no 1-, 10-, 20-, 30-, or 60-second/i)
  assert.match(combined, /fork_turns: none/)
  assert.match(combined, /substantive follow-up limit: `1`|one consolidated substantive follow-up/i)
  assert.match(combined, /same frozen|same stable snapshot/i)
  assert.match(combined, /independent|decoupled/i)
  assert.match(combined, /useful_wait_ratio/)
  assert.match(combined, /wait_token_ratio/)
  assert.match(combined, /never assume completed threads release capacity|Do not assume a completed thread releases capacity/i)
})
