import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixtureRoot = path.join(root, 'tests', 'fixtures', 'power-verifier')

async function readFixture(name) {
  return JSON.parse(await readFile(path.join(fixtureRoot, name), 'utf8'))
}

function aggregate(input) {
  if (input.conflicts.length || input.humanDecisionRequired) return 'NEEDS_HUMAN'

  const isFresh = evidence => evidence.snapshot === input.snapshot.id && !evidence.stale
  const hasBlockingClause = input.clauses.some(
    clause => clause.applicable && ['nonconformant', 'missing_evidence'].includes(clause.status),
  )
  const missingEvidence = input.requiredEvidence.some(evidence => !evidence.present || !isFresh(evidence))
  const failedReplay = input.validationReplays.some(replay => replay.required && (!isFresh(replay) || replay.result !== 'passed'))
  const reviewsMeetRequirements = input.reviewRequirements.every(requirement =>
    input.reviews.some(review =>
      isFresh(review) && Object.entries(requirement.exact).every(([key, value]) => review[key] === value),
    ),
  )
  const hasIndependentConformanceReview = input.reviews.some(
    review =>
      isFresh(review) &&
      review.independentFromImplementation &&
      review.capability === 'contract-conformance' &&
      review.result === 'passed',
  )

  if (
    hasBlockingClause ||
    missingEvidence ||
    failedReplay ||
    !reviewsMeetRequirements ||
    !hasIndependentConformanceReview
  ) {
    return 'BLOCKED'
  }
  return input.notes.length ? 'PASS_WITH_NOTES' : 'PASS'
}

test('aggregation fixtures implement the documented deterministic precedence', async () => {
  const fixture = await readFixture('aggregation-cases.json')

  assert.equal(fixture.schema, 'power-verifier-aggregation-cases/v1')
  for (const scenario of fixture.cases) {
    assert.equal(aggregate(scenario.input), scenario.expected.result, scenario.id)
    assert.ok(scenario.expected.smallestNextAction, `${scenario.id} has a next action`)
  }
})

test('aggregation fixtures cover every required result and evidence condition', async () => {
  const fixture = await readFixture('aggregation-cases.json')
  const ids = new Set(fixture.cases.map(scenario => scenario.id))

  for (const id of [
    'full-compliance',
    'fixable-implementation-nonconformance',
    'missing-required-evidence',
    'missing-independent-review',
    'issue-goal-conflict',
    'nonblocking-reviewer-notes',
    'stale-evidence-after-snapshot-change',
    'exact-named-review-requirement',
  ]) {
    assert.ok(ids.has(id), `missing ${id}`)
  }
})

test('semantic packages are replay-ready evidence, not deterministic LLM assertions', async () => {
  const fixture = await readFixture('semantic-cases.json')

  assert.equal(fixture.schema, 'power-verifier-semantic-cases/v1')
  assert.equal(fixture.evaluation, 'manual-read-only-replay')
  assert.ok(fixture.packages.some(item => item.project.portable), 'includes an arbitrary project')
  for (const item of fixture.packages) {
    assert.match(item.expected.result, /^(PASS|PASS_WITH_NOTES|BLOCKED|NEEDS_HUMAN)$/)
    assert.ok(item.contract.issue.clauses.length)
    assert.ok(item.contract.goal.clauses.length)
    assert.ok(item.snapshot.id)
    assert.ok(item.clauseEvidence.length)
    assert.ok(item.reviewerProvenance.length)
    assert.ok(item.validationReplay.assessment)
    assert.ok(item.replayAssessment)
  }
})
