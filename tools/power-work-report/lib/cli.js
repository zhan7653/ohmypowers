import path from 'node:path'
import { promises as fs } from 'node:fs'
import { writeRawSummary } from './collector.js'
import { generateDraftWithCodex } from './codex-draft.js'
import { finalizeReport } from './finalize.js'
import { buildFallbackDraft, buildMemoryProposal, renderMarkdown } from './render.js'
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
    await draftCommand({ date, codexHome, paths, options })
    const result = await finalizeReport({
      paths,
      allowFallback: Boolean(options.allowFallback),
      force: Boolean(options.force),
    })
    console.log(JSON.stringify({ reportMdFile: result.reportMdFile, memoryFile: result.memoryFile }, null, 2))
    return
  }

  if (command === 'finalize') {
    const result = await finalizeReport({
      paths,
      allowFallback: Boolean(options.allowFallback),
      force: Boolean(options.force),
    })
    console.log(JSON.stringify({ reportMdFile: result.reportMdFile, memoryFile: result.memoryFile }, null, 2))
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
  const memory = await readJson(paths.memoryFile, { schemaVersion: 1, todos: [], ideas: [], reports: [] })
  let report
  try {
    report = await generateDraftWithCodex(rawSummary, {
      lang,
      codexBin: options.codexBin,
      cwd: process.cwd(),
      memory,
    })
  } catch (error) {
    report = buildFallbackDraft(rawSummary, { lang, status: 'codex_failed', memory })
    report.codexError = error instanceof Error ? error.message : String(error)
  }

  const proposal = buildMemoryProposal(report)
  const reportJsonPath = path.join(paths.draftDir, 'report.json')
  const reportMdPath = path.join(paths.draftDir, 'report.md')
  const proposalPath = path.join(paths.draftDir, 'memory-update.proposed.json')

  await fs.writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await fs.writeFile(reportMdPath, renderMarkdown(report), 'utf8')
  await fs.writeFile(proposalPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8')

  return {
    report,
    paths: {
      reportJsonPath,
      reportMdPath,
      rawSummaryPath,
      proposalPath,
    },
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch {
    return fallback
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
    if (key === 'allowFallback' || key === 'force') {
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
  power-work-report run --date YYYY-MM-DD [--out-dir DIR] [--codex-home DIR] [--lang zh-CN|en] [--codex-bin BIN] [--force]
  power-work-report finalize --date YYYY-MM-DD [--out-dir DIR] [--allow-fallback] [--force]

Markdown-first workflow: the skill confirms report intent with the user before run; run writes the final report.md and merges memory.`)
}
