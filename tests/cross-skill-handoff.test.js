import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixturePath = path.join(root, 'tests', 'fixtures', 'cross-skill-handoff', 'handoff-cases.json')
const sha256Pattern = /^sha256:[0-9a-f]{64}$/

async function readFixture() {
  return JSON.parse(await readFile(fixturePath, 'utf8'))
}

function hasCompleteSnapshot(snapshot, fields) {
  return fields.every(field => {
    const value = snapshot?.[field]
    return typeof value === 'string' && value.trim() && value !== 'unavailable' && value !== 'unknown'
  })
}

function hasCompleteWaiver(scenario, fixture) {
  const waiver = scenario.waiver
  return Boolean(
    waiver?.confirmed &&
      fixture.waiverFields.every(field => {
        const value = waiver[field]
        return Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim() : value
      }) &&
      hasCompleteSnapshot(waiver.verifiedSnapshot, fixture.snapshotFields) &&
      hasCompleteSnapshot(waiver.finalSnapshot, fixture.snapshotFields) &&
      waiver.verifiedSnapshot.gitTreeDigest === scenario.verifiedSnapshot.gitTreeDigest &&
      waiver.finalSnapshot.gitTreeDigest === scenario.finalSnapshot.gitTreeDigest &&
      /old PASS covers only/i.test(waiver.coverageStatement) &&
      /not verifier PASS/i.test(waiver.coverageStatement),
  )
}

function classifyHandoff(scenario, fixture) {
  if (!sha256Pattern.test(scenario.issue?.fullBodySha256)) return 'unresolved'
  if (
    !hasCompleteSnapshot(scenario.verifiedSnapshot, fixture.snapshotFields) ||
    !hasCompleteSnapshot(scenario.finalSnapshot, fixture.snapshotFields)
  ) {
    return 'unresolved'
  }
  if (scenario.verifiedSnapshot.gitTreeDigest === scenario.finalSnapshot.gitTreeDigest) {
    return 'tree-equivalent'
  }
  if (scenario.behaviorImpact.some(impact => fixture.contractChangeImpacts.includes(impact))) {
    return 'contract-changing'
  }
  if (
    ['PASS', 'PASS_WITH_NOTES'].includes(scenario.finalTreeVerifierResult?.result) &&
    scenario.finalTreeVerifierResult.gitTreeDigest === scenario.finalSnapshot.gitTreeDigest
  ) {
    return 'reverified'
  }
  if (hasCompleteWaiver(scenario, fixture)) return 'human-waived'
  return 'unresolved'
}

function directExecutionDecision(scenario) {
  return scenario.issue.blueprintReference.planningStatus === 'confirmed' &&
    scenario.issue.taskContractSha256 === scenario.issue.blueprintReference.taskContractSha256 &&
    sha256Pattern.test(scenario.issue.blueprintReference.artifactSha256)
    ? 'ready'
    : 'stop'
}

test('cross-skill fixtures enforce tree freshness and the Issue #25 stale-PASS regression', async () => {
  const fixture = await readFixture()
  const cases = fixture.cases.filter(scenario => scenario.kind === 'handoff')

  assert.equal(fixture.schema, 'cross-skill-handoff-cases/v1')
  for (const scenario of cases) {
    const classification = classifyHandoff(scenario, fixture)
    assert.equal(classification, scenario.expected.classification, scenario.id)
    assert.equal(
      scenario.expected.oldVerifierPassAppliesToFinalTree,
      Boolean(
        scenario.verifierResult?.result === 'PASS' &&
          scenario.verifierResult.gitTreeDigest === scenario.finalSnapshot.gitTreeDigest,
      ),
      scenario.id,
    )
  }

  const issue25 = cases.find(scenario => scenario.id === 'issue-25-stale-pass-a-to-b-without-reverify')
  assert.equal(issue25.verifiedSnapshot.gitTreeDigest, '2bf11ddb9a410642f580de34d8b4a7cf619e745f')
  assert.equal(issue25.finalSnapshot.gitTreeDigest, '12031721d89ee2461f9a0687b1a68450559017ab')
  assert.equal(issue25.expected.closureFreshnessGate, 'blocked')
})

test('same-tree reuse, final-tree revalidation, waiver, route-back, and legacy handling are distinct', async () => {
  const fixture = await readFixture()
  const cases = new Map(fixture.cases.map(scenario => [scenario.id, scenario]))

  assert.equal(classifyHandoff(cases.get('same-tree-different-commit-reuse'), fixture), 'tree-equivalent')
  assert.equal(classifyHandoff(cases.get('changed-tree-reverified'), fixture), 'reverified')
  assert.equal(classifyHandoff(cases.get('complete-human-waiver-without-final-tree-pass'), fixture), 'human-waived')
  assert.equal(cases.get('complete-human-waiver-without-final-tree-pass').finalTreeVerifierResult, undefined)
  assert.equal(classifyHandoff(cases.get('contract-changing-route-back'), fixture), 'contract-changing')
  assert.deepEqual(cases.get('contract-changing-route-back').expected.routeBack, ['power-grill', 'power-loop'])
  assert.equal(classifyHandoff(cases.get('legacy-missing-identity'), fixture), 'unresolved')
})

test('confirmed Issue is the direct execution entry and Task Contract drift stops execution', async () => {
  const fixture = await readFixture()
  const executions = fixture.cases.filter(scenario => scenario.kind === 'execution-entry')

  for (const scenario of executions) {
    assert.equal(scenario.issue.executionEntry, 'canonical-persisted-issue')
    assert.equal(scenario.issue.blueprintReference.evidenceRole, 'supplementary-plan')
    assert.equal(directExecutionDecision(scenario), scenario.expected.startDecision, scenario.id)
  }

  const drift = executions.find(scenario => scenario.id === 'task-contract-drift-stop')
  assert.notEqual(drift.issue.taskContractSha256, drift.issue.blueprintReference.taskContractSha256)
  assert.equal(drift.expected.reason, 'task-contract-digest-mismatch')
})

test('lifecycle mappings persist only canonical states and keep labels non-normative', async () => {
  const fixture = await readFixture()
  const scenario = fixture.cases.find(item => item.id === 'lifecycle-mappings')
  const states = new Set(scenario.canonicalStates)

  assert.deepEqual(scenario.canonicalStates, [
    'open',
    'in-progress',
    'pr-ready',
    'merged',
    'done',
    'superseded',
    'follow-up-needed',
  ])
  for (const value of [...scenario.runtimeOutcomes, ...fixture.freshnessClassifications]) {
    assert.equal(states.has(value), false, `${value} is not a persisted lifecycle state`)
  }
  for (const targets of Object.values(scenario.classificationMappings)) {
    assert.ok(targets.every(target => states.has(target)))
  }
  assert.equal(scenario.labels.normative, false)
})

test('artifact lint keeps identity, snapshot, waiver, freshness, and lifecycle vocabulary aligned', async () => {
  const files = await Promise.all(
    [
      'power-loop/SKILL.md',
      'power-loop/assets/issue-patch.md',
      'power-verifier/SKILL.md',
      'power-verifier/assets/verifier-result-template.md',
      'power-curator/SKILL.md',
      'README.md',
      'docs/loop-engineering-tutorial.md',
      'docs/specs/2026-07-10-power-loop-cost-aware-multi-agent-orchestration-spec.md',
    ].map(async relativePath => ({
      relativePath,
      content: await readFile(path.join(root, relativePath), 'utf8'),
    })),
  )
  const combined = files.map(file => file.content).join('\n')

  for (const { relativePath, content } of files.slice(0, 5)) {
    assert.match(content, /Issue|persisted body/i, `${relativePath} identifies the persisted contract`)
  }
  assert.match(combined, /sole normative contract|only normative contract/i)
  assert.match(combined, /exact full[- ]body SHA-256|SHA-256 of the exact (complete|full) persisted/i)
  assert.match(combined, /host revision.*provenance|provenance.*host revision/i)
  assert.match(combined, /byte.*before.*power-loop:execution-blueprint:start|byte immediately before.*execution-blueprint:start/i)
  for (const term of ['repository', 'commit', 'Git tree digest', 'dirty/generated', 'capture time']) {
    assert.match(combined, new RegExp(term.replace('/', '\\/'), 'i'), term)
  }
  for (const classification of ['tree-equivalent', 'reverified', 'human-waived', 'contract-changing', 'unresolved']) {
    assert.match(combined, new RegExp(classification), classification)
  }
  for (const state of ['open', 'in-progress', 'pr-ready', 'merged', 'done', 'superseded', 'follow-up-needed']) {
    assert.match(combined, new RegExp(`\\b${state}\\b`), state)
  }
  assert.match(combined, /Labels are optional, non-normative|labels remain optional and non-normative/i)
  assert.match(combined, /old PASS.*only.*verified|old result covers only verified snapshot/i)
  assert.match(combined, /not verifier PASS/i)
})
