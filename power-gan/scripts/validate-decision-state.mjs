#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { writeSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const allowedPhases = new Set(['alignment', 'launch', 'authorized', 'rollover', 'handoff'])
const snapshotStartMarker = '-----BEGIN POWER-GAN DECISION SNAPSHOT-----'
const snapshotEndMarker = '-----END POWER-GAN DECISION SNAPSHOT-----'
const indexStartMarker = '-----BEGIN POWER-GAN DECISION INDEX-----'
const indexEndMarker = '-----END POWER-GAN DECISION INDEX-----'
const launchFields = [
  'Outcome',
  'Scope / non-goals',
  'Launch basis',
  'Stop / reopen conditions',
  'Final carrier',
  'Issue persistence',
]
const args = process.argv.slice(2)
const statePath = args[0]
const phaseIndex = args.indexOf('--phase')
const phase = phaseIndex === -1 ? 'alignment' : args[phaseIndex + 1]

if (!statePath || !allowedPhases.has(phase)) {
  console.error(
    'usage: node validate-decision-state.mjs <decision-snapshot.md> ' +
      '[--phase alignment|launch|authorized|rollover|handoff]',
  )
  process.exit(2)
}

const text = await readFile(statePath, 'utf8')
const normalizedText = normalizeText(text)
const errors = validateDecisionState(normalizedText, phase, statePath)

if (errors.length > 0) {
  writeSync(2, `${errors.map(error => `decision state invalid: ${error}`).join('\n')}\n`)
  process.exitCode = 1
} else {
  const output = [`decision state valid for ${phase}: ${statePath}`]
  const renderedContent = ['alignment', 'rollover'].includes(phase)
    ? undefined
    : launchContent(normalizedText)
  if (renderedContent !== undefined) output.push(`launch content sha256: ${contentDigest(renderedContent)}`)
  if (phase === 'launch') {
    output.push(snapshotStartMarker)
    writeSync(1, `${output.join('\n')}\n${renderedContent}${snapshotEndMarker}\n`)
  } else {
    writeSync(1, `${output.join('\n')}\n`)
  }
}

function validateDecisionState(text, phase, ledgerPath) {
  const errors = []
  const lines = text.split('\n')
  if (lines[0] !== '# Decision Snapshot') errors.push('missing `# Decision Snapshot` heading')
  if (!lines.includes('## Decisions')) errors.push('missing `## Decisions` section')

  const ledgerVersion = fieldValue(lines, 'Ledger version')
  if (ledgerVersion !== '5') errors.push('Ledger version must be 5')

  const decisions = []
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    if (!/^- D\d/.test(line)) continue
    const parsed = parseDecision(line)
    if (!parsed) {
      errors.push(`malformed decision entry: ${line}`)
      continue
    }
    const { id, number, status, statement } = parsed
    if (isPlaceholder(statement)) errors.push(`${id} has an empty or placeholder statement`)
    const details = decisionDetails(lines, lineIndex)
    decisions.push({ id, number, status, statement, details })
    for (const detail of ['Basis', 'Recommendation', 'Resolution evidence']) {
      const value = details.get(detail)
      if (value === undefined) errors.push(`${id} is missing ${detail} detail`)
      else if (detail !== 'Resolution evidence' || status !== 'pending') {
        if (isPlaceholder(value)) errors.push(`${id} has an empty or placeholder ${detail} detail`)
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
  if (nextId !== expectedNext) errors.push(`Next decision ID must be ${expectedNext} so IDs remain contiguous`)

  const requiredFields = [
    'Ledger version',
    'Repository key',
    'Delivery ID',
    'Predecessor',
    'Note lifecycle',
    'Persistence boundary',
    'Thread',
    'Next decision ID',
    'Outcome',
    'Scope / non-goals',
    'Launch basis',
    'Stop / reopen conditions',
    'Final carrier',
    'Issue persistence',
    'Handoff retention',
    'Overall launch confirmation',
    'Handoff status',
  ]
  for (const field of requiredFields) {
    if (fieldValue(lines, field) === undefined) errors.push(`missing \`${field}\` field`)
  }
  if (isPlaceholder(fieldValue(lines, 'Thread'))) errors.push('Thread must identify the current session')
  validatePermanentPath(lines, ledgerPath, errors)

  const predecessorLines = lines.filter(line => line.startsWith('- Predecessor:'))
  if (predecessorLines.length !== 1) errors.push('Ledger must contain exactly one `Predecessor` field')
  validatePredecessor(fieldValue(lines, 'Predecessor'), errors)

  const lifecycle = fieldValue(lines, 'Note lifecycle') || ''
  if (!/^(active|sealed)\b/i.test(lifecycle)) {
    errors.push('Note lifecycle must be `active — <reason>` or `sealed — <reason>`')
  }
  const persistence = fieldValue(lines, 'Persistence boundary') || ''
  if (!/^(pending|verified)\b/i.test(persistence)) {
    errors.push('Persistence boundary must be `pending` or `verified — <carrier> — read-back sha256:<digest>`')
  } else if (/^verified\b/i.test(persistence)) {
    validatePersistenceBoundary(persistence, errors)
  }
  if (/^sealed\b/i.test(lifecycle) && !/^verified\b/i.test(persistence)) {
    errors.push('sealed local note requires a verified Persistence boundary')
  }
  if (/^sealed\b/i.test(lifecycle) && phase !== 'rollover') {
    errors.push('sealed local note is terminal; create a new note instead of reusing it')
  }
  if (/^active\b/i.test(lifecycle) && /^verified\b/i.test(persistence)) {
    errors.push('active local note cannot retain a verified Persistence boundary; create a new note')
  }
  if (phase !== 'handoff' && phase !== 'rollover' && /^complete\b/i.test(fieldValue(lines, 'Handoff status') || '')) {
    errors.push('handed-off Ledger is terminal; delete it after verified carrier handoff and create a new delivery')
  }
  if (phase === 'rollover' && !/^sealed\b/i.test(lifecycle)) errors.push('rollover validation requires a sealed local note')
  if (phase === 'rollover' && !/^verified\b/i.test(persistence)) errors.push('rollover validation requires a verified Persistence boundary')
  if (phase === 'handoff') {
    if (!/^active\b/i.test(lifecycle)) errors.push('handoff validation requires the final active local note')
    if (!/^pending\b/i.test(persistence)) errors.push('handoff validation requires no pending persistence rollover')
    if (!/^delete\b/i.test(fieldValue(lines, 'Handoff retention') || '')) {
      errors.push('handoff validation requires `delete` retention so the final local note can be removed')
    }
  }

  if (!['alignment', 'rollover'].includes(phase)) {
    const renderedContent = launchContent(text)
    const reservedMarker = [snapshotStartMarker, snapshotEndMarker].find(marker => renderedContent.includes(marker))
    if (reservedMarker) errors.push(`launch content contains reserved snapshot marker: ${reservedMarker}`)
    const pending = decisions.filter(decision => decision.status === 'pending')
    if (pending.length > 0) errors.push(`pending decision IDs block launch: ${pending.map(item => item.id).join(', ')}`)
    for (const field of launchFields.slice(0, 5)) {
      if (isPlaceholder(fieldValue(lines, field))) errors.push(`${field} must be complete before launch`)
    }
    const carrier = fieldValue(lines, 'Final carrier') || ''
    if (!/\b(issue|pr|commit)\b/i.test(carrier)) errors.push('Final carrier must identify an Issue, PR, or commit before source-writing launch')
    validateIssuePersistence(fieldValue(lines, 'Issue persistence'), decisions, errors)
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
    if (!/^complete\b/i.test(handoff)) errors.push('handoff status must be complete before declaring delivery complete')
    else validateHandoffEvidence(handoff, errors)
    validateHandoffRetention(fieldValue(lines, 'Handoff retention'), errors)
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
  if (/^not required\b/i.test(normalized)) {
    const reason = normalized.replace(/^not required\b(?:\s*[—:-]\s*)?/i, '')
    if (isPlaceholder(reason)) errors.push('Issue persistence waiver must state why a canonical Issue is not needed')
    return
  }
  errors.push('Issue persistence must be verified, waived with a concrete reason, or omitted only on the low-risk path')
}

function validateHandoffEvidence(handoff, errors) {
  if (!/\b(issue|pr|commit)\b/i.test(handoff)) {
    errors.push('handoff status must identify the verified Issue, PR, or commit carrier')
  }
  if (!/(?:\bread-back sha256:[0-9a-f]{64}\b|\bcommit [0-9a-f]{7,64}\b)/i.test(handoff)) {
    errors.push('handoff status must include carrier read-back evidence')
  }
}

function validateHandoffRetention(value, errors) {
  const match = (value || '').match(/^(compact|full|delete)\b\s*[—:-]\s*(.+)$/i)
  if (!match || isPlaceholder(match[2])) {
    errors.push('Handoff retention must be `compact — <reason>`, `full — <reason>`, or `delete — <reason>` before handoff')
  }
}

function validatePersistenceBoundary(value, errors) {
  const match = (value || '').match(/^verified\s*[—:-]\s*(.+)\s*[—:-]\s*read-back sha256:([0-9a-f]{64})$/i)
  if (!match || isPlaceholder(match[1])) {
    errors.push('Persistence boundary must identify a durable carrier and exact read-back body digest')
    return
  }
  if (!isDurableSourceIdentity(match[1].trim())) {
    errors.push('Persistence boundary must identify a concrete Issue, PR, MR, or commit carrier')
  }
}

function validatePredecessor(value, errors) {
  if (value === 'none') return
  const parts = (value || '').split(' — ')
  if (parts.length !== 4) {
    errors.push('Predecessor must contain exactly delivery, durable source, content digest, and handoff carrier')
    return
  }
  const [delivery, durableSource, contentDigest, handoffCarrier] = parts
  if (!/^delivery:[a-z0-9][a-z0-9._-]*$/.test(delivery)) {
    errors.push('Predecessor delivery ID must be one complete path-safe `delivery:<id>` value')
  }
  if (!isDurableSourceIdentity(durableSource)) {
    errors.push('Predecessor durable source must identify a concrete Issue, PR, MR, or commit')
  }
  if (!/^(?:body|content) sha256:[0-9a-f]{64}$/i.test(contentDigest)) {
    errors.push('Predecessor must record one exact prior content SHA-256')
  }
  if (!(isPersistenceCarrierIdentity(handoffCarrier) || isHandoffCarrierIdentity(handoffCarrier))) {
    errors.push('Predecessor carrier must identify a concrete persistence or handoff carrier and read-back digest')
  }
}

function isDurableSourceIdentity(value) {
  if (/^commit [0-9a-f]{7,64}$/i.test(value)) return true
  const issue = value.match(/^Issue #(\d+) (https:\/\/\S+)$/)
  if (issue) return new RegExp(`\/(?:-\/)?issues\/${issue[1]}$`).test(issue[2])
  const pullRequest = value.match(/^PR #(\d+) (https:\/\/\S+)$/)
  if (pullRequest) return new RegExp(`\/pull\/${pullRequest[1]}$`).test(pullRequest[2])
  const mergeRequest = value.match(/^MR !(\d+) (https:\/\/\S+)$/)
  if (mergeRequest) return new RegExp(`\/(?:-\/)?merge_requests\/${mergeRequest[1]}$`).test(mergeRequest[2])
  return false
}

function isHandoffCarrierIdentity(value) {
  if (/^handoff commit [0-9a-f]{7,64}$/i.test(value)) return true
  const hosted = value.match(/^handoff (.+) read-back sha256:[0-9a-f]{64}$/i)
  return Boolean(hosted && isDurableSourceIdentity(hosted[1]))
}

function isPersistenceCarrierIdentity(value) {
  const persisted = value.match(/^persistence (.+) read-back sha256:[0-9a-f]{64}$/i)
  return Boolean(persisted && isDurableSourceIdentity(persisted[1]))
}

function parseDecision(line) {
  const match = line.match(
    /^- (D(\d{3,})) \[(pending|confirmed|delegated|rejected|superseded)\]:? (.+)$/,
  )
  if (!match) return undefined
  const [, id, number, status, statement] = match
  return { id, number: Number(number), status, statement }
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
  return launchProjection(text)
}

function launchProjection(text) {
  const lines = text.split('\n')
  const active = lines
    .map(parseDecision)
    .filter(decision => decision && ['confirmed', 'delegated'].includes(decision.status))
  const projection = [
    '# Decision Snapshot',
    '',
    ...launchFields.map(field => `- ${field}: ${fieldValue(lines, field) || ''}`),
    '',
    '## Active decisions',
    '',
    ...active.map(decision => `- ${decision.id} [${decision.status}]: ${decision.statement}`),
  ]
  return `${projection.join('\n')}\n`
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

function normalizeText(text) {
  return text.replaceAll('\r\n', '\n')
}
