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
  'power-loop/assets/agent-dispatch-plan-strict.md',
  'power-loop/assets/agent-dispatch-plan-inherited.md',
  'power-loop/assets/codex-loop-goal.txt',
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
]

async function readFixture(name) {
  return JSON.parse(await readFile(path.join(fixtureRoot, name), 'utf8'))
}

function normalizeReviewerResult(result) {
  switch (typeof result === 'string' ? result.trim().toUpperCase() : '') {
    case 'PASS':
    case 'PASSED':
      return 'PASS'
    case 'PASS_WITH_NOTES':
      return 'PASS_WITH_NOTES'
    case 'NEEDS_HUMAN':
      return 'NEEDS_HUMAN'
    default:
      return 'BLOCKED'
  }
}

function aggregate(input) {
  if (input.conflicts.length || input.humanDecisionRequired) return 'NEEDS_HUMAN'

  const isFresh = evidence => evidence.snapshot === input.snapshot.id && !evidence.stale
  const selectedReviews = input.reviews.filter(review => review.selected !== false)
  const selectedReviewResults = selectedReviews.map(review => normalizeReviewerResult(review.result))
  const isPassingReview = review => ['PASS', 'PASS_WITH_NOTES'].includes(normalizeReviewerResult(review.result))
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
      isPassingReview(review) &&
      Object.entries(requirement.exact).every(([key, value]) => review[key] === value),
    ),
  )
  const hasHumanRequiredReview = selectedReviews.some(
    review => isFresh(review) && normalizeReviewerResult(review.result) === 'NEEDS_HUMAN',
  )
  const hasBlockingSelectedReview = selectedReviews.some(
    (review, index) => !isFresh(review) || selectedReviewResults[index] === 'BLOCKED',
  )
  const hasIndependentConformanceReview = selectedReviews.some(
    review =>
      isFresh(review) &&
      review.independentFromImplementation &&
      review.capability === 'contract-conformance' &&
      isPassingReview(review),
  )

  if (hasHumanRequiredReview) return 'NEEDS_HUMAN'

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
  return input.notes.length || selectedReviewResults.includes('PASS_WITH_NOTES') ? 'PASS_WITH_NOTES' : 'PASS'
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
    'selected-needs-human-review-stale',
    'selected-needs-human-review-wrong-snapshot',
    'selected-public-blocked-review',
    'selected-public-needs-human-review',
    'selected-public-pass-with-notes-review',
    'selected-public-pending-review',
    'exact-review-pass-with-notes',
  ]) {
    assert.ok(ids.has(id), `missing ${id}`)
  }
})

test('selected public reviewer results have deterministic precedence', async () => {
  const fixture = await readFixture('aggregation-cases.json')
  const cases = new Map(fixture.cases.map(scenario => [scenario.id, scenario]))

  for (const [id, expected] of [
    ['selected-public-blocked-review', 'BLOCKED'],
    ['selected-public-needs-human-review', 'NEEDS_HUMAN'],
    ['selected-needs-human-review-stale', 'BLOCKED'],
    ['selected-needs-human-review-wrong-snapshot', 'BLOCKED'],
    ['selected-public-pass-with-notes-review', 'PASS_WITH_NOTES'],
    ['selected-public-pending-review', 'BLOCKED'],
    ['exact-review-pass-with-notes', 'PASS_WITH_NOTES'],
  ]) {
    assert.equal(aggregate(cases.get(id).input), expected, id)
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

  assert.equal(fixture.schema, 'power-verifier-semantic-cases/v2')
  assert.equal(fixture.evaluation, 'manual-read-only-replay')
  assert.ok(fixture.packages.some(item => item.project.portable), 'includes an arbitrary project')
  for (const item of fixture.packages) {
    assert.match(item.expected.result, /^(PASS|PASS_WITH_NOTES|BLOCKED|NEEDS_HUMAN)$/)
    assert.ok(item.contract.issue.clauses.length)
    assert.ok(item.contract.goal.clauses.length)
    assert.ok(item.snapshot.id)
    assert.ok(item.clauseEvidence.length)
    assert.match(item.executionModeEvidence.confirmedMode, /^(strict-model-routing|inherited-model-routing)$/)
    assert.match(item.executionModeEvidence.classification, /^(strict-selection-supported|inherited-model-only|indeterminate)$/)
    assert.ok(item.executionModeEvidence.evidenceInspected)
    assert.ok(item.executionModeEvidence.userConfirmation)
    const selectable = item.executionModeEvidence.selectableCapabilities
    assert.deepEqual(Object.keys(selectable).sort(), ['model', 'profile', 'reasoning', 'sandbox'])
    assert.ok(Object.values(selectable).every(value => typeof value === 'boolean'))
    if (item.executionModeEvidence.confirmedMode === 'strict-model-routing') {
      assert.ok(selectable.model || selectable.profile, `${item.id} strict mode has a model or profile selector`)
    } else {
      assert.equal(selectable.model, false, `${item.id} inherited mode has no model selector`)
      assert.equal(selectable.profile, false, `${item.id} inherited mode has no profile selector`)
      assert.equal(selectable.reasoning, false, `${item.id} inherited mode has no reasoning selector`)
    }
    for (const review of item.reviewerProvenance) {
      assert.equal(review.confirmedMode, item.executionModeEvidence.confirmedMode)
      assert.ok(review.configurationProvenance, `${item.id} reviewer records configuration provenance`)
      assert.equal(typeof review.independentFromImplementation, 'boolean')
      assert.ok(review.instructionBoundary)
      assert.ok(review.observableHostIsolationEvidence)
      if (review.confirmedMode === 'strict-model-routing') {
        if (selectable.model) assert.ok(review.model, `${item.id} strict reviewer exposes selected model`)
        else assert.equal('model' in review, false, `${item.id} strict reviewer omits unavailable model`)
        if (selectable.reasoning) {
          assert.ok(review.reasoningEffort, `${item.id} strict reviewer records exposed reasoning provenance`)
        } else {
          assert.equal('reasoningEffort' in review, false, `${item.id} strict reviewer omits unavailable reasoning`)
        }
        assert.ok(review.selectionRationale, `${item.id} strict reviewer explains selection`)
        if (!selectable.sandbox) {
          assert.equal(review.observableHostIsolationEvidence, 'none observed', `${item.id} does not fabricate host isolation`)
        }
      } else {
        assert.equal('model' in review, false, `${item.id} inherited reviewer does not invent a model`)
        assert.equal('reasoningEffort' in review, false, `${item.id} inherited reviewer does not invent reasoning effort`)
        assert.equal('selectionRationale' in review, false, `${item.id} inherited reviewer has no model-tier rationale`)
      }
    }
    assert.ok(item.validationReplay.assessment)
    assert.ok(item.replayAssessment)
  }

  const fullySupportedStrict = fixture.packages.filter(item => {
    const capabilities = item.executionModeEvidence.selectableCapabilities
    return item.executionModeEvidence.confirmedMode === 'strict-model-routing' && Object.values(capabilities).every(Boolean)
  })
  assert.ok(fullySupportedStrict.length, 'retains fully supported strict evidence packages')
  assert.ok(fullySupportedStrict.every(item => item.reviewerProvenance.every(review => review.model && review.reasoningEffort)))
})

test('partial strict verifier evidence keeps selected model and omits unavailable reasoning', async () => {
  const fixture = await readFixture('semantic-cases.json')
  const partial = fixture.packages.find(item => item.id === 'partial-strict-model-without-reasoning')
  const review = partial.reviewerProvenance[0]

  assert.deepEqual(partial.executionModeEvidence.selectableCapabilities, {
    model: true,
    profile: false,
    reasoning: false,
    sandbox: false,
  })
  assert.equal(review.model, 'review-model-2')
  assert.equal('reasoningEffort' in review, false)
  assert.match(review.configurationProvenance, /reasoning unavailable/)
  assert.equal(review.observableHostIsolationEvidence, 'none observed')
  assert.equal(partial.expected.result, 'PASS')
})

test('inherited verifier evidence records provenance honestly and pauses for unavailable exact requirements', async () => {
  const fixture = await readFixture('semantic-cases.json')
  const packages = new Map(fixture.packages.map(item => [item.id, item]))
  const inherited = packages.get('inherited-review-provenance')
  const exact = packages.get('inherited-exact-model-unavailable')

  assert.equal(inherited.executionModeEvidence.configurationProvenance, 'inherited from parent')
  assert.equal(inherited.executionModeEvidence.hostIsolationEvidence, 'none observed')
  assert.equal(inherited.reviewerProvenance[0].contextPolicy, 'fork_turns: none')
  assert.equal(inherited.reviewerProvenance[0].observableHostIsolationEvidence, 'none observed')
  assert.equal(exact.expected.result, 'NEEDS_HUMAN')
  assert.deepEqual(exact.executionModeEvidence.unavailableExactRequirements, ['review-model-2', 'provider-x'])
  assert.equal(exact.reviewerProvenance.length, 0, 'execution pauses before substituting a reviewer')
})

test('verifier guidance requires mode evidence and rejects unsupported inherited guarantees', async () => {
  const files = [
    'power-verifier/SKILL.md',
    'power-verifier/assets/implementation-verifier-checklist.md',
    'power-verifier/assets/verifier-result-template.md',
  ]

  for (const relativePath of files) {
    const content = await readFile(path.join(root, relativePath), 'utf8')
    assert.match(content, /Confirmed execution mode|confirmed execution mode/)
    assert.match(content, /Capability classification|capability classification/)
    assert.match(content, /Configuration provenance|configuration provenance/)
    assert.match(content, /host-isolation|host isolation/i)
  }

  const skill = await readFile(path.join(root, 'power-verifier', 'SKILL.md'), 'utf8')
  for (const unsupported of [
    'per-subagent model or reasoning assignments',
    'custom profiles',
    'sandbox or host-isolation guarantees',
    'model escalation',
    'reviewer tiers',
    'assignment-accuracy claims',
    'model-cost savings',
  ]) assert.match(skill, new RegExp(unsupported))
  assert.match(skill, /return `NEEDS_HUMAN`/)
  assert.match(skill, /Record model or reasoning only when the host directly exposes it; never infer either value\./)
})
