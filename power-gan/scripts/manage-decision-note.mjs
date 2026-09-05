#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rename, unlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , operation, sourcePath, successorPath] = process.argv
const validator = path.join(path.dirname(fileURLToPath(import.meta.url)), 'validate-decision-state.mjs')

if (!['rollover', 'handoff'].includes(operation) || !sourcePath || (operation === 'rollover' && !successorPath)) {
  console.error(
    'usage: node manage-decision-note.mjs rollover <sealed-note> <successor-note>\n' +
      '   or: node manage-decision-note.mjs handoff <completed-note>',
  )
  process.exit(2)
}

const sourceBefore = await readVersion5Note(sourcePath)

if (operation === 'rollover') {
  const successorBefore = await readVersion5Note(successorPath)
  if (path.resolve(sourcePath) === path.resolve(successorPath)) fail('source and successor must be different files')

  validateWith('rollover', sourcePath)
  validateWith(successorPhase(successorBefore.text), successorPath)
  validateRolloverLink(sourceBefore.text, successorBefore.text)
  await assertUnchanged(sourcePath, sourceBefore.digest)
  await assertUnchanged(successorPath, successorBefore.digest)
  await removeExact(sourcePath, sourceBefore.digest)
  process.stdout.write(
    `decision note rollover complete\ndeleted: ${path.resolve(sourcePath)}\n` +
      `successor: ${path.resolve(successorPath)}\n`,
  )
} else {
  validateWith('handoff', sourcePath)
  await assertUnchanged(sourcePath, sourceBefore.digest)
  await removeExact(sourcePath, sourceBefore.digest)
  process.stdout.write(`decision note handoff cleanup complete\ndeleted: ${path.resolve(sourcePath)}\n`)
}

async function readVersion5Note(notePath) {
  const text = await readFile(notePath, 'utf8')
  if (fieldValue(text, 'Ledger version') !== '5') fail('note cleanup is supported only for Ledger version 5')
  assertCanonicalNotePath(notePath, text)
  return { text, digest: digest(text) }
}

function assertCanonicalNotePath(notePath, text) {
  const repositoryKey = fieldValue(text, 'Repository key') || ''
  const deliveryId = fieldValue(text, 'Delivery ID') || ''
  const safeSegment = /^[a-z0-9][a-z0-9._-]*$/
  if (!safeSegment.test(repositoryKey) || !safeSegment.test(deliveryId)) {
    fail('version 5 note path cannot be checked until Repository key and Delivery ID are path-safe')
  }
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
  const expectedPath = path.resolve(
    codexHome,
    'power-gan',
    'records',
    repositoryKey,
    deliveryId,
    'decision-snapshot.md',
  )
  const actualPath = path.resolve(notePath)
  const comparable = value => (process.platform === 'win32' ? value.toLowerCase() : value)
  if (comparable(actualPath) !== comparable(expectedPath)) {
    fail(`version 5 note path must be ${expectedPath}`)
  }
}

function validateWith(phase, notePath) {
  const result = spawnSync(process.execPath, [validator, notePath, '--phase', phase], {
    encoding: 'utf8',
    env: process.env,
  })
  if (result.error) fail(`could not run decision validator: ${result.error.message}`)
  if (result.status !== 0) fail((result.stderr || result.stdout || `validation failed for ${phase}`).trim())
}

function successorPhase(text) {
  return /^confirmed\b/i.test(fieldValue(text, 'Overall launch confirmation') || '')
    ? 'authorized'
    : 'alignment'
}

function validateRolloverLink(source, successor) {
  const sourceRepository = fieldValue(source, 'Repository key')
  const successorRepository = fieldValue(successor, 'Repository key')
  if (sourceRepository !== successorRepository) fail('source and successor Repository key values must match')

  const sourceDelivery = fieldValue(source, 'Delivery ID')
  const persistence = parsePersistenceBoundary(fieldValue(source, 'Persistence boundary'))
  if (!persistence) fail('source Persistence boundary is not a verified carrier receipt')

  const expectedPredecessor =
    `delivery:${sourceDelivery} — ${persistence.carrier} — body sha256:${persistence.digest} — ` +
    `persistence ${persistence.carrier} read-back sha256:${persistence.digest}`
  if (fieldValue(successor, 'Predecessor') !== expectedPredecessor) {
    fail(`successor Predecessor must be exactly: ${expectedPredecessor}`)
  }
  if (!/^active\b/i.test(fieldValue(successor, 'Note lifecycle') || '')) {
    fail('successor Note lifecycle must be active')
  }
  if (fieldValue(successor, 'Persistence boundary') !== 'pending') {
    fail('successor Persistence boundary must be pending')
  }
}

function parsePersistenceBoundary(value) {
  const match = (value || '').match(
    /^verified\s*[—:-]\s*(.+)\s*[—:-]\s*read-back sha256:([0-9a-f]{64})$/i,
  )
  return match ? { carrier: match[1].trim(), digest: match[2].toLowerCase() } : undefined
}

async function assertUnchanged(notePath, expectedDigest) {
  const current = await readFile(notePath, 'utf8')
  if (digest(current) !== expectedDigest) fail(`note changed during validation: ${path.resolve(notePath)}`)
}

async function removeExact(notePath, expectedDigest) {
  const quarantinePath = `${notePath}.cleanup-${process.pid}-${Date.now()}`
  try {
    await rename(notePath, quarantinePath)
    const quarantined = await readFile(quarantinePath, 'utf8')
    if (digest(quarantined) !== expectedDigest) {
      fail(`note changed before cleanup; recovery file retained at ${path.resolve(quarantinePath)}`)
    }
    await unlink(quarantinePath)
  } catch (error) {
    fail(`could not delete ${path.resolve(notePath)}: ${error.message}`)
  }
}

function fieldValue(text, name) {
  const prefix = `- ${name}:`
  const line = text.replaceAll('\r\n', '\n').split('\n').find(candidate => candidate.startsWith(prefix))
  return line?.slice(prefix.length).trim()
}

function digest(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function fail(message) {
  console.error(`decision note cleanup failed: ${message}`)
  process.exit(1)
}
