import os from 'node:os'
import path from 'node:path'

export function resolveCodexHome(explicitHome) {
  if (explicitHome) return path.resolve(explicitHome)
  if (process.env.CODEX_HOME) return path.resolve(process.env.CODEX_HOME)
  return path.join(os.homedir(), '.codex')
}

export function resolveOutDir(explicitOutDir, codexHome = resolveCodexHome()) {
  if (explicitOutDir) return path.resolve(explicitOutDir)
  return path.join(codexHome, 'daily-reports')
}

export function pathsForDate({ date, outDir }) {
  const root = path.resolve(outDir)
  const dayDir = path.join(root, date)
  return {
    root,
    dayDir,
    draftDir: path.join(dayDir, 'draft'),
    finalDir: path.join(dayDir, 'final'),
    memoryFile: path.join(root, 'memory.json'),
  }
}

export function sessionDirForDate(codexHome, date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error(`Invalid --date "${date}". Expected YYYY-MM-DD.`)
  const [, year, month, day] = match
  return path.join(codexHome, 'sessions', year, month, day)
}
