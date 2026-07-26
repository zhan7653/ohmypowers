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
  const [skill, orchestration] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('power-gan/references/orchestration.md'),
  ])

  assert.match(skill, /`ALIGN_ONLY`/)
  assert.match(skill, /`DELIVER`/)
  assert.match(skill, /`FAST`/)
  assert.match(skill, /`DEEP`/)
  assert.match(skill, /Keep any required skill announcement to one brief clause/i)
  assert.match(skill, /direct request to implement authorizes reversible work within the confirmed scope/i)
  assert.match(skill, /If implementation intent is unclear, ask only that/i)
  const mainHeadings = [
    'Core Contract',
    'Ownership And The Materiality Test',
    'Decision Ledger',
    'Alignment: The Grill Loop',
    'Delivery',
    'Validation And Independent Check',
    'Persistence',
    'Orchestration',
  ]
  for (const heading of mainHeadings) {
    assert.match(skill, new RegExp(`^## ${heading}$`, 'm'))
  }
  assert.deepEqual(skill.match(/^## .+$/gm), mainHeadings.map(heading => `## ${heading}`))
  for (const marker of ['▸ 已确认:', '▸ 待定:', '▸ 默认(可改):', '▸ 已委托:']) assert.match(skill, new RegExp(marker.replace(/[()]/g, '\\$&')))
  assert.match(skill, /ledger — not conversational memory/i)
  assert.match(skill, /An unconfirmed recommendation lives in 待定/i)
  assert.match(skill, /If the user answers only part of a batch, the unanswered items stay in 待定/i)
  assert.match(skill, /blanket delegation never covers safety, legality, irreversible actions/i)
  assert.match(skill, /M1 — Observable behavior/i)
  assert.match(skill, /M2 — Public contract/i)
  assert.match(skill, /M3 — Durable cost or risk/i)
  assert.match(skill, /M4 — Costly to reverse/i)
  assert.match(skill, /one to three highest-leverage unresolved questions/i)
  assert.match(skill, /Each question carries exactly one recommendation with its reason/i)
  assert.match(skill, /Stop and wait for the answer/i)
  assert.match(skill, /Do not precompute a blueprint, file list, private interface design, or test matrix/i)
  assert.match(skill, /Do not manufacture alternatives, force symmetry/i)
  assert.match(skill, /Never ask the user to choose reversible mechanics/i)
  assert.match(skill, /only an explicit user decision.*resolves a material boundary/i)
  assert.match(skill, /Do not flatter, appease, or mirror/i)
  assert.match(skill, /A direct implementation request covers reversible work/i)
  assert.match(skill, /Every material element of the launch basis must already sit in 已确认 or 已委托/i)
  assert.match(skill, /Do not reopen settled decisions or re-grill history/i)
  assert.match(skill, /Materiality alone neither forces an Issue nor authorizes hosted mutation/i)
  assert.match(skill, /follow code → commit → PR\/MR → Decision Issue/i)
  assert.match(skill, /references\/issue-persistence\.md/)
  assert.match(skill, /references\/delivery-evidence\.md/)
  assert.match(skill, /references\/orchestration\.md/)
  assert.match(skill, /CHECK_REQUIRED/)
  assert.match(skill, /At alignment completion, always state the smallest adequate carrier/i)
  assert.match(skill, /proactively show the Decision Record draft/i)
  assert.match(skill, /power-check's Applicability section/i)
  assert.match(skill, /power-check's Caller Protocol/i)
  assert.match(skill, /build the Check Packet/i)
  assert.match(orchestration, /Route by task shape/i)
  assert.match(orchestration, /`power_worker`/)
  assert.match(orchestration, /`power_explorer`/)
  assert.match(orchestration, /`power_planner`/)
  assert.match(orchestration, /`power_reviewer`/)
  assert.match(orchestration, /fork_turns: none.*smallest supported positive history slice/i)
  assert.match(orchestration, /Do not persist it as a Blueprint or Agent Dispatch Plan/i)
  assert.match(orchestration, /If a profile is unavailable/i)
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

  assert.match(skill, /single source of truth for when an independent check is required/i)
  assert.match(skill, /materially affects or creates credible production risk/i)
  assert.match(skill, /production persistent state/i)
  assert.match(skill, /external or cross-version compatibility/i)
  assert.match(skill, /concurrency correctness/i)
  assert.match(skill, /Merely touching related code, configuration, tests, caches, fixtures, or compatibility logic is insufficient/i)
  assert.match(skill, /a small diff can still be material/i)
  assert.match(skill, /backward-compatible optional configuration field/i)
  assert.doesNotMatch(skill, /when delivery risk involves security, privacy, permissions, persistent state/i)
  assert.match(skill, /without editing source, Git state, Issues, PRs, comments, or any external state/i)
  assert.match(skill, /caller.*reviewer.*Check Packet is the only interface/is)
  assert.match(skill, /Mode: full \| delta/i)
  assert.match(skill, /Decision source:/i)
  assert.match(skill, /Explicit non-goals:/i)
  assert.match(skill, /Self-validation evidence:/i)
  assert.match(skill, /External evidence:/i)
  assert.match(skill, /commit SHA \*\*only while\*\*/i)
  assert.match(skill, /git status --porcelain=v1 --untracked-files=all/i)
  assert.match(skill, /git diff --binary --full-index --no-textconv HEAD --/i)
  assert.match(skill, /git status --porcelain=v1 -z --untracked-files=all/i)
  assert.match(skill, /git ls-files -z --others --exclude-standard/i)
  assert.match(skill, /hash each relative path, entry type, and file bytes or symbolic-link target/i)
  assert.match(skill, /Never hash a collapsed directory label/i)
  assert.match(skill, /Both roles recompute the complete identity recipe, not only `HEAD`/i)
  assert.match(skill, /ordinary omissions before delegation/i)
  assert.match(skill, /incomplete packet, return `BLOCKED`/i)
  assert.match(skill, /use `NEEDS_HUMAN` only when.*unresolved decision, interpretation, or authorization/is)
  assert.match(skill, /Do not add preferences or imagined requirements/i)
  assert.match(skill, /`PASS`/)
  assert.match(skill, /`PASS_WITH_NOTES`/)
  assert.match(skill, /`BLOCKED`/)
  assert.match(skill, /`NEEDS_HUMAN`/)
  assert.match(skill, /`CHECK_REQUIRED`/)
  assert.match(skill, /delegate to the managed `power_reviewer`/i)
  assert.match(skill, /explicitly telling it to use `\$power-check`/i)
  assert.match(skill, /recompute the identity/i)
  assert.match(skill, /resume the same reviewer context/i)
  assert.match(skill, /otherwise spawn a new reviewer with the delta-mode packet/i)
  assert.match(skill, /Independence from implementation is the invariant/i)
  assert.match(skill, /inspect only the delta, the decision mappings it affects, and the regression evidence it affects/i)
  assert.match(skill, /do not re-read unrelated files, rerun unrelated suites, or reacquire unchanged external evidence/i)
  assert.match(skill, /verified snapshot in the packet/i)
  assert.match(skill, /incompatible platform.*duplicate evidence/i)
  assert.doesNotMatch(skill, /read-only sandbox|sandbox_mode/i)
  assert.doesNotMatch(skill, /gpt-5\.6-(?:sol|terra)/i)
  assert.match(profile, /name = "power_reviewer"/)
  assert.match(profile, /model = "gpt-5\.6-sol"/)
  assert.match(profile, /model_reasoning_effort = "high"/)
  assert.match(profile, /Do not edit files, Git state, Issues, PRs, comments, or any external state/i)
  assert.match(profile, /Do not delegate to another agent/i)
  assert.match(profile, /missing tests as a finding only when/i)
  assert.match(profile, /work only from the supplied Check Packet/i)
  assert.match(profile, /Label every finding \[Blocker\], \[Major\], or \[Minor\]/i)
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
  const [gan, orchestration, check, readme, spec, profile] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('power-gan/references/orchestration.md'),
    read('power-check/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
    read('power-check/agents/reviewer.toml'),
  ])

  for (const text of [gan, orchestration, check, readme, spec, profile]) assert.match(text, /power_reviewer/)
  assert.match(readme, /Codex CLI 0\.145\.0 multi-agent V2/i)
  assert.match(spec, /Codex CLI 0\.145\.0 multi-agent V2/i)
  assert.match(readme, /does not rely on the host sandbox being downgraded/i)
  assert.match(spec, /不要求宿主强制降级.*sandbox/)
  assert.match(check, /recompute the identity/i)
  assert.match(orchestration, /verify the working tree is unchanged after it returns/i)
  assert.doesNotMatch(profile, /sandbox_mode/)
})

test('power-gan custom agent profiles own their routing configuration', async () => {
  const [orchestration, worker, explorer, planner] = await Promise.all([
    read('power-gan/references/orchestration.md'),
    read('power-gan/agents/power-worker.toml'),
    read('power-gan/agents/power-explorer.toml'),
    read('power-gan/agents/power-planner.toml'),
  ])

  assert.match(orchestration, /Each profile owns its model and reasoning-effort configuration/i)
  assert.match(orchestration, /do not restate or override them at spawn time/i)
  assert.match(worker, /name = "power_worker"/)
  assert.match(worker, /model = "gpt-5\.6-terra"/)
  assert.match(worker, /model_reasoning_effort = "high"/)
  assert.match(worker, /Write only within the allowed-writes boundary/i)
  assert.match(explorer, /name = "power_explorer"/)
  assert.match(explorer, /model = "gpt-5\.6-sol"/)
  assert.match(explorer, /model_reasoning_effort = "medium"/)
  assert.match(explorer, /behaviorally read-only/i)
  assert.match(planner, /name = "power_planner"/)
  assert.match(planner, /model = "gpt-5\.6-sol"/)
  assert.match(planner, /model_reasoning_effort = "xhigh"/)
  assert.match(planner, /behaviorally read-only/i)
  for (const profile of [worker, explorer, planner]) {
    assert.match(profile, /Do not delegate to another agent/i)
    assert.doesNotMatch(profile, /sandbox_mode/)
  }
})

test('independent review waits for the final candidate and retries only affected delta', async () => {
  const [gan, check, readme, spec] = await Promise.all([
    read('power-gan/SKILL.md'),
    read('power-check/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  for (const text of [check, readme]) {
    assert.match(text, /stable final candidate|final candidate is stable/i)
    assert.match(text, /complete final diff/i)
    assert.match(text, /same reviewer|resume the same reviewer/i)
    assert.match(text, /delta/i)
  }
  assert.match(gan, /power-check's Caller Protocol/i)
  assert.match(gan, /re-check fixes as a delta/i)
  assert.match(check, /otherwise spawn a new reviewer with the delta-mode packet/i)
  assert.match(check, /do not re-read unrelated files, rerun unrelated suites/i)
  assert.match(check, /never on an incompatible platform/i)
  assert.match(spec, /绑定最终实现身份/)
  assert.match(spec, /不可恢复时允许新 reviewer 使用含前次结果和处置的 delta packet/)
  assert.match(spec, /不得为重复取证重新联网/)
})

test('power-check materiality trigger stays consistent across workflow guidance', async () => {
  const [check, gan, readme, spec] = await Promise.all([
    read('power-check/SKILL.md'),
    read('power-gan/SKILL.md'),
    read('README.md'),
    read('docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md'),
  ])

  assert.match(check, /materially affects or creates credible production risk/i)
  assert.match(check, /production persistent state/i)
  assert.match(check, /external or cross-version compatibility/i)
  assert.match(check, /concurrency correctness/i)
  assert.match(gan, /defined once, in power-check's Applicability section/i)
  assert.doesNotMatch(gan, /materially affects or creates credible production risk/i)
  assert.match(readme, /`\$power-check` owns the single runtime Applicability contract/i)
  assert.match(readme, /material effect or credible production risk/i)
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

  assert.match(skill, /before drafting or touching hosted state, read \[references\/issue-persistence\.md\]/i)
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
  assert.match(curator, /later identity change invalidates the old result/i)
})

test('curator requires explicit evidence-safe lifecycle mutations', async () => {
  const curator = await read('power-curator/SKILL.md')

  assert.match(curator, /This skill is explicit-only/i)
  assert.match(curator, /Never start an assessment proactively/i)
  assert.match(curator, /all required self-validation completed successfully/i)
  assert.match(curator, /`PASS` or `PASS_WITH_NOTES` result bound to its implementation identity/i)
  assert.match(curator, /`BLOCKED`, `NEEDS_HUMAN`, and `CHECK_REQUIRED` never satisfy this state/i)
  assert.match(curator, /\[I<n>-M1\]/i)
  assert.match(curator, /globally unique across the entire proposal/i)
  assert.match(curator, /never reset or reuse the same full ID/i)
  assert.match(curator, /Before the first hosted write in a curation run/i)
  assert.match(curator, /For every confirmed mutation, separately perform/i)
  assert.match(curator, /verified read-back after each successful mutation becomes.*expected rolling baseline/i)
  assert.match(curator, /If external drift appears, stop the remaining mutations/i)
})

test('retired core skill directories are absent', async () => {
  for (const skill of ['power-think', 'power-grill', 'power-loop', 'power-verifier']) {
    await assert.rejects(access(path.join(root, skill, 'SKILL.md')))
  }
})
