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

test('power-gan decision state validator prevents lossy or premature launch', async t => {
  const legacyRoot = path.join(os.tmpdir(), 'power-gan')
  await mkdir(legacyRoot, { recursive: true })
  const tmp = await mkdtemp(path.join(legacyRoot, 'legacy-decision-state-'))
  t.after(() => rm(tmp, { recursive: true, force: true }))
  const statePath = path.join(tmp, 'decision-snapshot.md')
  const alignmentState = `# Decision Snapshot

- Thread: test-thread
- Next decision ID: D003
- Outcome: pending
- Scope / non-goals: pending
- Launch basis: pending
- Stop / reopen conditions: pending
- Final carrier: pending
- Overall launch confirmation: pending
- Handoff status: pending

## Decisions

- D001 [confirmed]: Preserve the public response contract.
- D002 [pending]: Decide whether old clients remain supported.
`
  await writeFile(statePath, alignmentState, 'utf8')

  await execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'alignment'])
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'launch']),
    /pending decision/i,
  )

  const launchState = alignmentState
    .replace('- Outcome: pending', '- Outcome: Ship the compatible response contract.')
    .replace('- Scope / non-goals: pending', '- Scope / non-goals: Keep old clients; do not redesign transport.')
    .replace('- Launch basis: pending', '- Launch basis: Add contract tests before implementation.')
    .replace('- Stop / reopen conditions: pending', '- Stop / reopen conditions: Stop if wire compatibility must break.')
    .replace('- Final carrier: pending', '- Final carrier: commit')
    .replace('- D002 [pending]:', '- D002 [delegated]:')
  await writeFile(statePath, launchState, 'utf8')

  const { stdout: launchOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'launch'],
  )
  const launchDigest = launchOutput.match(/launch content sha256: ([0-9a-f]{64})/i)?.[1]
  assert.ok(launchDigest, 'launch validation must return the confirmation digest')
  const snapshotStart = '-----BEGIN POWER-GAN DECISION SNAPSHOT-----\n'
  const snapshotEnd = '-----END POWER-GAN DECISION SNAPSHOT-----'
  const contentStart = launchOutput.indexOf(snapshotStart) + snapshotStart.length
  const contentEnd = launchOutput.lastIndexOf(snapshotEnd)
  assert.ok(contentStart >= snapshotStart.length, 'launch output must contain the start marker')
  assert.ok(contentEnd >= contentStart, 'launch output must contain the end marker')
  const renderedSnapshot = launchOutput.slice(contentStart, contentEnd)
  assert.equal(renderedSnapshot, launchState.replaceAll('\r\n', '\n'))
  assert.equal(createHash('sha256').update(renderedSnapshot, 'utf8').digest('hex'), launchDigest)

  for (const marker of [snapshotStart.trimEnd(), snapshotEnd]) {
    await writeFile(
      statePath,
      launchState.replace(
        'Preserve the public response contract.',
        `Preserve the public response contract. ${marker}`,
      ),
      'utf8',
    )
    await rejectsWithStderr(
      execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'launch']),
      /reserved snapshot marker/i,
    )
  }
  await writeFile(statePath, launchState, 'utf8')

  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'authorized']),
    /launch confirmation/i,
  )

  const authorizedState = launchState.replace(
    '- Overall launch confirmation: pending',
    `- Overall launch confirmation: confirmed — sha256:${launchDigest} — user confirmed complete rendering`,
  )
  await writeFile(statePath, authorizedState, 'utf8')
  const { stdout: authorizedOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'authorized'],
  )
  assert.doesNotMatch(authorizedOutput, /BEGIN POWER-GAN DECISION SNAPSHOT/)

  await writeFile(
    statePath,
    authorizedState.replace(
      'Preserve the public response contract.',
      'Change the public response contract.',
    ),
    'utf8',
  )
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'authorized']),
    /does not match current launch content/i,
  )

  await writeFile(statePath, authorizedState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'handoff']),
    /handoff status/i,
  )
  await writeFile(
    statePath,
    authorizedState.replace('- Handoff status: pending', '- Handoff status: complete — commit abc123'),
    'utf8',
  )
  await execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'handoff'])

  await writeFile(statePath, launchState.replace(/^- D002 .*\n/m, ''), 'utf8')
  await rejectsWithStderr(
    execFileAsync(process.execPath, [decisionStateValidator, statePath, '--phase', 'launch']),
    /contiguous/i,
  )
})

test('power-gan keeps version 2 ledgers durable and gates launch on Issue persistence', async t => {
  const codexHome = await mkdtemp(path.join(os.tmpdir(), 'power-gan-codex-home-'))
  t.after(() => rm(codexHome, { recursive: true, force: true }))
  const repositoryKey = 'github.com-zhan7653-ohmypowers'
  const deliveryId = 'delivery-018f8f86-7b10-7f42-9f44-7f68f93a4a1c'
  const statePath = path.join(
    codexHome,
    'power-gan',
    'records',
    repositoryKey,
    deliveryId,
    'decision-snapshot.md',
  )
  await mkdir(path.dirname(statePath), { recursive: true })
  const validatorOptions = { env: { ...process.env, CODEX_HOME: codexHome } }
  const alignmentState = `# Decision Snapshot

- Ledger version: 2
- Repository key: ${repositoryKey}
- Delivery ID: ${deliveryId}
- Thread: test-thread
- Next decision ID: D003
- Outcome: pending
- Scope / non-goals: pending
- Launch basis: pending
- Stop / reopen conditions: pending
- Final carrier: pending
- Issue persistence: pending
- Overall launch confirmation: pending
- Handoff status: pending

## Decisions

- D001 [confirmed]: Preserve the public response contract.
  Basis: Existing clients consume the verified response shape.
  Recommendation: Preserve that shape because compatibility is required.
  Resolution evidence: User explicitly confirmed the compatibility boundary.
- D002 [pending]: Decide whether old clients remain supported.
  Basis: Repository inspection found both old and new client versions.
  Recommendation: Keep old clients because removing them changes the public contract.
  Resolution evidence: pending
`
  await writeFile(statePath, alignmentState, 'utf8')

  await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'alignment'],
    validatorOptions,
  )

  const versionlessOutsideLegacyPath = path.join(codexHome, 'versionless', 'decision-snapshot.md')
  await mkdir(path.dirname(versionlessOutsideLegacyPath), { recursive: true })
  await writeFile(
    versionlessOutsideLegacyPath,
    alignmentState
      .replace('- Ledger version: 2\n', '')
      .replace(`- Repository key: ${repositoryKey}\n`, '')
      .replace(`- Delivery ID: ${deliveryId}\n`, '')
      .replace('- Issue persistence: pending\n', ''),
    'utf8',
  )
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, versionlessOutsideLegacyPath, '--phase', 'alignment'],
      validatorOptions,
    ),
    /version 2 or 3 is required outside the legacy temporary/i,
  )

  const outsidePath = path.join(codexHome, 'outside', 'decision-snapshot.md')
  await mkdir(path.dirname(outsidePath), { recursive: true })
  await writeFile(outsidePath, alignmentState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, outsidePath, '--phase', 'alignment'],
      validatorOptions,
    ),
    /permanent ledger path/i,
  )

  await writeFile(statePath, alignmentState.replace('  Basis: Existing clients', '  Context: Existing clients'), 'utf8')
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, statePath, '--phase', 'alignment'],
      validatorOptions,
    ),
    /D001.*Basis/i,
  )

  const issueBodyDigest = 'a'.repeat(64)
  const launchState = alignmentState
    .replace('- Outcome: pending', '- Outcome: Ship the compatible response contract.')
    .replace('- Scope / non-goals: pending', '- Scope / non-goals: Keep old clients; do not redesign transport.')
    .replace('- Launch basis: pending', '- Launch basis: Add contract tests before implementation.')
    .replace('- Stop / reopen conditions: pending', '- Stop / reopen conditions: Stop if wire compatibility must break.')
    .replace('- Final carrier: pending', '- Final carrier: Decision Issue #38 — https://github.com/example/project/issues/38')
    .replace(
      '- Issue persistence: pending',
      `- Issue persistence: verified — Issue #38 — https://github.com/example/project/issues/38 — authorization confirmed — read-back sha256:${issueBodyDigest}`,
    )
    .replace('- D002 [pending]:', '- D002 [confirmed]:')
    .replace('  Resolution evidence: pending', '  Resolution evidence: User explicitly confirmed continued old-client support.')
  await writeFile(statePath, launchState, 'utf8')

  const { stdout: launchOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'launch'],
    validatorOptions,
  )
  const launchDigest = launchOutput.match(/launch content sha256: ([0-9a-f]{64})/i)?.[1]
  assert.ok(launchDigest)

  await writeFile(
    statePath,
    launchState.replace('authorization confirmed', 'authorization pending'),
    'utf8',
  )
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, statePath, '--phase', 'launch'],
      validatorOptions,
    ),
    /Issue persistence/i,
  )

  const authorizedState = launchState.replace(
    '- Overall launch confirmation: pending',
    `- Overall launch confirmation: confirmed — sha256:${launchDigest} — user confirmed complete rendering`,
  )
  const handoffState = authorizedState.replace(
    '- Handoff status: pending',
    `- Handoff status: complete — Issue #38 — read-back sha256:${'b'.repeat(64)}`,
  )
  await writeFile(
    statePath,
    authorizedState.replace('- Handoff status: pending', '- Handoff status: complete — Issue #38'),
    'utf8',
  )
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, statePath, '--phase', 'handoff'],
      validatorOptions,
    ),
    /carrier read-back evidence/i,
  )
  await writeFile(statePath, handoffState, 'utf8')
  await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'handoff'],
    validatorOptions,
  )
  assert.equal(await readFile(statePath, 'utf8'), handoffState)

  const secondDeliveryId = 'delivery-018f8f86-7b10-7f42-9f44-7f68f93a4a1d'
  const secondStatePath = path.join(
    codexHome,
    'power-gan',
    'records',
    repositoryKey,
    secondDeliveryId,
    'decision-snapshot.md',
  )
  await mkdir(path.dirname(secondStatePath), { recursive: true })
  await writeFile(
    secondStatePath,
    alignmentState.replace(`- Delivery ID: ${deliveryId}`, `- Delivery ID: ${secondDeliveryId}`),
    'utf8',
  )
  await execFileAsync(
    process.execPath,
    [decisionStateValidator, secondStatePath, '--phase', 'alignment'],
    validatorOptions,
  )
  assert.notEqual(statePath, secondStatePath)

  const conflictingMechanicalState = launchState
    .replace(
      /^- Final carrier:.*$/m,
      '- Final carrier: commit after a purely mechanical formatting correction',
    )
    .replace(
      /^- Issue persistence:.*$/m,
      '- Issue persistence: mechanical exemption requested — formatting-only edit with no observable or contract change',
    )
  await writeFile(statePath, conflictingMechanicalState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, statePath, '--phase', 'launch'],
      validatorOptions,
    ),
    /mechanical Issue exemption cannot coexist with active material decisions/i,
  )

  const mechanicalLaunchState = conflictingMechanicalState
    .replace('- Next decision ID: D003', '- Next decision ID: D001')
    .replace(/\n- D001[\s\S]*$/, '\n')
  await writeFile(statePath, mechanicalLaunchState, 'utf8')
  const { stdout: mechanicalLaunchOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'launch'],
    validatorOptions,
  )
  const mechanicalDigest = mechanicalLaunchOutput.match(/launch content sha256: ([0-9a-f]{64})/i)?.[1]
  assert.ok(mechanicalDigest)
  await writeFile(
    statePath,
    mechanicalLaunchState.replace(
      '- Overall launch confirmation: pending',
      `- Overall launch confirmation: confirmed — sha256:${mechanicalDigest} — user confirmed complete rendering including the mechanical exemption`,
    ),
    'utf8',
  )
  await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'authorized'],
    validatorOptions,
  )
})

test('power-gan version 3 separates launch confirmation from history and compacts routine handoff', async t => {
  const codexHome = await mkdtemp(path.join(os.tmpdir(), 'power-gan-v3-codex-home-'))
  t.after(() => rm(codexHome, { recursive: true, force: true }))
  const repositoryKey = 'github.com-zhan7653-ohmypowers'
  const deliveryId = 'compact-routine-delivery'
  const statePath = path.join(
    codexHome,
    'power-gan',
    'records',
    repositoryKey,
    deliveryId,
    'decision-snapshot.md',
  )
  await mkdir(path.dirname(statePath), { recursive: true })
  const validatorOptions = { env: { ...process.env, CODEX_HOME: codexHome } }
  const issueBodyDigest = 'a'.repeat(64)
  const alignmentState = `# Decision Snapshot

- Ledger version: 3
- Repository key: ${repositoryKey}
- Delivery ID: ${deliveryId}
- Thread: test-thread
- Next decision ID: D005
- Outcome: Ship the compatible response contract.
- Scope / non-goals: Keep old clients; do not redesign transport.
- Launch basis: Add contract tests before implementation.
- Stop / reopen conditions: Stop if wire compatibility must break.
- Final carrier: commit on develop linked to Decision Issue #39 https://github.com/example/project/issues/39
- Issue persistence: verified — Issue #39 https://github.com/example/project/issues/39 — authorization confirmed — read-back sha256:${issueBodyDigest}
- Handoff retention: pending
- Overall launch confirmation: pending
- Handoff status: pending

## Decisions

- D001 [confirmed]: Preserve the public response contract.
  Basis: Existing clients consume the verified response shape.
  Recommendation: Preserve that shape because compatibility is required.
  Resolution evidence: User explicitly confirmed the compatibility boundary.
- D002 [delegated]: Keep old clients supported.
  Basis: Repository inspection found both old and new client versions.
  Recommendation: Keep old clients because removing them changes the public contract.
  Resolution evidence: User explicitly delegated this boundary.
- D003 [rejected]: Remove the old response contract immediately.
  Basis: The old contract was considered during alignment.
  Recommendation: Do not remove it because verified clients still depend on it.
  Resolution evidence: User rejected immediate removal.
- D004 [superseded]: Return only the legacy response shape.
  Basis: This was the first confirmed compatibility boundary.
  Recommendation: Keep it until the additive shape was confirmed.
  Resolution evidence: Superseded by D002 after the additive contract was confirmed.

## Working defaults

- Use debug logging while implementing.
`
  await writeFile(statePath, alignmentState, 'utf8')

  await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'alignment'],
    validatorOptions,
  )

  const { stdout: launchOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'launch'],
    validatorOptions,
  )
  const launchDigest = launchOutput.match(/launch content sha256: ([0-9a-f]{64})/i)?.[1]
  assert.ok(launchDigest)
  const snapshotStart = '-----BEGIN POWER-GAN DECISION SNAPSHOT-----\n'
  const snapshotEnd = '-----END POWER-GAN DECISION SNAPSHOT-----'
  const renderedSnapshot = launchOutput.slice(
    launchOutput.indexOf(snapshotStart) + snapshotStart.length,
    launchOutput.lastIndexOf(snapshotEnd),
  )
  const expectedProjection = `# Decision Snapshot

- Outcome: Ship the compatible response contract.
- Scope / non-goals: Keep old clients; do not redesign transport.
- Launch basis: Add contract tests before implementation.
- Stop / reopen conditions: Stop if wire compatibility must break.
- Final carrier: commit on develop linked to Decision Issue #39 https://github.com/example/project/issues/39
- Issue persistence: verified — Issue #39 https://github.com/example/project/issues/39 — authorization confirmed — read-back sha256:${issueBodyDigest}

## Active decisions

- D001 [confirmed]: Preserve the public response contract.
- D002 [delegated]: Keep old clients supported.
`
  assert.equal(renderedSnapshot, expectedProjection)
  assert.equal(createHash('sha256').update(renderedSnapshot, 'utf8').digest('hex'), launchDigest)

  const authorizedState = alignmentState.replace(
    '- Overall launch confirmation: pending',
    `- Overall launch confirmation: confirmed — sha256:${launchDigest} — user confirmed complete rendering`,
  )
  await writeFile(statePath, authorizedState, 'utf8')
  await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'authorized'],
    validatorOptions,
  )

  const historyOnlyChange = authorizedState
    .replace(
      'Recommendation: Preserve that shape because compatibility is required.',
      'Recommendation: Historical recommendation wording changed.',
    )
    .replace(
      'Remove the old response contract immediately.',
      'Remove every legacy response contract immediately.',
    )
    .replace('Return only the legacy response shape.', 'Return only the original response shape.')
    .replace('Use debug logging while implementing.', 'Use trace logging while implementing.')
  await writeFile(statePath, historyOnlyChange, 'utf8')
  await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'authorized'],
    validatorOptions,
  )

  await writeFile(
    statePath,
    historyOnlyChange.replace(
      'Preserve the public response contract.',
      'Change the public response contract.',
    ),
    'utf8',
  )
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, statePath, '--phase', 'authorized'],
      validatorOptions,
    ),
    /does not match current launch content/i,
  )

  const compactHandoffState = historyOnlyChange
    .replace(
      '- Handoff retention: pending',
      '- Handoff retention: compact — routine delivery with no material protected risk',
    )
    .replace('- Handoff status: pending', '- Handoff status: complete — commit abc1234')
  for (const marker of [
    '-----BEGIN POWER-GAN DECISION INDEX-----',
    '-----END POWER-GAN DECISION INDEX-----',
  ]) {
    await writeFile(
      statePath,
      compactHandoffState.replace('complete — commit abc1234', `complete — commit abc1234 ${marker}`),
      'utf8',
    )
    await rejectsWithStderr(
      execFileAsync(
        process.execPath,
        [decisionStateValidator, statePath, '--phase', 'handoff'],
        validatorOptions,
      ),
      /compact index contains reserved marker/i,
    )
  }
  await writeFile(statePath, compactHandoffState, 'utf8')
  const { stdout: handoffOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'handoff'],
    validatorOptions,
  )
  const indexStart = '-----BEGIN POWER-GAN DECISION INDEX-----\n'
  const indexEnd = '-----END POWER-GAN DECISION INDEX-----'
  const renderedIndex = handoffOutput.slice(
    handoffOutput.indexOf(indexStart) + indexStart.length,
    handoffOutput.lastIndexOf(indexEnd),
  )
  const expectedIndex = `# Decision Ledger Index

- Ledger version: 3
- Repository key: ${repositoryKey}
- Delivery ID: ${deliveryId}
- Next decision ID: D005
- Decision source: verified — Issue #39 https://github.com/example/project/issues/39 — authorization confirmed — read-back sha256:${issueBodyDigest}
- Final carrier: commit on develop linked to Decision Issue #39 https://github.com/example/project/issues/39
- Decision content SHA-256: sha256:${launchDigest}
- Handoff evidence: complete — commit abc1234
`
  assert.equal(renderedIndex, expectedIndex)
  assert.match(
    handoffOutput,
    new RegExp(`decision index sha256: ${createHash('sha256').update(expectedIndex, 'utf8').digest('hex')}`),
  )

  await writeFile(statePath, renderedIndex, 'utf8')
  await execFileAsync(
    process.execPath,
    [decisionStateValidator, statePath, '--phase', 'handoff'],
    validatorOptions,
  )

  const fullDeliveryId = 'retain-full-risk-delivery'
  const fullStatePath = path.join(
    codexHome,
    'power-gan',
    'records',
    repositoryKey,
    fullDeliveryId,
    'decision-snapshot.md',
  )
  await mkdir(path.dirname(fullStatePath), { recursive: true })
  const fullHandoffState = authorizedState
    .replace(`- Delivery ID: ${deliveryId}`, `- Delivery ID: ${fullDeliveryId}`)
    .replace(
      '- Handoff retention: pending',
      '- Handoff retention: full — material cross-version compatibility risk',
    )
    .replace('- Handoff status: pending', '- Handoff status: complete — commit def5678')
  await writeFile(fullStatePath, fullHandoffState, 'utf8')
  const { stdout: fullHandoffOutput } = await execFileAsync(
    process.execPath,
    [decisionStateValidator, fullStatePath, '--phase', 'handoff'],
    validatorOptions,
  )
  assert.doesNotMatch(fullHandoffOutput, /BEGIN POWER-GAN DECISION INDEX/)
  assert.equal(await readFile(fullStatePath, 'utf8'), fullHandoffState)

  const incompleteHandoffState = fullHandoffState
    .replace(
      '- Handoff retention: full — material cross-version compatibility risk',
      '- Handoff retention: pending',
    )
    .replace('- Handoff status: complete — commit def5678', '- Handoff status: pending')
  await writeFile(fullStatePath, incompleteHandoffState, 'utf8')
  await rejectsWithStderr(
    execFileAsync(
      process.execPath,
      [decisionStateValidator, fullStatePath, '--phase', 'handoff'],
      validatorOptions,
    ),
    /handoff status|retention/i,
  )
  assert.equal(await readFile(fullStatePath, 'utf8'), incompleteHandoffState)
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
  for (const skill of ['power-think', 'power-grill', 'power-loop', 'power-verifier', 'power-work-report']) {
    await assert.rejects(access(path.join(root, skill, 'SKILL.md')))
  }
})
