#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { writeSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const allowedPhases = new Set(['alignment', 'launch', 'authorized', 'handoff'])
const snapshotStartMarker = '-----BEGIN POWER-GAN DECISION SNAPSHOT-----'
const snapshotEndMarker = '-----END POWER-GAN DECISION SNAPSHOT-----'
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
const errors = validateDecisionState(text, phase, statePath)
if (errors.length > 0) {
  writeSync(2, `${errors.map(error => `decision state invalid: ${error}`).join('\n')}\n`)
  process.exitCode = 1
} else {
  const output = [`decision state valid for ${phase}: ${statePath}`]
  const renderedContent = phase === 'alignment' ? undefined : launchContent(text)
  if (renderedContent !== undefined) {
    output.push(`launch content sha256: ${contentDigest(renderedContent)}`)
  }
  if (phase === 'launch') {
    output.push(snapshotStartMarker)
    writeSync(1, `${output.join('\n')}\n${renderedContent}${snapshotEndMarker}\n`)
  } else {
    writeSync(1, `${output.join('\n')}\n`)
  }
}

function validateDecisionState(text, phase, ledgerPath) {
  const errors = []
  const lines = text.replaceAll('\r\n', '\n').split('\n')
  if (lines[0] !== '# Decision Snapshot') errors.push('missing `# Decision Snapshot` heading')
  if (!lines.includes('## Decisions')) errors.push('missing `## Decisions` section')

  const ledgerVersion = fieldValue(lines, 'Ledger version')
  const isPermanentLedger = ledgerVersion === '2'
  if (ledgerVersion !== undefined && !isPermanentLedger) {
    errors.push('Ledger version must be 2 when present')
  } else if (ledgerVersion === undefined && !isLegacyLedgerPath(ledgerPath)) {
    errors.push('Ledger version 2 is required outside the legacy temporary Ledger namespace')
  }

  const decisions = []
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    if (!/^- D\d/.test(line)) continue
    const match = line.match(
      /^- (D(\d{3,})) \[(pending|confirmed|delegated|rejected|superseded)\]:? (.+)$/,
    )
    if (!match) {
      errors.push(`malformed decision entry: ${line}`)
      continue
    }
    const [, id, number, status, statement] = match
    if (isPlaceholder(statement)) errors.push(`${id} has an empty or placeholder statement`)
    const details = decisionDetails(lines, lineIndex)
    decisions.push({ id, number: Number(number), status, details })
    if (isPermanentLedger) {
      for (const detail of ['Basis', 'Recommendation', 'Resolution evidence']) {
        const value = details.get(detail)
        if (value === undefined) errors.push(`${id} is missing ${detail} detail`)
        else if (detail !== 'Resolution evidence' || status !== 'pending') {
          if (isPlaceholder(value)) errors.push(`${id} has an empty or placeholder ${detail} detail`)
        }
      }
    }
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

  const requiredFields = [
    'Thread',
    'Outcome',
    'Scope / non-goals',
    'Launch basis',
    'Stop / reopen conditions',
    'Final carrier',
    'Overall launch confirmation',
    'Handoff status',
  ]
  if (isPermanentLedger) {
    requiredFields.unshift('Ledger version', 'Repository key', 'Delivery ID')
    requiredFields.push('Issue persistence')
  }
  for (const field of requiredFields) {
    if (fieldValue(lines, field) === undefined) errors.push(`missing \`${field}\` field`)
  }
  if (isPlaceholder(fieldValue(lines, 'Thread'))) errors.push('Thread must identify the current session')
  if (isPermanentLedger) validatePermanentPath(lines, ledgerPath, errors)

  if (phase !== 'alignment') {
    const reservedMarker = [snapshotStartMarker, snapshotEndMarker].find(marker =>
      launchContent(text).includes(marker),
    )
    if (reservedMarker) errors.push(`launch content contains reserved snapshot marker: ${reservedMarker}`)
    const pending = decisions.filter(decision => decision.status === 'pending')
    if (pending.length > 0) errors.push(`pending decision IDs block launch: ${pending.map(item => item.id).join(', ')}`)
    for (const field of ['Outcome', 'Scope / non-goals', 'Launch basis', 'Stop / reopen conditions', 'Final carrier']) {
      if (isPlaceholder(fieldValue(lines, field))) errors.push(`${field} must be complete before launch`)
    }
    const carrier = fieldValue(lines, 'Final carrier') || ''
    if (!/\b(issue|pr|commit)\b/i.test(carrier)) {
      errors.push('Final carrier must identify an Issue, PR, or commit before source-writing launch')
    }
    if (isPermanentLedger) {
      validateIssuePersistence(fieldValue(lines, 'Issue persistence'), decisions, errors)
    }
  }

  if (phase === 'authorized' || phase === 'handoff') {
    const confirmation = fieldValue(lines, 'Overall launch confirmation') || ''
    const recordedDigest = confirmation.match(/\bsha256:([0-9a-f]{64})\b/i)?.[1].toLowerCase()
    if (!/^confirmed\b/i.test(confirmation) || !recordedDigest) {
      errors.push('whole launch confirmation must be recorded before source writes')
    } else if (recordedDigest !== launchContentDigest(text)) {
      errors.push('whole launch confirmation does not match current launch content')
    }
  }
  if (phase === 'handoff') {
    const handoff = fieldValue(lines, 'Handoff status') || ''
    if (!/^complete\b/i.test(handoff)) {
      errors.push('handoff status must be complete before declaring delivery complete')
    } else if (isPermanentLedger) {
      if (!/\b(issue|pr|commit)\b/i.test(handoff)) {
        errors.push('handoff status must identify the verified Issue, PR, or commit carrier')
      }
      if (!/(?:\bread-back sha256:[0-9a-f]{64}\b|\bcommit [0-9a-f]{7,64}\b)/i.test(handoff)) {
        errors.push('handoff status must include carrier read-back evidence')
      }
    }
  }

  return errors
}

function validatePermanentPath(lines, ledgerPath, errors) {
  const repositoryKey = fieldValue(lines, 'Repository key') || ''
  const deliveryId = fieldValue(lines, 'Delivery ID') || ''
  const safeSegment = /^[a-z0-9][a-z0-9._-]*$/
  if (!safeSegment.test(repositoryKey)) {
    errors.push('Repository key must be a lowercase path-safe segment')
  }
  if (!safeSegment.test(deliveryId)) {
    errors.push('Delivery ID must be a lowercase path-safe segment')
  }
  if (!safeSegment.test(repositoryKey) || !safeSegment.test(deliveryId)) return

  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
  const expectedPath = path.resolve(
    codexHome,
    'power-gan',
    'records',
    repositoryKey,
    deliveryId,
    'decision-snapshot.md',
  )
  const actualPath = path.resolve(ledgerPath)
  const comparable = value => (process.platform === 'win32' ? value.toLowerCase() : value)
  if (comparable(actualPath) !== comparable(expectedPath)) {
    errors.push(`permanent Ledger path must be ${expectedPath}`)
  }
}

function isLegacyLedgerPath(ledgerPath) {
  const legacyRoot = path.resolve(os.tmpdir(), 'power-gan')
  const actualPath = path.resolve(ledgerPath)
  const relative = path.relative(legacyRoot, actualPath)
  return (
    relative.length > 0 &&
    !relative.startsWith('..') &&
    !path.isAbsolute(relative) &&
    path.basename(actualPath) === 'decision-snapshot.md'
  )
}

function validateIssuePersistence(value, decisions, errors) {
  const normalized = value || ''
  if (/^verified\b/i.test(normalized)) {
    if (!/https:\/\/\S+\/(?:-\/)?issues\/\d+\b/i.test(normalized)) {
      errors.push('Issue persistence must identify the verified Issue URL')
    }
    if (!/\bauthorization confirmed\b/i.test(normalized)) {
      errors.push('Issue persistence must record explicit hosted-mutation authorization')
    }
    if (!/\bread-back sha256:[0-9a-f]{64}\b/i.test(normalized)) {
      errors.push('Issue persistence must record the exact read-back body digest')
    }
    return
  }
  if (/^mechanical exemption requested\b/i.test(normalized)) {
    const reason = normalized.replace(/^mechanical exemption requested\b(?:\s*[—:-]\s*)?/i, '')
    if (isPlaceholder(reason)) errors.push('mechanical Issue exemption must state its concrete reason')
    const active = decisions.filter(decision =>
      ['confirmed', 'delegated'].includes(decision.status),
    )
    if (active.length > 0) {
      errors.push(
        `mechanical Issue exemption cannot coexist with active material decisions: ${active.map(item => item.id).join(', ')}`,
      )
    }
    return
  }
  errors.push('Issue persistence must be verified or request a concrete mechanical exemption')
}

function decisionDetails(lines, decisionLineIndex) {
  const details = new Map()
  for (let cursor = decisionLineIndex + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor]
    if (/^- D\d/.test(line) || line.startsWith('## ')) break
    const match = line.match(/^  (Basis|Recommendation|Resolution evidence):\s*(.*)$/)
    if (match) details.set(match[1], match[2].trim())
    else if (line.startsWith('- ')) break
  }
  return details
}

function launchContentDigest(text) {
  return contentDigest(launchContent(text))
}

function contentDigest(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

function launchContent(text) {
  return text
    .replaceAll('\r\n', '\n')
    .replace(/^- Overall launch confirmation:.*$/m, '- Overall launch confirmation: pending')
    .replace(/^- Handoff status:.*$/m, '- Handoff status: pending')
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
