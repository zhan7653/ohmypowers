export function buildFallbackDraft(rawSummary, options = {}) {
  const lang = options.lang || 'zh-CN'
  const projects = rawSummary.projects.map(project => ({
    project: project.project,
    summary: summarizeProject(rawSummary.sessions, project),
    completed: [],
    todos: project.todos.map(item => ({
      text: item.text,
      project: project.project,
      sourceSessionIds: item.sourceSessionIds || project.sessionIds,
    })),
    ideas: project.ideas.map(item => ({
      text: item.text,
      project: project.project,
      sourceSessionIds: item.sourceSessionIds || project.sessionIds,
    })),
    evidence: {
      sessionIds: project.sessionIds,
      filesModified: project.filesModified,
    },
  }))

  const report = {
    schemaVersion: 1,
    status: options.status || 'draft',
    lang,
    date: rawSummary.date,
    generatedAt: new Date().toISOString(),
    title: lang === 'zh-CN' ? `Codex 工作日报 · ${rawSummary.date}` : `Codex Work Report · ${rawSummary.date}`,
    overview:
      lang === 'zh-CN'
        ? `共读取 ${rawSummary.sessionCount} 个 Codex 会话，覆盖 ${rawSummary.projects.length} 个项目。`
        : `Read ${rawSummary.sessionCount} Codex sessions across ${rawSummary.projects.length} projects.`,
    dailyFocus: [],
    projects,
    completed: [],
    todos: flattenProjectItems(projects, 'todos'),
    tomorrow: flattenProjectItems(projects, 'todos').slice(0, 5),
    ideas: flattenProjectItems(projects, 'ideas'),
    risks: options.status === 'codex_failed' ? ['Codex draft generation failed; this is a deterministic fallback draft.'] : [],
    evidence: {
      sessionCount: rawSummary.sessionCount,
      sessionIds: rawSummary.sessions.map(session => session.id),
    },
    rawSummary,
  }

  return normalizeReportStructure(report, options.memory)
}

export function normalizeReportStructure(report, memory = {}) {
  const projects = Array.isArray(report.projects) ? report.projects : []
  const memoryCarryover = normalizeTaskItems(openMemoryTodos(memory))
  const returnedCarryover = normalizeTaskItems(report.todoReview?.carryover)
  const carryoverCandidates = dedupeTasks([...memoryCarryover, ...returnedCarryover])
  const maybeCompleted = dedupeTasks([
    ...normalizeTaskItems(report.todoReview?.maybeCompleted),
    ...inferMaybeCompleted(carryoverCandidates, report),
  ])
  const maybeKeys = new Set(maybeCompleted.map(itemKey))
  const carryover = carryoverCandidates.filter(item => !maybeKeys.has(itemKey(item)))
  const newCandidates = report.todoReview?.new?.length
    ? normalizeTaskItems(report.todoReview.new)
    : normalizeTaskItems(report.todos?.length ? report.todos : flattenProjectItems(projects, 'todos'))
  const carryoverKeys = new Set([...carryover, ...maybeCompleted].map(itemKey))
  const newTodos = dedupeTasks(newCandidates).filter(item => !carryoverKeys.has(itemKey(item)))
  const projectSections = buildProjectSections(projects.length ? projects : report.projectSections || [], {
    carryover,
    newTodos,
    maybeCompleted,
  })

  return {
    ...report,
    title: normalizeTitle(report),
    dailyFocus: normalizeTextItems(report.dailyFocus),
    projects,
    projectSections,
    completed: normalizeTextItems(report.completed),
    todos: newTodos,
    tomorrow: normalizeTextItems(report.tomorrow),
    ideas: normalizeTaskItems(report.ideas),
    risks: normalizeTextItems(report.risks),
    todoReview: {
      carryover,
      new: newTodos,
      maybeCompleted,
    },
  }
}

export function buildMemoryProposal(report) {
  const normalized = normalizeReportStructure(report)
  const todos = itemObjects(normalized.todoReview?.new?.length ? normalized.todoReview.new : normalized.todos || [], report, 'todo')
  const ideas = itemObjects(normalized.ideas || [], report, 'idea')
  return {
    schemaVersion: 1,
    date: report.date,
    status: report.status,
    todos,
    ideas,
    report: {
      date: report.date,
      title: normalized.title,
      status: report.status,
      generatedAt: report.generatedAt,
      sessionIds: report.evidence?.sessionIds || [],
    },
  }
}

export function renderMarkdown(report) {
  const normalized = normalizeReportStructure(report)
  const lines = []
  const sessionCount = normalized.evidence?.sessionCount ?? normalized.evidence?.sessionIds?.length ?? 0
  const projects = normalized.projectSections || []

  lines.push(`# ${normalized.title}`)
  lines.push('')
  lines.push(`- 日期: ${normalized.date}`)
  lines.push(`- 状态: ${normalized.status}`)
  lines.push(`- 项目数: ${projects.length}`)
  lines.push(`- 会话数: ${sessionCount}`)
  lines.push('')
  lines.push('## 今日概览')
  lines.push('')
  lines.push(displayText(normalized.overview || '无概览。'))
  appendList(lines, '今日重点', normalized.dailyFocus)
  appendTodoReview(lines, normalized.todoReview)
  appendList(lines, '明日建议任务', normalized.tomorrow)
  lines.push('')
  lines.push('## 按项目分组')
  lines.push('')
  for (const project of projects) {
    lines.push(`### ${project.project}`)
    lines.push('')
    lines.push(displayText(project.summary || '无摘要。'))
    appendList(lines, '完成事项', project.completed, 4)
    appendTaskList(lines, '待办事项', [...project.todoReview.carryover, ...project.todoReview.new], 4)
    appendTaskList(lines, '可能已完成，需确认', project.todoReview.maybeCompleted, 4, true)
    appendTaskList(lines, '想法/灵感', project.ideas, 4)
    appendEvidence(lines, project.evidence)
  }
  appendList(lines, '风险/阻塞', normalized.risks)
  appendList(lines, '原始会话索引', normalized.evidence?.sessionIds)
  return `${lines.join('\n')}\n`
}

export function renderHtml(report) {
  const normalized = normalizeReportStructure(report)
  const projects = normalized.projectSections || []
  const sessionCount = normalized.evidence?.sessionCount ?? normalized.evidence?.sessionIds?.length ?? 0
  const taskCount = normalized.todoReview.carryover.length + normalized.todoReview.new.length

  return `<!doctype html>
<html lang="${escapeHtml(normalized.lang || 'zh-CN')}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(normalized.title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --paper: #ffffff;
        --ink: #172033;
        --muted: #667085;
        --line: #d9e0ea;
        --accent: #1f7a8c;
        --accent-soft: #e5f4f7;
        --task: #8a5a00;
        --task-soft: #fff4d8;
        --done: #287a4b;
        --done-soft: #e7f5ed;
        --risk: #a43f48;
        --risk-soft: #fdecee;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font: 15px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--ink);
        background: var(--bg);
      }
      a { color: inherit; }
      .report-shell {
        max-width: 1120px;
        margin: 0 auto;
        padding: 32px 20px 56px;
      }
      .report-header {
        display: grid;
        gap: 20px;
        padding: 28px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
      }
      .eyebrow {
        margin: 0 0 6px;
        color: var(--accent);
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0;
      }
      h1, h2, h3, h4, p { overflow-wrap: anywhere; }
      h1 {
        margin: 0;
        font-size: 32px;
        line-height: 1.18;
        letter-spacing: 0;
      }
      h2 {
        margin: 0 0 14px;
        font-size: 22px;
        line-height: 1.25;
        letter-spacing: 0;
      }
      h3 {
        margin: 0;
        font-size: 18px;
        line-height: 1.3;
        letter-spacing: 0;
      }
      h4 {
        margin: 0 0 8px;
        font-size: 14px;
        line-height: 1.3;
        letter-spacing: 0;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .meta li, .pill {
        min-height: 28px;
        padding: 3px 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--muted);
        background: #fbfcfe;
      }
      .toc {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .toc a {
        min-height: 32px;
        padding: 5px 11px;
        border-radius: 8px;
        text-decoration: none;
        background: var(--accent-soft);
        color: #155766;
        font-weight: 650;
      }
      .section {
        margin-top: 18px;
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 18px;
      }
      .metric {
        min-height: 78px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fbfcfe;
      }
      .metric strong {
        display: block;
        font-size: 26px;
        line-height: 1;
      }
      .metric span {
        color: var(--muted);
        font-size: 13px;
      }
      .task-section {
        border-color: #eed59a;
        background: #fffdf8;
      }
      .task-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .task-panel {
        min-height: 120px;
        padding: 16px;
        border: 1px solid #ebd9ad;
        border-radius: 8px;
        background: var(--paper);
      }
      .task-panel h3 {
        margin-bottom: 10px;
        color: var(--task);
      }
      ul {
        margin: 0;
        padding-left: 19px;
      }
      li + li { margin-top: 6px; }
      .item-meta {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 12px;
      }
      .empty {
        margin: 0;
        color: var(--muted);
      }
      .project-list {
        display: grid;
        gap: 14px;
      }
      .project-panel {
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fbfcfe;
      }
      .project-panel > p {
        margin: 8px 0 14px;
        color: #344054;
      }
      .project-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .detail-box {
        padding: 14px;
        border-radius: 8px;
        background: var(--paper);
        border: 1px solid var(--line);
      }
      .detail-box.done { border-color: #b8dfc8; background: var(--done-soft); }
      .detail-box.tasks { border-color: #ebd9ad; background: var(--task-soft); }
      .detail-box.risks { border-color: #f3b9bf; background: var(--risk-soft); }
      .evidence {
        grid-column: 1 / -1;
      }
      .evidence code {
        display: inline-block;
        max-width: 100%;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      @media (max-width: 820px) {
        .report-shell { padding: 18px 12px 36px; }
        .report-header, .section { padding: 18px; }
        h1 { font-size: 26px; }
        .metrics, .task-grid, .project-grid { grid-template-columns: 1fr; }
      }
      @media print {
        body { background: #fff; }
        .report-shell { max-width: none; padding: 0; }
        .toc { display: none; }
        .report-header, .section, .project-panel, .detail-box {
          break-inside: avoid;
          box-shadow: none;
          background: #fff;
        }
      }
    </style>
  </head>
  <body>
    <main class="report-shell">
      <header class="report-header">
        <div>
          <p class="eyebrow">Codex Daily Report</p>
          <h1>${escapeHtml(normalized.title)}</h1>
        </div>
        <ul class="meta">
          <li>日期: ${escapeHtml(normalized.date)}</li>
          <li>状态: ${escapeHtml(normalized.status)}</li>
          <li>项目: ${projects.length}</li>
          <li>会话: ${sessionCount}</li>
        </ul>
        <nav class="toc" aria-label="报告目录">
          <a href="#summary">今日概览</a>
          <a href="#tasks">待办事项</a>
          <a href="#tomorrow">明日建议</a>
          <a href="#projects">按项目分组</a>
          <a href="#risks">风险/阻塞</a>
        </nav>
      </header>

      <section class="section" id="summary">
        <h2>今日概览</h2>
        <p>${escapeHtml(displayText(normalized.overview || '无概览。'))}</p>
        ${renderHtmlList(normalized.dailyFocus, '今日重点')}
        <div class="metrics">
          ${renderMetric(projects.length, '项目')}
          ${renderMetric(sessionCount, 'Codex 会话')}
          ${renderMetric(taskCount, '待办事项')}
          ${renderMetric(normalized.ideas.length, '想法/灵感')}
        </div>
      </section>

      <section class="section task-section" id="tasks">
        <h2>待办事项</h2>
        <div class="task-grid">
          ${renderTaskPanel('继承待办事项', normalized.todoReview.carryover, '没有继承待办事项。')}
          ${renderTaskPanel('新增待办事项', normalized.todoReview.new, '没有新增待办事项。')}
          ${renderTaskPanel('可能已完成，需确认', normalized.todoReview.maybeCompleted, '没有需要确认关闭的待办事项。')}
        </div>
      </section>

      <section class="section" id="tomorrow">
        <h2>明日建议任务</h2>
        ${renderHtmlList(normalized.tomorrow, '明日建议任务', '暂无明日建议任务。')}
      </section>

      <section class="section" id="projects">
        <h2>按项目分组</h2>
        <div class="project-list">
          ${projects.map((project, index) => renderProject(project, index)).join('\n')}
        </div>
      </section>

      <section class="section" id="risks">
        <h2>风险/阻塞</h2>
        ${renderHtmlList(normalized.risks, '风险/阻塞', '暂无风险或阻塞。')}
      </section>
    </main>
  </body>
</html>
`
}

function appendTodoReview(lines, todoReview) {
  lines.push('')
  lines.push('## 待办事项')
  appendTaskList(lines, '继承待办事项', todoReview.carryover, 3)
  appendTaskList(lines, '新增待办事项', todoReview.new, 3)
  appendTaskList(lines, '可能已完成，需确认', todoReview.maybeCompleted, 3, true)
  lines.push('')
}

function appendEvidence(lines, evidence = {}) {
  const items = []
  if (evidence.sessionIds?.length) items.push(`会话: ${evidence.sessionIds.join(', ')}`)
  if (evidence.filesModified?.length) items.push(`关键文件: ${evidence.filesModified.join(', ')}`)
  appendList(lines, '证据', items, 4)
}

function appendList(lines, title, items = [], level = 2) {
  const normalized = normalizeTextItems(items)
  if (!normalized.length) return
  lines.push('')
  lines.push(`${'#'.repeat(level)} ${title}`)
  lines.push('')
  for (const item of normalized) {
    lines.push(`- ${item}`)
  }
  lines.push('')
}

function appendTaskList(lines, title, items = [], level = 3, includeReason = false) {
  const normalized = normalizeTaskItems(items)
  if (!normalized.length) return
  lines.push('')
  lines.push(`${'#'.repeat(level)} ${title}`)
  lines.push('')
  for (const item of normalized) {
    const meta = [item.project, includeReason ? item.reason : '', item.sourceDates?.length ? `来源日期: ${item.sourceDates.join(', ')}` : '']
      .filter(Boolean)
      .join('；')
    lines.push(`- ${shortText(item.text)}${meta ? `（${meta}）` : ''}`)
  }
  lines.push('')
}

function renderMetric(value, label) {
  return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`
}

function renderTaskPanel(title, items, emptyText) {
  return `<article class="task-panel">
    <h3>${escapeHtml(title)}</h3>
    ${renderTaskList(items, emptyText)}
  </article>`
}

function renderProject(project) {
  const projectTasks = [...project.todoReview.carryover, ...project.todoReview.new]
  return `<article class="project-panel">
    <h3>${escapeHtml(project.project)}</h3>
    <p>${escapeHtml(displayText(project.summary || '无摘要。'))}</p>
    <div class="project-grid">
      <section class="detail-box done">
        <h4>完成事项</h4>
        ${renderTextList(project.completed, '暂无完成事项。')}
      </section>
      <section class="detail-box tasks">
        <h4>待办事项</h4>
        ${renderTaskList(projectTasks, '暂无待办事项。')}
      </section>
      <section class="detail-box">
        <h4>想法/灵感</h4>
        ${renderTaskList(project.ideas, '暂无想法或灵感。')}
      </section>
      <section class="detail-box risks">
        <h4>可能已完成，需确认</h4>
        ${renderTaskList(project.todoReview.maybeCompleted, '暂无需要确认关闭的待办事项。')}
      </section>
      <section class="detail-box evidence">
        <h4>证据</h4>
        ${renderEvidence(project.evidence)}
      </section>
    </div>
  </article>`
}

function renderHtmlList(items, title, emptyText = '') {
  const normalized = normalizeTextItems(items)
  if (!normalized.length) return emptyText ? `<p class="empty">${escapeHtml(emptyText)}</p>` : ''
  return `<h3>${escapeHtml(title)}</h3>${renderTextList(normalized)}`
}

function renderTextList(items, emptyText = '') {
  const normalized = normalizeTextItems(items)
  if (!normalized.length) return `<p class="empty">${escapeHtml(emptyText)}</p>`
  return `<ul>${normalized.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function renderTaskList(items, emptyText = '') {
  const normalized = normalizeTaskItems(items)
  if (!normalized.length) return `<p class="empty">${escapeHtml(emptyText)}</p>`
  return `<ul>${normalized.map(renderTaskItem).join('')}</ul>`
}

function renderTaskItem(item) {
  const meta = [item.project, item.reason, item.sourceDates?.length ? `来源日期: ${item.sourceDates.join(', ')}` : '']
    .filter(Boolean)
    .join('；')
  return `<li>${escapeHtml(shortText(item.text))}${meta ? `<span class="item-meta">${escapeHtml(meta)}</span>` : ''}</li>`
}

function renderEvidence(evidence = {}) {
  const items = []
  for (const sessionId of evidence.sessionIds || []) {
    items.push(`会话: ${sessionId}`)
  }
  for (const file of evidence.filesModified || []) {
    items.push(`关键文件: ${file}`)
  }
  if (!items.length) return '<p class="empty">暂无证据。</p>'
  return `<ul>${items.map(item => `<li><code>${escapeHtml(item)}</code></li>`).join('')}</ul>`
}

function buildProjectSections(projects, todoReview) {
  return projects.map(project => {
    const name = project.project || project.name || ''
    return {
      project: name,
      summary: project.summary || '无摘要。',
      completed: normalizeTextItems(project.completed),
      todoReview: {
        carryover: todoReview.carryover.filter(item => sameProject(item.project, name)),
        new: todoReview.newTodos.filter(item => sameProject(item.project, name)),
        maybeCompleted: todoReview.maybeCompleted.filter(item => sameProject(item.project, name)),
      },
      ideas: normalizeTaskItems(project.ideas, name, project.evidence?.sessionIds),
      evidence: {
        sessionIds: normalizeTextItems(project.evidence?.sessionIds || project.sessionIds),
        filesModified: normalizeTextItems(project.evidence?.filesModified || project.filesModified),
      },
    }
  })
}

function inferMaybeCompleted(carryover, report) {
  const completed = new Set()
  for (const item of normalizeTextItems(report.completed)) {
    completed.add(normalizeText(item))
  }
  for (const project of report.projects || []) {
    for (const item of normalizeTextItems(project.completed)) {
      completed.add(`${project.project || ''}::${normalizeText(item)}`)
      completed.add(normalizeText(item))
    }
  }
  return carryover
    .filter(item => completed.has(itemKey(item)) || completed.has(normalizeText(item.text)))
    .map(item => ({
      ...item,
      reason: item.reason || '今日完成事项中出现了相同内容，需确认是否关闭。',
    }))
}

function openMemoryTodos(memory = {}) {
  return (memory.todos || []).filter(item => !item.status || item.status === 'open')
}

function normalizeTaskItems(items = [], fallbackProject = '', fallbackSessionIds = []) {
  return dedupeTasks(
    items
      .map(item => {
        if (typeof item === 'string') {
          return {
            text: displayText(item),
            project: fallbackProject,
            sourceSessionIds: fallbackSessionIds,
            status: 'open',
          }
        }
        return {
          id: item?.id,
          text: displayText(item?.text || ''),
          project: item?.project || fallbackProject,
          sourceDate: item?.sourceDate || '',
          sourceDates: item?.sourceDates || (item?.sourceDate ? [item.sourceDate] : []),
          sourceSessionIds: item?.sourceSessionIds || fallbackSessionIds,
          status: item?.status || 'open',
          reason: item?.reason || '',
        }
      })
      .filter(item => normalizeText(item.text)),
  )
}

function normalizeTextItems(items = []) {
  const texts = items.map(formatItem).filter(Boolean)
  const seen = new Set()
  const result = []
  for (const text of texts) {
    const key = normalizeText(text)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}

function dedupeTasks(items) {
  const seen = new Set()
  const result = []
  for (const item of items) {
    const key = itemKey(item)
    if (!normalizeText(item.text) || seen.has(key)) continue
    seen.add(key)
    result.push({
      ...item,
      sourceSessionIds: unique(item.sourceSessionIds || []),
      sourceDates: unique(item.sourceDates || (item.sourceDate ? [item.sourceDate] : [])),
    })
  }
  return result
}

function itemKey(item) {
  return `${item.project || ''}::${normalizeText(item.text)}`
}

function sameProject(left, right) {
  return String(left || '') === String(right || '')
}

function normalizeTitle(report) {
  return report.lang === 'en' ? `Codex Work Report · ${report.date}` : `Codex 工作日报 · ${report.date}`
}

function formatItem(item) {
  if (typeof item === 'string') return displayText(item)
  if (item?.text) return displayText(item.text)
  if (item == null) return ''
  return displayText(String(item))
}

function summarizeProject(sessions, project) {
  const titles = sessions
    .filter(session => project.sessionIds.includes(session.id))
    .map(session => session.title)
    .filter(Boolean)
  if (!titles.length) return '无摘要。'
  return titles.join('；')
}

function flattenProjectItems(projects, key) {
  return projects.flatMap(project =>
    (project[key] || []).map(item => ({
      ...(typeof item === 'string' ? { text: item } : item),
      project: project.project,
      sourceSessionIds: item.sourceSessionIds || project.evidence?.sessionIds || [],
    })),
  )
}

function itemObjects(items, report, type) {
  return normalizeTaskItems(items).map(item => ({
    text: item.text,
    project: item.project || '',
    sourceDate: item.sourceDate || report.date,
    sourceDates: item.sourceDates?.length ? item.sourceDates : [report.date],
    sourceSessionIds: item.sourceSessionIds || [],
    status: item.status || (type === 'todo' ? 'open' : 'active'),
  }))
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function displayText(value) {
  return String(value || '').replace(/(?<![-/._\w])todos?(?![-/._\w])/gi, '待办事项')
}

function shortText(value, limit = 180) {
  const text = displayText(value).replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}...`
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
