import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const installer = path.join(root, 'scripts', 'install.sh')
const managedSkills = ['power-gan', 'power-check', 'power-curator']
const retiredSkills = ['power-critic', 'power-think', 'power-grill', 'power-loop', 'power-verifier', 'power-work-report']
const managedProfiles = [
  'power-critic.toml',
  'reviewer.toml',
  'power-worker.toml',
  'power-scout.toml',
  'power-explorer.toml',
  'power-planner.toml',
]

test('installer installs only active skills, removes retired global profiles, and is idempotent', async t => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ohmypowers-install-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const agentsDir = path.join(tmp, 'agents')
  const skillsDir = path.join(tmp, 'skills')
  const personalAgent = path.join(agentsDir, 'personal-agent.toml')
  const personalAgentContents = 'name = "personal_agent"\ncustom = true\n'

  await fs.mkdir(agentsDir, { recursive: true })
  await fs.mkdir(skillsDir, { recursive: true })
  await fs.writeFile(personalAgent, personalAgentContents, 'utf8')
  for (const retired of managedProfiles) await fs.writeFile(path.join(agentsDir, retired), 'stale = true\n', 'utf8')
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
  for (const retired of managedProfiles) assert.equal(await exists(path.join(agentsDir, retired)), false)
  for (const retired of retiredSkills) assert.equal(await exists(path.join(skillsDir, retired)), false)
  assert.deepEqual([...managedSkills].sort(), await declaredSkills())

  for (const skill of managedSkills) {
    assert.deepEqual(await listFiles(path.join(skillsDir, skill)), await listFiles(path.join(root, skill)))
  }
})

test('project reviewer is a valid narrow custom agent', async () => {
  const reviewerPath = path.join(root, '.codex', 'agents', 'reviewer.toml')
  const reviewer = await parseToml(reviewerPath)
  assert.equal(reviewer.name, 'power_reviewer')
  assert.equal(reviewer.sandbox_mode, 'read-only')
  assert.equal(reviewer.model, 'gpt-6-astra')
  assert.equal(reviewer.model_reasoning_effort, 'medium')
  assert.match(reviewer.description, /read-only/i)
  assert.match(reviewer.developer_instructions, /Do not edit files/i)
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
  for (const skill of managedSkills) inventory[`skills/${skill}`] = await listFiles(path.join(codexHome, 'skills', skill))
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
