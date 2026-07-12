import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import test from 'node:test'
import { runCli } from '../../power-work-report/scripts/power-work-report/lib/cli.js'
import { buildCodexArgs } from '../../power-work-report/scripts/power-work-report/lib/codex-draft.js'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const runtimeRoot = path.join(root, 'power-work-report', 'scripts', 'power-work-report')
const bin = path.join(runtimeRoot, 'bin', 'power-work-report.js')
const fixtureCodexHome = path.join(__dirname, 'fixtures', 'codex-home')
const successCodex = path.join(__dirname, 'fixtures', 'bin', 'mock-codex-success.cjs')
const failCodex = path.join(__dirname, 'fixtures', 'bin', 'mock-codex-fail.cjs')

test('codex args default to Luna Medium in an isolated read-only run', () => {
  const args = buildCodexArgs({ tempDir: '/tmp/pwr-codex-test', schemaPath: '/tmp/report.schema.json' })

  assert.deepEqual(args, [
    'exec',
    '--json',
    '--skip-git-repo-check',
    '--ephemeral',
    '--model',
    'gpt-5.6-luna',
    '--sandbox',
    'read-only',
    '--config',
    'model_reasoning_effort="medium"',
    '--cd',
    '/tmp/pwr-codex-test',
    '--output-schema',
    '/tmp/report.schema.json',
    '-',
  ])
})

test('codex args allow an explicit model and reasoning override', () => {
  const args = buildCodexArgs({
    model: 'gpt-5.6-terra',
    reasoningEffort: 'high',
    tempDir: '/tmp/pwr-codex-test',
    schemaPath: '/tmp/report.schema.json',
  })

  assert.equal(args[args.indexOf('--model') + 1], 'gpt-5.6-terra')
  assert.equal(args[args.indexOf('--config') + 1], 'model_reasoning_effort="high"')
})

test('collect writes deterministic raw summary grouped by project', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-collect-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  await run([
    'collect',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--timezone',
    'Asia/Shanghai',
  ])

  const raw = await readJson(path.join(tmp, '2026-07-01', 'draft', 'raw-summary.json'))
  assert.equal(raw.sessionCount, 2)
  assert.equal(raw.lookbackDays, 30)
  assert.equal(raw.timezone, 'Asia/Shanghai')
  assert.equal(raw.scan.directories.length, 32)
  assert.deepEqual(
    raw.projects.map(project => project.project).sort(),
    ['/workspace/alpha', '/workspace/beta'],
  )
  assert.equal(raw.sessions.find(session => session.cwd === '/workspace/alpha').malformedLines, 1)
  assert.equal(raw.skippedEvents.malformedLines, 1)
  assert.ok(JSON.stringify(raw).includes('修复日报生成的边界'))
})

test('collect slices cross-day rollout files by configured local date', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-cross-day-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  await writeRollout(codexHome, '2026-07-01', 'cross', [
    event('2026-07-01T01:00:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '旧日期工作。待办: 不应进入 7 月 2 日。',
        cwd: '/workspace/old',
        title: 'Old day',
      },
    }),
    event('2026-07-01T01:05:00.000Z', {
      type: 'response_item',
      payload: { type: 'function_call', name: 'apply_patch', arguments: patchFor('old.js') },
    }),
    event('2026-07-01T16:05:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '目标日工作。待办: 收敛跨天日报能力。想法: 增量汇总。',
        cwd: '/workspace/cross',
        title: 'Cross target',
      },
    }),
    event('2026-07-01T16:06:00.000Z', {
      type: 'response_item',
      payload: { type: 'function_call', name: 'apply_patch', arguments: patchFor('target.js') },
    }),
    event('2026-07-01T16:07:00.000Z', {
      type: 'event_msg',
      payload: { type: 'exec_command_end', command: ['bash', '-lc', 'npm test'], exit_code: 0, status: 'completed' },
    }),
    event('2026-07-02T15:59:00.000Z', {
      type: 'response_item',
      payload: { type: 'message', role: 'assistant', content: [{ text: '完成目标日切片。后续: 补测试。' }] },
    }),
    event('2026-07-02T16:01:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '次日内容不应进入。',
        cwd: '/workspace/future',
        title: 'Future day',
      },
    }),
    { type: 'event_msg', payload: { type: 'user_message', message: '无 timestamp 不应进入。' } },
    event('not-a-date', {
      type: 'event_msg',
      payload: { type: 'user_message', message: '坏 timestamp 不应进入。' },
    }),
    'not-json',
  ])
  await writeRollout(codexHome, '2026-07-03', 'future-dir', [
    event('2026-07-01T16:10:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '未来目录里的目标日事件不应被扫描。',
        cwd: '/workspace/future-dir',
        title: 'Future dir',
      },
    }),
  ])

  await run([
    'collect',
    '--date',
    '2026-07-02',
    '--codex-home',
    codexHome,
    '--out-dir',
    tmp,
    '--lookback-days',
    '1',
    '--timezone',
    'Asia/Shanghai',
  ])

  const raw = await readJson(path.join(tmp, '2026-07-02', 'draft', 'raw-summary.json'))
  assert.equal(raw.sessionCount, 1)
  assert.equal(raw.timezone, 'Asia/Shanghai')
  assert.equal(raw.lookbackDays, 1)
  assert.ok(raw.scan.directories.some(item => item.date === '2026-07-01'))
  assert.ok(raw.scan.directories.some(item => item.date === '2026-07-02'))
  assert.ok(!raw.scan.directories.some(item => item.date === '2026-07-03'))
  assert.equal(raw.scan.files.length, 1)
  assert.equal(raw.sessions[0].startedAt, '2026-07-01T16:05:00.000Z')
  assert.equal(raw.sessions[0].endedAt, '2026-07-02T15:59:00.000Z')
  assert.equal(raw.sessions[0].cwd, '/workspace/cross')
  assert.deepEqual(raw.sessions[0].filesModified, ['target.js'])
  assert.equal(raw.sessions[0].commands.length, 1)
  assert.ok(JSON.stringify(raw).includes('目标日工作'))
  assert.ok(!JSON.stringify(raw).includes('旧日期工作'))
  assert.ok(!JSON.stringify(raw).includes('次日内容不应进入'))
  assert.ok(!JSON.stringify(raw).includes('未来目录里的目标日事件'))
  assert.deepEqual(raw.skippedEvents, {
    malformedLines: 1,
    missingTimestamp: 1,
    invalidTimestamp: 1,
    outsideTargetDate: 3,
  })
})

test('collect rerun for original date excludes later local-date events', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-rerun-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  await writeRollout(codexHome, '2026-07-01', 'cross', [
    event('2026-07-01T01:00:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '原日期内容。待办: 保留原日。',
        cwd: '/workspace/original',
        title: 'Original day',
      },
    }),
    event('2026-07-01T16:05:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '后一天内容不应混入。',
        cwd: '/workspace/cross',
        title: 'Later day',
      },
    }),
  ])

  await run([
    'collect',
    '--date',
    '2026-07-01',
    '--codex-home',
    codexHome,
    '--out-dir',
    tmp,
    '--lookback-days',
    '0',
    '--timezone',
    'Asia/Shanghai',
  ])

  const raw = await readJson(path.join(tmp, '2026-07-01', 'draft', 'raw-summary.json'))
  assert.equal(raw.sessionCount, 1)
  assert.equal(raw.sessions[0].cwd, '/workspace/original')
  assert.ok(JSON.stringify(raw).includes('原日期内容'))
  assert.ok(!JSON.stringify(raw).includes('后一天内容不应混入'))
})

test('collect scans next UTC directory when timezone maps it to target local date', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-west-tz-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  await writeRollout(codexHome, '2026-07-02', 'la-night', [
    event('2026-07-02T06:30:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: 'LA 本地 7 月 1 日晚间工作。待办: 跟进本地日期切片。',
        cwd: '/workspace/la',
        title: 'LA local day',
      },
    }),
  ])

  await run([
    'collect',
    '--date',
    '2026-07-01',
    '--codex-home',
    codexHome,
    '--out-dir',
    tmp,
    '--lookback-days',
    '0',
    '--timezone',
    'America/Los_Angeles',
  ])

  const raw = await readJson(path.join(tmp, '2026-07-01', 'draft', 'raw-summary.json'))
  assert.deepEqual(
    raw.scan.directories.map(item => item.date),
    ['2026-07-01', '2026-07-02'],
  )
  assert.equal(raw.sessionCount, 1)
  assert.equal(raw.sessions[0].cwd, '/workspace/la')
  assert.ok(JSON.stringify(raw).includes('LA 本地 7 月 1 日晚间工作'))
})

test('collect scans previous UTC directory when timezone maps it to target local date', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-east-tz-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  await writeRollout(codexHome, '2026-06-30', 'shanghai-morning', [
    event('2026-06-30T16:30:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '上海本地 7 月 1 日凌晨工作。待办: 跟进正时区切片。',
        cwd: '/workspace/shanghai',
        title: 'Shanghai local day',
      },
    }),
  ])

  await run([
    'collect',
    '--date',
    '2026-07-01',
    '--codex-home',
    codexHome,
    '--out-dir',
    tmp,
    '--lookback-days',
    '0',
    '--timezone',
    'Asia/Shanghai',
  ])

  const raw = await readJson(path.join(tmp, '2026-07-01', 'draft', 'raw-summary.json'))
  assert.deepEqual(
    raw.scan.directories.map(item => item.date),
    ['2026-06-30', '2026-07-01'],
  )
  assert.equal(raw.sessionCount, 1)
  assert.equal(raw.sessions[0].cwd, '/workspace/shanghai')
  assert.ok(JSON.stringify(raw).includes('上海本地 7 月 1 日凌晨工作'))
})

test('collect preserves rollout metadata without counting earlier content', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-metadata-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  await writeRollout(codexHome, '2026-07-01', 'metadata', [
    event('2026-07-01T15:50:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: '前一天的上下文正文不应进入目标日。',
        cwd: '/workspace/metadata',
        title: 'Metadata source',
      },
    }),
    event('2026-07-01T16:05:00.000Z', {
      type: 'response_item',
      payload: { type: 'function_call', name: 'apply_patch', arguments: patchFor('metadata.js') },
    }),
    event('2026-07-01T16:10:00.000Z', {
      type: 'response_item',
      payload: { type: 'message', role: 'assistant', content: [{ text: '目标日完成。' }] },
    }),
  ])

  await run([
    'collect',
    '--date',
    '2026-07-02',
    '--codex-home',
    codexHome,
    '--out-dir',
    tmp,
    '--lookback-days',
    '1',
    '--timezone',
    'Asia/Shanghai',
  ])

  const raw = await readJson(path.join(tmp, '2026-07-02', 'draft', 'raw-summary.json'))
  assert.equal(raw.sessions[0].cwd, '/workspace/metadata')
  assert.equal(raw.sessions[0].title, 'Metadata source')
  assert.deepEqual(raw.sessions[0].userMessages, [])
  assert.ok(!JSON.stringify(raw.projects).includes('前一天的上下文正文'))
  assert.deepEqual(raw.sessions[0].filesModified, ['metadata.js'])
})

test('collect writes memory context separately from today data', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-context-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  await fs.writeFile(
    path.join(tmp, 'memory.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      todos: [
        { id: 'hist-open', text: '历史开放待办', project: '/workspace/history', status: 'open' },
        { id: 'hist-done', text: '历史已完成待办', project: '/workspace/history', status: 'done' },
      ],
      ideas: [],
      reports: [
        {
          date: '2026-06-30',
          title: '旧日报正文标题',
          status: 'final',
          generatedAt: '2026-06-30T12:00:00.000Z',
          sessionIds: ['old-session'],
          body: '旧日报正文不应进入 context',
        },
      ],
    })}\n`,
    'utf8',
  )

  await run([
    'collect',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--timezone',
    'Asia/Shanghai',
  ])

  const raw = await readJson(path.join(tmp, '2026-07-01', 'draft', 'raw-summary.json'))
  assert.deepEqual(raw.context.openTodos, [
    { id: 'hist-open', text: '历史开放待办', project: '/workspace/history', status: 'open' },
  ])
  assert.equal(raw.context.recentReports.length, 1)
  assert.equal(raw.context.recentReports[0].title, '旧日报正文标题')
  assert.equal(raw.context.recentReports[0].body, undefined)
  assert.ok(!JSON.stringify(raw.projects).includes('历史开放待办'))
})

test('fallback keeps narrow implementation details out of top-level todos', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-top-todos-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  const lowLevelTodo = '处理本地 test.txt 中真实 API Token 的留存方式，确保不被误提交或共享'
  const projectTodo = '收敛 partyagent 项目的凭据留存策略'
  await writeRollout(codexHome, '2026-07-01', 'detail', [
    event('2026-07-01T09:00:00.000Z', {
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: `待办: ${lowLevelTodo}。待办: ${projectTodo}。`,
        cwd: '/workspace/partyagent',
        title: 'PartyAgent credentials',
      },
    }),
  ])

  await run([
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    codexHome,
    '--out-dir',
    tmp,
    '--timezone',
    'Asia/Shanghai',
    '--codex-bin',
    failCodex,
  ])

  const draftDir = path.join(tmp, '2026-07-01', 'draft')
  const report = await readJson(path.join(draftDir, 'report.json'))
  const review = await fs.readFile(path.join(draftDir, 'review.md'), 'utf8')
  const markdown = await fs.readFile(path.join(draftDir, 'report.md'), 'utf8')
  const topLevelTexts = [...report.tasks.tomorrowPriority, ...report.tasks.backlog].map(item => item.text)
  assert.deepEqual(topLevelTexts, [`待办: ${projectTodo}`])
  assert.ok(report.projectSections[0].pending.includes(`待办: ${lowLevelTodo}`))
  assert.ok(markdown.includes(`待办: ${lowLevelTodo}`))
  assert.ok(!review.includes(lowLevelTodo))
  assert.ok(review.includes(projectTodo))
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
    '--timezone',
    'Asia/Shanghai',
    '--codex-bin',
    successCodex,
  ])

  const draftDir = path.join(tmp, '2026-07-01', 'draft')
  const report = await readJson(path.join(draftDir, 'report.json'))
  const proposal = await readJson(path.join(draftDir, 'memory-update.proposed.json'))
  const markdown = await fs.readFile(path.join(draftDir, 'report.md'), 'utf8')
  const review = await fs.readFile(path.join(draftDir, 'review.md'), 'utf8')
  const html = await fs.readFile(path.join(draftDir, 'report.html'), 'utf8')

  assert.equal(report.status, 'draft')
  assert.equal(report.schemaVersion, 2)
  assert.equal(report.projectSections.length, 2)
  assertMarkdownOrder(review, [
    '## 今天完成了什么',
    '## 可能完成的历史待办',
    '## 新增待办',
    '## 保留待办',
    '## 新想法',
    '## finalize 前必须确认',
  ])
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
  assert.ok(html.includes('不做窄双栏，按优先级展开'))
  assert.ok(!html.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'))
  assert.ok(!html.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'))
  assert.ok(!html.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)'))
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(proposal.todos.length >= 2)
  assert.ok(proposal.ideas.length >= 2)
  assert.deepEqual(proposal.todoUpdates, [])
  assert.ok(proposal.review)
  assert.ok(proposal.review.newTodos.length >= 2)
  assert.equal(report.personalReflection.status, 'not_provided')
  assert.equal(report.reusableInsights.skillCandidates[0].id, 'review-workflow-skill')
  assert.equal(report.reusableInsights.automationCandidates[0].id, 'report-check-automation')
  assert.equal(report.reusableInsights.globalInstructionCandidates[0].id, 'focused-tests-before-handoff')
  assert.ok(review.includes('## 个人补充与反思'))
  assert.ok(review.includes('## 复用洞察'))
  assert.ok(markdown.includes('## 个人补充与反思'))
  assert.ok(markdown.includes('## 复用洞察'))
})

test('memo regeneration accepts reviewed JSON or text and rejects unsafe input without replacing the draft', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-memo-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const baseArgs = [
    'run', '--date', '2026-07-01', '--codex-home', fixtureCodexHome, '--out-dir', tmp,
    '--timezone', 'Asia/Shanghai', '--codex-bin', successCodex,
  ]
  await run(baseArgs)
  const reportPath = path.join(tmp, '2026-07-01', 'draft', 'report.json')
  const original = await fs.readFile(reportPath, 'utf8')

  await assert.rejects(() => runCli([...baseArgs, '--memo-file', path.join(tmp, 'missing.json')]), /Memo file is missing or unreadable/)
  assert.equal(await fs.readFile(reportPath, 'utf8'), original)

  const invalid = path.join(tmp, 'invalid.json')
  await fs.writeFile(invalid, '{bad')
  await assert.rejects(() => runCli([...baseArgs, '--memo-file', invalid]), /Memo JSON is invalid/)
  assert.equal(await fs.readFile(reportPath, 'utf8'), original)

  const large = path.join(tmp, 'large.txt')
  await fs.writeFile(large, 'x'.repeat(4001))
  await assert.rejects(() => runCli([...baseArgs, '--memo-file', large]), /Memo summary is too large/)
  assert.equal(await fs.readFile(reportPath, 'utf8'), original)

  const memoFile = path.join(tmp, 'reviewed-memo.json')
  await fs.writeFile(memoFile, `${JSON.stringify({ status: 'provided', summary: '复盘后确认：交付前固定运行仓库 smoke test。', provenance: 'user_memo' })}\n`)
  const memoRun = await captureCli([...baseArgs, '--memo-file', memoFile])
  const report = await readJson(reportPath)
  const memoArtifact = await readJson(path.join(tmp, '2026-07-01', 'draft', 'personal-memo.json'))
  const review = await fs.readFile(path.join(tmp, '2026-07-01', 'draft', 'review.md'), 'utf8')
  assert.deepEqual(report.personalReflection, memoArtifact)
  assert.equal(report.personalReflection.status, 'provided')
  assert.equal(JSON.parse(memoRun).memoPath, path.join(tmp, '2026-07-01', 'draft', 'personal-memo.json'))
  assert.ok(review.includes(report.personalReflection.summary))
  assert.equal(report.reusableInsights.projectInstructionCandidates[0].id, 'memo-project-validation')

  const textMemo = path.join(tmp, 'memo.txt')
  await fs.writeFile(textMemo, '纯文本备忘也会被规范化。\n')
  await run([...baseArgs, '--memo-file', textMemo])
  assert.deepEqual(await readJson(path.join(tmp, '2026-07-01', 'draft', 'personal-memo.json')), {
    status: 'provided',
    summary: '纯文本备忘也会被规范化。',
    provenance: 'user_memo',
  })
})

test('explicit memo skip and ordinary no-memo draft remain non-blocking', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-memo-skip-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const skipFile = path.join(tmp, 'skip.json')
  await fs.writeFile(skipFile, `${JSON.stringify({ status: 'skipped' })}\n`)
  await run([
    'run', '--date', '2026-07-01', '--codex-home', fixtureCodexHome, '--out-dir', tmp,
    '--timezone', 'Asia/Shanghai', '--codex-bin', successCodex, '--memo-file', skipFile,
  ])
  assert.equal((await readJson(path.join(tmp, '2026-07-01', 'draft', 'report.json'))).personalReflection.status, 'skipped')

  const ordinary = path.join(tmp, 'ordinary')
  await run([
    'run', '--date', '2026-07-01', '--codex-home', fixtureCodexHome, '--out-dir', ordinary,
    '--timezone', 'Asia/Shanghai', '--codex-bin', successCodex,
  ])
  assert.equal((await readJson(path.join(ordinary, '2026-07-01', 'draft', 'report.json'))).personalReflection.status, 'not_provided')
})

test('run includes historical open todos and advisory completion candidates in review', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-review-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  await fs.writeFile(
    path.join(tmp, 'memory.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        todos: [
          { id: 'old-alpha', text: '修复日报生成的边界', project: '/workspace/alpha' },
          { id: 'old-gamma', text: '历史遗留待办', project: '/workspace/gamma', status: 'open' },
          { id: 'done-beta', text: '已完成旧任务', project: '/workspace/beta', status: 'done' },
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
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--timezone',
    'Asia/Shanghai',
    '--codex-bin',
    successCodex,
  ])

  const draftDir = path.join(tmp, '2026-07-01', 'draft')
  const review = await fs.readFile(path.join(draftDir, 'review.md'), 'utf8')
  const proposal = await readJson(path.join(draftDir, 'memory-update.proposed.json'))
  const memory = await readJson(path.join(tmp, 'memory.json'))

  assert.ok(review.includes('修复日报生成的边界（/workspace/alpha）'))
  assert.ok(review.includes('历史遗留待办（/workspace/gamma）'))
  assert.ok(!review.includes('已完成旧任务'))
  assert.equal(proposal.review.possibleCompletedTodos.length, 1)
  assert.equal(proposal.review.possibleCompletedTodos[0].id, 'old-alpha')
  assert.deepEqual(proposal.todoUpdates, [])
  assert.equal(memory.todos.find(item => item.id === 'old-alpha').status, undefined)
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
    '--timezone',
    'Asia/Shanghai',
    '--codex-bin',
    failCodex,
  ])

  const report = await readJson(path.join(tmp, '2026-07-01', 'draft', 'report.json'))
  assert.equal(report.status, 'codex_failed')
  assert.ok(await exists(path.join(tmp, '2026-07-01', 'draft', 'review.md')))

  await assert.rejects(
    () => runCli(['finalize', '--date', '2026-07-01', '--out-dir', tmp]),
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
    '--timezone',
    'Asia/Shanghai',
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
    memory.todos.find(item => item.project === '/workspace/alpha' && item.text === '修复日报生成的边界').status,
    'open',
  )
  assert.equal(
    memory.ideas.filter(item => item.project === '/workspace/alpha' && item.text === '把确认流程做成 skill').length,
    1,
  )
  assert.equal(memory.reports.length, 1)
  assert.equal(memory.reports[0].personalReflection.status, 'not_provided')
  assert.equal(memory.reports[0].reusableInsights.globalInstructionCandidates[0].id, 'focused-tests-before-handoff')
  assert.deepEqual(memory.instructionChanges, [])
})

test('instruction plan and apply use separate gates, audit success, and support update and remove', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-instruction-cli-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  const target = path.join(codexHome, 'AGENTS.md')
  await fs.mkdir(codexHome, { recursive: true })
  await fs.writeFile(target, '# Human rules\n\nKeep exact.\n')
  await run([
    'run', '--date', '2026-07-01', '--codex-home', fixtureCodexHome, '--out-dir', tmp,
    '--timezone', 'Asia/Shanghai', '--codex-bin', successCodex,
  ])
  await run(['finalize', '--date', '2026-07-01', '--out-dir', tmp])
  const before = await fs.readFile(target, 'utf8')

  const planOutput = JSON.parse(await captureCli([
    'instruction-plan', '--date', '2026-07-01', '--candidate-id', 'focused-tests-before-handoff',
    '--action', 'add', '--codex-home', codexHome, '--out-dir', tmp,
  ]))
  const proposalPath = path.join(tmp, '2026-07-01', 'draft', 'instruction-change.proposed.json')
  const diffPath = path.join(tmp, '2026-07-01', 'draft', 'instruction-change.diff')
  const proposal = await readJson(proposalPath)
  assert.equal(await fs.readFile(target, 'utf8'), before)
  assert.equal(await fs.readFile(diffPath, 'utf8'), proposal.exactDiff)
  assert.equal(planOutput.targetPath, target)
  assert.equal(planOutput.instructionProposalPath, proposalPath)
  assert.equal((await readJson(path.join(tmp, 'memory.json'))).instructionChanges.length, 0)

  const applyOutput = JSON.parse(await captureCli(['instruction-apply', '--date', '2026-07-01', '--out-dir', tmp]))
  assert.equal(await fs.readFile(target, 'utf8'), proposal.afterContent)
  let memory = await readJson(path.join(tmp, 'memory.json'))
  assert.equal(memory.instructionChanges.length, 1)
  assert.equal(memory.instructionChanges[0].proposalId, proposal.proposalId)
  assert.equal(applyOutput.reloadRequired, true)

  const reportPath = path.join(tmp, '2026-07-01', 'draft', 'report.json')
  const report = await readJson(reportPath)
  report.reusableInsights.globalInstructionCandidates[0].recommendation = 'Run focused and integration tests before claiming completion.'
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  await run([
    'instruction-plan', '--date', '2026-07-01', '--candidate-id', 'focused-tests-before-handoff',
    '--action', 'update', '--codex-home', codexHome, '--out-dir', tmp,
  ])
  await run(['instruction-apply', '--date', '2026-07-01', '--out-dir', tmp])
  assert.ok((await fs.readFile(target, 'utf8')).includes('Run focused and integration tests'))

  await run([
    'instruction-plan', '--date', '2026-07-01', '--candidate-id', 'focused-tests-before-handoff',
    '--action', 'remove', '--codex-home', codexHome, '--out-dir', tmp,
  ])
  await run(['instruction-apply', '--date', '2026-07-01', '--out-dir', tmp])
  assert.equal(await fs.readFile(target, 'utf8'), before)
  memory = await readJson(path.join(tmp, 'memory.json'))
  assert.deepEqual(memory.instructionChanges.map(item => item.action), ['add', 'update', 'remove'])
  assert.equal(memory.todos.length > 0, true)
  assert.equal(memory.ideas.length > 0, true)
  assert.equal(memory.reports.length, 1)
})

test('ordinary finalize never mutates AGENTS.md and target drift leaves instruction audit unchanged', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-instruction-drift-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const codexHome = path.join(tmp, 'codex-home')
  const target = path.join(codexHome, 'AGENTS.md')
  await fs.mkdir(codexHome, { recursive: true })
  await fs.writeFile(target, 'human bytes\n')
  await run([
    'run', '--date', '2026-07-01', '--codex-home', fixtureCodexHome, '--out-dir', tmp,
    '--timezone', 'Asia/Shanghai', '--codex-bin', successCodex,
  ])
  await run(['finalize', '--date', '2026-07-01', '--out-dir', tmp])
  assert.equal(await fs.readFile(target, 'utf8'), 'human bytes\n')
  await run([
    'instruction-plan', '--date', '2026-07-01', '--candidate-id', 'focused-tests-before-handoff',
    '--action', 'add', '--codex-home', codexHome, '--out-dir', tmp,
  ])
  const auditBefore = (await readJson(path.join(tmp, 'memory.json'))).instructionChanges
  await fs.writeFile(target, 'drifted bytes\n')
  await assert.rejects(
    () => runCli(['instruction-apply', '--date', '2026-07-01', '--out-dir', tmp]),
    /changed after the proposal/,
  )
  assert.equal(await fs.readFile(target, 'utf8'), 'drifted bytes\n')
  assert.deepEqual((await readJson(path.join(tmp, 'memory.json'))).instructionChanges, auditBefore)
})

test('project instruction planning requires the explicit temporary repository and remains proposal-only', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-project-plan-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const repo = path.join(tmp, 'repo')
  const memo = path.join(tmp, 'memo.json')
  await fs.mkdir(path.join(repo, '.git'), { recursive: true })
  await fs.writeFile(path.join(repo, 'AGENTS.md'), 'project human rules\n')
  await fs.writeFile(memo, `${JSON.stringify({ status: 'provided', summary: '请把 smoke test 约定作为项目规则候选。', provenance: 'user_memo' })}\n`)
  await run([
    'run', '--date', '2026-07-01', '--codex-home', fixtureCodexHome, '--out-dir', tmp,
    '--timezone', 'Asia/Shanghai', '--codex-bin', successCodex, '--memo-file', memo,
  ])
  await run([
    'instruction-plan', '--date', '2026-07-01', '--candidate-id', 'memo-project-validation',
    '--action', 'add', '--project-root', repo, '--codex-home', path.join(tmp, 'codex-home'), '--out-dir', tmp,
  ])
  assert.equal(await fs.readFile(path.join(repo, 'AGENTS.md'), 'utf8'), 'project human rules\n')
  const proposal = await readJson(path.join(tmp, '2026-07-01', 'draft', 'instruction-change.proposed.json'))
  assert.equal(proposal.target.path, path.join(repo, 'AGENTS.md'))
  assert.equal(proposal.target.scope, 'project')
})

test('help retains existing commands and exposes memo and instruction artifact commands', async () => {
  const output = await captureCli(['--help'])
  for (const command of ['collect', 'draft', 'run', 'render', 'finalize', 'instruction-plan', 'instruction-apply']) {
    assert.ok(output.includes(`power-work-report ${command}`), `${command} should remain in help`)
  }
  assert.ok(output.includes('--memo-file PATH'))
})

test('finalize applies explicit confirmed todo completion updates', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-done-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  await fs.writeFile(
    path.join(tmp, 'memory.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      todos: [{ id: 'old-alpha', text: '修复日报生成的边界', project: '/workspace/alpha' }],
      ideas: [],
      reports: [],
    })}\n`,
    'utf8',
  )

  await run([
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--timezone',
    'Asia/Shanghai',
    '--codex-bin',
    successCodex,
  ])

  const proposalPath = path.join(tmp, '2026-07-01', 'draft', 'memory-update.proposed.json')
  const proposal = await readJson(proposalPath)
  proposal.todoUpdates = [
    {
      id: 'old-alpha',
      status: 'done',
      completedSourceSessionIds: ['2026-07-01T09-00-00-session-a'],
    },
  ]
  await fs.writeFile(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8')

  await run(['finalize', '--date', '2026-07-01', '--out-dir', tmp])

  const memory = await readJson(path.join(tmp, 'memory.json'))
  const todo = memory.todos.find(item => item.id === 'old-alpha')
  assert.equal(todo.status, 'done')
  assert.equal(todo.completedDate, '2026-07-01')
  assert.equal(todo.completedReportDate, '2026-07-01')
  assert.deepEqual(todo.completedSourceSessionIds, ['2026-07-01T09-00-00-session-a'])
})

test('render refreshes review after oral proposal edits', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-render-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))

  await run([
    'run',
    '--date',
    '2026-07-01',
    '--codex-home',
    fixtureCodexHome,
    '--out-dir',
    tmp,
    '--timezone',
    'Asia/Shanghai',
    '--codex-bin',
    successCodex,
  ])

  const proposalPath = path.join(tmp, '2026-07-01', 'draft', 'memory-update.proposed.json')
  const proposal = await readJson(proposalPath)
  proposal.todos = [
    {
      text: '口头确认后的新增待办',
      project: '/workspace/alpha',
      sourceDate: '2026-07-01',
      sourceSessionIds: ['2026-07-01T09-00-00-session-a'],
      status: 'open',
    },
  ]
  await fs.writeFile(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8')

  await run(['render', '--date', '2026-07-01', '--out-dir', tmp])

  const review = await fs.readFile(path.join(tmp, '2026-07-01', 'draft', 'review.md'), 'utf8')
  const refreshedProposal = await readJson(proposalPath)
  assert.ok(review.includes('口头确认后的新增待办（/workspace/alpha）'))
  assert.ok(!review.includes('验证 memory 去重（/workspace/beta）'))
  assert.deepEqual(
    refreshedProposal.review.newTodos.map(item => item.text),
    ['口头确认后的新增待办'],
  )
})

test('malformed memory json fails draft clearly', async t => {
  const tmp = await fs.mkdtemp(path.join('/tmp', 'pwr-bad-memory-'))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  await fs.writeFile(path.join(tmp, 'memory.json'), '{bad json', 'utf8')

  await assert.rejects(
    () =>
      runCli([
        'run',
        '--date',
        '2026-07-01',
        '--codex-home',
        fixtureCodexHome,
        '--out-dir',
        tmp,
        '--timezone',
        'Asia/Shanghai',
        '--codex-bin',
        successCodex,
      ]),
    /Memory JSON is missing or invalid/,
  )
})

async function run(args) {
  return execFileAsync(process.execPath, [bin, ...args], {
    cwd: root,
    maxBuffer: 10 * 1024 * 1024,
  })
}

async function captureCli(args) {
  const lines = []
  const original = console.log
  console.log = value => lines.push(String(value))
  try {
    await runCli(args)
  } finally {
    console.log = original
  }
  return lines.join('\n')
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

async function writeRollout(codexHome, date, id, lines) {
  const [year, month, day] = date.split('-')
  const dir = path.join(codexHome, 'sessions', year, month, day)
  await fs.mkdir(dir, { recursive: true })
  const body = lines.map(line => (typeof line === 'string' ? line : JSON.stringify(line))).join('\n')
  await fs.writeFile(path.join(dir, `rollout-${id}.jsonl`), `${body}\n`, 'utf8')
}

function event(timestamp, rest) {
  return { timestamp, ...rest }
}

function patchFor(filePath) {
  return `*** Begin Patch\n*** Update File: ${filePath}\n+changed\n*** End Patch`
}

function assertMarkdownOrder(markdown, headings) {
  let cursor = -1
  for (const heading of headings) {
    const index = markdown.indexOf(heading)
    assert.ok(index > cursor, `${heading} should appear after the previous report section`)
    cursor = index
  }
}
