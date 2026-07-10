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

test('installer is idempotent and preserves unrelated custom agents', async t => {
  const tmp = await fs.mkdtemp('/tmp/ohmypowers-install-')
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const agentsDir = path.join(tmp, 'agents')
  await fs.mkdir(agentsDir, { recursive: true })
  await fs.writeFile(path.join(agentsDir, 'personal-agent.toml'), 'name = "personal_agent"\n', 'utf8')

  await install(tmp)
  await install(tmp)

  assert.ok(await exists(path.join(tmp, 'skills', 'power-loop', 'SKILL.md')))
  assert.ok(!(await exists(path.join(tmp, 'skills', 'power-loop', 'power-loop'))))
  assert.ok(
    await exists(
      path.join(
        tmp,
        'skills',
        'power-work-report',
        'scripts',
        'power-work-report',
        'bin',
        'power-work-report.js',
      ),
    ),
  )
  assert.ok(await exists(path.join(agentsDir, 'power-luna-worker.toml')))
  assert.ok(await exists(path.join(agentsDir, 'personal-agent.toml')))
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
