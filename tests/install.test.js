import assert from 'node:assert/strict'
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
  'power-think',
  'power-grill',
  'power-loop',
  'power-verifier',
  'power-curator',
  'power-work-report',
  'power-critic',
]
const managedProfiles = [
  ['power-loop/agents/power-luna-worker.toml', 'power_luna_worker', 'gpt-5.6-luna', 'max', 'workspace-write'],
  ['power-loop/agents/power-sol-worker.toml', 'power_sol_worker', 'gpt-5.6-sol', 'medium', 'workspace-write'],
  ['power-loop/agents/power-terra-reviewer.toml', 'power_terra_reviewer', 'gpt-5.6-terra', 'high', 'read-only'],
  ['power-loop/agents/power-sol-reviewer.toml', 'power_sol_reviewer', 'gpt-5.6-sol', 'medium', 'read-only'],
  ['power-loop/agents/power-sol-high-reviewer.toml', 'power_sol_high_reviewer', 'gpt-5.6-sol', 'high', 'read-only'],
  ['power-critic/agents/power-critic.toml', 'power_critic', undefined, 'high', 'read-only'],
]
const retiredProfiles = [
  'power-terra-worker.toml',
  'power-terra-complex-worker.toml',
  'power-sol-escalation.toml',
  'power-code-reviewer.toml',
  'power-verifier.toml',
]

test('installer installs the complete managed inventory idempotently without changing unrelated agents', async t => {
  const tmp = await fs.mkdtemp('/tmp/ohmypowers-install-')
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const agentsDir = path.join(tmp, 'agents')
  const personalAgent = path.join(agentsDir, 'personal-agent.toml')
  const personalAgentContents = 'name = "personal_agent"\ncustom = true\n'
  await fs.mkdir(agentsDir, { recursive: true })
  await fs.writeFile(personalAgent, personalAgentContents, 'utf8')
  for (const retired of retiredProfiles) await fs.writeFile(path.join(agentsDir, retired), 'stale = true\n', 'utf8')

  await install(tmp)
  const firstInstall = await installedInventory(tmp)
  await install(tmp)
  const secondInstall = await installedInventory(tmp)

  assert.deepEqual(secondInstall, firstInstall)
  assert.equal(await fs.readFile(personalAgent, 'utf8'), personalAgentContents)
  for (const retired of retiredProfiles) assert.equal(await exists(path.join(agentsDir, retired)), false)
  assert.deepEqual([...managedSkills].sort(), await declaredSkills())
  assert.deepEqual(
    managedProfiles.map(([source]) => source).sort(),
    await declaredProfileSources(),
  )

  for (const skill of managedSkills) {
    await assertDirectoriesMatch(path.join(root, skill), path.join(tmp, 'skills', skill))
  }

  const installedLoopAssets = path.join(tmp, 'skills', 'power-loop', 'assets')
  for (const template of ['agent-dispatch-plan-strict.md', 'agent-dispatch-plan-inherited.md']) {
    assert.equal(await exists(path.join(installedLoopAssets, template)), true, `${template} is installed`)
    assert.deepEqual(
      await fs.readFile(path.join(installedLoopAssets, template)),
      await fs.readFile(path.join(root, 'power-loop', 'assets', template)),
    )
  }

  for (const [source, expectedName, model, effort, sandbox] of managedProfiles) {
    const installed = path.join(agentsDir, path.basename(source))
    assert.deepEqual(await fs.readFile(installed), await fs.readFile(path.join(root, source)))
    assertProfile(await parseToml(path.join(root, source)), expectedName, model, effort, sandbox)
    assertProfile(await parseToml(installed), expectedName, model, effort, sandbox)
  }
})

test('installed power-work-report runs without the source repository as cwd', async t => {
  const tmp = await fs.mkdtemp('/tmp/ohmypowers-installed-report-')
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  await install(tmp)
  const installedBin = path.join(
    tmp,
    'skills',
    'power-work-report',
    'scripts',
    'power-work-report',
    'bin',
    'power-work-report.js',
  )
  const outDir = path.join(tmp, 'reports')
  const fixtureCodexHome = path.join(root, 'tests', 'power-work-report', 'fixtures', 'codex-home')
  const mockCodex = path.join(root, 'tests', 'power-work-report', 'fixtures', 'bin', 'mock-codex-success.cjs')

  await execFileAsync(
    process.execPath,
    [
      installedBin,
      'run',
      '--date',
      '2026-07-01',
      '--codex-home',
      fixtureCodexHome,
      '--out-dir',
      outDir,
      '--timezone',
      'Asia/Shanghai',
      '--codex-bin',
      mockCodex,
    ],
    { cwd: tmp },
  )

  assert.ok(await exists(path.join(outDir, '2026-07-01', 'draft', 'report.json')))
})

async function install(codexHome) {
  await execFileAsync(installer, [], {
    cwd: root,
    env: { ...process.env, CODEX_HOME: codexHome },
  })
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

async function assertDirectoriesMatch(source, installed) {
  assert.deepEqual(await listFiles(installed), await listFiles(source))
}

async function declaredSkills() {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const skills = []
  for (const entry of entries) {
    if (entry.isDirectory() && (await exists(path.join(root, entry.name, 'SKILL.md')))) {
      skills.push(entry.name)
    }
  }
  return skills.sort()
}

async function declaredProfileSources() {
  const skills = await declaredSkills()
  const profiles = []
  for (const skill of skills) {
    const agentsDir = path.join(root, skill, 'agents')
    if (!(await exists(agentsDir))) continue
    for (const entry of await fs.readdir(agentsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.toml')) profiles.push(path.join(skill, 'agents', entry.name))
    }
  }
  return profiles.sort()
}

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = {}
  for (const entry of entries) {
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
  const { stdout } = await execFileAsync('python3', ['-c', 'import json, sys, tomllib; print(json.dumps(tomllib.load(open(sys.argv[1], "rb"))))', filePath])
  return JSON.parse(stdout)
}

function assertProfile(profile, expectedName, model, effort, sandbox) {
  assert.equal(profile.name, expectedName)
  if (model) assert.equal(profile.model, model)
  assert.equal(profile.model_reasoning_effort, effort)
  assert.equal(profile.sandbox_mode, sandbox)
  assert.equal(typeof profile.developer_instructions, 'string')
}
