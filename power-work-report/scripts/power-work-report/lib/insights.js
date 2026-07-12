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
  if (!value || typeof value !== 'object' || Array.isArray(value)) return normalizedFallback
  if (value.status === 'skipped') return skippedPersonalReflection()
  if (value.status === 'not_provided') return emptyPersonalReflection()
  const summary = boundedText(value.summary, MEMO_LIMIT)
  if (value.status === 'provided' && summary) return providedPersonalReflection(summary)
  return normalizedFallback
}

export function normalizeReusableInsights(value, options = {}) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const allowedEvidence = evidenceAllowlist(options.rawSummary, options.personalReflection)
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
      const normalized = normalizeCandidate(candidate, type, allowedEvidence)
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

function normalizeCandidate(value, type, allowedEvidence) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const recommendation = boundedText(value.recommendation, TEXT_LIMIT)
  const scope = boundedText(value.scope, TEXT_LIMIT)
  if (!recommendation || !scope) return null
  if (isInstructionType(type) && isForbiddenInstructionRecommendation(recommendation)) return null

  const provenance = value.provenance === 'user_nominated' ? 'user_nominated' : 'automatic'
  const evidence = uniqueEvidence(
    (Array.isArray(value.evidence) ? value.evidence : [])
      .map(item => normalizeEvidence(item, allowedEvidence))
      .filter(Boolean),
  )
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

function normalizeEvidence(value, allowedEvidence) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const sourceType = VALID_SOURCE_TYPES.has(value.sourceType) ? value.sourceType : ''
  const sourceRef = boundedText(value.sourceRef, 1000)
  const date = boundedText(value.date, 32)
  const project = boundedText(value.project, 1000)
  const summary = boundedText(value.summary, EVIDENCE_SUMMARY_LIMIT)
  const reportStatus = String(value.reportStatus ?? value.sourceStatus ?? value.status ?? '').toLowerCase()
  if (!sourceType || !sourceRef || !date || !summary) return null
  if (sourceType === 'report' && INVALID_REPORT_STATUSES.has(reportStatus)) return null
  if (sourceType === 'report' && /(?:^|[/\\])draft(?:[/\\]|$)/i.test(sourceRef)) return null
  if (allowedEvidence[sourceType].size && !allowedEvidence[sourceType].has(sourceRef)) return null
  return { date, project, sourceType, sourceRef, summary }
}

function evidenceAllowlist(rawSummary, personalReflection) {
  const allowed = {
    session: new Set(),
    report: new Set(),
    user_memo: new Set(),
  }
  for (const session of rawSummary?.sessions || []) {
    if (session.id) allowed.session.add(String(session.id))
    if (session.filePath) allowed.session.add(String(session.filePath))
  }
  for (const report of rawSummary?.context?.finalizedReports || []) {
    if (report.sourceRef) allowed.report.add(String(report.sourceRef))
  }
  if (personalReflection?.status === 'provided') {
    allowed.user_memo.add(`user-memo:${rawSummary?.date || ''}`)
  }
  return allowed
}

function stableCandidateId(type, recommendation, scope) {
  return crypto.createHash('sha1').update(`${type}\n${scope}\n${recommendation}`).digest('hex').slice(0, 16)
}

function uniqueEvidence(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = `${item.sourceType}\n${item.sourceRef}\n${item.date}\n${item.project}`
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
