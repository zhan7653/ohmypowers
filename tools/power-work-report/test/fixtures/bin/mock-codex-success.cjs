#!/usr/bin/env node

const report = {
  schemaVersion: 1,
  status: 'draft',
  lang: 'zh-CN',
  date: '2026-07-01',
  title: '2026-07-01 Codex 工作日报',
  overview: '今天推进了 Alpha 和 Beta 两个项目。',
  projects: [
    {
      project: '/workspace/alpha',
      summary: 'Alpha 项目完成日报草稿能力。',
      completed: ['完成 Alpha 草稿'],
      todos: ['修复日报生成的边界', '补充 finalize 测试'],
      ideas: ['把确认流程做成 skill'],
      evidence: { sessionIds: ['2026-07-01T09-00-00-session-a'], filesModified: ['alpha.js'] }
    },
    {
      project: '/workspace/beta',
      summary: 'Beta 项目补充 fallback 报告。',
      completed: ['完成 fallback 报告'],
      todos: ['增加 fallback 报告', '验证 memory 去重'],
      ideas: ['HTML 可以先保持静态'],
      evidence: { sessionIds: ['2026-07-01T10-00-00-session-b'], filesModified: ['beta.js'] }
    }
  ],
  completed: ['完成 Alpha 草稿', '完成 fallback 报告'],
  todos: [
    { text: '修复日报生成的边界', project: '/workspace/alpha', sourceSessionIds: ['2026-07-01T09-00-00-session-a'] },
    { text: '修复日报生成的边界', project: '/workspace/alpha', sourceSessionIds: ['2026-07-01T09-00-00-session-a'] },
    { text: '验证 memory 去重', project: '/workspace/beta', sourceSessionIds: ['2026-07-01T10-00-00-session-b'] }
  ],
  tomorrow: ['补充 finalize 测试', '验证 memory 去重'],
  ideas: [
    { text: '把确认流程做成 skill', project: '/workspace/alpha', sourceSessionIds: ['2026-07-01T09-00-00-session-a'] },
    { text: 'HTML 可以先保持静态', project: '/workspace/beta', sourceSessionIds: ['2026-07-01T10-00-00-session-b'] }
  ],
  risks: [],
  evidence: { sessionCount: 2, sessionIds: ['2026-07-01T09-00-00-session-a', '2026-07-01T10-00-00-session-b'] }
}

console.log(JSON.stringify({
  type: 'item.completed',
  item: {
    type: 'agent_message',
    text: JSON.stringify(report)
  }
}))
