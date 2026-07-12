import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixturePath = path.join(root, 'tests', 'fixtures', 'power-curator', 'lifecycle-cases.json')
const snapshotFields = [
  'repository',
  'ref',
  'commit',
  'treeDigest',
  'dirtyGeneratedBoundary',
  'capturedAt',
]
const waiverFields = [
  'verifiedSnapshot',
  'finalSnapshot',
  'changedPaths',
  'diffSummary',
  'behaviorImpact',
  'validationsRun',
  'uncoveredContent',
  'reason',
  'scope',
  'confirmer',
  'confirmationTime',
  'residualRisks',
  'coverageStatement',
]

async function readFixture() {
  return JSON.parse(await readFile(fixturePath, 'utf8'))
}

function hasValue(value) {
  return Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim().length > 0 : value != null
}

function hasCompleteSnapshot(snapshot) {
  return snapshotFields.every(field => hasValue(snapshot?.[field]))
}

function hasCompleteWaiver(input) {
  const waiver = input.waiver
  return Boolean(
    waiver?.confirmed &&
      waiverFields.every(field => hasValue(waiver[field])) &&
      hasCompleteSnapshot(waiver.verifiedSnapshot) &&
      hasCompleteSnapshot(waiver.finalSnapshot) &&
      waiver.verifiedSnapshot.treeDigest === input.verifiedSnapshot.treeDigest &&
      waiver.finalSnapshot.treeDigest === input.finalSnapshot.treeDigest &&
      waiver.coverageStatement.includes('old PASS covers only') &&
      waiver.coverageStatement.includes('not verifier PASS'),
  )
}

function classify(input, contractChangeImpacts) {
  if (!hasCompleteSnapshot(input.verifiedSnapshot) || !hasCompleteSnapshot(input.finalSnapshot)) {
    return 'unresolved'
  }
  if (input.verifiedSnapshot.treeDigest === input.finalSnapshot.treeDigest) return 'tree-equivalent'
  if (input.behaviorImpact.some(impact => contractChangeImpacts.includes(impact))) return 'contract-changing'
  if (
    ['PASS', 'PASS_WITH_NOTES'].includes(input.finalTreeVerifierResult?.result) &&
    input.finalTreeVerifierResult.treeDigest === input.finalSnapshot.treeDigest
  ) {
    return 'reverified'
  }
  if (hasCompleteWaiver(input)) return 'human-waived'
  return 'unresolved'
}

test('freshness fixtures classify every reconciliation deterministically', async () => {
  const fixture = await readFixture()

  assert.equal(fixture.schema, 'power-curator-lifecycle-cases/v1')
  for (const scenario of fixture.cases) {
    const classification = classify(scenario.input, fixture.contractChangeImpacts)
    assert.equal(classification, scenario.expected.classification, scenario.id)
    assert.equal(
      scenario.expected.closureFreshnessGate,
      ['tree-equivalent', 'reverified', 'human-waived'].includes(classification) ? 'satisfied' : 'blocked',
      scenario.id,
    )
  }
})

test('fixtures cover the exact freshness vocabulary and required regression flows', async () => {
  const fixture = await readFixture()
  const ids = new Set(fixture.cases.map(scenario => scenario.id))
  const classifications = new Set(fixture.cases.map(scenario => scenario.expected.classification))

  assert.deepEqual(
    fixture.freshnessClassifications,
    ['tree-equivalent', 'reverified', 'human-waived', 'contract-changing', 'unresolved'],
  )
  assert.deepEqual(classifications, new Set(fixture.freshnessClassifications))
  for (const id of [
    'same-tree-different-commits',
    'changed-tree-reverified',
    'changed-tree-complete-human-waiver',
    'changed-tree-incomplete-waiver',
    'public-behavior-change-routes-back',
    'changed-tree-without-reverification-or-waiver',
    'legacy-issue-missing-snapshot-identity',
  ]) {
    assert.ok(ids.has(id), `missing ${id}`)
  }
})

test('old verifier PASS is never promoted across a tree change', async () => {
  const fixture = await readFixture()

  for (const scenario of fixture.cases) {
    const sameTree =
      scenario.input.verifiedSnapshot.treeDigest &&
      scenario.input.verifiedSnapshot.treeDigest === scenario.input.finalSnapshot.treeDigest
    assert.equal(scenario.expected.oldVerifierPassAppliesToFinalTree, Boolean(sameTree), scenario.id)
  }
})

test('waiver requires every persisted evidence field and remains human-owned', async () => {
  const fixture = await readFixture()
  const complete = fixture.cases.find(scenario => scenario.id === 'changed-tree-complete-human-waiver')
  const incomplete = fixture.cases.find(scenario => scenario.id === 'changed-tree-incomplete-waiver')

  assert.equal(hasCompleteWaiver(complete.input), true)
  assert.equal(hasCompleteWaiver(incomplete.input), false)
  assert.equal(complete.expected.oldVerifierPassAppliesToFinalTree, false)
})

test('contract-level changes override verifier and waiver evidence and route back', async () => {
  const fixture = await readFixture()
  const scenario = fixture.cases.find(item => item.id === 'public-behavior-change-routes-back')

  assert.equal(classify(scenario.input, fixture.contractChangeImpacts), 'contract-changing')
  assert.deepEqual(scenario.expected.routeBack, ['power-grill', 'power-loop'])
  assert.deepEqual(fixture.contractChangeImpacts, [
    'task-contract',
    'acceptance-criteria',
    'public-behavior',
    'security',
    'permissions',
    'migration',
  ])
  for (const impact of fixture.contractChangeImpacts) {
    const input = structuredClone(scenario.input)
    input.behaviorImpact = [impact]
    assert.equal(classify(input, fixture.contractChangeImpacts), 'contract-changing', impact)
  }
})

test('canonical lifecycle states exclude runtime outcomes and classifications', async () => {
  const fixture = await readFixture()
  const { canonicalStates, runtimeOutcomes, assessmentMappings, allowedTransitions } = fixture.lifecycle
  const states = new Set(canonicalStates)

  assert.deepEqual(canonicalStates, [
    'open',
    'in-progress',
    'pr-ready',
    'merged',
    'done',
    'superseded',
    'follow-up-needed',
  ])
  for (const outcome of [...runtimeOutcomes, ...fixture.freshnessClassifications]) {
    assert.equal(states.has(outcome), false, `${outcome} is not a persisted Issue state`)
  }
  for (const targets of Object.values(assessmentMappings)) {
    assert.ok(targets.every(target => states.has(target)))
  }
  for (const [source, targets] of Object.entries(allowedTransitions)) {
    assert.ok(states.has(source), source)
    assert.ok(targets.every(target => states.has(target)), source)
  }
})

test('skill documents the fixed interfaces without making labels normative', async () => {
  const skill = await readFile(path.join(root, 'power-curator', 'SKILL.md'), 'utf8')

  assert.match(skill, /Git tree digest controls freshness/i)
  assert.match(skill, /旧结果只覆盖已验证快照；最终树是 human-waived，不是 verifier PASS/i)
  assert.match(skill, /route those decisions to `power-grill`; use `power-loop` only when the revised work needs a persisted Blueprint/i)
  assert.doesNotMatch(skill, /Latest canonical context|Decisions since contract/)
  assert.match(skill, /Persist only these Issue states: `open`, `in-progress`, `pr-ready`, `merged`, `done`, `superseded`, and `follow-up-needed`/)
  assert.match(skill, /Labels are optional, non-normative presentation aids/i)
  assert.match(skill, /默认使用简体中文输出整理计划/)
})
