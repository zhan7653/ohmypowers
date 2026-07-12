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
    routeSteps: ['Issue Contract', 'Direct Issue Execution', 'Verifier Evidence', 'Markdown-first Report'],
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
  appendix: {
    sessionIds: ['2026-07-01T09-00-00-session-a', '2026-07-01T10-00-00-session-b'],
    filesModified: ['alpha.js', 'beta.js'],
  },
}

console.log(JSON.stringify({
  type: 'item.completed',
  item: {
    type: 'agent_message',
    text: JSON.stringify(report),
  },
}))
