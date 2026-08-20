import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'power-gan-decision-state-'))
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
