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
  const readiness = skill.indexOf('### 1. Check Readiness And Lane')
  const runtimeReview = skill.indexOf('## Runtime Final Review')
  assert.ok(readiness >= 0 && runtimeReview > readiness)
  assert.match(skill, /Only after V2\/V3 and the final diff are known, inspect the visible `spawn_agent` contract/)
  assert.doesNotMatch(skill, /confirm the execution mode|mode-specific Agent Dispatch Plan/i)
})

test('one runtime Final Review Record owns reviewer results and wait telemetry', async () => {
  const finalRecord = await readFile(path.join(assetsDir, 'final-review-record.md'), 'utf8')
  assert.match(finalRecord, /路由来源/)
  assert.match(finalRecord, /合同符合性评审和代码评审/)
  assert.match(finalRecord, /180-second waits|180 seconds|180 秒/)
  assert.match(finalRecord, /Reviewer 分工与结果/)

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

test('Issue patch makes the confirmed Issue directly executable without a launcher asset', async () => {
  const [patchTemplate, blueprint] = await Promise.all([
    readFile(path.join(assetsDir, 'issue-patch.md'), 'utf8'),
    readFile(path.join(assetsDir, 'execution-blueprint.md'), 'utf8'),
  ])

  assert.match(patchTemplate, /精确替换区块/)
  assert.match(patchTemplate, /任务合同 digest：`sha256:/)
  assert.match(patchTemplate, /执行入口：`此持久化 Issue/)
  assert.match(patchTemplate, /即可直接执行/)
  assert.doesNotMatch(patchTemplate, /Decision summary|User-visible scope|Required safety guarantees|决策摘要/)
  assert.equal((await readdir(assetsDir)).some(name => /goal/i.test(name)), false, 'no launcher asset remains')
  assert.match(blueprint, /Reviewer 路由和等待策略只在最终树冻结后决定/)
  assert.match(blueprint, /主 Agent 实施 -> V0 -> V1/)
  assert.doesNotMatch(blueprint, /Candidate snapshot ceiling|Max implementation iterations|Same-failure retry limit/)
})

test('LIGHT direct execution skips persisted planning while STANDARD and HIGH retain the optional Blueprint path', async () => {
  const [finalRecord, skill] = await Promise.all([
    readFile(path.join(assetsDir, 'final-review-record.md'), 'utf8'),
    readFile(path.join(root, 'power-loop', 'SKILL.md'), 'utf8'),
  ])
  assert.match(finalRecord, /冻结 Git tree digest/)
  assert.match(skill, /For `LIGHT`, prefer direct execution/)
  assert.match(skill, /Use a persisted Blueprint for `STANDARD`, `HIGH`/)
  assert.doesNotMatch(skill, /residual risk|ALLOW_EXECUTION|EXECUTION_WITH_STRICT_GATE/i)
  assert.match(skill, /默认使用简体中文输出 readiness 结果/)
})

async function parseToml(filePath) {
  const { stdout } = await execFileAsync('python3', [
    '-c',
    'import json, sys, tomllib; print(json.dumps(tomllib.load(open(sys.argv[1], "rb"))))',
    filePath,
  ])
  return JSON.parse(stdout)
}
