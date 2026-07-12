import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const assetsDir = path.join(root, 'power-loop', 'assets')
const agentsDir = path.join(root, 'power-loop', 'agents')

function runtimeRouting(input) {
  if (!input.schemaAvailable || input.contradictoryEvidence) {
    return { status: 'needs-human', routingProvenance: 'unavailable', selectedFields: [] }
  }
  const selectedFields = input.exposedFields.filter(field =>
    ['model', 'agent_type', 'profile', 'reasoning_effort', 'sandbox_mode'].includes(field),
  )
  return selectedFields.length
    ? { status: 'ready', routingProvenance: 'selected supported fields', selectedFields }
    : { status: 'ready', routingProvenance: 'inherited from parent', selectedFields: [] }
}

function routeReviewer(input) {
  switch (input.reviewClass) {
    case 'explicitly-simple':
      return { profile: 'power_terra_reviewer', model: 'gpt-5.6-terra', reasoningEffort: 'high' }
    case 'high-risk-or-complex':
      return { profile: 'power_sol_high_reviewer', model: 'gpt-5.6-sol', reasoningEffort: 'high' }
    default:
      return { profile: 'power_sol_reviewer', model: 'gpt-5.6-sol', reasoningEffort: 'medium' }
  }
}

test('runtime reviewer capability is inspected after implementation without mode confirmation', async () => {
  const fixture = JSON.parse(await readFile(path.join(root, 'tests/fixtures/power-loop/capability-routing-cases.json'), 'utf8'))
  assert.equal(fixture.schema, 'runtime-review-capability-cases/v2')
  for (const scenario of fixture.cases) assert.deepEqual(runtimeRouting(scenario.input), scenario.expected, scenario.id)

  const skill = await readFile(path.join(root, 'power-loop/SKILL.md'), 'utf8')
  const readiness = skill.indexOf('### 1. Gate Readiness And Risk')
  const runtimeReview = skill.indexOf('## Runtime Final Review')
  assert.ok(readiness >= 0 && runtimeReview > readiness)
  assert.match(skill, /Only after V2\/V3 and the final diff are known, inspect the visible `spawn_agent` contract/)
  assert.doesNotMatch(skill, /confirm the execution mode|mode-specific Agent Dispatch Plan/i)
})

test('one runtime Final Review Plan replaces all pre-implementation Dispatch templates', async () => {
  const finalPlan = await readFile(path.join(assetsDir, 'final-review-plan.md'), 'utf8')
  assert.match(finalPlan, /Runtime capability evidence/)
  assert.match(finalPlan, /selected configuration \| inherited from parent/)
  assert.match(finalPlan, /contract-conformance and code-review capabilities/)
  assert.match(finalPlan, /180-second waits/)

  for (const removed of [
    'agent-dispatch-plan.md',
    'agent-dispatch-plan-strict.md',
    'agent-dispatch-plan-inherited.md',
  ]) {
    await assert.rejects(access(path.join(assetsDir, removed)), `${removed} is removed`)
  }
})

test('reviewer profile fixtures preserve the three read-only reviewer tiers', async () => {
  const fixture = JSON.parse(await readFile(path.join(root, 'tests/fixtures/power-loop/model-routing-cases.json'), 'utf8'))
  assert.equal(fixture.schema, 'runtime-review-profile-routing-cases/v3')
  for (const scenario of fixture.cases) assert.deepEqual(routeReviewer(scenario), scenario.expected, scenario.id)

  const profileFiles = (await readdir(agentsDir)).filter(name => name.endsWith('.toml')).sort()
  assert.deepEqual(profileFiles, [
    'power-sol-high-reviewer.toml',
    'power-sol-reviewer.toml',
    'power-terra-reviewer.toml',
  ])
  for (const file of profileFiles) {
    const profile = await parseToml(path.join(agentsDir, file))
    assert.equal(profile.sandbox_mode, 'read-only')
  }
})

test('Issue patch and thin Goal pin only the Blueprint before implementation', async () => {
  const [patchTemplate, goal, blueprint] = await Promise.all([
    readFile(path.join(assetsDir, 'issue-patch.md'), 'utf8'),
    readFile(path.join(assetsDir, 'codex-loop-goal.txt'), 'utf8'),
    readFile(path.join(assetsDir, 'execution-blueprint.md'), 'utf8'),
  ])

  assert.match(patchTemplate, /Replacement block: Execution Blueprint reference/)
  assert.doesNotMatch(patchTemplate, /Agent Dispatch Plan|Final Review Plan reference/)
  assert.match(goal, /Required confirmed reference:/)
  assert.doesNotMatch(goal, /Agent Dispatch Plan artifact/)
  assert.match(goal, /After the final tree is frozen and V2\/V3 evidence exists/)
  assert.match(blueprint, /Reviewer capability, routing, count, and waiting are intentionally absent/)
})

test('Final Review Plan is supplementary and the Goal remains a thin launcher', async () => {
  const [finalPlan, goal] = await Promise.all([
    readFile(path.join(assetsDir, 'final-review-plan.md'), 'utf8'),
    readFile(path.join(assetsDir, 'codex-loop-goal.txt'), 'utf8'),
  ])
  assert.match(finalPlan, /Task Contract is the sole normative contract/)
  assert.match(finalPlan, /supplementary evidence/)
  assert.match(goal, /treat only its Task Contract byte range as normative/i)
  assert.match(goal, /The user must start this Goal manually/)
  assert.doesNotMatch(goal, /^Budget:|^Dispatch Summary:|^Verifier gate:/m)
})

async function parseToml(filePath) {
  const { stdout } = await execFileAsync('python3', [
    '-c',
    'import json, sys, tomllib; print(json.dumps(tomllib.load(open(sys.argv[1], "rb"))))',
    filePath,
  ])
  return JSON.parse(stdout)
}
