# Decision Snapshot

Read this reference for every delivery that will write repository-tracked source, tests, configuration, schema, or documentation. The snapshot protects execution continuity; the selected Issue, PR, or commit provides durable traceability.

## Create Before Writing

After material alignment is complete and the final carrier is selected, create one session-unique Markdown file in the operating system temporary directory before the first source write. Prevent access by other unprivileged users and report the exact path in the launch update so interrupted work can be recovered. Never create it in the repository, stage it, or commit it.

Do not trust an environment-provided temporary directory blindly. Resolve the repository root, candidate temporary directory, and created file to canonical paths; reject any candidate or file equal to or nested under the repository. After creation, verify that its permissions or ACL do not grant access to other unprivileged users. If either check cannot be completed, pause before writing content or source.

Use a collision-safe path. On POSIX systems, prefer:

```bash
umask 077
snapshot_file="$(mktemp "${validated_temp_dir}/power-gan-decision-snapshot.XXXXXX.md")"
chmod 600 "$snapshot_file"
```

Here `validated_temp_dir` means an existing canonical OS temporary directory already proven to be outside the repository; it is not an unchecked copy of `TMPDIR`.

On PowerShell 7, canonicalize `[IO.Path]::GetTempPath()` and the repository root, reject repository nesting, combine the validated directory with a new GUID, create the file with `FileMode.CreateNew`, and verify the resulting ACL does not grant access to other unprivileged users.

If a safe temporary location cannot be created, pause before writing source. Do not substitute a tracked or broadly shared path.

## Minimum Contents

Keep the snapshot compact and current:

```markdown
# Decision Snapshot

- Outcome: <observable result>
- Scope / non-goals: <confirmed boundary>
- Confirmed / delegated decisions: <material items from the ledger>
- Launch basis: <hard constraints, smallest credible path, validation direction>
- Stop / reopen conditions: <material delta that pauses delivery>
- Final carrier: <Issue, PR, or commit identity when known>
- Handoff status: pending | verified
```

Include reversible defaults only when they are useful for resuming interrupted work. Do not add a blueprint, fixed file list, private interface design, test matrix, agent routing, or transcript. Update the snapshot when a confirmed material delta or final-carrier selection changes.

## Transfer And Delete

Before declaring delivery complete:

1. Transfer the durable outcome, scope, material decisions, accepted risks, and self-validation evidence into the selected Issue, PR, or commit. A commit carrier requires explicit user or project authorization for local Git mutation; direct source-write authorization is insufficient. Before staging, inspect the working tree and include only task-owned paths. If unrelated changes cannot be isolated, stop instead of absorbing them. Preserve the necessary context in the commit message; a bare diff is not a decision handoff.
2. Read back the exact carrier and verify that it contains the intended evidence. For a commit, bind verification to its SHA, full message, and included path set. Follow the stricter Issue or delivery-evidence reference when that carrier requires it.
3. If `$power-check` is required, run it only after the stable final implementation identity exists. Never amend or replace a checked commit merely to add the check result. Persist the result in an authorized Issue or PR that names the checked identity, then read that evidence back. A commit-only carrier is sufficient only when no independent check is required; otherwise upgrade the final carrier to an authorized Issue or PR. If that authorization is unavailable, retain the snapshot and report the completed implementation identity, check status, and pending persistence handoff.
4. Mark the snapshot handoff verified, then delete only its exact session-unique path.

If the selected carrier cannot be created, updated, or verified with current authorization, keep the snapshot, report its exact path and the pending handoff, and do not claim completed persistence. If delivery stops with source changes still in progress, retain the snapshot for resumption or explicit handoff.
