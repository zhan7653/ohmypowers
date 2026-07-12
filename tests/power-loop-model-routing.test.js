import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const agentsDir = path.join(root, 'power-loop', 'agents')
const fixturePath = path.join(root, 'tests', 'fixtures', 'power-loop', 'model-routing-cases.json')
const capabilityFixturePath = path.join(root, 'tests', 'fixtures', 'power-loop', 'capability-routing-cases.json')
const assetsDir = path.join(root, 'power-loop', 'assets')
const unavailableSelector = 'unavailable — not independently selectable'
const blueprintStartMarker = '<!-- power-loop:execution-blueprint:start -->'

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function issueIdentity(body, source, hostRevision = null) {
  const markerIndex = body.indexOf(blueprintStartMarker)
  assert.notEqual(markerIndex, -1, 'Issue body contains the Blueprint start marker')
  return {
    source,
    hostRevision,
    bodySha256: sha256(body),
    taskContractSha256: sha256(body.slice(0, markerIndex)),
  }
}

function thinGoalPreflight(body, pinned) {
  const actual = issueIdentity(body, pinned.source, pinned.hostRevision)
  return actual.bodySha256 === pinned.bodySha256
    && actual.taskContractSha256 === pinned.taskContractSha256
}

const expectedProfiles = {
  power_terra_reviewer: ['gpt-5.6-terra', 'high', 'read-only'],
  power_sol_reviewer: ['gpt-5.6-sol', 'medium', 'read-only'],
  power_sol_high_reviewer: ['gpt-5.6-sol', 'high', 'read-only'],
}

function route(input) {
  assert.equal(input.type, 'review')
  switch (input.reviewClass) {
    case 'explicitly-simple':
      return { profile: 'power_terra_reviewer', model: 'gpt-5.6-terra', reasoningEffort: 'high' }
    case 'high-risk-or-complex':
      return { profile: 'power_sol_high_reviewer', model: 'gpt-5.6-sol', reasoningEffort: 'high' }
    default:
      return { profile: 'power_sol_reviewer', model: 'gpt-5.6-sol', reasoningEffort: 'medium' }
  }
}

function classifyCapability(input) {
  if (!input.schemaAvailable || input.contradictoryEvidence) {
    return {
      classification: 'indeterminate',
      recommendedMode: null,
      probeSpawned: false,
      asksUser: true,
    }
  }

  const selectors = input.exposedFields.filter(field => ['model', 'agent_type', 'profile'].includes(field))
  if (selectors.length) {
    return {
      classification: 'strict-selection-supported',
      recommendedMode: 'strict-model-routing',
      probeSpawned: false,
      asksUser: true,
      selectorEvidence: selectors,
    }
  }

  if (input.exposedFields.includes('reasoning_effort')) {
    return {
      classification: 'indeterminate',
      recommendedMode: null,
      probeSpawned: false,
      asksUser: true,
    }
  }

  return {
    classification: 'inherited-model-only',
    recommendedMode: 'inherited-model-routing',
    probeSpawned: false,
    asksUser: true,
    selectorEvidence: [],
  }
}

function selectPlanningArtifacts(capability, confirmedMode, exactRequirements = []) {
  if (!confirmedMode) return { status: 'awaiting-confirmation', dispatchTemplate: null, goal: null }
  if (capability.classification === 'indeterminate') {
    return { status: 'needs-human', dispatchTemplate: null, goal: null }
  }
  if (confirmedMode !== capability.recommendedMode) {
    return { status: 'needs-human', dispatchTemplate: null, goal: null }
  }
  if (confirmedMode === 'inherited-model-routing' && exactRequirements.length) {
    return { status: 'needs-human', dispatchTemplate: null, goal: null }
  }
  return {
    status: 'ready',
    dispatchTemplate: confirmedMode === 'strict-model-routing'
      ? 'agent-dispatch-plan-strict.md'
      : 'agent-dispatch-plan-inherited.md',
    goal: 'codex-loop-goal.txt',
  }
}

function strictPlanningFields(input) {
  const supports = field => input.exposedFields.includes(field)
  return {
    capabilityMatrix: {
      model: supports('model') ? 'supported' : unavailableSelector,
      profile: supports('agent_type') || supports('profile') ? 'supported' : unavailableSelector,
      reasoning: supports('reasoning_effort') ? 'supported' : unavailableSelector,
      sandbox: supports('sandbox_mode') ? 'supported' : unavailableSelector,
    },
    task: {
      customAgent: supports('agent_type') || supports('profile') ? 'power_sol_reviewer' : unavailableSelector,
      initialModel: supports('model') ? 'gpt-5.6-sol' : unavailableSelector,
      reasoningEffort: supports('reasoning_effort') ? 'medium' : unavailableSelector,
      sandboxMode: supports('sandbox_mode') ? 'read-only' : 'instruction-level no-write boundary; host enforcement unavailable',
    },
  }
}

test('routing cases preserve three final-reviewer tiers', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))

  assert.equal(fixture.schema, 'power-loop-review-routing-cases/v2')
  assert.equal(fixture.executionMode, 'strict-model-routing')
  for (const scenario of fixture.cases) {
    assert.deepEqual(route(scenario), scenario.expected, scenario.id)
  }

  assert.ok(new Set(fixture.cases.filter(item => item.type === 'review').map(item => item.capability)).size > 1)
})

test('capability fixtures classify strict, inherited, incomplete, and contradictory evidence without probe spawns', async () => {
  const fixture = JSON.parse(await readFile(capabilityFixturePath, 'utf8'))

  assert.equal(fixture.schema, 'power-loop-capability-routing-cases/v1')
  for (const scenario of fixture.cases) {
    const actual = classifyCapability(scenario.input)
    assert.deepEqual(actual, scenario.expected, scenario.id)
    if (scenario.input.schemaAvailable && !scenario.input.contradictoryEvidence) {
      assert.equal(actual.probeSpawned, false, `${scenario.id} uses conclusive schema evidence`)
    }
  }
})

test('mode-specific planning and the Goal stay withheld until confirmation', async () => {
  const fixture = JSON.parse(await readFile(capabilityFixturePath, 'utf8'))

  for (const scenario of fixture.cases) {
    const capability = classifyCapability(scenario.input)
    assert.deepEqual(
      selectPlanningArtifacts(capability, null),
      { status: 'awaiting-confirmation', dispatchTemplate: null, goal: null },
      scenario.id,
    )
  }

  const skill = await readFile(path.join(root, 'power-loop', 'SKILL.md'), 'utf8')
  assert.match(skill, /Until the user confirms, do not generate a mode-specific Agent Dispatch Plan, compact reference patch, or final Goal Prompt\./)
})

test('confirmed modes select separate templates and exact unavailable requirements pause inherited planning', async () => {
  const fixture = JSON.parse(await readFile(capabilityFixturePath, 'utf8'))
  const cases = new Map(fixture.cases.map(scenario => [scenario.id, classifyCapability(scenario.input)]))

  assert.deepEqual(selectPlanningArtifacts(cases.get('strict-profile-selector'), 'strict-model-routing'), {
    status: 'ready',
    dispatchTemplate: 'agent-dispatch-plan-strict.md',
    goal: 'codex-loop-goal.txt',
  })
  assert.deepEqual(selectPlanningArtifacts(cases.get('current-reduced-spawn-schema'), 'inherited-model-routing'), {
    status: 'ready',
    dispatchTemplate: 'agent-dispatch-plan-inherited.md',
    goal: 'codex-loop-goal.txt',
  })
  for (const requirement of ['model', 'profile', 'provider', 'reasoning', 'sandbox', 'isolation']) {
    assert.deepEqual(
      selectPlanningArtifacts(cases.get('current-reduced-spawn-schema'), 'inherited-model-routing', [requirement]),
      { status: 'needs-human', dispatchTemplate: null, goal: null },
      requirement,
    )
  }
  assert.equal(selectPlanningArtifacts(cases.get('contradictory-user-and-schema-evidence'), 'strict-model-routing').status, 'needs-human')
})

test('model-only strict review planning selects the model while marking profile, reasoning, and sandbox guarantees unavailable', async () => {
  const fixture = JSON.parse(await readFile(capabilityFixturePath, 'utf8'))
  const cases = new Map(fixture.cases.map(scenario => [scenario.id, scenario]))
  const modelOnly = cases.get('strict-model-selector-with-independent-omissions')
  const fullProfile = cases.get('strict-full-profile-routing')

  assert.equal(classifyCapability(modelOnly.input).recommendedMode, 'strict-model-routing')
  assert.deepEqual(strictPlanningFields(modelOnly.input), {
    capabilityMatrix: {
      model: 'supported',
      profile: unavailableSelector,
      reasoning: unavailableSelector,
      sandbox: unavailableSelector,
    },
    task: {
      customAgent: unavailableSelector,
      initialModel: 'gpt-5.6-sol',
      reasoningEffort: unavailableSelector,
      sandboxMode: 'instruction-level no-write boundary; host enforcement unavailable',
    },
  })

  assert.deepEqual(strictPlanningFields(fullProfile.input), {
    capabilityMatrix: {
      model: 'supported',
      profile: 'supported',
      reasoning: 'supported',
      sandbox: 'supported',
    },
    task: {
      customAgent: 'power_sol_reviewer',
      initialModel: 'gpt-5.6-sol',
      reasoningEffort: 'medium',
      sandboxMode: 'read-only',
    },
  })
})

test('strict and inherited templates reserve subagents for bounded final review', async () => {
  const strict = await readFile(path.join(assetsDir, 'agent-dispatch-plan-strict.md'), 'utf8')
  const inherited = await readFile(path.join(assetsDir, 'agent-dispatch-plan-inherited.md'), 'utf8')
  const router = await readFile(path.join(assetsDir, 'agent-dispatch-plan.md'), 'utf8')

  for (const required of [
    'Execution mode: `strict-model-routing`',
    'Independent capability matrix',
    'unavailable — not independently selectable',
    'Custom agent:',
    'Initial model:',
    'Reasoning effort:',
    'power_terra_reviewer',
    'power_sol_reviewer',
    'power_sol_high_reviewer',
    'launch all decoupled selected final reviewers concurrently',
  ]) assert.match(strict, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

  assert.match(strict, /Custom agent: `<exact installed agent name when profile selection is supported \| unavailable — not independently selectable>`/)
  assert.match(strict, /Initial model: `<exact selected model when separately supported \| unavailable — not independently selectable>`/)
  assert.match(strict, /Reasoning effort: `<Medium \| High \| Max when separately supported \| unavailable — not independently selectable>`/)
  assert.match(strict, /Sandbox or permission mode: `<host-enforced mode when separately observable \| instruction-level boundary only; host enforcement unavailable>`/)
  assert.match(strict, /Do not replace, escalate, or retry a reviewer after launch/)

  for (const required of [
    'Execution mode: `inherited-model-routing`',
    'Objective:',
    'Role:',
    'Context policy:',
    'Allowed write paths:',
    'Dependencies:',
    'Expected deliverable:',
    'Parallelization conditions:',
    'fork_turns: none',
    'distinct non-implementing subagent',
    'instruction-level no-write boundary',
    'Launch every selected reviewer in one parallel wave',
  ]) assert.match(inherited, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

  for (const forbidden of [
    /^- Custom agent:/m,
    /^- Initial model:/m,
    /^- Reasoning effort:/m,
    /^- Sandbox or permission mode:/m,
    /^- Allowed direct escalation targets:/m,
    /^- Escalation ceiling:/m,
    /Reviewer tier selection:/,
    /model-cost sav/i,
  ]) assert.doesNotMatch(inherited, forbidden)

  assert.match(router, /strict-model-routing` -> `agent-dispatch-plan-strict\.md/)
  assert.match(router, /inherited-model-routing` -> `agent-dispatch-plan-inherited\.md/)
  assert.match(router, /Do not combine the two templates or generate mode-specific planning before confirmation\./)
})

test('shared Goal and repository guidance consistently describe dual-track mode evidence', async () => {
  const paths = [
    'README.md',
    'docs/loop-engineering-tutorial.md',
    'docs/specs/2026-07-10-power-loop-cost-aware-multi-agent-orchestration-spec.md',
    'power-loop/SKILL.md',
    'power-loop/assets/codex-loop-goal.txt',
    'power-loop/assets/execution-blueprint.md',
    'power-loop/assets/pr-evidence-template.md',
  ]

  for (const relativePath of paths) {
    const content = await readFile(path.join(root, relativePath), 'utf8')
    assert.match(content, /strict-model-routing/, `${relativePath} names strict mode`)
    assert.match(content, /inherited-model-routing/, `${relativePath} names inherited mode`)
    assert.match(content, /capabilit/i, `${relativePath} records capability evidence`)
  }

  const goal = await readFile(path.join(assetsDir, 'codex-loop-goal.txt'), 'utf8')
  assert.match(goal, /Do not launch a probe when its visible schema is conclusive\./)
  assert.match(goal, /Instruction-level no-write behavior is not host-enforced isolation\./)
  assert.match(goal, /Stop before implementation on any Issue identity, Task Contract, planning-reference, planning-artifact, repository-baseline, execution-mode, capability, section, or source-access drift\./)
  assert.doesNotMatch(goal, /Luna Max|Sol Medium|Terra High/)
})

test('canonical Issue identity uses exact bytes and thin Goal preflight stops on body or Task Contract drift', () => {
  const body = [
    '# Task Contract',
    '',
    'Goal: preserve exact bytes.',
    '',
    blueprintStartMarker,
    '# Execution Blueprint',
    '',
    'Planning status: `confirmed`',
  ].join('\n')
  const pinned = issueIdentity(body, 'https://example.test/issues/27', 'updatedAt:2026-07-12T03:45:51Z')

  assert.equal(thinGoalPreflight(body, pinned), true)
  assert.equal(thinGoalPreflight(body.replace('exact bytes', 'changed bytes'), pinned), false)
  assert.equal(thinGoalPreflight(`${body}\n`, pinned), false, 'complete-body identity rejects newline normalization')
  assert.equal(
    issueIdentity(body, pinned.source, 'different-host-revision').bodySha256,
    pinned.bodySha256,
    'body digest remains authoritative when host revision metadata differs',
  )
})

test('Goal template is a pinned launcher and contains no independent operational obligations', async () => {
  const goal = await readFile(path.join(assetsDir, 'codex-loop-goal.txt'), 'utf8')

  for (const required of [
    'Pinned Issue identity:',
    'Exact complete-body SHA-256:',
    'Exact Task Contract SHA-256:',
    'Required confirmed references:',
    'Preflight:',
    'sole normative Task Contract',
    'body digest is authoritative',
    'The user must start this Goal manually',
  ]) assert.match(goal, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

  for (const forbidden of [
    /^Budget:/m,
    /^Validation loop:/m,
    /^Verifier gate:/m,
    /^PR\/MR evidence:/m,
    /^Dispatch Summary:/m,
    /^Loop decision:/m,
    /Max implementation iterations/,
    /Same-failure retry limit/,
    /Create or update a draft PR/,
    /Require at least one reviewer/,
    /Decision: `pr-ready/,
  ]) assert.doesNotMatch(goal, forbidden)
})

test('separate planning artifacts preserve identity, operational policy, and a Task-Contract-only normative boundary', async () => {
  const [skill, blueprint, inherited, strict, patchTemplate, evidence] = await Promise.all([
    readFile(path.join(root, 'power-loop', 'SKILL.md'), 'utf8'),
    readFile(path.join(assetsDir, 'execution-blueprint.md'), 'utf8'),
    readFile(path.join(assetsDir, 'agent-dispatch-plan-inherited.md'), 'utf8'),
    readFile(path.join(assetsDir, 'agent-dispatch-plan-strict.md'), 'utf8'),
    readFile(path.join(assetsDir, 'issue-patch.md'), 'utf8'),
    readFile(path.join(assetsDir, 'pr-evidence-template.md'), 'utf8'),
  ])

  assert.match(skill, /SHA-256 of the exact UTF-8 bytes from document start to the byte immediately before/)
  assert.match(skill, /The complete-body digest is authoritative/)
  assert.match(blueprint, /## Runtime budget and delivery policy/)
  assert.match(blueprint, /Evidence invalidation:/)
  assert.match(blueprint, /confirmed operational guidance and cannot add acceptance criteria/)
  for (const dispatch of [inherited, strict]) {
    assert.match(dispatch, /sole normative contract/)
    assert.match(dispatch, /Git tree digest/)
    assert.match(dispatch, /planning artifacts and thin Goal/)
    assert.match(dispatch, /cannot add requirements/)
  }
  assert.match(patchTemplate, /Canonical Issue identity before application:/)
  assert.match(patchTemplate, /Decision summary/)
  assert.match(patchTemplate, /Artifact digest:/)
  assert.match(patchTemplate, /Do not write that digest into the body it hashes\./)
  assert.match(evidence, /authoritative persisted-container identity/)
  assert.match(evidence, /sole normative contract/)
  assert.match(evidence, /Git tree digest:/)
})

test('workflow guidance places capability preflight and mode confirmation before readiness gating', async () => {
  const orderedMarkers = [
    ['power-loop/SKILL.md', '### 1. Preflight Subagent Capability And Confirm The Mode', '### 2. Gate Readiness And Risk'],
    ['README.md', 'Low-cost inspection of the exposed subagent-spawn contract', 'Loop readiness check'],
    ['docs/loop-engineering-tutorial.md', 'Ask the user to confirm the execution mode.', 'Run readiness, delivery-lane, split, and residual-risk gating'],
    [
      'docs/specs/2026-07-10-power-loop-cost-aware-multi-agent-orchestration-spec.md',
      '-> wait for explicit execution-mode confirmation',
      '-> run readiness, delivery-lane, split, and residual-risk gating',
    ],
  ]

  for (const [relativePath, preflightMarker, readinessMarker] of orderedMarkers) {
    const content = await readFile(path.join(root, relativePath), 'utf8')
    const preflightIndex = content.indexOf(preflightMarker)
    const readinessIndex = content.indexOf(readinessMarker)
    assert.notEqual(preflightIndex, -1, `${relativePath} contains preflight/confirmation marker`)
    assert.notEqual(readinessIndex, -1, `${relativePath} contains readiness marker`)
    assert.ok(preflightIndex < readinessIndex, `${relativePath} orders confirmation before readiness`)
  }

  const readme = await readFile(path.join(root, 'README.md'), 'utf8')
  const specification = await readFile(
    path.join(root, 'docs/specs/2026-07-10-power-loop-cost-aware-multi-agent-orchestration-spec.md'),
    'utf8',
  )
  assert.match(readme, /supported model selector or custom-profile selector is enough to recommend `strict-model-routing`/)
  assert.match(readme, /Model, profile, reasoning, and sandbox selection are still independent capabilities/)
  assert.match(specification, /This classification does not imply that reasoning, profile, model, or sandbox selection is also available/)
})

test('managed power-loop profiles exactly match the routing contract', async () => {
  const profileFiles = (await readdir(agentsDir)).filter(name => name.endsWith('.toml')).sort()
  assert.deepEqual(profileFiles, [
    'power-sol-high-reviewer.toml',
    'power-sol-reviewer.toml',
    'power-terra-reviewer.toml',
  ])

  const profiles = await Promise.all(profileFiles.map(name => parseToml(path.join(agentsDir, name))))
  assert.deepEqual(
    Object.fromEntries(profiles.map(profile => [
      profile.name,
      [profile.model, profile.model_reasoning_effort, profile.sandbox_mode],
    ])),
    expectedProfiles,
  )

  const reviewerProfiles = profiles.filter(profile => profile.sandbox_mode === 'read-only')
  assert.deepEqual(reviewerProfiles.map(profile => profile.name).sort(), [
    'power_sol_high_reviewer',
    'power_sol_reviewer',
    'power_terra_reviewer',
  ])
})

async function parseToml(filePath) {
  const { stdout } = await execFileAsync('python3', [
    '-c',
    'import json, sys, tomllib; print(json.dumps(tomllib.load(open(sys.argv[1], "rb"))))',
    filePath,
  ])
  return JSON.parse(stdout)
}
