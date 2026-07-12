import { itemKey, normalizeText } from './memory.js'

export function buildFallbackDraft(rawSummary, options = {}) {
  const lang = options.lang || 'zh-CN'
  const projectSections = rawSummary.projects.map(project => {
    const sessions = rawSummary.sessions.filter(session => project.sessionIds.includes(session.id))
    return {
      project: displayProjectName(project.project),
      path: project.project,
      badge: `${project.sessionCount} sessions`,
      results: sessions.map(session => session.title).filter(Boolean),
      pending: project.todos.map(item => item.text),
      ideas: project.ideas.map(item => item.text),
      evidence: {
        sessionIds: project.sessionIds,
        filesModified: project.filesModified,
      },
    }
  })
  const todos = memoryItemsFromProjects(rawSummary.projects, 'todos')
  const ideas = memoryItemsFromProjects(rawSummary.projects, 'ideas')
  const topLevelTodos = todos.filter(item => isHighAttentionTodo(item))
  const tomorrowPriority = topLevelTodos.slice(0, 5)
  const backlog = topLevelTodos.slice(5)
  const overviewText =
    lang === 'zh-CN'
      ? `共读取 ${rawSummary.sessionCount} 个 Codex 会话，覆盖 ${rawSummary.projects.length} 个项目。`
      : `Read ${rawSummary.sessionCount} Codex sessions across ${rawSummary.projects.length} projects.`
  const skippedWarnings = skippedEventWarnings(rawSummary)

  return {
    schemaVersion: 2,
    status: options.status || 'draft',
    lang,
    date: rawSummary.date,
    generatedAt: new Date().toISOString(),
    metadata: {
      date: rawSummary.date,
      status: options.status || 'draft',
      projectCount: rawSummary.projects.length,
      sessionCount: rawSummary.sessionCount,
      title: lang === 'zh-CN' ? `Codex 工作日报 · ${rawSummary.date}` : `Codex Work Report · ${rawSummary.date}`,
      lead: overviewText,
      routeSteps: ['Issue Contract', 'Bounded /goal', 'Verifier Evidence', 'Markdown-first Report'],
    },
    overview: {
      overview: overviewText,
      readingFocus: tomorrowPriority.length
        ? `优先查看 ${tomorrowPriority
            .slice(0, 3)
            .map(item => item.text)
            .join('；')}`
        : '',
    },
    outcomes: projectSections.flatMap(project =>
      project.results.slice(0, 2).map(title => ({
        title,
        body: project.path,
      })),
    ),
    decisions: [],
    tasks: {
      tomorrowPriority,
      backlog,
    },
    projectSections,
    riskGroups: {
      blocked:
        options.status === 'codex_failed'
          ? ['Codex draft generation failed; this is a deterministic fallback draft.']
          : [],
      watch: [
        ...rawSummary.sessions
          .filter(session => session.malformedLines > 0)
          .map(session => `${session.id} 包含 ${session.malformedLines} 行无法解析的 JSONL。`),
        ...skippedWarnings,
      ],
      limit: [],
    },
    ideas: {
      chips: ideas,
    },
    personalReflection: {
      status: 'not_provided',
      summary: '',
      provenance: 'none',
    },
    reusableInsights: {
      skillCandidates: [],
      automationCandidates: [],
      globalInstructionCandidates: [],
      projectInstructionCandidates: [],
      warnings:
        options.status === 'codex_failed'
          ? ['Codex fallback output is not valid reusable-insight evidence.']
          : [],
    },
    appendix: {
      sessionIds: rawSummary.sessions.map(session => session.id),
      filesModified: unique(rawSummary.projects.flatMap(project => project.filesModified)),
    },
    rawSummary,
  }
}

export function buildMemoryProposal(report, options = {}) {
  const todos = itemObjects([...(report.tasks?.tomorrowPriority || []), ...(report.tasks?.backlog || [])], report, 'todo')
  const ideas = itemObjects(report.ideas?.chips || [], report, 'idea')
  const review = options.review || null
  return {
    schemaVersion: 1,
    date: report.date,
    status: report.status,
    todos,
    ideas,
    todoUpdates: [],
    review,
    report: {
      date: report.date,
      title: report.metadata?.title || report.title || `Codex 工作日报 · ${report.date}`,
      status: report.status,
      generatedAt: report.generatedAt,
      sessionIds: report.appendix?.sessionIds || [],
    },
  }
}

export function buildReviewModel({ report, proposal, memory }) {
  const historicalOpenTodos = (memory.todos || []).filter(item => item.status === 'open')
  const todayCompleted = todayCompletedItems(report)
  const possibleCompletedTodos = historicalOpenTodos.filter(todo => matchesAnyCompletion(todo, todayCompleted))
  const possibleKeys = new Set(possibleCompletedTodos.map(item => itemKey(item)))

  return {
    schemaVersion: 1,
    date: report.date,
    status: report.status,
    todayCompleted,
    possibleCompletedTodos,
    newTodos: proposal.todos || [],
    remainingTodos: historicalOpenTodos.filter(item => !possibleKeys.has(itemKey(item))),
    newIdeas: proposal.ideas || [],
    personalReflection: report.personalReflection,
    reusableInsights: report.reusableInsights,
  }
}

export function renderReviewMarkdown(review) {
  const lines = []
  lines.push(`# 日报确认清单 · ${review.date}`)
  lines.push('')
  lines.push(`- 状态: ${review.status}`)
  lines.push('- 说明: 候选完成项只供人工确认，不会在 finalize 时自动关闭。')
  lines.push('')
  lines.push('## 今天完成了什么')
  lines.push('')
  appendBullets(lines, review.todayCompleted || [], item => formatTitledItem(item))
  lines.push('## 可能完成的历史待办')
  lines.push('')
  appendBullets(lines, review.possibleCompletedTodos || [], item => formatReviewTodo(item))
  lines.push('## 新增待办')
  lines.push('')
  appendBullets(lines, review.newTodos || [], item => formatReviewTodo(item))
  lines.push('## 保留待办')
  lines.push('')
  appendBullets(lines, review.remainingTodos || [], item => formatReviewTodo(item))
  lines.push('## 新想法')
  lines.push('')
  appendBullets(lines, review.newIdeas || [], item => formatReviewTodo(item))
  appendReflectionMarkdown(lines, review.personalReflection)
  appendInsightsMarkdown(lines, review.reusableInsights)
  lines.push('## finalize 前必须确认')
  lines.push('')
  lines.push('- 哪些“可能完成的历史待办”要写入 `todoUpdates` 并标记为 `done`。')
  lines.push('- 哪些“新增待办”和“新想法”需要删除、改写或保留。')
  lines.push('- 日报 finalize 只授权报告和 memory；不会授权任何 Codex 指令修改。')
  lines.push('- 指令候选必须先单独确认，再审阅准确 diff，并对该 diff 进行第二次单独确认。')
  lines.push('- 确认后再运行 `finalize`；未确认时不要更新 memory。')
  lines.push('')
  return `${lines.join('\n')}\n`
}

export function renderMarkdown(report) {
  const metadata = normalizedMetadata(report)
  const lines = []
  lines.push(`# ${metadata.title}`)
  lines.push('')
  lines.push(`- 日期: ${metadata.date}`)
  lines.push(`- 状态: ${metadata.status}`)
  lines.push(`- 项目数: ${metadata.projectCount}`)
  lines.push(`- 会话数: ${metadata.sessionCount}`)
  lines.push('')

  lines.push('## 今日概览')
  lines.push('')
  lines.push(report.overview?.overview || '无概览。')
  if (report.overview?.readingFocus) {
    lines.push('')
    lines.push(`> 阅读重点：${report.overview.readingFocus}`)
  }
  lines.push('')

  lines.push('## 关键成果')
  lines.push('')
  appendNumbered(lines, report.outcomes || [], formatTitledItem)

  lines.push('## 关键决策')
  lines.push('')
  appendBullets(lines, report.decisions || [], item => formatTitledItem(item, { includeIcon: true }))

  lines.push('## 明日优先')
  lines.push('')
  appendNumbered(lines, report.tasks?.tomorrowPriority || [], item => formatTextItem(item))

  lines.push('## 后续待办')
  lines.push('')
  appendBullets(lines, report.tasks?.backlog || [], item => formatTextItem(item))

  lines.push('## 项目进展')
  lines.push('')
  for (const project of report.projectSections || []) {
    lines.push(`### ${project.project || displayProjectName(project.path)}`)
    lines.push('')
    if (project.path) lines.push(`路径：${project.path}`)
    if (project.badge) lines.push(`标签：${project.badge}`)
    lines.push('')
    lines.push('#### 今日结果')
    lines.push('')
    appendBullets(lines, project.results || [], item => formatTextItem(item))
    lines.push('#### 待处理')
    lines.push('')
    appendBullets(lines, project.pending || [], item => formatTextItem(item))
    lines.push('#### 关键想法')
    lines.push('')
    appendBullets(lines, project.ideas || [], item => formatTextItem(item))
  }

  lines.push('## 风险与阻塞')
  lines.push('')
  appendRiskMarkdown(lines, '当前阻塞', report.riskGroups?.blocked || [])
  appendRiskMarkdown(lines, '需要注意', report.riskGroups?.watch || [])
  appendRiskMarkdown(lines, '后续限制', report.riskGroups?.limit || [])

  lines.push('## 想法与灵感')
  lines.push('')
  appendBullets(lines, report.ideas?.chips || [], item => formatTextItem(item))

  appendReflectionMarkdown(lines, report.personalReflection)
  appendInsightsMarkdown(lines, report.reusableInsights)

  lines.push('## 附录：证据索引')
  lines.push('')
  lines.push('### 原始会话')
  lines.push('')
  appendBullets(lines, report.appendix?.sessionIds || [], item => formatTextItem(item))
  lines.push('### 关键文件')
  lines.push('')
  appendBullets(lines, report.appendix?.filesModified || [], item => formatTextItem(item))

  return `${lines.join('\n')}\n`
}

export function renderHtml(report) {
  const metadata = normalizedMetadata(report)
  const routeSteps = metadata.routeSteps.length
    ? metadata.routeSteps
    : ['Issue Contract', 'Bounded /goal', 'Verifier Evidence', 'Markdown-first Report']
  const nav = [
    ['overview', '概览'],
    ['outcomes', '成果'],
    ['decisions', '决策'],
    ['tasks', '任务'],
    ['projects', '项目'],
    ['risks', '风险'],
    ['ideas', '灵感'],
    ['reflection', '反思'],
    ['insights', '洞察'],
    ['appendix', '证据'],
  ]

  return `<!doctype html>
<html lang="${escapeAttr(report.lang || 'zh-CN')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(metadata.title)}</title>
  <style>
    :root {
      --bg: #f7f5ef;
      --paper: #fffdf8;
      --paper-2: #ffffff;
      --ink: #1f2933;
      --ink-soft: #4b5563;
      --muted: #7b8494;
      --line: rgba(31, 41, 51, .10);
      --line-strong: rgba(31, 41, 51, .16);
      --accent: #2563eb;
      --accent-2: #7c3aed;
      --green: #059669;
      --amber: #d97706;
      --red: #dc2626;
      --blue-soft: #eef4ff;
      --green-soft: #ecfdf5;
      --amber-soft: #fff7ed;
      --red-soft: #fef2f2;
      --shadow: 0 18px 50px rgba(31, 41, 51, .10);
      --shadow-sm: 0 8px 24px rgba(31, 41, 51, .07);
      --max: 1040px;
    }
    [data-theme="dark"] {
      --bg: #0f172a;
      --paper: #111827;
      --paper-2: #172033;
      --ink: #f8fafc;
      --ink-soft: #d1d5db;
      --muted: #94a3b8;
      --line: rgba(255,255,255,.10);
      --line-strong: rgba(255,255,255,.18);
      --blue-soft: rgba(37, 99, 235, .16);
      --green-soft: rgba(5, 150, 105, .16);
      --amber-soft: rgba(217, 119, 6, .16);
      --red-soft: rgba(220, 38, 38, .14);
      --shadow: 0 20px 60px rgba(0,0,0,.25);
      --shadow-sm: 0 10px 28px rgba(0,0,0,.18);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at 12% 0%, rgba(37,99,235,.12), transparent 28%),
        radial-gradient(circle at 88% 5%, rgba(124,58,237,.10), transparent 30%),
        linear-gradient(180deg, var(--bg), var(--bg));
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif;
      line-height: 1.74;
      letter-spacing: 0;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background-image: linear-gradient(rgba(31,41,51,.045) 1px, transparent 1px);
      background-size: 100% 44px;
      mask-image: linear-gradient(180deg, #000, transparent 72%);
    }
    a { color: inherit; text-decoration: none; }
    .progress {
      position: fixed;
      left: 0;
      top: 0;
      width: 0%;
      height: 3px;
      z-index: 50;
      background: linear-gradient(90deg, var(--accent), var(--accent-2));
      box-shadow: 0 0 18px rgba(37,99,235,.35);
    }
    .wrap {
      width: min(var(--max), calc(100% - 32px));
      margin: 0 auto;
      padding: 34px 0 72px;
    }
    .hero {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 30px;
      background:
        linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.76)),
        radial-gradient(circle at 90% 12%, rgba(37,99,235,.18), transparent 32%);
      box-shadow: var(--shadow);
      padding: 44px;
    }
    [data-theme="dark"] .hero {
      background:
        linear-gradient(135deg, rgba(17,24,39,.96), rgba(23,32,51,.92)),
        radial-gradient(circle at 90% 12%, rgba(37,99,235,.24), transparent 34%);
    }
    .hero::after {
      content: "";
      position: absolute;
      right: -120px;
      top: -120px;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(37,99,235,.18), rgba(124,58,237,.16));
      filter: blur(4px);
    }
    .hero-content { position: relative; z-index: 1; }
    .topline {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255,255,255,.55);
      color: var(--ink-soft);
      font-weight: 700;
      font-size: 13px;
    }
    [data-theme="dark"] .brand { background: rgba(255,255,255,.05); }
    .brand-mark {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 8px;
      color: white;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      font-weight: 900;
      font-size: 12px;
    }
    .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .button {
      border: 1px solid var(--line);
      background: var(--paper-2);
      color: var(--ink);
      border-radius: 999px;
      padding: 9px 13px;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(31,41,51,.06);
    }
    h1 {
      margin: 0;
      max-width: 820px;
      font-size: clamp(42px, 7vw, 82px);
      line-height: 1;
      letter-spacing: 0;
    }
    h1 span { display: block; }
    h1 .title-date { font-size: .86em; }
    .lead {
      max-width: 820px;
      margin: 24px 0 0;
      color: var(--ink-soft);
      font-size: 18px;
    }
    .route {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 32px;
    }
    .route-step {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 11px 14px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--paper-2);
      box-shadow: var(--shadow-sm);
      color: var(--ink-soft);
      font-weight: 800;
      font-size: 13px;
    }
    .route-step span {
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      color: #fff;
      background: var(--accent);
      font-size: 12px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin: 18px 0;
    }
    .stat {
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
    }
    .stat-label {
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .stat-value {
      margin-top: 5px;
      font-size: 20px;
      font-weight: 900;
      word-break: break-word;
    }
    .nav {
      position: sticky;
      top: 10px;
      z-index: 20;
      display: flex;
      gap: 6px;
      margin: 18px 0 22px;
      padding: 8px;
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: color-mix(in srgb, var(--paper) 88%, transparent);
      backdrop-filter: blur(16px);
      box-shadow: var(--shadow-sm);
    }
    .nav a {
      flex: 0 0 auto;
      padding: 8px 12px;
      border-radius: 999px;
      color: var(--ink-soft);
      font-size: 13px;
      font-weight: 900;
    }
    .nav a.active, .nav a:hover {
      background: var(--blue-soft);
      color: var(--accent);
    }
    .section {
      margin-top: 18px;
      scroll-margin-top: 90px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 24px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
      padding: 28px;
    }
    .section-title {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .kicker {
      color: var(--accent);
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
    }
    h2, h3, h4 { margin: 0; line-height: 1.25; letter-spacing: 0; }
    h2 { font-size: 28px; }
    h3 { font-size: 18px; }
    h4 { font-size: 14px; color: var(--ink-soft); }
    .section-note {
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
      text-align: right;
    }
    .overview-text {
      margin: 0;
      color: var(--ink-soft);
      font-size: 17px;
    }
    .callout {
      margin-top: 18px;
      padding: 16px 18px;
      border: 1px solid rgba(37,99,235,.16);
      border-radius: 18px;
      background: var(--blue-soft);
      color: var(--ink-soft);
    }
    .timeline {
      display: grid;
      gap: 14px;
    }
    .timeline-item {
      display: grid;
      grid-template-columns: 46px 1fr;
      gap: 14px;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--paper-2);
    }
    .timeline-num {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 14px;
      color: #fff;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      font-weight: 900;
    }
    .timeline-title { font-weight: 900; }
    .timeline-body { color: var(--ink-soft); }
    .decision-list {
      display: grid;
      gap: 12px;
    }
    .decision {
      display: grid;
      grid-template-columns: 44px 1fr;
      gap: 12px;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--paper-2);
    }
    .icon {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 14px;
      background: var(--blue-soft);
    }
    .decision strong { display: block; }
    .decision span { display: block; color: var(--ink-soft); }
    .task-board {
      display: grid;
      gap: 16px;
    }
    .task-panel {
      padding: 18px;
      border: 1px solid rgba(5,150,105,.18);
      border-radius: 20px;
      background: var(--green-soft);
    }
    .task-panel.backlog {
      border-color: rgba(217,119,6,.20);
      background: var(--amber-soft);
    }
    .task-panel-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 3px 9px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--paper-2);
      color: var(--muted);
      font-size: 12px;
      font-weight: 900;
      white-space: nowrap;
    }
    .task-list {
      display: grid;
      gap: 10px;
    }
    .task {
      display: grid;
      grid-template-columns: 30px 1fr;
      gap: 10px;
      align-items: start;
      color: var(--ink-soft);
    }
    .checkbox {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 10px;
      background: var(--paper-2);
      color: var(--accent);
      font-size: 12px;
      font-weight: 900;
    }
    .project-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin: -8px 0 12px;
    }
    .accordion {
      display: grid;
      gap: 12px;
    }
    details.project {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: var(--paper-2);
      overflow: hidden;
    }
    details.project summary {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      align-items: center;
      padding: 16px 18px;
      cursor: pointer;
      list-style: none;
    }
    details.project summary::-webkit-details-marker { display: none; }
    .project-name h3 { word-break: break-word; }
    .path {
      margin-top: 4px;
      color: var(--muted);
      font-size: 13px;
      word-break: break-all;
    }
    .chevron {
      color: var(--muted);
      font-weight: 900;
    }
    details[open] .chevron { transform: rotate(180deg); }
    .project-content {
      display: grid;
      gap: 14px;
      padding: 0 18px 18px;
    }
    .block {
      padding: 14px;
      border-radius: 16px;
      background: color-mix(in srgb, var(--blue-soft) 38%, transparent);
    }
    .plain-list, .file-list {
      margin: 10px 0 0;
      padding-left: 20px;
      color: var(--ink-soft);
    }
    .plain-list li, .file-list li { margin: 5px 0; }
    .risk-list {
      display: grid;
      gap: 12px;
    }
    .risk {
      padding: 16px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: var(--paper-2);
    }
    .risk p { margin: 10px 0 0; color: var(--ink-soft); }
    .risk.blocked { border-color: rgba(220,38,38,.22); background: var(--red-soft); }
    .risk.watch { border-color: rgba(217,119,6,.22); background: var(--amber-soft); }
    .risk.limit { border-color: rgba(37,99,235,.18); background: var(--blue-soft); }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      padding: 9px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--paper-2);
      color: var(--ink-soft);
      font-weight: 800;
      word-break: break-word;
    }
    .evidence details {
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--paper-2);
      overflow: hidden;
    }
    .evidence details + details { margin-top: 10px; }
    .evidence summary {
      cursor: pointer;
      padding: 14px 16px;
      font-weight: 900;
    }
    .evidence-body { padding: 0 16px 16px; }
    .footer {
      margin-top: 24px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
    }
    .empty {
      margin: 0;
      color: var(--muted);
      font-style: italic;
    }
    @media (max-width: 820px) {
      .wrap { width: min(100% - 20px, var(--max)); padding-top: 16px; }
      .hero { padding: 28px 22px; border-radius: 24px; }
      h1 { font-size: 42px; }
      .stats { grid-template-columns: 1fr; }
      .section-title { display: block; }
      .section-note { margin-top: 4px; text-align: left; }
      details.project summary { grid-template-columns: 1fr; }
      .project-actions { justify-content: flex-start; }
    }
    @media print {
      body { background: #fff; color: #111827; }
      body::before, .progress, .nav, .actions, .project-actions { display: none !important; }
      .wrap { width: 100%; padding: 0; }
      .hero, .card, .stat, details.project { box-shadow: none; break-inside: avoid; }
      .section { break-inside: avoid; }
      details.project, .evidence details { display: block; }
      details.project > *:not(summary), .evidence details > *:not(summary) { display: block; }
    }
  </style>
</head>
<body>
  <div class="progress" id="progress"></div>
  <main class="wrap">
    <header class="hero">
      <div class="hero-content">
        <div class="topline">
          <div class="brand"><span class="brand-mark">C</span> Codex Daily Report</div>
          <div class="actions">
            <button class="button" id="themeBtn" type="button">切换深色</button>
            <button class="button" onclick="window.print()" type="button">打印 / 导出 PDF</button>
          </div>
        </div>
        <h1>${heroTitleHtml(metadata.title)}</h1>
        <p class="lead">${escapeHtml(metadata.lead || report.overview?.overview || '')}</p>
        <div class="route" aria-label="main route">
          ${routeSteps.map((step, index) => `<div class="route-step"><span>${index + 1}</span>${escapeHtml(step)}</div>`).join('\n          ')}
        </div>
      </div>
    </header>

    <section class="stats" aria-label="metadata">
      ${statHtml('日期', metadata.date)}
      ${statHtml('状态', metadata.status)}
      ${statHtml('项目数', metadata.projectCount)}
      ${statHtml('会话数', metadata.sessionCount)}
    </section>

    <nav class="nav" id="nav">
      ${nav.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('\n      ')}
    </nav>

    <section id="overview" class="section card">
      ${sectionTitle('Overview', '今日概览', '单栏正文 · 阅读优先')}
      <p class="overview-text">${escapeHtml(report.overview?.overview || '无概览。')}</p>
      ${report.overview?.readingFocus ? `<div class="callout"><strong>阅读重点：</strong>${escapeHtml(report.overview.readingFocus)}</div>` : ''}
    </section>

    <section id="outcomes" class="section card">
      ${sectionTitle('Outcomes', '关键成果', '按推进顺序展示')}
      <div class="timeline">
        ${listOrEmpty(report.outcomes || [], (item, index) => timelineItemHtml(item, index))}
      </div>
    </section>

    <section id="decisions" class="section card">
      ${sectionTitle('Decisions', '关键决策', '避免明天重复纠结')}
      <div class="decision-list">
        ${listOrEmpty(report.decisions || [], decisionHtml)}
      </div>
    </section>

    <section id="tasks" class="section card">
      ${sectionTitle('Tasks', '任务清单', '不做窄双栏，按优先级展开')}
      <div class="task-board">
        ${taskPanelHtml('明日优先', report.tasks?.tomorrowPriority || [], false)}
        ${taskPanelHtml('后续待办', report.tasks?.backlog || [], true)}
      </div>
    </section>

    <section id="projects" class="section card">
      ${sectionTitle('Projects', '项目进展', '手风琴组件 · 默认展开主项目')}
      <div class="project-actions"><button class="button" type="button" id="openAll">展开全部</button><button class="button" type="button" id="closeAll">收起全部</button></div>
      <div class="accordion">
        ${listOrEmpty(report.projectSections || [], (project, index) => projectHtml(project, index))}
      </div>
    </section>

    <section id="risks" class="section card">
      ${sectionTitle('Risks', '风险与阻塞', '按紧急程度分组')}
      <div class="risk-list">
        ${riskHtml('当前阻塞', report.riskGroups?.blocked || [], 'blocked')}
        ${riskHtml('需要注意', report.riskGroups?.watch || [], 'watch')}
        ${riskHtml('后续限制', report.riskGroups?.limit || [], 'limit')}
      </div>
    </section>

    <section id="ideas" class="section card">
      ${sectionTitle('Ideas', '想法与灵感', '适合沉淀到 memory')}
      <div class="chips">
        ${listOrEmpty(report.ideas?.chips || [], item => `<span class="chip">${escapeHtml(formatTextItem(item))}</span>`)}
      </div>
    </section>

    <section id="reflection" class="section card">
      ${sectionTitle('Reflection', '个人补充与反思', '用户审阅后的备忘摘要')}
      ${reflectionHtml(report.personalReflection)}
    </section>

    <section id="insights" class="section card evidence">
      ${sectionTitle('Reusable Insights', '复用洞察', '建议与持久指令候选均需人工确认')}
      ${insightsHtml(report.reusableInsights)}
    </section>

    <section id="appendix" class="section card evidence">
      ${sectionTitle('Appendix', '附录：证据索引', '默认收起，避免污染阅读')}
      ${evidenceDetailsHtml('原始会话', report.appendix?.sessionIds || [])}
      ${evidenceDetailsHtml('关键文件', report.appendix?.filesModified || [])}
    </section>

    <footer class="footer">Codex 工作日报 · single-column component layout · Markdown-first compatible</footer>
  </main>
  <script>
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeBtn');
    const savedTheme = localStorage.getItem('codex-report-theme');
    if (savedTheme) root.dataset.theme = savedTheme;
    themeBtn?.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? '' : 'dark';
      if (next) root.dataset.theme = next;
      else delete root.dataset.theme;
      localStorage.setItem('codex-report-theme', next);
    });

    const progress = document.getElementById('progress');
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = total > 0 ? Math.min(1, window.scrollY / total) : 0;
      progress.style.width = (ratio * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    document.getElementById('openAll')?.addEventListener('click', () => {
      document.querySelectorAll('details.project').forEach(item => { item.open = true; });
    });
    document.getElementById('closeAll')?.addEventListener('click', () => {
      document.querySelectorAll('details.project').forEach(item => { item.open = false; });
    });

    const navLinks = [...document.querySelectorAll('#nav a')];
    const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + visible.target.id));
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.2, 0.5] });
    sections.forEach(section => observer.observe(section));
  </script>
</body>
</html>
`
}

export function normalizeReportShape(value, rawSummary, lang = 'zh-CN') {
  const fallback = buildFallbackDraft(rawSummary, { lang, status: 'draft' })
  const status = value.status || value.metadata?.status || fallback.status
  const date = value.date || value.metadata?.date || rawSummary.date
  const projectSections = projectSectionList(value.projectSections, fallback.projectSections)
  const normalizedTasks = normalizeTopLevelTasks(value.tasks, fallback.tasks)
  const metadata = {
    ...fallback.metadata,
    ...(isObject(value.metadata) ? value.metadata : {}),
    date,
    status,
    projectCount: numberOr(value.metadata?.projectCount, fallback.metadata.projectCount),
    sessionCount: numberOr(value.metadata?.sessionCount, fallback.metadata.sessionCount),
    title: value.metadata?.title || value.title || fallback.metadata.title,
    lead: value.metadata?.lead || value.overview?.overview || value.overview || fallback.metadata.lead,
    routeSteps: textList(value.metadata?.routeSteps || fallback.metadata.routeSteps),
  }

  return {
    schemaVersion: 2,
    status,
    lang: value.lang || lang,
    date,
    generatedAt: value.generatedAt || new Date().toISOString(),
    metadata,
    overview: {
      overview: textFrom(value.overview?.overview ?? value.overview) || fallback.overview.overview,
      readingFocus: textFrom(value.overview?.readingFocus) || fallback.overview.readingFocus,
    },
    outcomes: titledItems(value.outcomes, fallback.outcomes),
    decisions: titledItems(value.decisions, fallback.decisions, { withIcon: true }),
    tasks: {
      tomorrowPriority: normalizedTasks.tomorrowPriority,
      backlog: normalizedTasks.backlog,
    },
    projectSections,
    riskGroups: {
      blocked: textList(value.riskGroups?.blocked ?? fallback.riskGroups.blocked),
      watch: textList(value.riskGroups?.watch ?? fallback.riskGroups.watch),
      limit: textList(value.riskGroups?.limit ?? fallback.riskGroups.limit),
    },
    ideas: {
      chips: memoryItemList(value.ideas?.chips ?? value.ideas, fallback.ideas.chips),
    },
    personalReflection: isObject(value.personalReflection)
      ? value.personalReflection
      : fallback.personalReflection,
    reusableInsights: isObject(value.reusableInsights)
      ? value.reusableInsights
      : fallback.reusableInsights,
    appendix: {
      sessionIds: textList(value.appendix?.sessionIds ?? fallback.appendix.sessionIds),
      filesModified: textList(value.appendix?.filesModified ?? fallback.appendix.filesModified),
    },
    rawSummary,
  }
}

function appendNumbered(lines, items, formatter) {
  if (!items.length) {
    lines.push('无。')
    lines.push('')
    return
  }
  items.forEach((item, index) => lines.push(`${index + 1}. ${formatter(item)}`))
  lines.push('')
}

function appendBullets(lines, items, formatter) {
  if (!items.length) {
    lines.push('无。')
    lines.push('')
    return
  }
  for (const item of items) lines.push(`- ${formatter(item)}`)
  lines.push('')
}

function appendRiskMarkdown(lines, title, items) {
  lines.push(`### ${title}`)
  lines.push('')
  appendBullets(lines, items, item => formatTextItem(item))
}

function appendReflectionMarkdown(lines, reflection) {
  const value = reflection || { status: 'not_provided', summary: '', provenance: 'none' }
  lines.push('## 个人补充与反思')
  lines.push('')
  lines.push(`- 状态: ${value.status || 'not_provided'}`)
  lines.push(`- 来源: ${value.provenance || 'none'}`)
  if (value.summary) {
    lines.push('')
    lines.push(value.summary)
  }
  lines.push('')
}

function appendInsightsMarkdown(lines, insights) {
  const value = insights || {}
  lines.push('## 复用洞察')
  lines.push('')
  appendCandidateGroupMarkdown(lines, 'Skill 候选', value.skillCandidates || [])
  appendCandidateGroupMarkdown(lines, '自动化候选', value.automationCandidates || [])
  appendCandidateGroupMarkdown(lines, '全局 Codex 指令候选', value.globalInstructionCandidates || [])
  appendCandidateGroupMarkdown(lines, '项目 Codex 指令候选', value.projectInstructionCandidates || [])
  lines.push('### 洞察警告')
  lines.push('')
  appendBullets(lines, value.warnings || [], item => formatTextItem(item))
}

function appendCandidateGroupMarkdown(lines, title, candidates) {
  lines.push(`### ${title}`)
  lines.push('')
  if (!candidates.length) {
    lines.push('无。')
    lines.push('')
    return
  }
  for (const candidate of candidates) {
    lines.push(`#### ${candidate.recommendation || candidate.id}`)
    lines.push('')
    lines.push(`- ID: ${candidate.id || ''}`)
    lines.push(`- 类型: ${candidate.type || ''}`)
    lines.push(`- 作用域: ${candidate.scope || ''}`)
    lines.push(`- 状态: ${candidate.confirmationStatus || 'unconfirmed'}`)
    lines.push(`- 来源: ${candidate.provenance || ''}`)
    lines.push(`- 证据次数: ${candidate.evidenceCount ?? (candidate.evidence || []).length}`)
    lines.push(`- 日期: ${formatInlineList(candidate.dates)}`)
    lines.push(`- 项目: ${formatInlineList(candidate.projects)}`)
    lines.push(`- 推荐理由: ${candidate.rationale || '未提供。'}`)
    lines.push(`- 预期收益: ${candidate.expectedBenefit || '未提供。'}`)
    lines.push(`- 冲突信号: ${candidate.conflict === true ? '是' : '否'}`)
    lines.push(`- 嵌套作用域信号: ${candidate.nestedScope === true ? '是' : '否'}`)
    lines.push(`- 建议作用域路径: ${candidate.scopePath || '无。'}`)
    lines.push(`- 安全原因: ${formatInlineList(candidate.safetyReasons)}`)
    lines.push(`- 建议下一步: ${candidateNextStep(candidate)}`)
    lines.push('- 证据:')
    const evidence = candidate.evidence || []
    if (!evidence.length) {
      lines.push('  - 无。')
    } else {
      for (const item of evidence) {
        lines.push(`  - ${formatEvidenceMarkdown(item)}`)
      }
    }
    lines.push('')
  }
}

function formatTitledItem(item, options = {}) {
  const icon = options.includeIcon && item.icon ? `${item.icon} ` : ''
  if (item.title && item.body) return `${icon}**${item.title}**：${item.body}`
  return `${icon}${formatTextItem(item)}`
}

function formatReviewTodo(item) {
  const text = formatTextItem(item)
  const project = typeof item === 'string' ? '' : item.project || ''
  return project ? `${text}（${project}）` : text
}

function formatTextItem(item) {
  if (typeof item === 'string') return item
  if (item?.text) return item.text
  if (item?.title && item?.body) return `${item.title}：${item.body}`
  if (item?.title) return item.title
  return String(item ?? '')
}

function normalizedMetadata(report) {
  const sessionIds = report.appendix?.sessionIds || []
  return {
    date: report.metadata?.date || report.date || '',
    status: report.metadata?.status || report.status || '',
    projectCount: report.metadata?.projectCount ?? report.projectSections?.length ?? 0,
    sessionCount: report.metadata?.sessionCount ?? sessionIds.length,
    title: report.metadata?.title || report.title || `Codex 工作日报 · ${report.date || ''}`,
    lead: report.metadata?.lead || report.overview?.overview || '',
    routeSteps: textList(report.metadata?.routeSteps || []),
  }
}

function statHtml(label, value) {
  return `<div class="stat"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div></div>`
}

function heroTitleHtml(title) {
  const parts = String(title || '').split(' · ')
  if (parts.length < 2) return escapeHtml(title)
  const date = parts.pop()
  return `<span>${escapeHtml(parts.join(' · '))}</span><span class="title-date">${escapeHtml(date)}</span>`
}

function sectionTitle(kicker, title, note) {
  return `<div class="section-title"><div><div class="kicker">${escapeHtml(kicker)}</div><h2>${escapeHtml(title)}</h2></div><div class="section-note">${escapeHtml(note)}</div></div>`
}

function listOrEmpty(items, renderer) {
  if (!items.length) return '<p class="empty">无。</p>'
  return items.map(renderer).join('\n        ')
}

function timelineItemHtml(item, index) {
  const number = String(index + 1).padStart(2, '0')
  return `<div class="timeline-item"><div class="timeline-num">${number}</div><div><div class="timeline-title">${escapeHtml(item.title || formatTextItem(item))}</div><div class="timeline-body">${escapeHtml(item.body || '')}</div></div></div>`
}

function decisionHtml(item) {
  return `<div class="decision"><div class="icon">${escapeHtml(item.icon || '•')}</div><div><strong>${escapeHtml(item.title || formatTextItem(item))}</strong><span>${escapeHtml(item.body || '')}</span></div></div>`
}

function taskPanelHtml(title, items, isBacklog) {
  return `<div class="task-panel${isBacklog ? ' backlog' : ''}">
          <div class="task-panel-head"><h3>${escapeHtml(title)}</h3><span class="badge">${items.length} items</span></div>
          <div class="task-list">
            ${listOrEmpty(items, (item, index) => `<div class="task"><div class="checkbox">${isBacklog ? '•' : index + 1}</div><div>${escapeHtml(formatTextItem(item))}</div></div>`)}
          </div>
        </div>`
}

function projectHtml(project, index) {
  const title = project.project || displayProjectName(project.path)
  const path = project.path || ''
  return `<details class="project"${index === 0 ? ' open' : ''}>
          <summary><div class="project-name"><h3>${escapeHtml(title)}</h3>${path ? `<div class="path">${escapeHtml(path)}</div>` : ''}</div><span class="badge">${escapeHtml(project.badge || '')}</span><span class="chevron">⌄</span></summary>
          <div class="project-content">
            ${projectBlockHtml('今日结果', project.results || [])}
            ${projectBlockHtml('待处理', project.pending || [])}
            ${projectBlockHtml('关键想法', project.ideas || [])}
          </div>
        </details>`
}

function projectBlockHtml(title, items) {
  return `<div class="block"><h4>${escapeHtml(title)}</h4>${listHtml(items, 'plain-list')}</div>`
}

function riskHtml(title, items, className) {
  const body = items.length === 1 ? `<p>${escapeHtml(formatTextItem(items[0]))}</p>` : listHtml(items, 'plain-list')
  return `<div class="risk ${className}"><h3>${escapeHtml(title)}</h3>${body}</div>`
}

function evidenceDetailsHtml(title, items) {
  return `<details><summary>${escapeHtml(title)}</summary><div class="evidence-body">${listHtml(items, 'file-list')}</div></details>`
}

function reflectionHtml(reflection) {
  const value = reflection || { status: 'not_provided', summary: '', provenance: 'none' }
  return `<div class="block"><div class="chips"><span class="badge">状态: ${escapeHtml(value.status || 'not_provided')}</span><span class="badge">来源: ${escapeHtml(value.provenance || 'none')}</span></div>${value.summary ? `<p class="overview-text">${escapeHtml(value.summary)}</p>` : '<p class="empty">未提供个人备忘。</p>'}</div>`
}

function insightsHtml(insights) {
  const value = insights || {}
  return [
    candidateGroupHtml('Skill 候选', value.skillCandidates || []),
    candidateGroupHtml('自动化候选', value.automationCandidates || []),
    candidateGroupHtml('全局 Codex 指令候选', value.globalInstructionCandidates || []),
    candidateGroupHtml('项目 Codex 指令候选', value.projectInstructionCandidates || []),
    evidenceDetailsHtml('洞察警告', value.warnings || []),
  ].join('\n      ')
}

function candidateGroupHtml(title, candidates) {
  if (!candidates.length) {
    return `<details><summary>${escapeHtml(title)} · 0</summary><div class="evidence-body"><p class="empty">无。</p></div></details>`
  }
  const body = candidates.map(candidate => candidateHtml(candidate)).join('\n')
  return `<details open><summary>${escapeHtml(title)} · ${candidates.length}</summary><div class="evidence-body">${body}</div></details>`
}

function candidateHtml(candidate) {
  const evidence = candidate.evidence || []
  return `<div class="block">
    <h3>${escapeHtml(candidate.recommendation || candidate.id || '')}</h3>
    <div class="chips">
      <span class="badge">${escapeHtml(candidate.type || '')}</span>
      <span class="badge">作用域: ${escapeHtml(candidate.scope || '')}</span>
      <span class="badge">状态: ${escapeHtml(candidate.confirmationStatus || 'unconfirmed')}</span>
      <span class="badge">证据: ${escapeHtml(candidate.evidenceCount ?? evidence.length)}</span>
      <span class="badge">冲突: ${candidate.conflict === true ? '是' : '否'}</span>
      <span class="badge">嵌套作用域: ${candidate.nestedScope === true ? '是' : '否'}</span>
    </div>
    <p><strong>ID：</strong>${escapeHtml(candidate.id || '')}</p>
    <p><strong>来源：</strong>${escapeHtml(candidate.provenance || '')}</p>
    <p><strong>日期：</strong>${escapeHtml(formatInlineList(candidate.dates))}</p>
    <p><strong>项目：</strong>${escapeHtml(formatInlineList(candidate.projects))}</p>
    <p><strong>推荐理由：</strong>${escapeHtml(candidate.rationale || '未提供。')}</p>
    <p><strong>预期收益：</strong>${escapeHtml(candidate.expectedBenefit || '未提供。')}</p>
    <p><strong>建议作用域路径：</strong>${escapeHtml(candidate.scopePath || '无。')}</p>
    <p><strong>安全原因：</strong>${escapeHtml(formatInlineList(candidate.safetyReasons))}</p>
    <p><strong>建议下一步：</strong>${escapeHtml(candidateNextStep(candidate))}</p>
    <h4>证据</h4>
    ${evidence.length ? `<ul class="file-list">${evidence.map(item => `<li>${escapeHtml(formatEvidenceText(item))}</li>`).join('')}</ul>` : '<p class="empty">无。</p>'}
  </div>`
}

function listHtml(items, className) {
  if (!items.length) return '<p class="empty">无。</p>'
  return `<ul class="${className}">${items.map(item => `<li>${escapeHtml(formatTextItem(item))}</li>`).join('')}</ul>`
}

function formatInlineList(value) {
  return Array.isArray(value) && value.length ? value.join('、') : '无。'
}

function formatEvidenceMarkdown(item) {
  const source = `${item.sourceType || 'unknown'}:${item.sourceRef || ''}`
  const context = [item.date, item.project].filter(Boolean).join(' · ')
  return `**${source}**${context ? `（${context}）` : ''}：${item.summary || ''}`
}

function formatEvidenceText(item) {
  const source = `${item.sourceType || 'unknown'}:${item.sourceRef || ''}`
  const context = [item.date, item.project].filter(Boolean).join(' · ')
  return `${source}${context ? ` (${context})` : ''}: ${item.summary || ''}`
}

function candidateNextStep(candidate) {
  if (candidate.conflict === true || candidate.nestedScope === true || candidate.scopePath) {
    return '暂停；先由人工解决作用域或规则冲突，并重新审阅候选。当前信号不允许进入 instruction-plan。'
  }
  if (candidate.type === 'global_instruction' || candidate.type === 'project_instruction') {
    return '先单独确认候选，再生成准确 instruction-plan diff；只有第二次确认该 diff 后才能 apply。'
  }
  return '仅审阅此建议；不会自动创建、安装或运行任何产物。'
}

function memoryItemsFromProjects(projects, key) {
  return projects.flatMap(project =>
    (project[key] || []).map(item => ({
      text: item.text,
      project: project.project,
      sourceSessionIds: item.sourceSessionIds || project.sessionIds || [],
    })),
  )
}

function todayCompletedItems(report) {
  const outcomeItems = (report.outcomes || []).map(item => ({
    title: item.title || formatTextItem(item),
    body: item.body || '',
  }))
  const projectResults = (report.projectSections || []).flatMap(project =>
    (project.results || []).map(result => ({
      title: formatTextItem(result),
      body: project.path || project.project || '',
    })),
  )
  return uniqueByText([...outcomeItems, ...projectResults])
}

function matchesAnyCompletion(todo, completedItems) {
  const todoText = normalizeText(todo.text)
  if (!todoText) return false
  return completedItems.some(item => {
    const completedText = normalizeText(`${item.title || ''} ${item.body || ''}`)
    return textLooksRelated(todoText, completedText)
  })
}

function textLooksRelated(todoText, completedText) {
  if (!todoText || !completedText) return false
  if (todoText.length >= 4 && completedText.includes(todoText)) return true
  if (completedText.length >= 4 && todoText.includes(completedText)) return true

  const todoTokens = significantTokens(todoText)
  if (!todoTokens.length) return false
  const completedTokens = new Set(significantTokens(completedText))
  const hits = todoTokens.filter(token => completedTokens.has(token)).length
  return hits >= Math.min(2, todoTokens.length)
}

function significantTokens(text) {
  return text
    .split(/[\s,，.。;；:：/\\()[\]{}"'`]+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2)
}

function uniqueByText(items) {
  const seen = new Set()
  const result = []
  for (const item of items) {
    const key = normalizeText(`${item.title || ''} ${item.body || ''}`)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

function itemObjects(items, report, type) {
  return items
    .map(item => ({
      text: formatTextItem(item),
      project: typeof item === 'string' ? '' : item.project || '',
      sourceDate: report.date,
      sourceSessionIds: typeof item === 'string' ? report.appendix?.sessionIds || [] : item.sourceSessionIds || [],
      status: type === 'todo' ? 'open' : 'active',
    }))
    .filter(item => item.text)
}

function projectSectionList(value, fallback) {
  const source = Array.isArray(value) ? value : fallback
  return source.map(project => ({
    project: textFrom(project.project) || displayProjectName(project.path),
    path: textFrom(project.path),
    badge: textFrom(project.badge),
    results: textList(project.results),
    pending: textList(project.pending),
    ideas: textList(project.ideas),
    evidence: {
      sessionIds: textList(project.evidence?.sessionIds),
      filesModified: textList(project.evidence?.filesModified),
    },
  }))
}

function titledItems(value, fallback, options = {}) {
  const source = Array.isArray(value) ? value : fallback
  return source
    .map(item => {
      if (typeof item === 'string') return { title: item, body: '', icon: options.withIcon ? '•' : undefined }
      return {
        title: textFrom(item.title || item.text),
        body: textFrom(item.body || item.summary),
        icon: options.withIcon ? textFrom(item.icon || '•') : undefined,
      }
    })
    .filter(item => item.title || item.body)
}

function memoryItemList(value, fallback) {
  const source = Array.isArray(value) ? value : fallback
  return source
    .map(item => {
      if (typeof item === 'string') return { text: item, project: '', sourceSessionIds: [] }
      return {
        text: textFrom(item.text || item.title),
        project: textFrom(item.project),
        sourceSessionIds: textList(item.sourceSessionIds),
      }
    })
    .filter(item => item.text)
}

function normalizeTopLevelTasks(value, fallback) {
  const source = [
    ...memoryItemList(value?.tomorrowPriority, fallback.tomorrowPriority),
    ...memoryItemList(value?.backlog, fallback.backlog),
  ]
  const topLevel = uniqueMemoryItems(source.filter(item => isHighAttentionTodo(item)))
  return {
    tomorrowPriority: topLevel.slice(0, 5),
    backlog: topLevel.slice(5),
  }
}

function uniqueMemoryItems(items) {
  const seen = new Set()
  const result = []
  for (const item of items) {
    const key = `${item.project || ''}::${normalizeText(item.text)}`
    if (!item.text || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

function isHighAttentionTodo(item) {
  const text = formatTextItem(item)
  if (!text) return false
  return !looksLikeLowLevelTodo(text)
}

function looksLikeLowLevelTodo(text) {
  const value = String(text || '')
  if (/(^|[\s（(])\/(?:home|tmp|var|workspace|Users)\//.test(value)) return true
  if (/\b[\w.-]+\.(?:txt|log|json|jsonl|md|js|mjs|cjs|ts|tsx|jsx|py|sh|yml|yaml|toml|env)\b/i.test(value)) {
    return true
  }
  if (/(本地|临时|测试|test).{0,12}(token|api token|密钥|凭据)/i.test(value)) return true
  if (/(token|api token|密钥|凭据).{0,12}(本地|临时|测试|test)/i.test(value)) return true
  return false
}

function skippedEventWarnings(rawSummary) {
  const skipped = rawSummary.skippedEvents || {}
  const warnings = []
  if (Number(skipped.malformedLines || 0) > 0) {
    warnings.push(`扫描中有 ${skipped.malformedLines} 行 JSONL 无法解析，已跳过。`)
  }
  if (Number(skipped.missingTimestamp || 0) > 0) {
    warnings.push(`扫描中有 ${skipped.missingTimestamp} 个事件缺少 timestamp，无法归属到本地日期，已跳过。`)
  }
  if (Number(skipped.invalidTimestamp || 0) > 0) {
    warnings.push(`扫描中有 ${skipped.invalidTimestamp} 个事件 timestamp 无法解析，已跳过。`)
  }
  return warnings
}

function textList(value) {
  if (!Array.isArray(value)) return []
  return value.map(item => textFrom(item)).filter(Boolean)
}

function textFrom(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  if (value?.text) return textFrom(value.text)
  if (value?.title) return textFrom(value.title)
  return ''
}

function numberOr(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function displayProjectName(value) {
  const text = String(value || '').replace(/[\\/]+$/, '')
  const parts = text.split(/[\\/]/).filter(Boolean)
  return parts.at(-1) || text || '(unknown project)'
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttr(value) {
  return escapeHtml(value)
}
