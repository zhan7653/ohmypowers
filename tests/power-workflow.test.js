import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const execFileAsync = promisify(execFile)
const decisionStateValidator = path.join(
  root,
  'power-gan',
  'scripts',
  'validate-decision-state.mjs',
)
const decisionNoteManager = path.join(
  root,
  'power-gan',
  'scripts',
  'manage-decision-note.mjs',
)

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

async function rejectsWithStderr(promise, pattern) {
  await assert.rejects(promise, error => {
    assert.match(error.stderr, pattern)
    return true
  })
}

function extractPowerShellBlock(reference, marker) {
  const blocks = [...reference.matchAll(/^```powershell\r?\n([\s\S]*?)^```\s*$/gm)].map(match => match[1])
  const block = blocks.find(candidate => candidate.includes(marker))
  assert.ok(block, `missing PowerShell block containing ${marker}`)
  return block
}

async function availablePowerShell(t) {
  const executable = process.platform === 'win32' ? 'pwsh.exe' : 'pwsh'
  try {
    await execFileAsync(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.ToString()'])
    return executable
  } catch {
    t.skip('PowerShell 7 is not available in this environment')
    return undefined
  }
}

test('power-gan v5 validator prevents premature launch and stale authorization', async t => {
  const codexHome = await mkdtemp(path.join(os.tmpdir(), 'power-gan-v5-validator-'))
  t.after(() => rm(codexHome, { recursive: true, force: true }))
  const repositoryKey = 'test-repository'
  const deliveryId = 'validator-delivery'
  const statePath = path.join(codexHome, 'power-gan', 'records', repositoryKey, deliveryId, 'decision-snapshot.md')
  const validatorOptions = { env: { ...process.env, CODEX_HOME: codexHome } }
  await mkdir(path.dirname(statePath), { recursive: true })
  const alignmentState = `# Decision Snapshot

- Ledger version: 5
- Repository key: ${repositoryKey}
- Delivery ID: ${deliveryId}
- Predecessor: none
- Note lifecycle: active — current note
- Persistence boundary: pending
- Thread: test-thread
- Next decision ID: D003
- Outcome: pending
- Scope / non-goals: pending
- Launch basis: pending
- Stop / reopen conditions: pending
- Final carrier: pending
- Issue persistence: pending
- Handoff retention: delete — remove the local note after handoff
- Overall launch confirmation: pending
- Handoff status: pending

## Decisions

- D001 [confirmed]: Preserve the current response contract.
  Basis: Existing consumers rely on the current response shape.
  Recommendation: Keep the shape because it is an observable contract.
  Resolution evidence: User explicitly confirmed the contract.
- D002 [pending]: Decide whether the compatibility boundary changes.
  Basis: The requested change may alter an observable contract.
  Recommendation: Keep the current boundary until the user confirms a change.
  Resolution evidence: pending
`
  await writeFile(statePath, alignmentState, 'utf8')
  await execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'alignment'], validatorOptions)
  await writeFile(statePath, alignmentState.replace('- Ledger version: 5', '- Ledger version: 4'), 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'alignment'], validatorOptions),
    /Ledger version must be 5/i,
  )
  await writeFile(statePath, alignmentState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'launch'], validatorOptions),
    /pending decision|pending/i,
  )

  const launchState = alignmentState
    .replace('- Outcome: pending', '- Outcome: Ship the current response contract.')
    .replace('- Scope / non-goals: pending', '- Scope / non-goals: Preserve the response shape; no transport redesign.')
    .replace('- Launch basis: pending', '- Launch basis: Validate the response contract before implementation.')
    .replace('- Stop / reopen conditions: pending', '- Stop / reopen conditions: Stop if the response shape must change.')
    .replace('- Final carrier: pending', '- Final carrier: commit')
    .replace('- Issue persistence: pending', '- Issue persistence: not required — no durable standard changes')
    .replace('- D002 [pending]:', '- D002 [delegated]:')
    .replace('  Resolution evidence: pending\n', '  Resolution evidence: User delegated the compatibility boundary.\n')
  await writeFile(statePath, launchState, 'utf8')

  const { stdout: launchOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'launch'],
    validatorOptions,
  )
  const launchDigest = launchOutput.match(/launch content sha256: ([0-9a-f]{64})/i)?.[1]
  assert.ok(launchDigest, 'launch validation must return the confirmation digest')
  const snapshotStart = '-----BEGIN POWER-GAN DECISION SNAPSHOT-----\n'
  const snapshotEnd = '-----END POWER-GAN DECISION SNAPSHOT-----'
  const contentStart = launchOutput.indexOf(snapshotStart) + snapshotStart.length
  const contentEnd = launchOutput.lastIndexOf(snapshotEnd)
  const renderedSnapshot = launchOutput.slice(contentStart, contentEnd)
  assert.match(renderedSnapshot, /## Active decisions/)
  assert.match(renderedSnapshot, /D002 \[delegated\]/)
  assert.equal(createHash('sha256').update(renderedSnapshot, 'utf8').digest('hex'), launchDigest)

  await writeFile(
    statePath,
    launchState.replace('Preserve the current response contract.', `Preserve the current response contract. ${snapshotEnd}`),
    'utf8',
  )
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'launch'], validatorOptions),
    /reserved snapshot marker/i,
  )
  await writeFile(statePath, launchState, 'utf8')

  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'authorized'], validatorOptions),
    /launch confirmation/i,
  )
  const authorizedState = launchState.replace(
    '- Overall launch confirmation: pending',
    `- Overall launch confirmation: confirmed — sha256:${launchDigest} — user confirmed complete rendering`,
  )
  await writeFile(statePath, authorizedState, 'utf8')
  await execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'authorized'], validatorOptions)

  await writeFile(statePath, authorizedState.replace('Preserve the current response contract.', 'Change the current response contract.'), 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'authorized'], validatorOptions),
    /does not match current launch content/i,
  )
  await writeFile(statePath, authorizedState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'handoff'], validatorOptions),
    /handoff status/i,
  )
  await writeFile(statePath, authorizedState.replace('- Handoff status: pending', '- Handoff status: complete — commit abc1234'), 'utf8')
  await execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'handoff'], validatorOptions)

  await writeFile(statePath, launchState.replace(/^- D002 .*\n(?:  .*\n){3}/m, ''), 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'launch'], validatorOptions),
    /contiguous|Next decision ID/i,
  )
})

test('power-gan v5 rolls over after durable persistence and deletes only verified local notes', async t => {
  const codexHome = await mkdtemp(path.join(os.tmpdir(), 'power-gan-v5-codex-home-'))
  t.after(() => rm(codexHome, { recursive: true, force: true }))
  const repositoryKey = 'github.com-zhan7653-ohmypowers'
  const sourceDelivery = 'v5-source-delivery'
  const successorDelivery = 'v5-successor-delivery'
  const sourcePath = path.join(codexHome, 'power-gan', 'records', repositoryKey, sourceDelivery, 'decision-snapshot.md')
  const successorPath = path.join(codexHome, 'power-gan', 'records', repositoryKey, successorDelivery, 'decision-snapshot.md')
  await mkdir(path.dirname(sourcePath), { recursive: true })
  await mkdir(path.dirname(successorPath), { recursive: true })
  const validatorOptions = { env: { ...process.env, CODEX_HOME: codexHome } }
  const issueDigest = 'c'.repeat(64)
  const sourceBoundary = `verified — Issue #39 https://github.com/zhan7653/ohmypowers/issues/39 — read-back sha256:${issueDigest}`
  const issuePersistence = `verified — Issue #39 https://github.com/zhan7653/ohmypowers/issues/39 — authorization confirmed — read-back sha256:${issueDigest}`
  const sourceState = `# Decision Snapshot

- Ledger version: 5
- Repository key: ${repositoryKey}
- Delivery ID: ${sourceDelivery}
- Predecessor: none
- Note lifecycle: active — current note
- Persistence boundary: pending
- Thread: test-thread
- Next decision ID: D002
- Outcome: Ship the persisted decision.
- Scope / non-goals: Keep the current decision; no unrelated changes.
- Launch basis: Validate the version 5 lifecycle.
- Stop / reopen conditions: Stop if carrier read-back fails.
- Final carrier: commit on develop linked to Decision Issue #39 https://github.com/zhan7653/ohmypowers/issues/39
- Issue persistence: ${issuePersistence}
- Handoff retention: delete — remove the local note after handoff
- Overall launch confirmation: pending
- Handoff status: pending

## Decisions

- D001 [confirmed]: Rotate the local note after durable persistence.
  Basis: A durable Issue carrier has been read back exactly.
  Recommendation: Start a fresh note after persistence to prevent transcript growth.
  Resolution evidence: User explicitly confirmed the lifecycle.
`
  await writeFile(sourcePath, sourceState, 'utf8')
  await execFileAsync(process.execPath, [decisionStateValidator, sourcePath, '--phase', 'alignment'], validatorOptions)

  const persistedSourceState = sourceState
    .replace('- Note lifecycle: active — current note', '- Note lifecycle: sealed — persisted Issue read-back')
    .replace('- Persistence boundary: pending', `- Persistence boundary: ${sourceBoundary}`)
  await writeFile(sourcePath, persistedSourceState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, sourcePath, '--phase', 'alignment'], validatorOptions),
    /sealed local note is terminal/i,
  )
  await execFileAsync(process.execPath, [decisionStateValidator, sourcePath, '--phase', 'rollover'], validatorOptions)

  const expectedPredecessor = `delivery:${sourceDelivery} — Issue #39 https://github.com/zhan7653/ohmypowers/issues/39 — body sha256:${issueDigest} — persistence Issue #39 https://github.com/zhan7653/ohmypowers/issues/39 read-back sha256:${issueDigest}`
  const successorState = sourceState
    .replace(`- Delivery ID: ${sourceDelivery}`, `- Delivery ID: ${successorDelivery}`)
    .replace('- Predecessor: none', `- Predecessor: ${expectedPredecessor}`)
  const wrongSuccessorPath = path.join(codexHome, 'power-gan', 'records', repositoryKey, successorDelivery, 'successor.md')
  await writeFile(wrongSuccessorPath, successorState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionNoteManager, 'rollover', sourcePath, wrongSuccessorPath],
      validatorOptions,
    ),
    /note path must be|permanent Ledger path/i,
  )
  await access(sourcePath)
  assert.equal(await readFile(wrongSuccessorPath, 'utf8'), successorState)
  await rm(wrongSuccessorPath)
  await writeFile(successorPath, successorState, 'utf8')
  await execFileAsync(
    process.execPath,
    [decisionNoteManager, 'rollover', sourcePath, successorPath],
    validatorOptions,
  )
  await assert.rejects(access(sourcePath))
  assert.equal(await readFile(successorPath, 'utf8'), successorState)

  const failedSourcePath = path.join(codexHome, 'power-gan', 'records', repositoryKey, 'v5-failed-source', 'decision-snapshot.md')
  const failedSuccessorPath = path.join(codexHome, 'power-gan', 'records', repositoryKey, 'v5-failed-successor', 'decision-snapshot.md')
  await mkdir(path.dirname(failedSourcePath), { recursive: true })
  await mkdir(path.dirname(failedSuccessorPath), { recursive: true })
  await writeFile(failedSourcePath, persistedSourceState.replace(`- Delivery ID: ${sourceDelivery}`, '- Delivery ID: v5-failed-source'), 'utf8')
  await writeFile(failedSuccessorPath, successorState.replace(`- Delivery ID: ${successorDelivery}`, '- Delivery ID: v5-failed-successor').replace(expectedPredecessor, 'delivery:v5-failed-source — Issue #39 https://github.com/zhan7653/ohmypowers/issues/39 — body sha256:bad — persistence Issue #39 https://github.com/zhan7653/ohmypowers/issues/39 read-back sha256:bad'), 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionNoteManager, 'rollover', failedSourcePath, failedSuccessorPath], validatorOptions),
    /Predecessor|sha256/i,
  )
  assert.equal(await readFile(failedSourcePath, 'utf8'), persistedSourceState.replace(`- Delivery ID: ${sourceDelivery}`, '- Delivery ID: v5-failed-source'))

  const { stdout: launchOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, successorPath, '--phase', 'launch'],
    validatorOptions,
  )
  const launchDigest = launchOutput.match(/launch content sha256: ([0-9a-f]{64})/i)?.[1]
  assert.ok(launchDigest)
  const authorizedState = successorState.replace(
    '- Overall launch confirmation: pending',
    `- Overall launch confirmation: confirmed — sha256:${launchDigest} — test confirmation`,
  )
  const completedState = authorizedState.replace(
    '- Handoff status: pending',
    '- Handoff status: complete — commit abc1234',
  )
  await writeFile(successorPath, completedState, 'utf8')
  await execFileAsync(
    process.execPath,
    [decisionNoteManager, 'handoff', successorPath],
    validatorOptions,
  )
  await assert.rejects(access(successorPath))
})

test('PowerShell payload creation is collision-safe across concurrent sessions', async t => {
  const pwsh = await availablePowerShell(t)
  if (!pwsh) return

  const reference = await read('power-gan/references/issue-persistence.md')
  const payloadBlock = extractPowerShellBlock(reference, 'function New-UniqueUtf8PayloadFile')
  const created = []

  try {
    const results = await Promise.all(
      Array.from({ length: 8 }, async (_, index) => {
        const script = [
          `$recordBody = 'record-${index}'`,
          `$noteBody = 'note-${index}'`,
          payloadBlock,
          '[ordered]@{ record = $recordFile; note = $noteFile } | ConvertTo-Json -Compress',
        ].join('\n')
        const { stdout } = await execFileAsync(
          pwsh,
          ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
          { encoding: 'utf8' },
        )
        return { index, ...JSON.parse(stdout.trim()) }
      }),
    )

    for (const result of results) {
      created.push(result.record, result.note)
      const record = await readFile(result.record)
      const note = await readFile(result.note)
      assert.equal(record.toString('utf8'), `record-${result.index}`)
      assert.equal(note.toString('utf8'), `note-${result.index}`)
      assert.notDeepEqual([...record.subarray(0, 3)], [0xef, 0xbb, 0xbf])
      assert.notDeepEqual([...note.subarray(0, 3)], [0xef, 0xbb, 0xbf])
    }
    assert.equal(new Set(created).size, created.length)
  } finally {
    await Promise.all(created.map(file => rm(file, { force: true })))
  }
})

test('PowerShell JSON pre-read rejects command, output, encoding, and JSON failures', async t => {
  const pwsh = await availablePowerShell(t)
  if (!pwsh) return

  const reference = await read('power-gan/references/issue-persistence.md')
  const helperBlock = extractPowerShellBlock(reference, 'function Invoke-Utf8JsonCli')
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'ohmypowers-json-cli-'))
  t.after(() => rm(tmp, { recursive: true, force: true }))

  const scripts = {
    failed: 'exit 7\n',
    empty: '$null\n',
    invalidJson: "[Console]::Out.Write('not-json')\n",
    invalidUtf8: '$bytes = [byte[]](0xFF); [Console]::OpenStandardOutput().Write($bytes, 0, $bytes.Length)\n',
    valid: "$value = [ordered]@{ body = '中文' }; [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); [Console]::Out.Write(($value | ConvertTo-Json -Compress))\n",
  }
  const paths = {}
  for (const [name, body] of Object.entries(scripts)) {
    paths[name] = path.join(tmp, `${name}.ps1`)
    await writeFile(paths[name], body, 'utf8')
  }

  const quote = value => `'${value.replaceAll("'", "''")}'`
  const driver = [
    helperBlock,
    '$pwsh = (Get-Process -Id $PID).Path',
    'function Assert-ReadFails {',
    '    param([string]$Path, [string]$Expected)',
    '    $failed = $false',
    "    try { $null = Invoke-Utf8JsonCli $pwsh @('-NoLogo', '-NoProfile', '-NonInteractive', '-File', $Path) 'probe' }",
    '    catch {',
    '        $failed = $true',
    '        if ($Expected -and -not $_.Exception.Message.Contains($Expected)) { throw }',
    '    }',
    "    if (-not $failed) { throw 'Expected the JSON read to fail.' }",
    '}',
    `Assert-ReadFails ${quote(paths.failed)} 'probe failed:'`,
    `Assert-ReadFails ${quote(paths.empty)} 'probe returned no JSON.'`,
    `Assert-ReadFails ${quote(paths.invalidJson)} 'probe returned invalid JSON:'`,
    `Assert-ReadFails ${quote(paths.invalidUtf8)} ''`,
    `$valid = Invoke-Utf8JsonCli $pwsh @('-NoLogo', '-NoProfile', '-NonInteractive', '-File', ${quote(paths.valid)}) 'valid probe'`,
    "if ([string]$valid.body -cne '中文') { throw 'Valid UTF-8 JSON did not round-trip.' }",
  ].join('\n')
  const driverPath = path.join(tmp, 'driver.ps1')
  await writeFile(driverPath, driver, 'utf8')

  await execFileAsync(pwsh, ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', driverPath], {
    encoding: 'utf8',
  })
})
test('retired core skill directories are absent', async () => {
  for (const skill of ['power-critic', 'power-think', 'power-grill', 'power-loop', 'power-verifier', 'power-work-report']) {
    await assert.rejects(access(path.join(root, skill, 'SKILL.md')))
  }
})
