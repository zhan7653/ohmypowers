import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { promises as fs } from 'node:fs'
import { buildContext } from '../../power-work-report/scripts/power-work-report/lib/collector.js'
import { normalizeDraft } from '../../power-work-report/scripts/power-work-report/lib/codex-draft.js'
import {
  normalizeMemoInput,
  normalizeReusableInsights,
} from '../../power-work-report/scripts/power-work-report/lib/insights.js'

const fixtureDir = path.resolve('tests/power-work-report/fixtures/insights')

test('memo normalization is deterministic, bounded, and distinguishes skip from absence', () => {
  assert.deepEqual(normalizeMemoInput(undefined), {
    status: 'not_provided',
    summary: '',
    provenance: 'none',
  })
  assert.deepEqual(normalizeMemoInput('   '), {
    status: 'skipped',
    summary: '',
    provenance: 'none',
  })
  assert.deepEqual(normalizeMemoInput('  keep\n this   concise  '), {
    status: 'provided',
    summary: 'keep this concise',
    provenance: 'user_memo',
  })
  assert.equal(normalizeMemoInput('x'.repeat(5000)).summary.length, 4000)
})

test('historical context includes only ten readable finalized bodies and warns about unusable history', async t => {
  const tmp = await fs.mkdtemp('/tmp/pwr-insights-context-')
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  const reports = []

  for (let day = 1; day <= 12; day += 1) {
    const date = `2026-06-${String(day).padStart(2, '0')}`
    const finalDir = path.join(tmp, date, 'final')
    await fs.mkdir(finalDir, { recursive: true })
    const reportStatus = day === 12 ? 'draft' : 'finalized'
    await fs.writeFile(
      path.join(finalDir, 'report.json'),
      `${JSON.stringify({ status: reportStatus, date, overview: { overview: `Final ${date}` } })}\n`,
      'utf8',
    )
    reports.push({ date, status: 'draft', title: date, finalDir, finalizedAt: `${date}T12:00:00.000Z` })
  }

  reports.push({
    date: '2026-06-13',
    status: 'draft',
    title: 'missing',
    finalDir: path.join(tmp, 'missing', 'final'),
    finalizedAt: '2026-06-13T12:00:00.000Z',
  })
  const fallbackDir = path.join(tmp, '2026-06-14', 'final')
  await fs.mkdir(fallbackDir, { recursive: true })
  await fs.writeFile(path.join(fallbackDir, 'report.json'), '{"status":"codex_failed"}\n', 'utf8')
  reports.push({
    date: '2026-06-14',
    status: 'draft',
    title: 'fallback',
    finalDir: fallbackDir,
    finalizedAt: '2026-06-14T12:00:00.000Z',
  })
  reports.push({ date: '2026-06-15', status: 'draft', title: 'not finalized' })
  const invalidJsonDir = path.join(tmp, '2026-06-16', 'final')
  await fs.mkdir(invalidJsonDir, { recursive: true })
  await fs.writeFile(path.join(invalidJsonDir, 'report.json'), '{invalid json\n', 'utf8')
  reports.push({
    date: '2026-06-16',
    status: 'finalized',
    title: 'invalid json',
    finalDir: invalidJsonDir,
    finalizedAt: '2026-06-16T12:00:00.000Z',
  })
  const invalidStatusDir = path.join(tmp, '2026-06-17', 'final')
  await fs.mkdir(invalidStatusDir, { recursive: true })
  await fs.writeFile(path.join(invalidStatusDir, 'report.json'), '{"status":"pending"}\n', 'utf8')
  reports.push({
    date: '2026-06-17',
    status: 'draft',
    title: 'invalid status json',
    finalDir: invalidStatusDir,
    finalizedAt: '2026-06-17T12:00:00.000Z',
  })
  const unfinalizedDraftDir = path.join(tmp, '2026-06-18', 'draft')
  await fs.mkdir(unfinalizedDraftDir, { recursive: true })
  await fs.writeFile(path.join(unfinalizedDraftDir, 'report.json'), '{"status":"draft"}\n', 'utf8')
  reports.push({
    date: '2026-06-18',
    status: 'draft',
    title: 'unfinalized draft path',
    finalDir: unfinalizedDraftDir,
  })
  const memoryFallbackDir = path.join(tmp, '2026-06-19', 'final')
  await fs.mkdir(memoryFallbackDir, { recursive: true })
  await fs.writeFile(path.join(memoryFallbackDir, 'report.json'), '{"status":"finalized"}\n', 'utf8')
  reports.push({
    date: '2026-06-19',
    status: 'fallback',
    title: 'memory fallback',
    finalDir: memoryFallbackDir,
    finalizedAt: '2026-06-19T12:00:00.000Z',
  })

  const memoryFile = path.join(tmp, 'memory.json')
  await fs.writeFile(memoryFile, `${JSON.stringify({ schemaVersion: 1, todos: [], ideas: [], reports })}\n`, 'utf8')
  const context = await buildContext(memoryFile)

  assert.equal(context.recentReports.length, 10)
  assert.equal(context.recentReports.at(-1).date, '2026-06-19')
  assert.equal(context.recentReports[0].body, undefined)
  assert.equal(context.finalizedReports.length, 10)
  assert.equal(context.finalizedReports[0].date, '2026-06-03')
  assert.equal(context.finalizedReports.at(-1).date, '2026-06-12')
  assert.equal(context.finalizedReports[0].status, 'finalized')
  assert.equal(context.finalizedReports.at(-1).status, 'draft')
  assert.deepEqual(context.finalizedReports[0].body, {
    status: 'finalized',
    date: '2026-06-03',
    overview: { overview: 'Final 2026-06-03' },
  })
  assert.ok(context.finalizedReports.every(item => item.sourceRef.endsWith('/final/report.json')))
  assert.ok(context.warnings.some(item => item.includes('has no finalDir')))
  assert.ok(context.warnings.some(item => item.includes('unreadable or invalid JSON')))
  assert.ok(context.warnings.some(item => item.includes('invalid finalized status "codex_failed"')))
  assert.ok(context.warnings.some(item => item.includes('invalid memory status "fallback"')))
  assert.ok(context.warnings.some(item => item.includes('invalid finalized status "pending"')))
  assert.ok(context.warnings.some(item => item.includes('points to a draft directory')))
})

test('candidate guards derive evidence fields and enforce repetition, scope, and nomination rules', async () => {
  const fixture = JSON.parse(await fs.readFile(path.join(fixtureDir, 'candidates.json'), 'utf8'))
  const personalReflection = normalizeMemoInput('Nominate the smoke-test rule for this project.')
  const rawSummary = summary({ personalReflection })
  const insights = normalizeReusableInsights(fixture, { rawSummary, personalReflection })

  assert.deepEqual(insights.skillCandidates.map(item => item.id), ['repeated-skill'])
  assert.equal(insights.skillCandidates[0].evidenceCount, 2)
  assert.deepEqual(insights.skillCandidates[0].dates, ['2026-07-11', '2026-07-12'])
  assert.deepEqual(insights.skillCandidates[0].projects, ['/workspace/alpha'])
  assert.deepEqual(insights.automationCandidates.map(item => item.id), ['repeated-automation'])
  assert.deepEqual(insights.globalInstructionCandidates.map(item => item.id), ['cross-project-global'])
  assert.equal(insights.globalInstructionCandidates[0].confirmationStatus, 'unconfirmed')
  assert.equal(insights.projectInstructionCandidates.length, 1)
  assert.equal(insights.projectInstructionCandidates[0].provenance, 'user_nominated')
  assert.equal(insights.projectInstructionCandidates[0].confirmationStatus, 'unconfirmed')
})

test('draft normalization adds the frozen report fields and keeps missing-history warnings', async () => {
  const fixture = JSON.parse(await fs.readFile(path.join(fixtureDir, 'candidates.json'), 'utf8'))
  const rawSummary = summary()
  const report = normalizeDraft(
    { schemaVersion: 2, status: 'draft', reusableInsights: fixture },
    rawSummary,
    'zh-CN',
    { memo: '  A private reflection to review.  ' },
  )

  assert.deepEqual(report.personalReflection, {
    status: 'provided',
    summary: 'A private reflection to review.',
    provenance: 'user_memo',
  })
  assert.ok(report.reusableInsights.warnings.includes('Missing finalized report 2026-07-10.'))
  assert.equal(report.reusableInsights.skillCandidates.length, 1)
  assert.equal(report.reusableInsights.projectInstructionCandidates.length, 1)
})

test('codex_failed normalization never retains fallback candidates as evidence', async () => {
  const fixture = JSON.parse(await fs.readFile(path.join(fixtureDir, 'candidates.json'), 'utf8'))
  const rawSummary = summary()
  const report = normalizeDraft(
    { schemaVersion: 2, status: 'codex_failed', reusableInsights: fixture },
    rawSummary,
  )

  assert.deepEqual(report.reusableInsights.skillCandidates, [])
  assert.deepEqual(report.reusableInsights.automationCandidates, [])
  assert.deepEqual(report.reusableInsights.globalInstructionCandidates, [])
  assert.deepEqual(report.reusableInsights.projectInstructionCandidates, [])
  assert.ok(report.reusableInsights.warnings.some(item => item.includes('fallback output')))
})

test('report schema requires the additive reflection and insight contract', async () => {
  const schema = JSON.parse(
    await fs.readFile('power-work-report/scripts/power-work-report/schemas/report.schema.json', 'utf8'),
  )
  assert.ok(schema.required.includes('personalReflection'))
  assert.ok(schema.required.includes('reusableInsights'))
  assert.deepEqual(schema.$defs.candidate.required, [
    'id',
    'type',
    'recommendation',
    'scope',
    'evidenceCount',
    'dates',
    'projects',
    'evidence',
    'rationale',
    'expectedBenefit',
    'provenance',
    'confirmationStatus',
  ])
})

function summary() {
  return {
    date: '2026-07-12',
    projects: [],
    sessions: [
      {
        id: 'today-session',
        filePath: '/codex/sessions/today-session.jsonl',
        malformedLines: 0,
      },
    ],
    sessionCount: 1,
    skippedEvents: {
      malformedLines: 0,
      missingTimestamp: 0,
      invalidTimestamp: 0,
      outsideTargetDate: 0,
    },
    context: {
      openTodos: [],
      recentReports: [],
      finalizedReports: [
        {
          date: '2026-07-11',
          sourceRef: '/reports/2026-07-11/final/report.json',
          body: { status: 'finalized', date: '2026-07-11' },
        },
      ],
      warnings: ['Missing finalized report 2026-07-10.'],
    },
  }
}
