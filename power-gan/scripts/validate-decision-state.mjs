#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { writeSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const allowedPhases = new Set(['alignment', 'launch', 'authorized', 'handoff'])
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
      '[--phase alignment|launch|authorized|handoff]',
  )
  process.exit(2)
}

const text = await readFile(statePath, 'utf8')
const normalizedText = normalizeText(text)
const isDecisionIndex = normalizedText.startsWith('# Decision Ledger Index\n')
const errors = isDecisionIndex
  ? validateDecisionIndex(normalizedText, phase, statePath)
  : validateDecisionState(normalizedText, phase, statePath)

if (errors.length > 0) {
  writeSync(2, `${errors.map(error => `decision state invalid: ${error}`).join('\n')}\n`)
  process.exitCode = 1
} else if (isDecisionIndex) {
  writeSync(
    1,
    `decision index valid for handoff: ${statePath}\n` +
      `decision index sha256: ${contentDigest(normalizedText)}\n`,
  )
} else {
  const ledgerVersion = ledgerVersionOf(normalizedText)
  const output = [`decision state valid for ${phase}: ${statePath}`]
  const renderedContent = phase === 'alignment' ? undefined : launchContent(normalizedText, ledgerVersion)
  if (renderedContent !== undefined) {
    output.push(`launch content sha256: ${contentDigest(renderedContent)}`)
  }
  if (phase === 'launch') {
    output.push(snapshotStartMarker)
    writeSync(1, `${output.join('\n')}\n${renderedContent}${snapshotEndMarker}\n`)
  } else if (phase === 'handoff' && ledgerVersion === '3' && retentionMode(normalizedText) === 'compact') {
    const renderedIndex = decisionIndex(normalizedText)
    output.push(`decision index sha256: ${contentDigest(renderedIndex)}`, indexStartMarker)
    writeSync(1, `${output.join('\n')}\n${renderedIndex}${indexEndMarker}\n`)
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
  const isPermanentLedger = ledgerVersion === '2' || ledgerVersion === '3'
  if (ledgerVersion !== undefined && !isPermanentLedger) {
    errors.push('Ledger version must be 2 or 3 when present')
  } else if (ledgerVersion === undefined && !isLegacyLedgerPath(ledgerPath)) {
    errors.push('Ledger version 2 or 3 is required outside the legacy temporary Ledger namespace')
  }

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
  if (ledgerVersion === '3') requiredFields.push('Handoff retention')
  for (const field of requiredFields) {
    if (fieldValue(lines, field) === undefined) errors.push(`missing \`${field}\` field`)
  }
  if (isPlaceholder(fieldValue(lines, 'Thread'))) errors.push('Thread must identify the current session')
  if (isPermanentLedger) validatePermanentPath(lines, ledgerPath, errors)

  if (phase !== 'alignment') {
    const renderedContent = launchContent(text, ledgerVersion)
    const reservedMarker = [snapshotStartMarker, snapshotEndMarker].find(marker =>
      renderedContent.includes(marker),
    )
    if (reservedMarker) errors.push(`launch content contains reserved snapshot marker: ${reservedMarker}`)
    const pending = decisions.filter(decision => decision.status === 'pending')
    if (pending.length > 0) errors.push(`pending decision IDs block launch: ${pending.map(item => item.id).join(', ')}`)
    for (const field of launchFields.slice(0, 5)) {
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
    } else if (recordedDigest !== launchContentDigest(text, ledgerVersion)) {
      errors.push('whole launch confirmation does not match current launch content')
    }
  }
  if (phase === 'handoff') {
    const handoff = fieldValue(lines, 'Handoff status') || ''
    if (!/^complete\b/i.test(handoff)) {
      errors.push('handoff status must be complete before declaring delivery complete')
    } else if (isPermanentLedger) {
      validateHandoffEvidence(handoff, errors)
    }
    if (ledgerVersion === '3') validateHandoffRetention(fieldValue(lines, 'Handoff retention'), errors)
  }

  return errors
}

function validateDecisionIndex(text, phase, ledgerPath) {
  const errors = []
  if (phase !== 'handoff') errors.push('Decision Ledger Index is valid only for the handoff phase')
  const lines = text.split('\n')
  const fields = [
    'Ledger version',
    'Repository key',
    'Delivery ID',
    'Next decision ID',
    'Decision source',
    'Final carrier',
    'Decision content SHA-256',
    'Handoff evidence',
  ]
  const values = new Map()
  for (const field of fields) {
    const matches = lines.filter(line => line.startsWith(`- ${field}:`))
    if (matches.length !== 1) errors.push(`Decision Ledger Index must contain exactly one \`${field}\` field`)
    values.set(field, fieldValue(lines, field))
  }
  if (values.get('Ledger version') !== '3') errors.push('Decision Ledger Index must use Ledger version 3')
  if (!/^D\d{3,}$/.test(values.get('Next decision ID') || '')) {
    errors.push('Next decision ID must preserve the next unused stable decision ID')
  }
  if (isPlaceholder(values.get('Decision source'))) errors.push('Decision source must identify the durable decision carrier')
  if (!/\b(issue|pr|commit)\b/i.test(values.get('Final carrier') || '')) {
    errors.push('Final carrier must identify an Issue, PR, or commit')
  }
  if (!/^sha256:[0-9a-f]{64}$/i.test(values.get('Decision content SHA-256') || '')) {
    errors.push('Decision content SHA-256 must contain the final decision digest')
  }
  const handoff = values.get('Handoff evidence') || ''
  if (!/^complete\b/i.test(handoff)) errors.push('Handoff evidence must be complete')
  else validateHandoffEvidence(handoff, errors)
  validatePermanentPath(lines, ledgerPath, errors)

  if (errors.length === 0) {
    const canonical = decisionIndexFromValues(values)
    if (text !== canonical) errors.push('Decision Ledger Index must use the canonical compact format')
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

function validateHandoffEvidence(handoff, errors) {
  if (!/\b(issue|pr|commit)\b/i.test(handoff)) {
    errors.push('handoff status must identify the verified Issue, PR, or commit carrier')
  }
  if (!/(?:\bread-back sha256:[0-9a-f]{64}\b|\bcommit [0-9a-f]{7,64}\b)/i.test(handoff)) {
    errors.push('handoff status must include carrier read-back evidence')
  }
}

function validateHandoffRetention(value, errors) {
  const match = (value || '').match(/^(compact|full)\b\s*[—:-]\s*(.+)$/i)
  if (!match || isPlaceholder(match[2])) {
    errors.push('Handoff retention must be `compact — <reason>` or `full — <reason>` before handoff')
  }
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

function launchContentDigest(text, ledgerVersion) {
  return contentDigest(launchContent(text, ledgerVersion))
}

function contentDigest(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

function launchContent(text, ledgerVersion) {
  if (ledgerVersion === '3') return launchProjection(text)
  return text
    .replace(/^- Overall launch confirmation:.*$/m, '- Overall launch confirmation: pending')
    .replace(/^- Handoff status:.*$/m, '- Handoff status: pending')
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

function decisionIndex(text) {
  const lines = text.split('\n')
  return decisionIndexFromValues(new Map([
    ['Ledger version', '3'],
    ['Repository key', fieldValue(lines, 'Repository key')],
    ['Delivery ID', fieldValue(lines, 'Delivery ID')],
    ['Next decision ID', fieldValue(lines, 'Next decision ID')],
    ['Decision source', fieldValue(lines, 'Issue persistence')],
    ['Final carrier', fieldValue(lines, 'Final carrier')],
    ['Decision content SHA-256', `sha256:${launchContentDigest(text, '3')}`],
    ['Handoff evidence', fieldValue(lines, 'Handoff status')],
  ]))
}

function decisionIndexFromValues(values) {
  return `# Decision Ledger Index

- Ledger version: ${values.get('Ledger version')}
- Repository key: ${values.get('Repository key')}
- Delivery ID: ${values.get('Delivery ID')}
- Next decision ID: ${values.get('Next decision ID')}
- Decision source: ${values.get('Decision source')}
- Final carrier: ${values.get('Final carrier')}
- Decision content SHA-256: ${values.get('Decision content SHA-256')}
- Handoff evidence: ${values.get('Handoff evidence')}
`
}

function retentionMode(text) {
  const value = fieldValue(text.split('\n'), 'Handoff retention') || ''
  return value.match(/^(compact|full)\b/i)?.[1].toLowerCase()
}

function ledgerVersionOf(text) {
  return fieldValue(text.split('\n'), 'Ledger version')
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
