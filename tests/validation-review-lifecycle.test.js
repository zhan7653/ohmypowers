import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixturePath = path.join(root, 'tests', 'fixtures', 'validation-review-lifecycle', 'cases.json')

function evaluate(events) {
  let repairRounds = 0
  let finalReviewWaves = 0
  let v3Runs = 0
  let finalTree = null
  const v3Trees = new Set()
  let result = 'PASS'

  for (const event of events) {
    const [name, tree] = event.split(':')
    if (name === 'repair') repairRounds++
    if (name === 'freeze') finalTree = tree
    if (name === 'final-review-block') {
      finalReviewWaves++
      if (finalReviewWaves >= 2) result = 'REPLAN'
    }
    if (name === 'final-review-pass') {
      finalReviewWaves++
      assert.ok(v3Trees.has(tree), 'final reviewers inspect V3 evidence for the same frozen tree')
    }
    if (name === 'v3') {
      v3Runs++
      assert.equal(tree, finalTree, 'V3 runs on the current frozen tree')
      v3Trees.add(tree)
    }
  }

  return { result, repairRounds, finalReviewWaves, v3Runs, finalTree }
}

test('validation lifecycle runs V3 after V2 on the frozen tree and stops after a second blocking review wave', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  assert.equal(fixture.schema, 'validation-review-lifecycle-cases/v1')
  for (const scenario of fixture.cases) {
    assert.deepEqual(evaluate(scenario.events), scenario.expected, scenario.id)
  }
})

test('Issue 29 six-snapshot loop is bounded to one batched review, one repair, and three candidates', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  const baseline = fixture.issue29Baseline
  assert.ok(baseline.targetCandidateSnapshotCeiling < baseline.recordedSnapshots)
  assert.ok(baseline.targetAdversarialReviewWaves < baseline.reviewRepairCycles)
  assert.equal(baseline.targetConcentratedRepairRounds, 1)
  assert.equal(baseline.targetV3SuccessfulFinalTreeRuns, 1)
  assert.equal(baseline.exceptionalV3TotalRunCeiling, 2)
})

test('loop and verifier artifacts separate V0-V3, batch adversarial findings, and bind final evidence to one tree', async () => {
  const files = [
    'power-loop/SKILL.md',
    'power-loop/assets/execution-blueprint.md',
    'power-loop/assets/agent-dispatch-plan-inherited.md',
    'power-loop/assets/agent-dispatch-plan-strict.md',
    'power-loop/assets/pr-evidence-template.md',
    'power-verifier/SKILL.md',
    'power-verifier/assets/implementation-verifier-checklist.md',
    'power-verifier/assets/verifier-result-template.md',
  ]
  const combined = (await Promise.all(files.map(file => readFile(path.join(root, file), 'utf8')))).join('\n')

  for (const tier of ['V0 Focused', 'V1 Integration', 'V2 Final deterministic', 'V3 External']) {
    assert.match(combined, new RegExp(tier, 'i'))
  }
  assert.match(combined, /failure matrix/i)
  assert.match(combined, /one batched finding set|one batched finding/i)
  assert.match(combined, /at most one concentrated repair|Concentrated repair rounds: `<0 or 1/)
  assert.match(combined, /Candidate snapshot ceiling: `3`/)
  assert.match(combined, /run once after V2|after `V2` passes/i)
  assert.match(combined, /does not replay|do not replay/i)
  assert.match(combined, /same frozen Git tree digest|same unchanged tree|unchanged frozen tree/i)
})
