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

  const hasCanonicalIssueIdentity = issue =>
    Boolean(issue?.source && issue?.revision && issue?.fullBodyDigest)
  const sameIssueIdentity =
    hasCanonicalIssueIdentity(input.pinnedIssue) &&
    hasCanonicalIssueIdentity(input.observedIssue) &&
    input.pinnedIssue.source === input.observedIssue.source &&
    input.pinnedIssue.fullBodyDigest === input.observedIssue.fullBodyDigest
  const hasSnapshotIdentity = Boolean(
    input.snapshot?.repositoryRef &&
      input.snapshot?.commit &&
      input.snapshot?.gitTreeDigest &&
      input.snapshot?.dirtyGeneratedBoundary &&
      input.snapshot?.capturedAt,
  )
  const isFresh = evidence =>
    Boolean(input.snapshot.gitTreeDigest) &&
    evidence.gitTreeDigest === input.snapshot.gitTreeDigest &&
    !evidence.stale
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

  if (!sameIssueIdentity || !hasSnapshotIdentity) return 'BLOCKED'

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

  assert.equal(fixture.schema, 'power-verifier-aggregation-cases/v2')
  for (const scenario of fixture.cases) {
    assert.equal(aggregate(scenario.input), scenario.expected.result, scenario.id)
    assert.ok(scenario.expected.smallestNextAction, `${scenario.id} has a next action`)
  }
})

test('aggregation fixtures cover canonical Issue and Git tree freshness conditions', async () => {
  const fixture = await readFixture('aggregation-cases.json')
  const ids = new Set(fixture.cases.map(scenario => scenario.id))

  for (const id of [
    'full-compliance',
    'same-tree-different-commit',
    'host-revision-difference-same-body',
    'canonical-issue-body-mismatch',
    'changed-tree-blocked',
    'historical-missing-issue-identity',
    'historical-missing-tree-identity',
    'missing-independent-review',
    'issue-internal-conflict',
    'nonblocking-reviewer-notes',
    'human-required-clause',
    'selected-public-blocked-review',
    'selected-public-needs-human-review',
    'selected-public-pass-with-notes-review',
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
    ['selected-public-pass-with-notes-review', 'PASS_WITH_NOTES'],
  ]) {
    assert.equal(aggregate(cases.get(id).input), expected, id)
  }
})

test('Issue identity gaps, changed trees, and human-required clauses cannot pass', async () => {
  const fixture = await readFixture('aggregation-cases.json')
  const cases = new Map(fixture.cases.map(scenario => [scenario.id, scenario]))

  for (const id of [
    'canonical-issue-body-mismatch',
    'changed-tree-blocked',
    'historical-missing-issue-identity',
    'historical-missing-tree-identity',
    'human-required-clause',
  ]) {
    assert.notEqual(aggregate(cases.get(id).input), 'PASS', id)
  }
})

test('different commits with the same Git tree reuse verifier evidence', async () => {
  const fixture = await readFixture('aggregation-cases.json')
  const scenario = fixture.cases.find(item => item.id === 'same-tree-different-commit')

  assert.notEqual(scenario.input.snapshot.commit, scenario.input.requiredEvidence[0].commit)
  assert.equal(scenario.input.snapshot.gitTreeDigest, scenario.input.requiredEvidence[0].gitTreeDigest)
  assert.equal(aggregate(scenario.input), 'PASS')
})

test('authoritative body identity survives differing host revision metadata', async () => {
  const fixture = await readFixture('aggregation-cases.json')
  const scenario = fixture.cases.find(item => item.id === 'host-revision-difference-same-body')

  assert.notEqual(scenario.input.pinnedIssue.revision, scenario.input.observedIssue.revision)
  assert.equal(scenario.input.pinnedIssue.fullBodyDigest, scenario.input.observedIssue.fullBodyDigest)
  assert.equal(aggregate(scenario.input), 'PASS_WITH_NOTES')
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

  assert.equal(fixture.schema, 'power-verifier-semantic-cases/v3')
  assert.equal(fixture.evaluation, 'manual-read-only-replay')
  assert.ok(fixture.packages.some(item => item.project.portable), 'includes an arbitrary project')
  for (const item of fixture.packages) {
    assert.match(item.expected.result, /^(PASS|PASS_WITH_NOTES|BLOCKED|NEEDS_HUMAN)$/)
    assert.ok(item.contract.issue.clauses.length)
    assert.ok(item.contract.issue.source)
    assert.ok(item.contract.issue.revision)
    assert.ok(item.contract.issue.fullBodyDigest)
    assert.equal(item.contract.goal.evidenceRole, 'supplementary')
    assert.equal('clauses' in item.contract.goal, false, `${item.id} Goal is not a normative clause source`)
    assert.ok(item.snapshot.repositoryRef)
    assert.ok(item.snapshot.commit)
    assert.ok(item.snapshot.gitTreeDigest)
    assert.ok(item.snapshot.dirtyGeneratedBoundary)
    assert.ok(item.snapshot.capturedAt)
    assert.ok(item.clauseEvidence.length)
    assert.ok(item.clauseEvidence.every(clause => clause.clauseId.startsWith('issue:')))
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

test('verifier artifacts define the Issue as sole normative source and bind results to Git trees', async () => {
  const files = [
    'power-verifier/SKILL.md',
    'power-verifier/assets/implementation-verifier-checklist.md',
    'power-verifier/assets/verifier-result-template.md',
  ]

  for (const relativePath of files) {
    const content = await readFile(path.join(root, relativePath), 'utf8')
    assert.match(content, /full-body SHA-256|full persisted UTF-8 body/i)
    assert.match(content, /Git tree digest/)
    assert.match(content, /supplementary/i)
  }

  const skill = await readFile(path.join(root, 'power-verifier', 'SKILL.md'), 'utf8')
  assert.match(skill, /sole normative verification contract/)
  assert.match(skill, /Different commits with the same Git tree digest are tree-equivalent/)
  assert.match(skill, /do not fabricate/i)
  assert.doesNotMatch(skill, /verification contract is exactly:[\s\S]*Final Goal Prompt/)
})
