import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const installer = path.join(root, 'scripts', 'install.sh')
const managedSkills = [
  'power-gan',
  'power-check',
  'power-curator',
  'power-critic',
]
const retiredSkills = ['power-think', 'power-grill', 'power-loop', 'power-verifier', 'power-work-report']
const managedProfiles = [
  ['power-critic/agents/power-critic.toml', 'power_critic', undefined, 'high', 'read-only'],
  ['power-check/agents/reviewer.toml', 'power_reviewer', 'gpt-5.6-sol', 'high', undefined],
  ['power-gan/agents/power-worker.toml', 'power_worker', 'gpt-5.6-terra', 'high', undefined],
  ['power-gan/agents/power-scout.toml', 'power_scout', 'gpt-5.6-terra', 'medium', undefined],
  ['power-gan/agents/power-explorer.toml', 'power_explorer', 'gpt-5.6-sol', 'medium', undefined],
  ['power-gan/agents/power-planner.toml', 'power_planner', 'gpt-5.6-sol', 'xhigh', undefined],
]
const retiredProfiles = [
  'power-luna-worker.toml',
  'power-sol-worker.toml',
  'power-terra-reviewer.toml',
  'power-sol-reviewer.toml',
  'power-sol-high-reviewer.toml',
  'power-terra-worker.toml',
  'power-terra-complex-worker.toml',
  'power-sol-escalation.toml',
  'power-code-reviewer.toml',
  'power-verifier.toml',
]

test('installer replaces the retired core workflow and preserves unrelated agents', async t => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ohmypowers-install-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const agentsDir = path.join(tmp, 'agents')
  const skillsDir = path.join(tmp, 'skills')
  const personalAgent = path.join(agentsDir, 'personal-agent.toml')
  const personalAgentContents = 'name = "personal_agent"\ncustom = true\n'

  await fs.mkdir(agentsDir, { recursive: true })
  await fs.mkdir(skillsDir, { recursive: true })
  await fs.writeFile(personalAgent, personalAgentContents, 'utf8')
  await fs.writeFile(path.join(agentsDir, 'reviewer.toml'), 'name = "personal_reviewer"\n', 'utf8')
  for (const retired of retiredProfiles) await fs.writeFile(path.join(agentsDir, retired), 'stale = true\n', 'utf8')
  for (const retired of retiredSkills) {
    await fs.mkdir(path.join(skillsDir, retired), { recursive: true })
    await fs.writeFile(path.join(skillsDir, retired, 'stale.txt'), 'stale\n', 'utf8')
  }

  await install(tmp)
  const firstInstall = await installedInventory(tmp)
  await install(tmp)
  const secondInstall = await installedInventory(tmp)

  assert.deepEqual(secondInstall, firstInstall)
  assert.equal(await fs.readFile(personalAgent, 'utf8'), personalAgentContents)
  for (const retired of retiredProfiles) assert.equal(await exists(path.join(agentsDir, retired)), false)
  for (const retired of retiredSkills) assert.equal(await exists(path.join(skillsDir, retired)), false)
  assert.deepEqual([...managedSkills].sort(), await declaredSkills())
  assert.deepEqual(
    managedProfiles.map(([source]) => source).sort(),
    await declaredProfileSources(),
  )

  for (const skill of managedSkills) {
    assert.deepEqual(await listFiles(path.join(skillsDir, skill)), await listFiles(path.join(root, skill)))
  }

  for (const [source, expectedName, model, effort, sandbox] of managedProfiles) {
    const installed = path.join(agentsDir, path.basename(source))
    assert.deepEqual(await fs.readFile(installed), await fs.readFile(path.join(root, source)))
    assertProfile(await parseToml(installed), expectedName, model, effort, sandbox)
  }
})

async function install(codexHome) {
  await execFileAsync(installer, [], { cwd: root, env: { ...process.env, CODEX_HOME: codexHome } })
}

async function exists(filePath) {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
}

async function installedInventory(codexHome) {
  const inventory = {}
  for (const skill of managedSkills) {
    inventory[`skills/${skill}`] = await listFiles(path.join(codexHome, 'skills', skill))
  }
  for (const [source] of managedProfiles) {
    const installed = path.join(codexHome, 'agents', path.basename(source))
    inventory[`agents/${path.basename(source)}`] = (await fs.readFile(installed)).toString('base64')
  }
  return inventory
}

async function declaredSkills() {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const skills = []
  for (const entry of entries) {
    if (entry.isDirectory() && (await exists(path.join(root, entry.name, 'SKILL.md')))) skills.push(entry.name)
  }
  return skills.sort()
}

async function declaredProfileSources() {
  const profiles = []
  for (const skill of await declaredSkills()) {
    const agentsDir = path.join(root, skill, 'agents')
    if (!(await exists(agentsDir))) continue
    for (const entry of await fs.readdir(agentsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.toml')) profiles.push(path.join(skill, 'agents', entry.name))
    }
  }
  return profiles.sort()
}

async function listFiles(directory) {
  const files = {}
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      for (const [relativePath, contents] of Object.entries(await listFiles(filePath))) {
        files[path.join(entry.name, relativePath)] = contents
      }
    } else if (entry.isFile()) {
      files[entry.name] = (await fs.readFile(filePath)).toString('base64')
    }
  }
  return files
}

async function parseToml(filePath) {
  const { stdout } = await execFileAsync('python3', [
    '-c',
    'import json, sys, tomllib; print(json.dumps(tomllib.load(open(sys.argv[1], "rb"))))',
    filePath,
  ])
  return JSON.parse(stdout)
}

function assertProfile(profile, expectedName, model, effort, sandbox) {
  assert.equal(profile.name, expectedName)
  if (model) assert.equal(profile.model, model)
  assert.equal(profile.model_reasoning_effort, effort)
  assert.equal(profile.sandbox_mode, sandbox)
  assert.equal(typeof profile.developer_instructions, 'string')
}
