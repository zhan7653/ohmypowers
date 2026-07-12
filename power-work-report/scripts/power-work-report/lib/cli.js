import path from 'node:path'
import { promises as fs } from 'node:fs'
import { writeRawSummary } from './collector.js'
import { generateDraftWithCodex } from './codex-draft.js'
import { finalizeReport } from './finalize.js'
import { applyInstructionChange, planInstructionChange } from './instructions.js'
import { appendInstructionChange, readMemory, readMemorySnapshot, writeMemoryAtomically } from './memory.js'
import {
  buildFallbackDraft,
  buildMemoryProposal,
  buildReviewModel,
  renderHtml,
  renderMarkdown,
  renderReviewMarkdown,
} from './render.js'
import { pathsForDate, resolveCodexHome, resolveOutDir, resolveTimezone } from './paths.js'

export async function runCli(argv, hooks = {}) {
  const [command, ...rest] = argv
  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  const options = parseArgs(rest)
  const date = requiredOption(options, 'date')
  const codexHome = resolveCodexHome(options.codexHome)
  const outDir = resolveOutDir(options.outDir, codexHome)
  const paths = pathsForDate({ date, outDir })
  const collectOptions = {
    lookbackDays: parseLookbackDays(options.lookbackDays),
    timezone: resolveTimezone(options.timezone),
  }

  if (command === 'collect') {
    const result = await collectCommand({ date, codexHome, paths, collectOptions })
    console.log(JSON.stringify({ rawSummaryPath: result.rawSummaryPath }, null, 2))
    return
  }

  if (command === 'draft') {
    const memo = await readMemoOption(options.memoFile)
    const result = await draftCommand({ date, codexHome, paths, options, collectOptions, memo })
    console.log(JSON.stringify(result.paths, null, 2))
    return
  }

  if (command === 'run') {
    const memo = await readMemoOption(options.memoFile)
    await collectCommand({ date, codexHome, paths, collectOptions })
    const result = await draftCommand({ date, codexHome, paths, options, collectOptions, memo })
    console.log(JSON.stringify(result.paths, null, 2))
    return
  }

  if (command === 'render') {
    const result = await renderDraftCommand({ paths })
    console.log(JSON.stringify(result.paths, null, 2))
    return
  }

  if (command === 'finalize') {
    const result = await finalizeReport({ paths, allowFallback: Boolean(options.allowFallback) })
    console.log(JSON.stringify({ finalDir: result.finalDir, memoryFile: result.memoryFile }, null, 2))
    return
  }

  if (command === 'instruction-plan') {
    const result = await instructionPlanCommand({ date, codexHome, paths, options })
    console.log(JSON.stringify(result, null, 2))
    return
  }

  if (command === 'instruction-apply') {
    const result = await instructionApplyCommand({ paths, hooks })
    console.log(JSON.stringify(result, null, 2))
    return
  }

  throw new Error(`Unknown command "${command}".`)
}

async function collectCommand({ date, codexHome, paths, collectOptions }) {
  return writeRawSummary({
    date,
    codexHome,
    outDir: paths.draftDir,
    memoryFile: paths.memoryFile,
    ...collectOptions,
  })
}

async function draftCommand({ date, codexHome, paths, options, collectOptions, memo }) {
  await fs.mkdir(paths.draftDir, { recursive: true })
  const rawSummaryPath = path.join(paths.draftDir, 'raw-summary.json')
  let rawSummary
  try {
    rawSummary = JSON.parse(await fs.readFile(rawSummaryPath, 'utf8'))
  } catch {
    rawSummary = (
      await writeRawSummary({
        date,
        codexHome,
        outDir: paths.draftDir,
        memoryFile: paths.memoryFile,
        ...collectOptions,
      })
    ).summary
  }

  const lang = options.lang || 'zh-CN'
  let report
  try {
    report = await generateDraftWithCodex(rawSummary, {
      lang,
      codexBin: options.codexBin,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
      memo,
    })
    if (memo) report.personalReflection = memo
  } catch (error) {
    report = buildFallbackDraft(rawSummary, { lang, status: 'codex_failed' })
    if (memo) report.personalReflection = memo
    report.codexError = error instanceof Error ? error.message : String(error)
  }

  const memory = await readMemory(paths.memoryFile)
  const proposal = buildMemoryProposal(report)
  const review = buildReviewModel({ report, proposal, memory })
  proposal.review = review
  const reportJsonPath = path.join(paths.draftDir, 'report.json')
  const reportMdPath = path.join(paths.draftDir, 'report.md')
  const reportHtmlPath = path.join(paths.draftDir, 'report.html')
  const reviewPath = path.join(paths.draftDir, 'review.md')
  const proposalPath = path.join(paths.draftDir, 'memory-update.proposed.json')

  if (memo) await fs.writeFile(paths.memoPath, `${JSON.stringify(memo, null, 2)}\n`, 'utf8')
  await fs.writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await fs.writeFile(reportMdPath, renderMarkdown(report), 'utf8')
  await fs.writeFile(reportHtmlPath, renderHtml(report), 'utf8')
  await fs.writeFile(reviewPath, renderReviewMarkdown(review), 'utf8')
  await fs.writeFile(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8')

  return {
    report,
    paths: {
      reportJsonPath,
      reportMdPath,
      reportHtmlPath,
      reviewPath,
      rawSummaryPath,
      proposalPath,
      ...(memo ? { memoPath: paths.memoPath } : {}),
    },
  }
}

async function instructionPlanCommand({ date, codexHome, paths, options }) {
  const action = requiredOption(options, 'action')
  if (!['add', 'update', 'remove'].includes(action)) {
    throw new Error(`Invalid --action "${action}". Expected add, update, or remove.`)
  }
  const reportJsonPath = path.join(paths.draftDir, 'report.json')
  const report = await readRequiredJson(reportJsonPath)
  if (report.status === 'codex_failed') throw new Error('A codex_failed report cannot authorize an instruction change.')
  const candidate = selectInstructionCandidate(report, requiredOption(options, 'candidateId'))
  const confirmedCandidate = instructionCandidate(candidate, { confirmed: true, projectRoot: options.projectRoot })
  const proposal = await planInstructionChange({
    candidate: confirmedCandidate,
    action,
    sourceReport: reportJsonPath,
    codexHome,
    projectRoot: options.projectRoot,
  })
  await fs.mkdir(paths.draftDir, { recursive: true })
  await fs.writeFile(paths.instructionProposalPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8')
  await fs.writeFile(paths.instructionDiffPath, proposal.exactDiff, 'utf8')
  return {
    date,
    candidateId: proposal.candidateId,
    action: proposal.action,
    proposalId: proposal.proposalId,
    targetScope: proposal.target.scope,
    targetPath: proposal.target.path,
    instructionProposalPath: paths.instructionProposalPath,
    instructionDiffPath: paths.instructionDiffPath,
  }
}

async function instructionApplyCommand({ paths, hooks }) {
  const proposal = await readRequiredJson(paths.instructionProposalPath)
  let candidate
  try {
    const report = await readRequiredJson(proposal.sourceReport)
    candidate = instructionCandidate(selectInstructionCandidate(report, proposal.candidateId), { confirmed: true })
  } catch (error) {
    throw new Error(`Cannot verify the instruction candidate against its source report: ${error.message}`)
  }
  const memorySnapshot = await readMemorySnapshot(paths.memoryFile)
  const audit = await applyInstructionChange({
    proposal,
    candidate,
    persistAudit: async value => {
      const nextMemory = appendInstructionChange(memorySnapshot.memory, value)
      await writeMemoryAtomically(paths.memoryFile, nextMemory, {
        expectedExists: memorySnapshot.exists,
        expectedBytes: memorySnapshot.rawBytes,
        expectedMode: memorySnapshot.mode,
        beforeCommit: hooks.beforeAuditCommit
          ? details => hooks.beforeAuditCommit({ ...details, audit: value, memory: nextMemory })
          : undefined,
        afterInstall: hooks.afterAuditInstall
          ? details => hooks.afterAuditInstall({ ...details, audit: value, memory: nextMemory })
          : undefined,
      })
    },
  })
  return {
    ...audit,
    changeId: audit.proposalId,
    memoryFile: paths.memoryFile,
    instructionProposalPath: paths.instructionProposalPath,
    instructionDiffPath: paths.instructionDiffPath,
    reloadRequired: true,
  }
}

function selectInstructionCandidate(report, candidateId) {
  const insights = report?.reusableInsights || {}
  const candidates = [
    ...(insights.globalInstructionCandidates || []),
    ...(insights.projectInstructionCandidates || []),
  ].filter(candidate => candidate?.id === candidateId)
  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one instruction candidate with id "${candidateId}"; found ${candidates.length}.`)
  }
  return candidates[0]
}

function instructionCandidate(candidate, options = {}) {
  const scope = candidate.type === 'global_instruction' ? 'global' : candidate.type === 'project_instruction' ? 'project' : ''
  if (!scope) throw new Error(`Candidate "${candidate.id}" is not a global or project instruction candidate.`)
  return {
    ...candidate,
    scope,
    instruction: candidate.recommendation,
    confirmationStatus: options.confirmed === true ? 'confirmed' : candidate.confirmationStatus,
    confirmed: options.confirmed === true,
    projectRoot: scope === 'project' ? options.projectRoot : undefined,
  }
}

async function readMemoOption(filePath) {
  if (!filePath) return undefined
  let content
  try {
    content = await fs.readFile(path.resolve(filePath), 'utf8')
  } catch (error) {
    throw new Error(`Memo file is missing or unreadable: ${path.resolve(filePath)}: ${error.message}`)
  }
  if (Buffer.byteLength(content, 'utf8') > 16 * 1024) {
    throw new Error(`Memo file is too large: ${path.resolve(filePath)}. Maximum size is 16384 bytes.`)
  }
  const trimmed = content.trim()
  if (!trimmed) throw new Error(`Memo file is empty: ${path.resolve(filePath)}.`)

  let memo
  if (path.extname(filePath).toLowerCase() === '.json' || trimmed.startsWith('{')) {
    try {
      memo = JSON.parse(trimmed)
    } catch (error) {
      throw new Error(`Memo JSON is invalid: ${path.resolve(filePath)}: ${error.message}`)
    }
    if (!memo || typeof memo !== 'object' || Array.isArray(memo)) throw new Error('Memo JSON must be an object.')
    if (memo.status === 'provided') {
      if (memo.provenance !== 'user_memo') throw new Error('Provided memo JSON must use provenance "user_memo".')
      if (typeof memo.summary !== 'string' || !memo.summary.trim()) throw new Error('Provided memo JSON requires a non-empty summary.')
      memo = { status: 'provided', summary: memo.summary.trim(), provenance: 'user_memo' }
    } else if (memo.status === 'skipped' || memo.status === 'not_provided') {
      memo = { status: memo.status, summary: '', provenance: 'none' }
    } else {
      throw new Error('Memo JSON status must be provided, skipped, or not_provided.')
    }
  } else {
    memo = { status: 'provided', summary: trimmed, provenance: 'user_memo' }
  }
  if (memo.summary.length > 4000) throw new Error('Memo summary is too large. Maximum length is 4000 characters.')
  return memo
}

async function renderDraftCommand({ paths }) {
  const reportJsonPath = path.join(paths.draftDir, 'report.json')
  const reportMdPath = path.join(paths.draftDir, 'report.md')
  const reportHtmlPath = path.join(paths.draftDir, 'report.html')
  const reviewPath = path.join(paths.draftDir, 'review.md')
  const proposalPath = path.join(paths.draftDir, 'memory-update.proposed.json')
  const report = await readRequiredJson(reportJsonPath)
  const proposal = await readRequiredJson(proposalPath)
  const memory = await readMemory(paths.memoryFile)
  const review = buildReviewModel({ report, proposal, memory })
  proposal.review = review

  await fs.writeFile(reportMdPath, renderMarkdown(report), 'utf8')
  await fs.writeFile(reportHtmlPath, renderHtml(report), 'utf8')
  await fs.writeFile(reviewPath, renderReviewMarkdown(review), 'utf8')
  await fs.writeFile(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8')

  return {
    report,
    proposal,
    paths: {
      reportJsonPath,
      reportMdPath,
      reportHtmlPath,
      reviewPath,
      proposalPath,
    },
  }
}

function parseArgs(args) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument "${arg}".`)
    }
    const key = toCamel(arg.slice(2))
    if (key === 'allowFallback') {
      options[key] = true
      continue
    }
    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}.`)
    }
    options[key] = value
    index += 1
  }
  return options
}

function requiredOption(options, key) {
  if (!options[key]) throw new Error(`Missing required --${toKebab(key)} option.`)
  return options[key]
}

function parseLookbackDays(value) {
  if (value === undefined) return 30
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`Invalid --lookback-days "${value}". Expected a non-negative integer.`)
  }
  return number
}

async function readRequiredJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Required JSON file is missing or invalid: ${filePath}: ${error.message}`)
  }
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

function toKebab(value) {
  return value.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
}

function printHelp() {
  console.log(`power-work-report

Usage:
  power-work-report collect --date YYYY-MM-DD [--out-dir DIR] [--codex-home DIR] [--lookback-days N] [--timezone TZ]
  power-work-report draft --date YYYY-MM-DD [--out-dir DIR] [--codex-home DIR] [--lookback-days N] [--timezone TZ] [--lang zh-CN|en] [--codex-bin BIN] [--model MODEL] [--reasoning-effort EFFORT] [--memo-file PATH]
  power-work-report run --date YYYY-MM-DD [--out-dir DIR] [--codex-home DIR] [--lookback-days N] [--timezone TZ] [--lang zh-CN|en] [--codex-bin BIN] [--model MODEL] [--reasoning-effort EFFORT] [--memo-file PATH]
  power-work-report render --date YYYY-MM-DD [--out-dir DIR]
  power-work-report finalize --date YYYY-MM-DD [--out-dir DIR] [--allow-fallback]
  power-work-report instruction-plan --date YYYY-MM-DD --candidate-id ID --action add|update|remove [--project-root DIR] [--codex-home DIR] [--out-dir DIR]
  power-work-report instruction-apply --date YYYY-MM-DD [--codex-home DIR] [--out-dir DIR]

V1 is manual: run/draft creates report files plus draft/review.md only; finalize must be explicit.`)
}
