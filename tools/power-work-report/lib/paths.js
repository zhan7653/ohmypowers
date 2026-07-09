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

export function resolveTimezone(explicitTimezone) {
  const timezone = explicitTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
  assertValidTimezone(timezone)
  return timezone
}

export function dateWindow({ codexHome, date, lookbackDays, timezone }) {
  assertValidDate(date)
  const daySet = new Set()
  const target = dateToUtc(date)
  const start = new Date(target)
  start.setUTCDate(start.getUTCDate() - lookbackDays)
  for (let offset = lookbackDays; offset >= 0; offset -= 1) {
    const value = new Date(target)
    value.setUTCDate(value.getUTCDate() - offset)
    daySet.add(utcDateString(value))
  }
  addPreviousUtcCarryDate({ daySet, start, timezone })
  addNextUtcCarryDate({ daySet, target, timezone })
  return Array.from(daySet)
    .sort()
    .map(day => ({
      date: day,
      path: sessionDirForDate(codexHome, day),
    }))
}

export function localDateForTimestamp(timestamp, timezone) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function assertValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    throw new Error(`Invalid --date "${date}". Expected YYYY-MM-DD.`)
  }
  const parsed = dateToUtc(date)
  if (utcDateString(parsed) !== date) {
    throw new Error(`Invalid --date "${date}". Expected a real calendar date.`)
  }
}

function assertValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
  } catch {
    throw new Error(`Invalid --timezone "${timezone}". Expected an IANA timezone such as Asia/Shanghai.`)
  }
}

function dateToUtc(date) {
  const [year, month, day] = String(date).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function utcDateString(date) {
  return date.toISOString().slice(0, 10)
}

function addNextUtcCarryDate({ daySet, target, timezone }) {
  if (!timezone) return
  const next = new Date(target)
  next.setUTCDate(next.getUTCDate() + 1)
  const nextDay = utcDateString(next)
  const localDateAtNextUtcMidnight = localDateForTimestamp(`${nextDay}T00:00:00.000Z`, timezone)
  if (daySet.has(localDateAtNextUtcMidnight)) daySet.add(nextDay)
}

function addPreviousUtcCarryDate({ daySet, start, timezone }) {
  if (!timezone) return
  const previous = new Date(start)
  previous.setUTCDate(previous.getUTCDate() - 1)
  const previousDay = utcDateString(previous)
  const localDateAtPreviousUtcEnd = localDateForTimestamp(`${previousDay}T23:59:59.999Z`, timezone)
  if (daySet.has(localDateAtPreviousUtcEnd)) daySet.add(previousDay)
}
