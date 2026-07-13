import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

test('power-gan keeps decisions firm and implementation adaptive', async () => {
  const skill = await read('power-gan/SKILL.md')

  assert.match(skill, /`ALIGN_ONLY`/)
  assert.match(skill, /`DELIVER`/)
  assert.match(skill, /`FAST`/)
  assert.match(skill, /`DEEP`/)
  assert.match(skill, /ask only whether they want alignment or delivery/i)
  assert.match(skill, /one question at a time/i)
  assert.match(skill, /do not call or depend on `grill-me`/i)
  assert.match(skill, /generic reply such as “可以”, “确认”, or “应用”/i)
  assert.match(skill, /strongest credible argument against/i)
  assert.match(skill, /Working Strategy in the current session/i)
  assert.match(skill, /Comments alone never add current obligations/i)
  assert.match(skill, /CHECK_REQUIRED/)
  assert.doesNotMatch(skill, /Task Contract|Execution Blueprint|Agent Dispatch Plan/)
})

test('power-check is read-only and checks only current decisions and final evidence', async () => {
  const skill = await read('power-check/SKILL.md')

  assert.match(skill, /without editing source, Git state, Issues, PRs, or comments/i)
  assert.match(skill, /current confirmed user decisions/i)
  assert.match(skill, /final implementation tree and diff/i)
  assert.match(skill, /Do not turn a Working Strategy, Blueprint, rejected option/i)
  assert.match(skill, /`PASS`/)
  assert.match(skill, /`PASS_WITH_NOTES`/)
  assert.match(skill, /`BLOCKED`/)
  assert.match(skill, /`NEEDS_HUMAN`/)
  assert.match(skill, /`CHECK_REQUIRED`/)
})

test('critic and curator route material changes back to power-gan', async () => {
  const [critic, curator] = await Promise.all([
    read('power-critic/SKILL.md'),
    read('power-curator/SKILL.md'),
  ])

  assert.match(critic, /return it to `\$power-gan` for user alignment/i)
  assert.match(critic, /redirect to `\$power-check`/i)
  assert.match(curator, /Send material decision changes back through `\$power-gan`/i)
  assert.match(curator, /Comments are history and evidence only/i)
  assert.match(curator, /Do not keep a closed Issue synchronized/i)
})

test('retired core skill directories are absent', async () => {
  for (const skill of ['power-think', 'power-grill', 'power-loop', 'power-verifier']) {
    await assert.rejects(access(path.join(root, skill, 'SKILL.md')))
  }
})
