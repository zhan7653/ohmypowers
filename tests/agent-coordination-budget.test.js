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
  return {
    reviewers: selectedReviewers,
    totalDistinctSubagents: selectedReviewers,
    needsHuman: availableSubagentSlots === 0,
  }
}

test('final review capacity scales with decoupled capabilities instead of delivery-lane ceilings', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  assert.equal(fixture.schema, 'review-coordination-budget-cases/v3')
  for (const scenario of fixture.cases) {
    assert.deepEqual(allocate(scenario.input), scenario.expected, scenario.id)
  }
})

test('Issue 29 wait baseline is stopped before repeated polling dominates the main session', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  const baseline = fixture.issue29Baseline
  assert.ok(baseline.maxConsecutiveNoInformationWaits < baseline.waitAgentCalls)
  assert.ok(1 - baseline.maxConsecutiveNoInformationWaits / baseline.waitAgentCalls > 0.98)
  assert.equal(baseline.reviewerGracePeriodSeconds, 180)
  assert.equal(baseline.waitTimeoutSeconds, 180)
  assert.equal(baseline.maxConsecutiveNoInformationWaits, 3)
})

test('loop artifacts require decoupled contract and code review with patient metered waiting', async () => {
  const files = [
    'power-loop/SKILL.md',
    'power-loop/assets/final-review-record.md',
    'power-loop/assets/pr-evidence-template.md',
  ]
  const contents = await Promise.all(files.map(file => readFile(path.join(root, file), 'utf8')))
  const combined = contents.join('\n')

  assert.match(combined, /wait_agent/)
  assert.doesNotMatch(combined, /Implementation subagent/i)
  assert.match(combined, /contract-conformance.*code-review/is)
  assert.match(combined, /Add .*risk scopes/i)
  assert.match(combined, /180 seconds|180 秒|three minutes/i)
  assert.match(combined, /after the third|第三次后/i)
  assert.match(combined, /fork_turns: none/)
  assert.match(combined, /one consolidated.*follow-up|一次合并后的澄清或完成请求/i)
  assert.match(combined, /frozen tree/i)
  assert.match(combined, /independent|decoupled/i)
  assert.doesNotMatch(combined, /useful_wait_ratio|wait_token_ratio|coordination-token ratio/i)

  const prEvidence = contents[2]
  assert.doesNotMatch(prEvidence, /wait_agent|Maximum consecutive no-information|Cumulative wait duration/)
})
