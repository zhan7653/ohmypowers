import path from 'node:path'
import { promises as fs } from 'node:fs'
import { writeRawSummary } from './collector.js'
import { generateDraftWithCodex } from './codex-draft.js'
import { finalizeReport } from './finalize.js'
import { buildFallbackDraft, buildMemoryProposal, renderHtml, renderMarkdown } from './render.js'
import { pathsForDate, resolveCodexHome, resolveOutDir } from './paths.js'

export async function runCli(argv) {
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

  if (command === 'collect') {
    const result = await collectCommand({ date, codexHome, paths })
    console.log(JSON.stringify({ rawSummaryPath: result.rawSummaryPath }, null, 2))
    return
  }

  if (command === 'draft') {
    const result = await draftCommand({ date, codexHome, paths, options })
    console.log(JSON.stringify(result.paths, null, 2))
    return
  }

  if (command === 'run') {
    await collectCommand({ date, codexHome, paths })
    const result = await draftCommand({ date, codexHome, paths, options })
    console.log(JSON.stringify(result.paths, null, 2))
    return
  }

  if (command === 'finalize') {
    const result = await finalizeReport({ paths, allowFallback: Boolean(options.allowFallback) })
    console.log(JSON.stringify({ finalDir: result.finalDir, memoryFile: result.memoryFile }, null, 2))
    return
  }

  if (command === 'screenshot') {
    const result = await screenshotCommand({ paths, options })
    console.log(JSON.stringify(result, null, 2))
    return
  }

  throw new Error(`Unknown command "${command}".`)
}

async function collectCommand({ date, codexHome, paths }) {
  return writeRawSummary({ date, codexHome, outDir: paths.draftDir })
}

async function draftCommand({ date, codexHome, paths, options }) {
  await fs.mkdir(paths.draftDir, { recursive: true })
  const rawSummaryPath = path.join(paths.draftDir, 'raw-summary.json')
  let rawSummary
  try {
    rawSummary = JSON.parse(await fs.readFile(rawSummaryPath, 'utf8'))
  } catch {
    rawSummary = (await writeRawSummary({ date, codexHome, outDir: paths.draftDir })).summary
  }

  const lang = options.lang || 'zh-CN'
  let report
  try {
    report = await generateDraftWithCodex(rawSummary, {
      lang,
      codexBin: options.codexBin,
      cwd: process.cwd(),
    })
  } catch (error) {
    report = buildFallbackDraft(rawSummary, { lang, status: 'codex_failed' })
    report.codexError = error instanceof Error ? error.message : String(error)
  }

  const proposal = buildMemoryProposal(report)
  const reportJsonPath = path.join(paths.draftDir, 'report.json')
  const reportMdPath = path.join(paths.draftDir, 'report.md')
  const reportHtmlPath = path.join(paths.draftDir, 'report.html')
  const proposalPath = path.join(paths.draftDir, 'memory-update.proposed.json')

  await fs.writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await fs.writeFile(reportMdPath, renderMarkdown(report), 'utf8')
  await fs.writeFile(reportHtmlPath, renderHtml(report), 'utf8')
  await fs.writeFile(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8')

  return {
    report,
    paths: {
      reportJsonPath,
      reportMdPath,
      reportHtmlPath,
      rawSummaryPath,
      proposalPath,
    },
  }
}

async function screenshotCommand({ paths, options }) {
  const htmlPath = options.html ? path.resolve(options.html) : path.join(paths.draftDir, 'report.html')
  const screenshotDir = options.screenshotDir ? path.resolve(options.screenshotDir) : path.join(paths.draftDir, 'screenshots')
  await fs.stat(htmlPath)
  const { screenshotReport } = await import('./screenshot.js')
  return screenshotReport({ htmlPath, outDir: screenshotDir })
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

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

function toKebab(value) {
  return value.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
}

function printHelp() {
  console.log(`power-work-report

Usage:
  power-work-report collect --date YYYY-MM-DD [--out-dir DIR] [--codex-home DIR]
  power-work-report draft --date YYYY-MM-DD [--out-dir DIR] [--codex-home DIR] [--lang zh-CN|en] [--codex-bin BIN]
  power-work-report run --date YYYY-MM-DD [--out-dir DIR] [--codex-home DIR] [--lang zh-CN|en] [--codex-bin BIN]
  power-work-report finalize --date YYYY-MM-DD [--out-dir DIR] [--allow-fallback]
  power-work-report screenshot --date YYYY-MM-DD [--out-dir DIR] [--html FILE] [--screenshot-dir DIR]

V1 is manual: run/draft creates a draft only; finalize must be explicit.`)
}
