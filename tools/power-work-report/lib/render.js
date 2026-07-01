export function buildFallbackDraft(rawSummary, options = {}) {
  const lang = options.lang || 'zh-CN'
  const projects = rawSummary.projects.map(project => ({
    project: project.project,
    summary: summarizeProject(rawSummary.sessions, project),
    completed: [],
    todos: project.todos.map(item => item.text),
    ideas: project.ideas.map(item => item.text),
    evidence: {
      sessionIds: project.sessionIds,
      filesModified: project.filesModified,
    },
  }))

  return {
    schemaVersion: 1,
    status: options.status || 'draft',
    lang,
    date: rawSummary.date,
    generatedAt: new Date().toISOString(),
    title: lang === 'zh-CN' ? `${rawSummary.date} Codex 工作日报` : `${rawSummary.date} Codex Work Report`,
    overview:
      lang === 'zh-CN'
        ? `共读取 ${rawSummary.sessionCount} 个 Codex 会话，覆盖 ${rawSummary.projects.length} 个项目。`
        : `Read ${rawSummary.sessionCount} Codex sessions across ${rawSummary.projects.length} projects.`,
    projects,
    completed: [],
    todos: flattenMemoryItems(projects, 'todos'),
    tomorrow: flattenMemoryItems(projects, 'todos').slice(0, 5),
    ideas: flattenMemoryItems(projects, 'ideas'),
    risks: options.status === 'codex_failed' ? ['Codex draft generation failed; this is a deterministic fallback draft.'] : [],
    evidence: {
      sessionCount: rawSummary.sessionCount,
      sessionIds: rawSummary.sessions.map(session => session.id),
    },
    rawSummary,
  }
}

export function buildMemoryProposal(report) {
  const todos = itemObjects(report.todos || [], report, 'todo')
  const ideas = itemObjects(report.ideas || [], report, 'idea')
  return {
    schemaVersion: 1,
    date: report.date,
    status: report.status,
    todos,
    ideas,
    report: {
      date: report.date,
      title: report.title,
      status: report.status,
      generatedAt: report.generatedAt,
      sessionIds: report.evidence?.sessionIds || [],
    },
  }
}

export function renderMarkdown(report) {
  const lines = []
  lines.push(`# ${report.title}`)
  lines.push('')
  lines.push(`- 日期: ${report.date}`)
  lines.push(`- 状态: ${report.status}`)
  lines.push(`- 会话数: ${report.evidence?.sessionCount ?? report.evidence?.sessionIds?.length ?? 0}`)
  lines.push('')
  lines.push('## 今日概览')
  lines.push('')
  lines.push(report.overview || '无概览。')
  lines.push('')
  lines.push('## 按项目分组')
  lines.push('')
  for (const project of report.projects || []) {
    lines.push(`### ${project.project}`)
    lines.push('')
    lines.push(project.summary || '无摘要。')
    appendList(lines, '完成事项', project.completed)
    appendList(lines, '待办', project.todos)
    appendList(lines, '想法/灵感', project.ideas)
    appendList(lines, '关键文件', project.evidence?.filesModified)
    appendList(lines, '会话', project.evidence?.sessionIds)
  }
  appendList(lines, '完成事项', report.completed)
  appendList(lines, '未完成 Todos', report.todos)
  appendList(lines, '明日建议任务', report.tomorrow)
  appendList(lines, '想法/灵感', report.ideas)
  appendList(lines, '风险/阻塞', report.risks)
  appendList(lines, '原始会话索引', report.evidence?.sessionIds)
  return `${lines.join('\n')}\n`
}

export function renderHtml(report) {
  const markdown = renderMarkdown(report)
  const body = markdown
    .split('\n')
    .map(line => {
      if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`
      if (line.startsWith('### ')) return `<h3>${escapeHtml(line.slice(4))}</h3>`
      if (line.startsWith('- ')) return `<li>${escapeHtml(line.slice(2))}</li>`
      if (!line.trim()) return ''
      return `<p>${escapeHtml(line)}</p>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="${escapeHtml(report.lang || 'zh-CN')}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(report.title)}</title>
    <style>
      body { margin: 0; font: 16px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; background: #f8fafc; }
      main { max-width: 920px; margin: 0 auto; padding: 32px 20px 64px; background: #fff; min-height: 100vh; }
      h1, h2, h3 { line-height: 1.25; }
      h1 { font-size: 32px; }
      h2 { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      li { margin: 4px 0; }
    </style>
  </head>
  <body><main>
${body}
  </main></body>
</html>
`
}

function appendList(lines, title, items = []) {
  if (!items.length) return
  lines.push('')
  lines.push(`## ${title}`)
  lines.push('')
  for (const item of items) {
    lines.push(`- ${formatItem(item)}`)
  }
  lines.push('')
}

function formatItem(item) {
  if (typeof item === 'string') return item
  if (item?.text) return item.text
  return String(item)
}

function summarizeProject(sessions, project) {
  const titles = sessions
    .filter(session => project.sessionIds.includes(session.id))
    .map(session => session.title)
    .filter(Boolean)
  if (!titles.length) return '无摘要。'
  return titles.join('；')
}

function flattenMemoryItems(projects, key) {
  return projects.flatMap(project =>
    (project[key] || []).map(text => ({
      text,
      project: project.project,
      sourceSessionIds: project.evidence?.sessionIds || [],
    })),
  )
}

function itemObjects(items, report, type) {
  return items.map(item => ({
    text: typeof item === 'string' ? item : item.text,
    project: typeof item === 'string' ? '' : item.project || '',
    sourceDate: report.date,
    sourceSessionIds: typeof item === 'string' ? report.evidence?.sessionIds || [] : item.sourceSessionIds || [],
    status: type === 'todo' ? 'open' : 'active',
  }))
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
