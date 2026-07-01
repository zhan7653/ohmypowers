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

test('run writes codex draft reports and proposed memory update', async t => {
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

  const draftDir = path.join(tmp, '2026-07-01', 'draft')
  const report = await readJson(path.join(draftDir, 'report.json'))
  const proposal = await readJson(path.join(draftDir, 'memory-update.proposed.json'))
  const markdown = await fs.readFile(path.join(draftDir, 'report.md'), 'utf8')
  const html = await fs.readFile(path.join(draftDir, 'report.html'), 'utf8')

  assert.equal(report.status, 'draft')
  assert.equal(report.schemaVersion, 2)
  assert.equal(report.projectSections.length, 2)
  assertMarkdownOrder(markdown, [
    '## 今日概览',
    '## 关键成果',
    '## 关键决策',
    '## 明日优先',
    '## 后续待办',
    '## 项目进展',
    '## 风险与阻塞',
    '## 想法与灵感',
    '## 附录：证据索引',
  ])
  assert.ok(html.includes('<!doctype html>'))
  assert.ok(html.includes('class="hero"'))
  assert.ok(html.includes('class="stats"'))
  assert.ok(html.includes('class="nav"'))
  assert.ok(html.includes('class="timeline"'))
  assert.ok(html.includes('class="decision-list"'))
  assert.ok(html.includes('class="task-board"'))
  assert.ok(html.includes('details class="project"'))
  assert.ok(html.includes('id="openAll"'))
  assert.ok(html.includes('id="closeAll"'))
  assert.ok(html.includes('id="themeBtn"'))
  assert.ok(html.includes('id="progress"'))
  assert.ok(html.includes('@media print'))
  assert.ok(html.includes('@media (max-width: 820px)'))
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(proposal.todos.length >= 2)
  assert.ok(proposal.ideas.length >= 2)
})

test('codex failure writes fallback draft and finalize refuses without allow-fallback', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-fallback-'))
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
    failCodex,
  ])

  const report = await readJson(path.join(tmp, '2026-07-01', 'draft', 'report.json'))
  assert.equal(report.status, 'codex_failed')

  await assert.rejects(
    () => run(['finalize', '--date', '2026-07-01', '--out-dir', tmp]),
    /Refusing to finalize codex_failed draft/,
  )
})

test('finalize writes final reports and deduplicates memory by normalized text and project', async t => {
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
  await run(['finalize', '--date', '2026-07-01', '--out-dir', tmp])

  const finalDir = path.join(tmp, '2026-07-01', 'final')
  const memory = await readJson(path.join(tmp, 'memory.json'))
  assert.ok(await exists(path.join(finalDir, 'report.md')))
  assert.ok(await exists(path.join(finalDir, 'report.html')))
  assert.ok(await exists(path.join(finalDir, 'report.json')))
  assert.equal(
    memory.todos.filter(item => item.project === '/workspace/alpha' && item.text === '修复日报生成的边界').length,
    1,
  )
  assert.equal(
    memory.ideas.filter(item => item.project === '/workspace/alpha' && item.text === '把确认流程做成 skill').length,
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

function assertMarkdownOrder(markdown, headings) {
  let cursor = -1
  for (const heading of headings) {
    const index = markdown.indexOf(heading)
    assert.ok(index > cursor, `${heading} should appear after the previous report section`)
    cursor = index
  }
}
