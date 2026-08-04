#!/usr/bin/env node

import { writeSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const allowedPhases = new Set(['alignment', 'launch', 'authorized', 'handoff'])
const args = process.argv.slice(2)
const statePath = args[0]
const phaseIndex = args.indexOf('--phase')
const phase = phaseIndex === -1 ? 'alignment' : args[phaseIndex + 1]

if (!statePath || !allowedPhases.has(phase)) {
  console.error(
    'usage: node validate-decision-state.mjs <decision-snapshot.md> ' +
      '[--phase alignment|launch|authorized|handoff]',
  )
  process.exit(2)
}

const text = await readFile(statePath, 'utf8')
const errors = validateDecisionState(text, phase)
if (errors.length > 0) {
  writeSync(2, `${errors.map(error => `decision state invalid: ${error}`).join('\n')}\n`)
  process.exitCode = 1
} else {
  console.log(`decision state valid for ${phase}: ${statePath}`)
}

function validateDecisionState(text, phase) {
  const errors = []
  const lines = text.replaceAll('\r\n', '\n').split('\n')
  if (lines[0] !== '# Decision Snapshot') errors.push('missing `# Decision Snapshot` heading')
  if (!lines.includes('## Decisions')) errors.push('missing `## Decisions` section')

  const decisions = []
  for (const line of lines) {
    if (!line.startsWith('- D')) continue
    const match = line.match(
      /^- (D(\d{3,})) \[(pending|confirmed|delegated|rejected|superseded)\]:? (.+)$/,
    )
    if (!match) {
      errors.push(`malformed decision entry: ${line}`)
      continue
    }
    const [, id, number, status, statement] = match
    if (isPlaceholder(statement)) errors.push(`${id} has an empty or placeholder statement`)
    decisions.push({ id, number: Number(number), status })
  }

  const ids = decisions.map(decision => decision.id)
  if (new Set(ids).size !== ids.length) errors.push('decision IDs must be unique')
  const numbers = decisions.map(decision => decision.number)
  for (let index = 0; index < numbers.length; index += 1) {
    if (numbers[index] !== index + 1) {
      errors.push('decision IDs must remain ordered and contiguous; retain rejected or superseded entries')
      break
    }
  }

  const nextId = fieldValue(lines, 'Next decision ID')
  const expectedNext = `D${String(decisions.length + 1).padStart(3, '0')}`
  if (nextId !== expectedNext) {
    errors.push(`Next decision ID must be ${expectedNext} so IDs remain contiguous`)
  }

  for (const field of ['Thread', 'Outcome', 'Scope / non-goals', 'Launch basis', 'Stop / reopen conditions', 'Final carrier', 'Overall launch confirmation', 'Handoff status']) {
    if (fieldValue(lines, field) === undefined) errors.push(`missing \`${field}\` field`)
  }
  if (isPlaceholder(fieldValue(lines, 'Thread'))) errors.push('Thread must identify the current session')

  if (phase !== 'alignment') {
    const pending = decisions.filter(decision => decision.status === 'pending')
    if (pending.length > 0) errors.push(`pending decision IDs block launch: ${pending.map(item => item.id).join(', ')}`)
    for (const field of ['Outcome', 'Scope / non-goals', 'Launch basis', 'Stop / reopen conditions', 'Final carrier']) {
      if (isPlaceholder(fieldValue(lines, field))) errors.push(`${field} must be complete before launch`)
    }
    const carrier = fieldValue(lines, 'Final carrier') || ''
    if (!/\b(issue|pr|commit)\b/i.test(carrier)) {
      errors.push('Final carrier must identify an Issue, PR, or commit before source-writing launch')
    }
  }

  if (phase === 'authorized' || phase === 'handoff') {
    if (!/^confirmed\b/i.test(fieldValue(lines, 'Overall launch confirmation') || '')) {
      errors.push('whole launch confirmation must be recorded before source writes')
    }
  }
  if (phase === 'handoff' && !/^complete\b/i.test(fieldValue(lines, 'Handoff status') || '')) {
    errors.push('handoff status must be complete before deleting the decision state')
  }

  return errors
}

function fieldValue(lines, name) {
  const prefix = `- ${name}:`
  const index = lines.findIndex(line => line.startsWith(prefix))
  if (index === -1) return undefined
  const values = [lines[index].slice(prefix.length).trim()]
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor]
    if (line.startsWith('- ') || line.startsWith('## ')) break
    if (line.startsWith('  ')) values.push(line.trim())
    else if (line.trim()) break
  }
  return values.filter(Boolean).join(' ').trim()
}

function isPlaceholder(value) {
  if (value === undefined) return true
  const normalized = value.trim()
  return !normalized || normalized.toLowerCase() === 'pending' || /<[^>]+>/.test(normalized)
}
