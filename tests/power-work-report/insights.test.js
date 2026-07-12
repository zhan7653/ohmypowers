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
  const globalCandidate = insights.globalInstructionCandidates[0]
  assert.equal(globalCandidate.confirmationStatus, 'unconfirmed')
  assert.equal(globalCandidate.type, 'global_instruction')
  assert.equal(globalCandidate.scope, 'global')
  assert.equal(globalCandidate.conflict, true)
  assert.equal(globalCandidate.nestedScope, true)
  assert.equal(globalCandidate.scopePath, '/workspace/beta/packages/api')
  assert.deepEqual(globalCandidate.safetyReasons, [
    'Nested package scope may be more accurate.',
    'Possible conflict with an existing validation rule.',
  ])
  assert.deepEqual(insights.projectInstructionCandidates.map(item => item.id), [
    'memo-nomination',
    'single-project-global',
  ])
  const reclassified = insights.projectInstructionCandidates.find(item => item.id === 'single-project-global')
  assert.equal(reclassified.type, 'project_instruction')
  assert.equal(reclassified.scope, '/workspace/alpha')
  assert.equal(reclassified.conflict, false)
  assert.equal(reclassified.nestedScope, false)
  assert.equal(reclassified.scopePath, '')
  assert.deepEqual(reclassified.safetyReasons, ['inspect existing rules'])
  const nominated = insights.projectInstructionCandidates.find(item => item.id === 'memo-nomination')
  assert.equal(nominated.provenance, 'user_nominated')
  assert.equal(nominated.confirmationStatus, 'unconfirmed')
  assert.equal(insights.skillCandidates[0].conflict, false)
  assert.deepEqual(insights.skillCandidates[0].safetyReasons, [])
})

test('candidate safety annotations are bounded without changing instruction classification', () => {
  const rawSummary = summary()
  const candidate = automaticCandidate('bounded-safety', 'project_instruction', [
    evidence('report', '/reports/2026-07-11/final/report.json', '2026-07-11', '/workspace/alpha'),
    evidence('session', 'today-session', '2026-07-12', '/workspace/alpha'),
  ])
  candidate.conflict = true
  candidate.nestedScope = true
  candidate.scopePath = '/workspace/alpha/'.padEnd(1500, 'x')
  candidate.safetyReasons = Array.from({ length: 25 }, (_, index) => `reason ${index} ${'x'.repeat(500)}`)
  const insights = normalizeReusableInsights({
    skillCandidates: [],
    automationCandidates: [],
    globalInstructionCandidates: [],
    projectInstructionCandidates: [candidate],
    warnings: [],
  }, { rawSummary })
  const normalized = insights.projectInstructionCandidates[0]

  assert.equal(normalized.type, 'project_instruction')
  assert.equal(normalized.scope, '/workspace/alpha')
  assert.equal(normalized.conflict, true)
  assert.equal(normalized.nestedScope, true)
  assert.equal(normalized.scopePath.length, 1000)
  assert.equal(normalized.safetyReasons.length, 20)
  assert.ok(normalized.safetyReasons.every(reason => reason.length <= 400))
})

test('forbidden English and Chinese instruction content is removed before display', async () => {
  const fixture = JSON.parse(
    await fs.readFile(path.join(fixtureDir, 'forbidden-instructions.json'), 'utf8'),
  )
  const input = {
    skillCandidates: [],
    automationCandidates: [],
    globalInstructionCandidates: [],
    projectInstructionCandidates: [],
    warnings: [],
  }
  for (const item of [...fixture.forbiddenInstructions, ...fixture.nonInstructionControls]) {
    input[groupForFixtureType(item.type)].push(candidateForFixture(item))
  }

  const insights = normalizeReusableInsights(input, { rawSummary: summary() })
  assert.deepEqual(insights.globalInstructionCandidates, [])
  assert.deepEqual(insights.projectInstructionCandidates, [])
  assert.deepEqual(insights.skillCandidates.map(item => item.id), ['skill-control'])
  assert.deepEqual(insights.automationCandidates.map(item => item.id), ['automation-control'])
})

test('fabricated evidence is rejected when no authoritative sources exist', () => {
  const rawSummary = summary()
  rawSummary.sessions = []
  rawSummary.projects = []
  rawSummary.context.finalizedReports = []
  const insights = normalizeReusableInsights({
    skillCandidates: [automaticCandidate('fake-session', 'skill', [
      evidence('session', 'invented-session', '2026-07-12', '/workspace/fake'),
      evidence('session', 'another-invented-session', '2026-07-12', '/workspace/fake'),
    ])],
    automationCandidates: [],
    globalInstructionCandidates: [automaticCandidate('fake-report', 'global_instruction', [
      evidence('report', '/invented/final/report.json', '2026-07-11', '/workspace/alpha'),
      evidence('report', '/another/final/report.json', '2026-07-10', '/workspace/beta'),
    ])],
    projectInstructionCandidates: [{
      ...automaticCandidate('fake-memo', 'project_instruction', [
        evidence('user_memo', 'user-memo:2026-07-12', '2026-07-12', '/workspace/fake'),
      ]),
      provenance: 'user_nominated',
    }],
    warnings: [],
  }, { rawSummary })

  assert.deepEqual(insights.skillCandidates, [])
  assert.deepEqual(insights.globalInstructionCandidates, [])
  assert.deepEqual(insights.projectInstructionCandidates, [])
})

test('session aliases and invented metadata cannot create repeated or cross-project evidence', () => {
  const rawSummary = summary()
  rawSummary.sessions = [rawSummary.sessions[0]]
  rawSummary.projects = [{ project: '/workspace/alpha' }]
  rawSummary.context.finalizedReports = []
  const repeatedAlias = automaticCandidate('alias-global', 'global_instruction', [
    evidence('session', 'today-session', '2026-07-12', '/workspace/alpha'),
    evidence('session', '/codex/sessions/today-session.jsonl', '2026-07-12', '/workspace/alpha'),
    evidence('session', 'today-session', '2099-01-01', '/workspace/beta'),
  ])
  const insights = normalizeReusableInsights({
    skillCandidates: [],
    automationCandidates: [],
    globalInstructionCandidates: [repeatedAlias],
    projectInstructionCandidates: [],
    warnings: [],
  }, { rawSummary })

  assert.deepEqual(insights.globalInstructionCandidates, [])
  assert.deepEqual(insights.projectInstructionCandidates, [])
})

test('report evidence is canonicalized from its body and mismatched metadata is rejected', () => {
  const rawSummary = summary()
  rawSummary.sessions = [rawSummary.sessions[0]]
  rawSummary.projects = [{ project: '/workspace/alpha' }]
  const valid = automaticCandidate('canonical-report', 'skill', [
    evidence('report', '/reports/2026-07-11/final/report.json', '', ''),
    evidence('session', 'today-session', '2026-07-12', '/workspace/alpha'),
  ])
  const mismatched = automaticCandidate('mismatched-report', 'skill', [
    evidence('report', '/reports/2026-07-11/final/report.json', '2099-01-01', '/workspace/beta'),
    evidence('session', 'today-session', '2026-07-12', '/workspace/alpha'),
  ])
  const insights = normalizeReusableInsights({
    skillCandidates: [valid, mismatched],
    automationCandidates: [],
    globalInstructionCandidates: [],
    projectInstructionCandidates: [],
    warnings: [],
  }, { rawSummary })

  assert.deepEqual(insights.skillCandidates.map(item => item.id), ['canonical-report'])
  assert.deepEqual(insights.skillCandidates[0].evidence[0], {
    date: '2026-07-11',
    project: '/workspace/alpha',
    sourceType: 'report',
    sourceRef: '/reports/2026-07-11/final/report.json',
    summary: 'Evidence summary.',
  })
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
  assert.equal(report.reusableInsights.projectInstructionCandidates.length, 2)
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
  assert.equal(schema.$defs.candidate.properties.conflict.type, 'boolean')
  assert.equal(schema.$defs.candidate.properties.nestedScope.type, 'boolean')
  assert.equal(schema.$defs.candidate.properties.scopePath.type, 'string')
  assert.equal(schema.$defs.candidate.properties.safetyReasons.$ref, '#/$defs/stringItems')
})

function summary() {
  return {
    date: '2026-07-12',
    projects: [
      {
        project: '/workspace/alpha',
        sessionIds: ['today-session'],
        sessionCount: 1,
        todos: [],
        ideas: [],
        filesModified: [],
      },
      {
        project: '/workspace/beta',
        sessionIds: ['beta-session'],
        sessionCount: 1,
        todos: [],
        ideas: [],
        filesModified: [],
      },
    ],
    sessions: [
      {
        id: 'today-session',
        filePath: '/codex/sessions/today-session.jsonl',
        cwd: '/workspace/alpha',
        malformedLines: 0,
      },
      {
        id: 'beta-session',
        filePath: '/codex/sessions/beta-session.jsonl',
        cwd: '/workspace/beta',
        malformedLines: 0,
      },
    ],
    sessionCount: 2,
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
          body: {
            status: 'finalized',
            date: '2026-07-11',
            projectSections: [{ project: 'alpha', path: '/workspace/alpha' }],
          },
        },
      ],
      warnings: ['Missing finalized report 2026-07-10.'],
    },
  }
}

function candidateForFixture(item) {
  const global = item.type === 'global_instruction'
  return {
    ...item,
    scope: global ? 'global' : '/workspace/alpha',
    evidence: [
      {
        date: '2026-07-11',
        project: '/workspace/alpha',
        sourceType: 'report',
        sourceRef: '/reports/2026-07-11/final/report.json',
        summary: 'Historical evidence.',
      },
      {
        date: '2026-07-12',
        project: global ? '/workspace/beta' : '/workspace/alpha',
        sourceType: 'session',
        sourceRef: global ? 'beta-session' : 'today-session',
        summary: 'Current evidence.',
      },
    ],
    rationale: 'Fixture rationale.',
    expectedBenefit: 'Fixture benefit.',
    provenance: 'automatic',
    confirmationStatus: 'unconfirmed',
  }
}

function groupForFixtureType(type) {
  return {
    skill: 'skillCandidates',
    automation: 'automationCandidates',
    global_instruction: 'globalInstructionCandidates',
    project_instruction: 'projectInstructionCandidates',
  }[type]
}

function automaticCandidate(id, type, candidateEvidence) {
  return {
    id,
    type,
    recommendation: type.includes('instruction')
      ? 'Always run authoritative validation before handoff.'
      : 'Package the authoritative validation workflow.',
    scope: type === 'global_instruction' ? 'global' : '/workspace/alpha',
    evidence: candidateEvidence,
    rationale: 'Repeated authoritative evidence.',
    expectedBenefit: 'Reliable future work.',
    provenance: 'automatic',
    confirmationStatus: 'unconfirmed',
  }
}

function evidence(sourceType, sourceRef, date, project) {
  return { sourceType, sourceRef, date, project, summary: 'Evidence summary.' }
}
