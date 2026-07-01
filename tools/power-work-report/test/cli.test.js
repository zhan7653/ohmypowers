import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const bin = path.join(root, 'bin', 'power-work-report.js')
const fixtureCodexHome = path.join(__dirname, 'fixtures', 'codex-home')
const successCodex = path.join(__dirname, 'fixtures', 'bin', 'mock-codex-success.cjs')
const failCodex = path.join(__dirname, 'fixtures', 'bin', 'mock-codex-fail.cjs')

test('collect writes deterministic raw summary grouped by project', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-collect-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  await run(['collect', '--date', '2026-07-01', '--codex-home', fixtureCodexHome, '--out-dir', tmp])

  const raw = await readJson(path.join(tmp, '2026-07-01', 'draft', 'raw-summary.json'))
  assert.equal(raw.sessionCount, 2)
  assert.deepEqual(
    raw.projects.map(project => project.project).sort(),
    ['/workspace/alpha', '/workspace/beta'],
  )
  assert.equal(raw.sessions.find(session => session.cwd === '/workspace/alpha').malformedLines, 1)
  assert.ok(JSON.stringify(raw).includes('修复日报生成的边界'))
})

test('run writes final markdown report and memory update', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-run-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  await run([
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--lang',
    'zh-CN',
    '--codex-bin',
    successCodex,
  ])

  const dayDir = path.join(tmp, '2026-07-01')
  const draftDir = path.join(dayDir, 'draft')
  const report = await readJson(path.join(draftDir, 'report.json'))
  const memory = await readJson(path.join(tmp, 'memory.json'))
  const markdown = await fs.readFile(path.join(dayDir, 'report.md'), 'utf8')

  assert.equal(report.status, 'draft')
  assert.equal(report.projects.length, 2)
  assert.equal(report.todoReview.new.length, 2)
  assert.ok(markdown.includes('按项目分组'))
  assert.ok(markdown.includes('待办事项'))
  assert.ok(!markdown.includes('未完成 Todos'))
  assert.equal(await exists(path.join(dayDir, 'report.html')), false)
  assert.ok(memory.todos.length >= 2)
})

test('run carries open memory todos into first-class todo review', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-carryover-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  await fs.writeFile(
    path.join(tmp, 'memory.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        todos: [
          {
            id: 'existing-alpha',
            text: '补充 finalize 测试',
            project: '/workspace/alpha',
            sourceDate: '2026-06-30',
            sourceDates: ['2026-06-30'],
            sourceSessionIds: ['old-session'],
            status: 'open',
          },
          {
            id: 'closed-beta',
            text: '已关闭事项',
            project: '/workspace/beta',
            sourceDate: '2026-06-29',
            sourceDates: ['2026-06-29'],
            sourceSessionIds: ['closed-session'],
            status: 'done',
          },
        ],
        ideas: [],
        reports: [],
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  await run([
    'draft',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--lang',
    'zh-CN',
    '--codex-bin',
    failCodex,
  ])

  const draftDir = path.join(tmp, '2026-07-01', 'draft')
  const report = await readJson(path.join(draftDir, 'report.json'))
  const markdown = await fs.readFile(path.join(draftDir, 'report.md'), 'utf8')

  assert.equal(report.todoReview.carryover.length, 1)
  assert.equal(report.todoReview.carryover[0].text, '补充 finalize 测试')
  assert.equal(report.todoReview.new.some(item => item.text === '已关闭事项'), false)
  assert.ok(markdown.includes('继承待办事项'))
  assert.ok(markdown.includes('新增待办事项'))
})

test('codex failure writes fallback draft and finalize refuses without allow-fallback', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-fallback-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  const args = [
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--codex-bin',
    failCodex,
  ]

  await assert.rejects(() => run(args), /Refusing to finalize codex_failed draft/)

  const report = await readJson(path.join(tmp, '2026-07-01', 'draft', 'report.json'))
  assert.equal(report.status, 'codex_failed')

  await assert.rejects(
    () => run(['finalize', '--date', '2026-07-01', '--out-dir', tmp]),
    /Refusing to finalize codex_failed draft/,
  )
})

test('run refuses to overwrite final markdown without force', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-overwrite-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  const args = [
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--codex-bin',
    successCodex,
  ]

  await run(args)
  await assert.rejects(() => run(args), /Refusing to overwrite existing report/)
  await run([...args, '--force'])
})

test('run writes markdown report and deduplicates memory by normalized text and project', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-finalize-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  await run([
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--codex-bin',
    successCodex,
  ])

  const dayDir = path.join(tmp, '2026-07-01')
  const memory = await readJson(path.join(tmp, 'memory.json'))
  assert.ok(await exists(path.join(dayDir, 'report.md')))
  assert.equal(await exists(path.join(dayDir, 'report.html')), false)
  assert.equal(await exists(path.join(dayDir, 'report.json')), false)
  assert.equal(
    memory.todos.filter(item => item.project === '/workspace/alpha' && item.text === '修复日报生成的边界').length,
    1,
  )
  assert.equal(memory.reports.length, 1)
})

async function run(args) {
  await execFileAsync(process.execPath, [bin, ...args], {
    cwd: root,
    maxBuffer: 10 * 1024 * 1024,
  })
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function exists(filePath) {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
}
