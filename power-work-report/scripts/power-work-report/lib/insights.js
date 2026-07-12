import crypto from 'node:crypto'

const MEMO_LIMIT = 4000
const TEXT_LIMIT = 1200
const EVIDENCE_SUMMARY_LIMIT = 800
const CANDIDATE_GROUPS = {
  skillCandidates: 'skill',
  automationCandidates: 'automation',
  globalInstructionCandidates: 'global_instruction',
  projectInstructionCandidates: 'project_instruction',
}
const VALID_SOURCE_TYPES = new Set(['session', 'report', 'user_memo'])
const INVALID_REPORT_STATUSES = new Set(['codex_failed', 'draft', 'fallback'])

export function normalizeMemoInput(value) {
  if (value === undefined || value === null) return emptyPersonalReflection()
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value.status === 'skipped') return skippedPersonalReflection()
    if (value.status === 'not_provided') return emptyPersonalReflection()
    const summary = boundedText(value.summary ?? value.memo ?? value.text, MEMO_LIMIT)
    return summary ? providedPersonalReflection(summary) : emptyPersonalReflection()
  }
  const summary = boundedText(value, MEMO_LIMIT)
  return summary ? providedPersonalReflection(summary) : skippedPersonalReflection()
}

export function normalizePersonalReflection(value, fallback = emptyPersonalReflection()) {
  const normalizedFallback = normalizeMemoInput(fallback)
  if (normalizedFallback.status === 'provided') {
    const summary = boundedText(value?.summary, MEMO_LIMIT)
    return value?.status === 'provided' && summary ? providedPersonalReflection(summary) : normalizedFallback
  }
  if (normalizedFallback.status === 'skipped') return skippedPersonalReflection()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return normalizedFallback
  if (value.status === 'skipped') return skippedPersonalReflection()
  if (value.status === 'not_provided') return emptyPersonalReflection()
  const summary = boundedText(value.summary, MEMO_LIMIT)
  if (value.status === 'provided' && summary) return providedPersonalReflection(summary)
  return normalizedFallback
}

export function normalizeReusableInsights(value, options = {}) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const evidenceRecords = evidenceCatalog(options.rawSummary, options.personalReflection)
  const warnings = textList(input.warnings)
  const result = {
    skillCandidates: [],
    automationCandidates: [],
    globalInstructionCandidates: [],
    projectInstructionCandidates: [],
    warnings,
  }

  for (const [group, type] of Object.entries(CANDIDATE_GROUPS)) {
    const candidates = Array.isArray(input[group]) ? input[group] : []
    for (const candidate of candidates) {
      const normalized = normalizeCandidate(candidate, type, evidenceRecords)
      if (!normalized) continue
      result[groupForType(normalized.type)].push(normalized)
    }
  }

  for (const group of Object.keys(CANDIDATE_GROUPS)) {
    result[group].sort((a, b) => a.id.localeCompare(b.id))
  }

  return {
    skillCandidates: result.skillCandidates,
    automationCandidates: result.automationCandidates,
    globalInstructionCandidates: result.globalInstructionCandidates,
    projectInstructionCandidates: result.projectInstructionCandidates,
    warnings: result.warnings,
  }
}

export function emptyPersonalReflection() {
  return { status: 'not_provided', summary: '', provenance: 'none' }
}

export function emptyReusableInsights(warnings = []) {
  return {
    skillCandidates: [],
    automationCandidates: [],
    globalInstructionCandidates: [],
    projectInstructionCandidates: [],
    warnings: textList(warnings),
  }
}

function skippedPersonalReflection() {
  return { status: 'skipped', summary: '', provenance: 'none' }
}

function providedPersonalReflection(summary) {
  return { status: 'provided', summary, provenance: 'user_memo' }
}

function normalizeCandidate(value, type, evidenceRecords) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const recommendation = boundedText(value.recommendation, TEXT_LIMIT)
  const scope = boundedText(value.scope, TEXT_LIMIT)
  if (!recommendation || !scope) return null
  if (isInstructionType(type) && isForbiddenInstructionRecommendation(recommendation)) return null

  const provenance = value.provenance === 'user_nominated' ? 'user_nominated' : 'automatic'
  const evidence = uniqueEvidence(
    (Array.isArray(value.evidence) ? value.evidence : [])
      .map(item => normalizeEvidence(item, evidenceRecords))
      .filter(Boolean),
  ).map(({ canonicalId, ...item }) => item)
  if (provenance === 'automatic' && evidence.length < 2) return null
  if (provenance === 'user_nominated' && evidence.length < 1) return null
  if (provenance === 'user_nominated' && evidence.length === 1 && evidence[0].sourceType !== 'user_memo') return null

  const dates = unique(evidence.map(item => item.date))
  const projects = unique(evidence.map(item => item.project))
  let normalizedType = type
  let normalizedScope = scope
  if (type === 'global_instruction' && provenance === 'automatic' && projects.length < 2) {
    if (projects.length !== 1) return null
    normalizedType = 'project_instruction'
    normalizedScope = projects[0]
  }

  const rationale = boundedText(value.rationale, TEXT_LIMIT)
  const expectedBenefit = boundedText(value.expectedBenefit, TEXT_LIMIT)
  const confirmationStatus = 'unconfirmed'
  const id = boundedText(value.id, 160) || stableCandidateId(normalizedType, recommendation, normalizedScope)

  return {
    id,
    type: normalizedType,
    recommendation,
    scope: normalizedScope,
    evidenceCount: evidence.length,
    dates,
    projects,
    evidence,
    rationale,
    expectedBenefit,
    provenance,
    confirmationStatus,
  }
}

function groupForType(type) {
  return Object.entries(CANDIDATE_GROUPS).find(([, candidateType]) => candidateType === type)?.[0]
}

function isInstructionType(type) {
  return type === 'global_instruction' || type === 'project_instruction'
}

function isForbiddenInstructionRecommendation(value) {
  const text = String(value || '').trim()
  if (/^(?:todo|to[- ]?do|待办|明天|tomorrow\b|follow[- ]?up\b)/i.test(text)) return true
  if (/^(?:today\b|currently\b|this (?:week|sprint)\b|temporary\b|今日|今天|当前|目前|本周|临时|暂时)/i.test(text)) return true
  if (
    /(?:\b(?:issue|pr|pull request)\s*#?\d+\b|(?:Issue|PR|合并请求|问题)\s*#?\d+)/i.test(text) &&
    /(?:\b(?:done|complete|completed|closed|merged|open|in progress|blocked)\b|已完成|完成了?|已关闭|已合并|进行中|阻塞)/i.test(text)
  ) return true
  if (/(?:\b(?:maybe|perhaps|possibly|probably|might|could be|guess|speculation)\b|也许|可能|大概|猜测|推测|似乎)/i.test(text)) return true
  if (/^(?:(?:we|i|the team|previously|historically)\b.*\b(?:used|did|completed|fixed|ran|was|were)\b|(?:我们|我|团队|之前|过去|历史上).*(?:已经|曾经|完成了|修复了|运行了|做了))/i.test(text)) return true
  return false
}

function normalizeEvidence(value, evidenceRecords) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const sourceType = VALID_SOURCE_TYPES.has(value.sourceType) ? value.sourceType : ''
  const sourceRef = boundedText(value.sourceRef, 1000)
  const summary = boundedText(value.summary, EVIDENCE_SUMMARY_LIMIT)
  const reportStatus = String(value.reportStatus ?? value.sourceStatus ?? value.status ?? '').toLowerCase()
  if (!sourceType || !sourceRef || !summary) return null
  if (sourceType === 'report' && INVALID_REPORT_STATUSES.has(reportStatus)) return null
  if (sourceType === 'report' && /(?:^|[/\\])draft(?:[/\\]|$)/i.test(sourceRef)) return null
  const record = evidenceRecords[sourceType].get(sourceRef)
  if (!record || !record.date) return null
  const suppliedDate = boundedText(value.date, 32)
  if (suppliedDate && suppliedDate !== record.date) return null
  const project = canonicalProject(record, boundedText(value.project, 1000))
  if (project === null) return null
  return {
    canonicalId: record.canonicalId,
    date: record.date,
    project,
    sourceType,
    sourceRef: record.sourceRef,
    summary,
  }
}

function evidenceCatalog(rawSummary, personalReflection) {
  const catalog = {
    session: new Map(),
    report: new Map(),
    user_memo: new Map(),
  }
  for (const session of rawSummary?.sessions || []) {
    const id = boundedText(session.id, 1000)
    const filePath = boundedText(session.filePath, 1000)
    const sourceRef = id || filePath
    if (!sourceRef) continue
    const record = {
      canonicalId: `session:${sourceRef}`,
      sourceRef,
      date: boundedText(rawSummary?.date, 32),
      projects: unique([boundedText(session.cwd, 1000)]),
      allowBlankProject: false,
    }
    registerAlias(catalog.session, id, record)
    registerAlias(catalog.session, filePath, record)
  }
  for (const report of rawSummary?.context?.finalizedReports || []) {
    const sourceRef = boundedText(report.sourceRef, 1000)
    if (!sourceRef) continue
    const record = {
      canonicalId: `report:${sourceRef}`,
      sourceRef,
      date: boundedText(report.body?.date || report.date, 32),
      projects: reportProjects(report.body),
      allowBlankProject: false,
    }
    registerAlias(catalog.report, sourceRef, record)
  }
  if (personalReflection?.status === 'provided') {
    const date = boundedText(rawSummary?.date, 32)
    const sourceRef = `user-memo:${date}`
    const record = {
      canonicalId: `user_memo:${date}`,
      sourceRef,
      date,
      projects: currentProjects(rawSummary),
      allowBlankProject: true,
    }
    registerAlias(catalog.user_memo, sourceRef, record)
  }
  return catalog
}

function registerAlias(map, alias, record) {
  if (!alias) return
  const current = map.get(alias)
  if (current && current.canonicalId !== record.canonicalId) {
    map.set(alias, null)
    return
  }
  if (current !== null) map.set(alias, record)
}

function canonicalProject(record, suppliedProject) {
  if (suppliedProject) return record.projects.includes(suppliedProject) ? suppliedProject : null
  if (record.allowBlankProject) return ''
  if (record.projects.length === 0) return ''
  if (record.projects.length === 1) return record.projects[0]
  return null
}

function reportProjects(body) {
  return unique(
    (Array.isArray(body?.projectSections) ? body.projectSections : []).map(section =>
      boundedText(section?.path || section?.project, 1000),
    ),
  )
}

function currentProjects(rawSummary) {
  return unique([
    ...(rawSummary?.projects || []).map(project => boundedText(project?.project, 1000)),
    ...(rawSummary?.sessions || []).map(session => boundedText(session?.cwd, 1000)),
  ])
}

function stableCandidateId(type, recommendation, scope) {
  return crypto.createHash('sha1').update(`${type}\n${scope}\n${recommendation}`).digest('hex').slice(0, 16)
}

function uniqueEvidence(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.canonicalId
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function boundedText(value, limit) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.slice(0, limit)
}

function textList(value) {
  return unique((Array.isArray(value) ? value : []).map(item => boundedText(item, TEXT_LIMIT)))
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}
