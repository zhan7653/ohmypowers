import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixtureRoot = path.join(root, 'tests', 'fixtures', 'power-verifier')
const fixedTopologyPaths = [
  'README.md',
  'docs/loop-engineering-tutorial.md',
  'docs/specs/2026-07-10-power-loop-cost-aware-multi-agent-orchestration-spec.md',
  'power-loop/SKILL.md',
  'power-loop/assets/agent-dispatch-plan.md',
  'power-loop/assets/execution-blueprint.md',
  'power-loop/assets/issue-patch.md',
  'power-loop/assets/loop-readiness-checklist.md',
  'power-loop/assets/pr-evidence-template.md',
  'tests/fixtures/power-loop/sample-contracts.md',
]
const fixedTopologyPatterns = [
  /two (independent )?Sol High/i,
  /both required review tracks/i,
  /mandatory separate code review/i,
  /fixed dual/i,
  /Sol High code review \+ evidence verification/i,
  /separate Sol High tasks/i,
  /Sol High review/i,
]

async function readFixture(name) {
  return JSON.parse(await readFile(path.join(fixtureRoot, name), 'utf8'))
}

function aggregate(input) {
  if (input.conflicts.length || input.humanDecisionRequired) return 'NEEDS_HUMAN'

  const isFresh = evidence => evidence.snapshot === input.snapshot.id && !evidence.stale
  const selectedReviews = input.reviews.filter(review => review.selected !== false)
  const hasHumanRequiredClause = input.clauses.some(
    clause =>
      clause.applicable &&
      (clause.status === 'needs_human' ||
        clause.requiresHumanInterpretation ||
        clause.humanDecisionRequired),
  )
  if (hasHumanRequiredClause) return 'NEEDS_HUMAN'

  const hasBlockingClause = input.clauses.some(
    clause =>
      clause.applicable &&
      (clause.status !== 'satisfied' ||
        clause.evidencePresent === false ||
        clause.stale ||
        (clause.snapshot && !isFresh(clause))),
  )
  const missingEvidence = input.requiredEvidence.some(evidence => !evidence.present || !isFresh(evidence))
  const failedReplay = input.validationReplays.some(replay => replay.required && (!isFresh(replay) || replay.result !== 'passed'))
  const reviewsMeetRequirements = input.reviewRequirements.every(requirement =>
    selectedReviews.some(review =>
      isFresh(review) &&
      review.result === 'passed' &&
      Object.entries(requirement.exact).every(([key, value]) => review[key] === value),
    ),
  )
  const hasBlockingSelectedReview = selectedReviews.some(
    review => !isFresh(review) || ['blocked', 'failed', 'nonconformant'].includes(review.result),
  )
  const hasIndependentConformanceReview = selectedReviews.some(
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
    hasBlockingSelectedReview ||
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
    'failed-exact-required-review',
    'stale-clause-evidence',
    'human-required-clause',
    'selected-review-wrong-snapshot',
  ]) {
    assert.ok(ids.has(id), `missing ${id}`)
  }
})

test('failed exact reviews, stale clauses, and human-required clauses cannot pass', async () => {
  const fixture = await readFixture('aggregation-cases.json')
  const cases = new Map(fixture.cases.map(scenario => [scenario.id, scenario]))

  for (const id of ['failed-exact-required-review', 'stale-clause-evidence', 'human-required-clause']) {
    assert.notEqual(aggregate(cases.get(id).input), 'PASS', id)
  }
})

test('repository guidance does not reintroduce fixed Sol High review topology', async () => {
  const files = await Promise.all(
    fixedTopologyPaths.map(async relativePath => ({
      relativePath,
      content: await readFile(path.join(root, relativePath), 'utf8'),
    })),
  )

  for (const { relativePath, content } of files) {
    for (const pattern of fixedTopologyPatterns) {
      assert.doesNotMatch(content, pattern, `${relativePath} reintroduces fixed review topology`)
    }
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
