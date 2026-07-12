#!/usr/bin/env node

const report = {
  schemaVersion: 2,
  status: 'draft',
  lang: 'zh-CN',
  date: '2026-07-01',
  generatedAt: '2026-07-01T12:00:00.000Z',
  metadata: {
    date: '2026-07-01',
    status: 'draft',
    projectCount: 2,
    sessionCount: 2,
    title: 'Codex 工作日报 · 2026-07-01',
    lead: '今天推进了 Alpha 和 Beta 两个项目，重点收敛日报结构与 fallback 行为。',
    routeSteps: ['Issue Contract', 'Bounded /goal', 'Verifier Evidence', 'Markdown-first Report'],
  },
  overview: {
    overview: '今天推进了 Alpha 和 Beta 两个项目，完成日报草稿、fallback 报告和 memory 去重验证。',
    readingFocus: '明日优先补齐 finalize 测试，并验证 memory 去重。',
  },
  outcomes: [
    { title: 'Alpha 草稿能力完成', body: '完成 Alpha 项目的日报草稿生成路径。' },
    { title: 'Beta fallback 报告补齐', body: '补充 fallback 报告并覆盖失败路径。' },
  ],
  decisions: [
    { icon: '✅', title: '待办事项保持分层', body: '明日优先与后续待办分开，避免重复。' },
    { icon: '📝', title: 'HTML 保持单文件', body: '不引入前端构建链。' },
  ],
  tasks: {
    tomorrowPriority: [
      { text: '修复日报生成的边界', project: '/workspace/alpha', sourceSessionIds: ['2026-07-01T09-00-00-session-a'] },
      { text: '补充 finalize 测试', project: '/workspace/alpha', sourceSessionIds: ['2026-07-01T09-00-00-session-a'] },
    ],
    backlog: [
      { text: '验证 memory 去重', project: '/workspace/beta', sourceSessionIds: ['2026-07-01T10-00-00-session-b'] },
      { text: '增加 fallback 报告', project: '/workspace/beta', sourceSessionIds: ['2026-07-01T10-00-00-session-b'] },
      { text: '确认 <script>alert(1)</script> 被当作文本', project: '/workspace/beta', sourceSessionIds: ['2026-07-01T10-00-00-session-b'] },
    ],
  },
  projectSections: [
    {
      project: 'alpha',
      path: '/workspace/alpha',
      badge: '草稿生成',
      results: ['完成 Alpha 草稿', '修复日报生成的边界'],
      pending: ['补充 finalize 测试'],
      ideas: ['把确认流程做成 skill'],
      evidence: { sessionIds: ['2026-07-01T09-00-00-session-a'], filesModified: ['alpha.js'] },
    },
    {
      project: 'beta',
      path: '/workspace/beta',
      badge: 'fallback',
      results: ['完成 fallback 报告'],
      pending: ['验证 memory 去重', '增加 fallback 报告', '确认 <script>alert(1)</script> 被当作文本'],
      ideas: ['HTML 可以先保持静态'],
      evidence: { sessionIds: ['2026-07-01T10-00-00-session-b'], filesModified: ['beta.js'] },
    },
  ],
  riskGroups: {
    blocked: [],
    watch: ['fallback 草稿需要人工审阅。'],
    limit: ['当前仍是本地 Codex-only 工具。'],
  },
  ideas: {
    chips: [
      { text: '把确认流程做成 skill', project: '/workspace/alpha', sourceSessionIds: ['2026-07-01T09-00-00-session-a'] },
      { text: 'HTML 可以先保持静态', project: '/workspace/beta', sourceSessionIds: ['2026-07-01T10-00-00-session-b'] },
    ],
  },
  personalReflection: {
    status: 'not_provided',
    summary: '',
    provenance: 'none',
  },
  reusableInsights: {
    skillCandidates: [
      {
        id: 'review-workflow-skill',
        type: 'skill',
        recommendation: 'Package the repeatable report review workflow as a skill.',
        scope: 'local workflow',
        evidenceCount: 2,
        dates: ['2026-07-01'],
        projects: ['/workspace/alpha', '/workspace/beta'],
        evidence: [
          { date: '2026-07-01', project: '/workspace/alpha', sourceType: 'session', sourceRef: '2026-07-01T09-00-00-session-a', summary: 'Alpha used the review workflow.' },
          { date: '2026-07-01', project: '/workspace/beta', sourceType: 'session', sourceRef: '2026-07-01T10-00-00-session-b', summary: 'Beta used the review workflow.' },
        ],
        rationale: 'The workflow repeats across report tasks.',
        expectedBenefit: 'Consistent report review.',
        provenance: 'automatic',
        confirmationStatus: 'unconfirmed',
      },
    ],
    automationCandidates: [
      {
        id: 'report-check-automation',
        type: 'automation',
        recommendation: 'Automate the deterministic report checks.',
        scope: '/workspace/alpha',
        evidenceCount: 2,
        dates: ['2026-07-01'],
        projects: ['/workspace/alpha', '/workspace/beta'],
        evidence: [
          { date: '2026-07-01', project: '/workspace/alpha', sourceType: 'session', sourceRef: '2026-07-01T09-00-00-session-a', summary: 'Alpha ran deterministic checks.' },
          { date: '2026-07-01', project: '/workspace/beta', sourceType: 'session', sourceRef: '2026-07-01T10-00-00-session-b', summary: 'Beta ran deterministic checks.' },
        ],
        rationale: 'The checks are mechanical.',
        expectedBenefit: 'Faster consistent validation.',
        provenance: 'automatic',
        confirmationStatus: 'unconfirmed',
      },
    ],
    globalInstructionCandidates: [
      {
        id: 'focused-tests-before-handoff',
        type: 'global_instruction',
        recommendation: 'Run focused tests before claiming completion.',
        scope: 'global',
        evidenceCount: 2,
        dates: ['2026-07-01'],
        projects: ['/workspace/alpha', '/workspace/beta'],
        evidence: [
          { date: '2026-07-01', project: '/workspace/alpha', sourceType: 'session', sourceRef: '2026-07-01T09-00-00-session-a', summary: 'Alpha required focused validation.' },
          { date: '2026-07-01', project: '/workspace/beta', sourceType: 'session', sourceRef: '2026-07-01T10-00-00-session-b', summary: 'Beta required focused validation.' },
        ],
        rationale: 'The validation rule applies across repositories.',
        expectedBenefit: 'More reliable completion claims.',
        provenance: 'automatic',
        confirmationStatus: 'unconfirmed',
      },
    ],
    projectInstructionCandidates: [
      {
        id: 'memo-project-validation',
        type: 'project_instruction',
        recommendation: 'Run the repository smoke test before handoff.',
        scope: '/workspace/alpha',
        evidenceCount: 1,
        dates: ['2026-07-01'],
        projects: ['/workspace/alpha'],
        evidence: [
          { date: '2026-07-01', project: '/workspace/alpha', sourceType: 'user_memo', sourceRef: 'user-memo:2026-07-01', summary: 'The user nominated repository smoke tests.' },
        ],
        rationale: 'The user explicitly nominated this durable project rule.',
        expectedBenefit: 'Consistent project validation.',
        provenance: 'user_nominated',
        confirmationStatus: 'unconfirmed',
      },
    ],
    warnings: [],
  },
  appendix: {
    sessionIds: ['2026-07-01T09-00-00-session-a', '2026-07-01T10-00-00-session-b'],
    filesModified: ['alpha.js', 'beta.js'],
  },
}

let prompt = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => { prompt += chunk })
process.stdin.on('end', () => {
  console.log(JSON.stringify({
    type: 'item.completed',
    item: {
      type: 'agent_message',
      text: JSON.stringify(report),
    },
  }))
})
