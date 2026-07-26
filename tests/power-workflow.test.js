import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const execFileAsync = promisify(execFile)

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
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

test('power-gan grills unresolved decisions naturally and delivers adaptively', async () => {
  const skill = await read('power-gan/SKILL.md')

  assert.match(skill, /`ALIGN_ONLY`/)
  assert.match(skill, /`DELIVER`/)
  assert.match(skill, /`FAST`/)
  assert.match(skill, /`DEEP`/)
  assert.match(skill, /Keep any required skill announcement to one brief clause/i)
  assert.match(skill, /direct request to implement authorizes reversible source changes/i)
  assert.match(skill, /ask only whether the user wants implementation/i)
  const mainHeadings = ['Goal', 'Success', 'Constraints', 'Decision Rules', 'Validation', 'Stop Rules']
  for (const heading of mainHeadings) {
    assert.match(skill, new RegExp(`^## ${heading}$`, 'm'))
  }
  assert.deepEqual(skill.match(/^## .+$/gm), mainHeadings.map(heading => `## ${heading}`))
  assert.match(skill, /Run The Grill Loop/i)
  assert.match(skill, /make each grill turn do this/i)
  assert.match(skill, /Ask one to three highest-leverage unresolved questions/i)
  assert.match(skill, /Ask one question when later questions depend on its answer/i)
  assert.match(skill, /Ask two or three only when they belong to the same decision layer/i)
  assert.match(skill, /If the user answers only part of a batch, keep the unanswered questions unresolved/i)
  assert.match(skill, /Stop and wait for the user's answer/i)
  assert.match(skill, /Use one short paragraph of context, not a bullet list/i)
  assert.match(skill, /Do not announce interview phases, mode transitions, or a future sequence of questions/i)
  assert.match(skill, /Do not front-load a design baseline, list downstream decisions/i)
  assert.match(skill, /assumption about a material user-owned boundary as unresolved/i)
  assert.match(skill, /Treat verified repository facts as facts/i)
  assert.match(skill, /keep agent-owned reversible implementation assumptions outside the user confirmation loop/i)
  assert.match(skill, /“先设计” authorizes the interview, not a full design written on the user's behalf/i)
  assert.match(skill, /If the previous turn made an unconfirmed recommendation, keep it in the next question batch/i)
  assert.match(skill, /do not output a design draft, acceptance criteria, a multi-bullet decision list, or numbered alternatives/i)
  assert.match(skill, /State one recommendation for each current question/i)
  assert.match(skill, /Inspect Before Asking/i)
  assert.match(skill, /Resolve observable product and state semantics before interface syntax or compatibility mechanics/i)
  assert.match(skill, /Be relentless about unresolved boundaries, not about filling fields/i)
  assert.match(skill, /Accept concise confirmation when the immediately preceding question makes its scope unambiguous/i)
  assert.match(skill, /Do not manufacture alternatives, force symmetry, use a routine A\/B\/C template/i)
  assert.match(skill, /do not ask the user to choose reversible implementation mechanics/i)
  assert.match(skill, /repository-derived assumption may guide non-material, reversible implementation as a visible working default/i)
  assert.match(skill, /does not resolve a material user-owned boundary/i)
  assert.match(skill, /material boundary as resolved only by an explicit user decision or an explicit not-applicable conclusion/i)
  assert.doesNotMatch(skill, /repository-derived assumption the user has not disputed/i)
  assert.doesNotMatch(skill, /do not call or depend on `grill-me`/i)
  assert.doesNotMatch(skill, /generic reply such as “可以”, “确认”, or “应用”/i)
  assert.doesNotMatch(skill, /strongest credible argument against/i)
  assert.match(skill, /durable subsystem, runtime, deployment, storage, or data-ownership boundary/i)
  assert.match(skill, /shared contract across modules or teams/i)
  assert.match(skill, /Do not escalate a local signature or replaceable abstraction/i)
  assert.match(skill, /Materiality alone does not authorize hosted mutation or force creation of an Issue/i)
  assert.match(skill, /Treat the user's direct implementation request as launch authorization/i)
  assert.match(skill, /Wait only when implementation would introduce an unresolved material commitment/i)
  assert.match(skill, /mention alternatives only when they are genuinely viable/i)
  assert.doesNotMatch(skill, /Wait once for explicit launch authorization/i)
  assert.doesNotMatch(skill, /discuss at least shrinking, splitting, or continuing/i)
  assert.match(skill, /Treat comments as history and evidence/i)
  assert.match(skill, /code to commit, commit to PR\/MR, PR\/MR to Decision Issue/i)
  assert.match(skill, /references\/issue-persistence\.md/)
  assert.match(skill, /references\/delivery-evidence\.md/)
  assert.match(skill, /Use a fresh non-implementation context when independence matters/i)
  assert.match(skill, /CHECK_REQUIRED/)
  assert.match(skill, /always select the smallest adequate persistence carrier/i)
  assert.match(skill, /proactively.*Decision Record draft/i)
  assert.match(skill, /independent judgment/i)
  assert.match(skill, /do not flatter|no flattery/i)
  assert.match(skill, /do not (?:flatter.*)?mirror|no mirroring/i)
  assert.match(skill, /route by task shape/i)
  assert.match(skill, /worker.*gpt-5\.6-terra.*high/i)
  assert.match(skill, /explorer.*gpt-5\.6-sol.*medium/i)
  assert.match(skill, /default.*gpt-5\.6-sol.*xhigh/i)
  assert.match(skill, /custom `power_reviewer`/i)
  assert.match(skill, /final arbitration.*main context/i)
  assert.match(skill, /fork_turns: none.*smallest supported positive history slice/i)
  assert.match(skill, /task packet/i)
  assert.match(skill, /If the host cannot honor the intended routing/i)
  assert.match(skill, /stable final candidate/i)
  assert.match(skill, /same independent reviewer.*only the delta and affected evidence/i)
  assert.doesNotMatch(skill, /current main agent announces and selects/i)
  assert.doesNotMatch(skill, /this skill does not call another skill/i)
  assert.match(skill, /Do not persist that packet as a Blueprint or Agent Dispatch Plan/i)
  assert.doesNotMatch(skill, /^# (?:Task Contract|Execution Blueprint|Agent Dispatch Plan)$/m)
  assert.doesNotMatch(skill, /Ask exactly one highest-leverage unresolved question/i)
})

test('power-gan question batching stays consistent across workflow guidance', async () => {
  const [skill, readme, spec] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  assert.match(skill, /one to three highest-leverage unresolved questions/i)
  assert.match(readme, /focused rounds of one to three questions/i)
  assert.match(spec, /每轮必须提出一至三个最高杠杆问题/)
  assert.match(spec, /同一决策层的独立问题/)
  assert.doesNotMatch(spec, /Deep Grill 必须一次只问一个问题/)
})

test('power-check is read-only and checks only current decisions and final evidence', async () => {
  const [skill, profile] = await Promise.all([
    read('power-check/SKILL.md'),
    read('power-check/agents/reviewer.toml'),
  ])

  assert.match(skill, /materially affects or creates credible production risk/i)
  assert.match(skill, /production persistent state/i)
  assert.match(skill, /external or cross-version compatibility commitments/i)
  assert.match(skill, /concurrency correctness/i)
  assert.match(skill, /Merely touching related code, configuration, tests, caches, fixtures, or compatibility logic is insufficient/i)
  assert.match(skill, /A small diff can still be material/i)
  assert.match(skill, /backward-compatible optional configuration field/i)
  assert.doesNotMatch(skill, /when delivery risk involves security, privacy, permissions, persistent state/i)
  assert.match(skill, /without editing source, Git state, Issues, PRs, or comments/i)
  assert.match(skill, /current confirmed user decisions/i)
  assert.match(skill, /final implementation tree and diff/i)
  assert.match(skill, /Do not turn a Working Strategy, Blueprint, rejected option/i)
  assert.match(skill, /`PASS`/)
  assert.match(skill, /`PASS_WITH_NOTES`/)
  assert.match(skill, /`BLOCKED`/)
  assert.match(skill, /`NEEDS_HUMAN`/)
  assert.match(skill, /`CHECK_REQUIRED`/)
  assert.match(skill, /compare the new identity with the checked identity and inspect only the delta/i)
  assert.match(skill, /main or implementation context[\s\S]*custom `power_reviewer`/i)
  assert.match(skill, /explicitly (?:tell|instruct).*`\$power-check`/i)
  assert.match(skill, /fresh `power_reviewer` context.*do not spawn another reviewer/i)
  assert.match(skill, /agent configuration.*model.*reasoning.*no-write\/no-delegation/i)
  assert.match(skill, /implementation identity immediately before delegation.*tree and diff again after/i)
  assert.match(skill, /Start the independent check only after the delivery has reached a stable final candidate/i)
  assert.match(skill, /wake the same independent `power_reviewer` context/i)
  assert.match(skill, /first check inspects the complete final diff/i)
  assert.match(skill, /inspect only the delta, affected decision mappings, and affected regression evidence/i)
  assert.match(skill, /Reuse unchanged Decision Record mappings, source inspection, and validation evidence/i)
  assert.match(skill, /verified local Decision Record snapshot.*instead of fetching the network again/i)
  assert.match(skill, /incompatible platform.*duplicate evidence/i)
  assert.doesNotMatch(skill, /read-only sandbox|sandbox_mode/i)
  assert.doesNotMatch(skill, /gpt-5\.6-(?:sol|terra)/i)
  assert.match(profile, /name = "power_reviewer"/)
  assert.match(profile, /model = "gpt-5\.6-sol"/)
  assert.match(profile, /model_reasoning_effort = "high"/)
  assert.match(profile, /Do not edit files, Git state, Issues, PRs, comments, or any external state/i)
  assert.match(profile, /Do not delegate to another agent/i)
  assert.doesNotMatch(profile, /sandbox_mode/)
  for (const field of [
    'Decision source',
    'Final implementation identity',
    'Validation evidence',
    'Residual risk',
    'Smallest next action',
  ]) {
    assert.match(skill, new RegExp(field, 'i'))
  }
})

test('managed reviewer routing stays uniquely named and behaviorally read-only', async () => {
  const [gan, check, readme, spec, profile] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('power-check/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
    read('power-check/agents/reviewer.toml'),
  ])

  for (const text of [gan, check, readme, spec, profile]) assert.match(text, /power_reviewer/)
  assert.match(readme, /Codex CLI 0\.145\.0 multi-agent V2/i)
  assert.match(spec, /Codex CLI 0\.145\.0 multi-agent V2/i)
  assert.match(readme, /does not rely on the host sandbox being downgraded/i)
  assert.match(spec, /不要求宿主强制降级 reviewer sandbox/)
  assert.match(check, /tree and diff again after the response/i)
  assert.match(gan, /final tree and diff are unchanged after the reviewer returns/i)
  assert.doesNotMatch(profile, /sandbox_mode/)
})

test('independent review waits for the final candidate and retries only affected delta', async () => {
  const [gan, check, readme, spec] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('power-check/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  for (const text of [gan, check, readme]) {
    assert.match(text, /stable final candidate|final candidate is stable/i)
    assert.match(text, /complete final diff/i)
    assert.match(text, /same independent .*reviewer/i)
    assert.match(text, /only the delta/i)
  }
  assert.match(check, /Do not remap the complete unchanged Decision Record/i)
  assert.match(check, /Do not run a command on an incompatible platform/i)
  assert.match(spec, /最终 tree\/diff 身份稳定后启动/)
  assert.match(spec, /同一 reviewer 上下文，只检查.*delta/)
  assert.match(spec, /不得为重复取证重新联网/)
})

test('power-check materiality trigger stays consistent across workflow guidance', async () => {
  const [check, gan, readme, spec] = await Promise.all([
    read('power-check/SKILL.md'),
    read('power-gan/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  for (const text of [check, gan, readme]) {
    assert.match(text, /materially affects or creates credible production risk/i)
    assert.match(text, /production persistent state/i)
    assert.match(text, /external or cross-version compatibility/i)
    assert.match(text, /concurrency correctness/i)
  }
  assert.match(spec, /材料影响或可信生产风险/)
  assert.match(spec, /外部或跨版本兼容/)
  assert.match(spec, /仅触碰相关代码、配置、测试、缓存、fixture 或兼容逻辑不足以触发独立检查/)
})

test('issue persistence supports verified GitHub and GitLab mutations without repo Markdown', async () => {
  const reference = await read('power-gan/references/issue-persistence.md')

  assert.match(reference, /(?:host )?operating system'?s temporary directory|OS temp(?:orary)? directory|os\.tmpdir\(\)/i)
  assert.match(reference, /UTF-8 (?:without|no) (?:a )?BOM/i)
  assert.match(reference, /raw.*read|read.*raw/i)
  assert.match(reference, /SHA-256/i)
  assert.match(reference, /body.*round-trip exactly|exact expected body/i)
  assert.match(reference, /protected sections or markers.*UTF-8 hashes separately/i)
  assert.match(reference, /mojibake/i)
  assert.doesNotMatch(reference, /\/tmp\/power-gan-decision-record\.md/)
  assert.match(reference, /session-unique/i)
  assert.match(reference, /\[Guid\]::NewGuid\(\)/)
  assert.match(reference, /\[IO\.FileMode\]::CreateNew/)
  assert.doesNotMatch(reference, /Join-Path \$tempDir ['"]power-gan-decision-(?:record|note)\.md['"]/)
  assert.match(reference, /explicitly requested or confirmed that mutation/i)
  assert.match(reference, /gh issue create[\s\S]*--body-file/i)
  assert.match(reference, /gh issue edit[\s\S]*--body-file/i)
  assert.match(reference, /Invoke-Utf8JsonCli \$gh[\s\S]*'issue', 'view'[\s\S]*'--json'/i)
  assert.match(reference, /glab issue create[\s\S]*-R \$repo/i)
  assert.match(reference, /glab issue update[\s\S]*-R \$repo/i)
  assert.match(reference, /Invoke-Utf8JsonCli \$glab[\s\S]*'issue', 'view'[\s\S]*'-R', \$repo/i)
  assert.match(reference, /full repository URL when required/i)
  assert.match(reference, /When a Decision Issue is the canonical source for the delivery/i)
  assert.match(reference, /Alternative not chosen: <include only when/i)
  assert.match(reference, /Do not invent alternatives to complete the template/i)
  assert.doesNotMatch(reference, /rejected: <main alternative>/i)
  assert.doesNotMatch(reference, /New evidence or objection/i)
  for (const field of ['Change', 'Reason / evidence', 'Confirmed decision', 'Rationale', 'Confirmed by']) {
    assert.match(reference, new RegExp(field, 'i'))
  }
})

test('issue persistence fails closed before hosted mutation and verifies the full contract', async () => {
  const reference = await read('power-gan/references/issue-persistence.md')

  assert.match(reference, /failed command, empty output, invalid JSON, missing required field, or undecodable UTF-8 as a hard pre-write stop/i)
  assert.match(reference, /StandardOutputEncoding = \$strictUtf8/)
  assert.match(reference, /process\.ExitCode -ne 0/)
  assert.match(reference, /IsNullOrWhiteSpace\(\$stdout\)/)
  assert.match(reference, /ConvertFrom-Json -ErrorAction Stop/)
  assert.match(reference, /GitHub Issue pre-write check/)
  assert.match(reference, /GitLab Issue pre-write check/)
  assert.match(reference, /GitHub Issue changed after the captured snapshot/i)
  assert.match(reference, /GitLab Issue changed after the captured snapshot/i)
  assert.match(reference, /Get-Utf8Sha256 \(\[string\]\$before\.body\)/)
  assert.match(reference, /Get-Utf8Sha256 \(\[string\]\$before\.description\)/)
  assert.match(reference, /identity, metadata, and body exactly/i)
  assert.match(reference, /identity, metadata, and description exactly/i)
  assert.match(reference, /Get-ProjectProtectedRangeHashes/)
  assert.match(reference, /Assert-ProjectProtectedRangeHashes/)
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

test('decision revisions remain optional and repository-defined', async () => {
  const [skill, reference, readme, spec] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('power-gan/references/issue-persistence.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  assert.match(skill, /If the repository uses decision revisions/i)
  assert.match(reference, /omit when the repository does not use revisions/i)
  assert.match(readme, /a revision only when the repository uses one/i)
  assert.match(spec, /仅在仓库采用 revision 时记录 revision/)
  assert.doesNotMatch(readme, /status, revision, outcome/i)
})

test('delivery evidence records final facts without recreating an implementation plan', async () => {
  const reference = await read('power-gan/references/delivery-evidence.md')

  for (const field of [
    'Decision source',
    'Delivered outcome',
    'Material deviations',
    'Validation',
    'Independent check',
    'Remaining risks or follow-up',
  ]) {
    assert.match(reference, new RegExp(field, 'i'))
  }
  assert.match(reference, /Record observed delivery facts, not the implementation plan/i)
  assert.match(reference, /Do not add Working Strategy/i)
  assert.doesNotMatch(reference, /Execution Blueprint|Agent Dispatch Plan|reviewer topology table/i)
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
  assert.match(curator, /Never collapse or supersede Issues from title similarity alone/i)
  assert.match(curator, /later tree or diff change invalidates the old result/i)
})

test('retired core skill directories are absent', async () => {
  for (const skill of ['power-think', 'power-grill', 'power-loop', 'power-verifier']) {
    await assert.rejects(access(path.join(root, skill, 'SKILL.md')))
  }
})
