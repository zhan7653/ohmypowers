# Issue Persistence

Read this reference only when `$power-gan` has decided that a task needs a hosted Issue or an existing Decision Record must change.

## Contents

- [Shared Flow](#shared-flow)
- [Temporary Files And UTF-8](#temporary-files-and-utf-8)
- [GitHub CLI](#github-cli)
- [GitLab CLI](#gitlab-cli)
- [Delivery Link](#delivery-link)

## Shared Flow

1. Read project guidance, Issue templates, and `git remote -v`. Identify the exact host and repository. If remotes or host rules conflict, ask before writing.
2. Build the Issue body from confirmed material decisions only. Before showing the draft, map every confirmed material item from the working understanding into exactly one clear location in the record; a missing location means the draft is incomplete. If the Issue carried a verified prior handoff, never reactivate that delivery's Ledger: create a new Ledger, capture the predecessor delivery ID, exact pre-write Issue body SHA-256, and prior handoff carrier, and include that revision link in both the new Ledger and revised Decision Record. A directly related follow-up may revise the same Issue; unrelated work or an Issue that is no longer an adequate current record gets a new Issue. After successful exact read-back, version 5 seals the current local note, creates a new predecessor-linked note, validates it, and deletes only the sealed local note. Use the host operating system's temporary directory; never hardcode `/tmp` or create a project decision Markdown file.
3. Create or update hosted state only after the user has explicitly requested or confirmed that mutation. Confirmation of one material decision is not automatically permission for unrelated labels, assignees, milestones, or projects.
4. Before updating an existing Issue, capture its identity, title, exact body, state, URL, revision metadata, and a SHA-256 hash of the UTF-8 body. Treat a failed command, empty output, invalid JSON, missing required field, or undecodable UTF-8 as a hard pre-write stop. Apply only the confirmed replacement to that captured body; preserve every unrelated section.
5. Immediately before the write, re-read the same fields and abort if they no longer match the captured snapshot. This narrows the lost-update window; when the host exposes an atomic revision or conditional-write contract, use it rather than claiming this check is atomic.
6. Re-read the resulting Issue and verify the identity, title, exact expected body, state, URL, host revision metadata when available, and `Decision revision` when present. When project guidance defines protected sections or markers, verify their pre-write and post-write UTF-8 hashes separately.
7. If Chinese or other non-ASCII text appears as mojibake or `?`, stop. Determine whether the problem is display decoding or remote corruption before attempting another write.
8. Return the Issue URL. Keep optional labels non-normative.

## Temporary Files And UTF-8

Prefer a CLI file option or API request file over an implicit text pipeline. Write UTF-8 without BOM and read exact text with a raw read.

PowerShell 7. Atomically create a session-unique path instead of reusing a predictable filename; this prevents two concurrent sessions from accidentally replacing one another's payload:

```powershell
$utf8NoBom = [Text.UTF8Encoding]::new($false)

function New-UniqueUtf8PayloadFile {
    param(
        [Parameter(Mandatory)][string]$Prefix,
        [Parameter(Mandatory)][string]$Content
    )

    $tempDir = [IO.Path]::GetTempPath()
    for ($attempt = 0; $attempt -lt 8; $attempt++) {
        $candidate = Join-Path $tempDir (
            '{0}-{1}.md' -f $Prefix, [Guid]::NewGuid().ToString('N')
        )
        try {
            $stream = [IO.FileStream]::new(
                $candidate,
                [IO.FileMode]::CreateNew,
                [IO.FileAccess]::Write,
                [IO.FileShare]::None
            )
            try {
                $bytes = $utf8NoBom.GetBytes($Content)
                $stream.Write($bytes, 0, $bytes.Length)
                $stream.Flush($true)
            } finally {
                $stream.Dispose()
            }
            return $candidate
        } catch [IO.IOException] {
            if ($attempt -eq 7) { throw }
        }
    }
}

# $recordBody and, when needed, $noteBody are previously constructed strings.
$recordFile = New-UniqueUtf8PayloadFile 'power-gan-decision-record' $recordBody
$expectedBody = [IO.File]::ReadAllText(
    $recordFile,
    [Text.UTF8Encoding]::new($false, $true)
)
$noteFile = New-UniqueUtf8PayloadFile 'power-gan-decision-note' $noteBody
```

POSIX shells:

```bash
record_file="$(mktemp "${TMPDIR:-/tmp}/power-gan-decision-record.XXXXXX.md")"
note_file="$(mktemp "${TMPDIR:-/tmp}/power-gan-decision-note.XXXXXX.md")"
```

Delete only the exact session-unique temporary paths after successful verification. Keep them temporarily when diagnosing a failed or mismatched write. For version 5 local notes, delete only through `manage-decision-note.mjs` after its validator and unchanged-file checks succeed; never delete a note merely because a hosted write was attempted.

For remote JSON reads on PowerShell, invoke the CLI with explicit UTF-8 decoding and fail closed before parsing:

```powershell
function Invoke-Utf8JsonCli {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$ArgumentList,
        [Parameter(Mandatory)][string]$Operation
    )

    $strictUtf8 = [Text.UTF8Encoding]::new($false, $true)
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $FilePath
    foreach ($argument in $ArgumentList) { $null = $start.ArgumentList.Add($argument) }
    $start.UseShellExecute = $false
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.StandardOutputEncoding = $strictUtf8
    $start.StandardErrorEncoding = $strictUtf8

    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    if (-not $process.Start()) { throw "$Operation did not start." }
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $stdout = $stdoutTask.GetAwaiter().GetResult()
    $stderr = $stderrTask.GetAwaiter().GetResult()
    if ($process.ExitCode -ne 0) { throw "$Operation failed: $stderr" }
    if ([string]::IsNullOrWhiteSpace($stdout)) { throw "$Operation returned no JSON." }
    if ($stdout.Contains([char]0xFFFD)) { throw "$Operation returned invalid UTF-8." }

    try {
        return $stdout | ConvertFrom-Json -ErrorAction Stop
    } catch {
        throw "$Operation returned invalid JSON: $($_.Exception.Message)"
    }
}

function Assert-RequiredFields {
    param([object]$Value, [string[]]$Names, [string]$Operation)
    foreach ($name in $Names) {
        if ($null -eq $Value.PSObject.Properties[$name] -or $null -eq $Value.$name) {
            throw "$Operation omitted required field '$name'."
        }
    }
}

function Get-Utf8Sha256 {
    param([AllowEmptyString()][string]$Text)
    return [Convert]::ToHexString(
        [Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($Text))
    )
}
```

When repository guidance defines protected markers, extract every protected range from the captured body and hash it before writing. Fail before the write if marker discovery is missing, ambiguous, or malformed. Extract the same ranges from the read-back body and compare each hash separately; exact whole-body equality does not replace this project-specific protected-range check.

Use this minimum sufficient body shape when the repository does not provide a stronger convention:

```markdown
# Decision Record

Decision status: proposed | confirmed | delivering | delivered | superseded
Decision revision: <increment only for confirmed material decision changes; omit when the repository does not use revisions>
Current delivery: <new delivery ID; include for a revision after verified handoff>
Predecessor: <prior delivery ID, exact pre-write body SHA-256, and prior handoff carrier; include for a revision after verified handoff>

## Outcome
<observable result>

## Scope / non-goals
- In: <boundary>
- Out: <boundary>

## Public contracts / compatibility
<material API, data, configuration, or compatibility commitment; omit this section when none applies>

## Material decisions
- Decision: <confirmed material decision>
  Why: <short rationale>
  Alternative not chosen: <include only when it explains a non-obvious boundary or avoids repeated debate; otherwise omit this line>

## Acceptance / validation expectations
- Observable completion: <behavior that demonstrates the outcome>
- Required evidence: <evidence needed for confidence; do not prescribe a speculative test matrix>

## Accepted cost / risk
- <accepted tradeoff or none>

## Stop / reopen conditions
- <condition>
```

Keep the record compact but lossless. Preserve every confirmed material decision, observable outcome, scope or non-goal, material public contract or compatibility commitment, accepted cost or risk, validation expectation, and stop or reopen condition. When shortening, remove process narration, repetition, reversible implementation mechanics, and unimportant rejected alternatives first. Do not invent alternatives to complete the template or preserve a full option history.

Use this compact comment shape when a material change needs a durable Decision Note:

```markdown
## Decision Note

Change: <material change, authorization, split, pause, or completion event>
Reason / evidence: <short reason or new evidence>
Confirmed decision: <the user-confirmed result>
Rationale: <why>
Confirmed by: <source of confirmation>
```

Do not post a Decision Note for ordinary implementation detail or copy the conversation transcript.

## GitHub CLI

1. Check `gh auth status` when authentication is not already established.
2. On Windows, resolve the executable explicitly when `gh` is not in `PATH`:

```powershell
$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCommand) {
    $gh = $ghCommand.Source
} elseif (Test-Path -LiteralPath 'C:\Program Files\GitHub CLI\gh.exe') {
    $gh = 'C:\Program Files\GitHub CLI\gh.exe'
} else {
    throw 'GitHub CLI was not found.'
}

& $gh auth status
if ($LASTEXITCODE -ne 0) { throw 'GitHub authentication check failed.' }
```

3. Use an explicit repository. Snapshot before an update, fail closed on every pre-read error, use `--body-file`, and compare the complete returned contract:

```powershell
$repo = 'HOST/OWNER/REPO'
$issue = 42
$fields = 'number,title,body,state,url,updatedAt'

$before = Invoke-Utf8JsonCli $gh @(
    'issue', 'view', [string]$issue, '--repo', $repo, '--json', $fields
) 'GitHub Issue pre-read'
Assert-RequiredFields $before @('number', 'title', 'body', 'state', 'url', 'updatedAt') (
    'GitHub Issue pre-read'
)
$beforeBodyHash = Get-Utf8Sha256 ([string]$before.body)

# Extract and hash repository-defined protected ranges here. If required markers
# are absent, duplicated, or malformed, throw before continuing.
# $protectedBefore = Get-ProjectProtectedRangeHashes ([string]$before.body)

# Re-read immediately before mutation. A mismatch is a hard stop; never write
# using an empty, invalid, or stale snapshot.
$preflight = Invoke-Utf8JsonCli $gh @(
    'issue', 'view', [string]$issue, '--repo', $repo, '--json', $fields
) 'GitHub Issue pre-write check'
Assert-RequiredFields $preflight @('number', 'title', 'body', 'state', 'url', 'updatedAt') (
    'GitHub Issue pre-write check'
)
if (
    [string]$preflight.number -cne [string]$before.number -or
    [string]$preflight.title -cne [string]$before.title -or
    [string]$preflight.state -cne [string]$before.state -or
    [string]$preflight.url -cne [string]$before.url -or
    [string]$preflight.updatedAt -cne [string]$before.updatedAt -or
    (Get-Utf8Sha256 ([string]$preflight.body)) -cne $beforeBodyHash
) {
    throw 'GitHub Issue changed after the captured snapshot; rebuild the intended body.'
}

& $gh issue edit $issue --repo $repo --body-file $recordFile
if ($LASTEXITCODE -ne 0) { throw 'GitHub Issue update failed.' }

$after = Invoke-Utf8JsonCli $gh @(
    'issue', 'view', [string]$issue, '--repo', $repo, '--json', $fields
) 'GitHub Issue read-back'
Assert-RequiredFields $after @('number', 'title', 'body', 'state', 'url', 'updatedAt') (
    'GitHub Issue read-back'
)
if (
    [string]$after.number -cne [string]$before.number -or
    [string]$after.title -cne [string]$before.title -or
    [string]$after.state -cne [string]$before.state -or
    [string]$after.url -cne [string]$before.url -or
    [string]$after.body -cne $expectedBody
) {
    throw 'GitHub Issue did not round-trip its identity, metadata, and body exactly.'
}
# $protectedAfter = Get-ProjectProtectedRangeHashes ([string]$after.body)
# Assert-ProjectProtectedRangeHashes $protectedBefore $protectedAfter
```

`Get-ProjectProtectedRangeHashes` and `Assert-ProjectProtectedRangeHashes` stand for the repository-specific marker parser required by project guidance. If the repository defines no protected ranges, omit those calls; if it does, do not replace them with a whole-body-only check. Exact body equality also verifies `Decision revision` when that line is present. Retain the returned `updatedAt` (or stronger host revision) as read-back evidence; do not require it to equal the pre-write value.

For creation, use `& $gh issue create --repo $repo --title $title --body-file $recordFile`, check `$LASTEXITCODE`, capture the returned URL, and then run the same strict JSON read-back and complete contract comparison. For a confirmed Decision Note, use `& $gh issue comment $issue --repo $repo --body-file $noteFile`, check `$LASTEXITCODE`, and verify the created comment when its exact contents matter.

## GitLab CLI

1. Check `glab auth status` when authentication is not already established.
2. Follow project guidance for `-R`. For self-hosted GitLab, use the full repository URL when required; do not silently replace it with `group/project`.
3. `glab issue create` and `glab issue update` accept the description as a string. On PowerShell 7, read the UTF-8 file explicitly, fail closed on every pre-read error, and pass the string as a native argument; do not use Bash command substitution such as `$(cat ...)`:

```powershell
$glabCommand = Get-Command glab -ErrorAction Stop
$glab = $glabCommand.Source
$repo = 'GROUP/PROJECT' # Or the full self-hosted repository URL.
$issue = 42
$expectedBody = [IO.File]::ReadAllText($recordFile, [Text.Encoding]::UTF8)

& $glab auth status
if ($LASTEXITCODE -ne 0) { throw 'GitLab authentication check failed.' }
$before = Invoke-Utf8JsonCli $glab @(
    'issue', 'view', [string]$issue, '-R', $repo, '-F', 'json'
) 'GitLab Issue pre-read'
Assert-RequiredFields $before @('iid', 'title', 'description', 'state', 'web_url', 'updated_at') (
    'GitLab Issue pre-read'
)
$beforeBodyHash = Get-Utf8Sha256 ([string]$before.description)
# $protectedBefore = Get-ProjectProtectedRangeHashes ([string]$before.description)

$preflight = Invoke-Utf8JsonCli $glab @(
    'issue', 'view', [string]$issue, '-R', $repo, '-F', 'json'
) 'GitLab Issue pre-write check'
Assert-RequiredFields $preflight @('iid', 'title', 'description', 'state', 'web_url', 'updated_at') (
    'GitLab Issue pre-write check'
)
if (
    [string]$preflight.iid -cne [string]$before.iid -or
    [string]$preflight.title -cne [string]$before.title -or
    [string]$preflight.state -cne [string]$before.state -or
    [string]$preflight.web_url -cne [string]$before.web_url -or
    [string]$preflight.updated_at -cne [string]$before.updated_at -or
    (Get-Utf8Sha256 ([string]$preflight.description)) -cne $beforeBodyHash
) {
    throw 'GitLab Issue changed after the captured snapshot; rebuild the intended body.'
}

& $glab issue update $issue -R $repo -d $expectedBody
if ($LASTEXITCODE -ne 0) { throw 'GitLab Issue update failed.' }

$after = Invoke-Utf8JsonCli $glab @(
    'issue', 'view', [string]$issue, '-R', $repo, '-F', 'json'
) 'GitLab Issue read-back'
Assert-RequiredFields $after @('iid', 'title', 'description', 'state', 'web_url', 'updated_at') (
    'GitLab Issue read-back'
)
if (
    [string]$after.iid -cne [string]$before.iid -or
    [string]$after.title -cne [string]$before.title -or
    [string]$after.state -cne [string]$before.state -or
    [string]$after.web_url -cne [string]$before.web_url -or
    [string]$after.description -cne $expectedBody
) {
    throw 'GitLab Issue did not round-trip its identity, metadata, and description exactly.'
}
# $protectedAfter = Get-ProjectProtectedRangeHashes ([string]$after.description)
# Assert-ProjectProtectedRangeHashes $protectedBefore $protectedAfter
```

As in the GitHub example, the project-specific protected-range calls are mandatory only when project guidance defines those markers, exact description equality covers an embedded `Decision revision`, and post-write `updated_at` is retained as evidence rather than compared to the old value.

For creation, use `& $glab issue create -R $repo -t $title -d $expectedBody -y`, check `$LASTEXITCODE`, capture the resulting Issue identity, and then perform the same strict JSON read-back and complete contract comparison. Do not assume `-y` suppresses every prompt on every `glab` version; stop if the CLI requests an unapproved choice.

For a confirmed Decision Note:

```powershell
$noteBody = [IO.File]::ReadAllText($noteFile, [Text.Encoding]::UTF8)
& $glab issue note $issue -R $repo -m $noteBody
```

When the description may approach the operating system's native command-line length limit, use `glab api --input <utf8-json-file>` with the GitLab Issues API instead of passing a large description argument. Re-read the Issue afterward and apply the same exact comparison.

## Delivery Link

When a Decision Issue is the canonical source for the delivery, mention it explicitly in the PR/MR. Use closing syntax only when merging that PR/MR should complete the Issue; otherwise use a plain Issue URL or non-closing relationship. Re-read the PR/MR link before closing the Issue.
