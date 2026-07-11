import assert from 'node:assert/strict'
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

const expectedProfiles = {
  power_luna_worker: ['gpt-5.6-luna', 'max', 'workspace-write'],
  power_sol_worker: ['gpt-5.6-sol', 'medium', 'workspace-write'],
  power_terra_reviewer: ['gpt-5.6-terra', 'high', 'read-only'],
  power_sol_reviewer: ['gpt-5.6-sol', 'medium', 'read-only'],
  power_sol_high_reviewer: ['gpt-5.6-sol', 'high', 'read-only'],
}

function route(input) {
  if (input.type === 'implementation') {
    return input.implementationClass === 'lower-medium-or-below'
      ? { profile: 'power_luna_worker', model: 'gpt-5.6-luna', reasoningEffort: 'max' }
      : { profile: 'power_sol_worker', model: 'gpt-5.6-sol', reasoningEffort: 'medium' }
  }

  if (input.type === 'implementation-replacement') {
    assert.equal(input.fromProfile, 'power_luna_worker')
    assert.equal(input.failureClass, 'capability-underclassification')
    return { profile: 'power_sol_worker', model: 'gpt-5.6-sol', reasoningEffort: 'medium', transitions: 1 }
  }

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

test('routing cases encode the two implementation tiers and three reviewer tiers', async () => {
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))

  assert.equal(fixture.schema, 'power-loop-model-routing-cases/v1')
  for (const scenario of fixture.cases) {
    assert.deepEqual(route(scenario), scenario.expected, scenario.id)
  }

  assert.ok(new Set(fixture.cases.filter(item => item.type === 'review').map(item => item.capability)).size > 1)
})

test('managed power-loop profiles exactly match the routing contract', async () => {
  const profileFiles = (await readdir(agentsDir)).filter(name => name.endsWith('.toml')).sort()
  assert.deepEqual(profileFiles, [
    'power-luna-worker.toml',
    'power-sol-high-reviewer.toml',
    'power-sol-reviewer.toml',
    'power-sol-worker.toml',
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

  const implementationProfiles = profiles.filter(profile => profile.sandbox_mode === 'workspace-write')
  assert.deepEqual(implementationProfiles.map(profile => profile.name).sort(), ['power_luna_worker', 'power_sol_worker'])
  assert.ok(implementationProfiles.every(profile => profile.model !== 'gpt-5.6-terra'))

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
