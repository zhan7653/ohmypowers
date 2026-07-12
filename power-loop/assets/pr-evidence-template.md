# Summary

<What changed.>

# Linked contract

<Issue URL, issue number, local brief path, or pasted contract reference>

# Execution mode and capability evidence

- Confirmed execution mode: `<strict-model-routing | inherited-model-routing>`
- Capability classification: `<strict-selection-supported | inherited-model-only>`
- Evidence inspected: `<visible host-contract evidence>`
- User confirmation: `<confirmation evidence>`
- Runtime recheck: `<result and any drift>`
- Configuration provenance: `<selected configuration supported by strict evidence, or inherited from parent and not independently selected>`
- Host-isolation evidence: `<separately observable enforcement, or None; instruction-level boundaries are not host enforcement>`

# Issue curation evidence

Linked contract status:

- <open | in-progress | pr-ready | merged | done | superseded | follow-up-needed | unknown>

closing intent:

- <close after merge | keep open | follow-up-needed | needs-human | not applicable>

follow-up handling:

- <no follow-up needed | linked follow-up issue | follow-up recommended | needs-human>

Curator mutation status:

- <not executed during implementation | confirmed and applied with URL/evidence>

# Rationale

<Why this approach satisfies the contract with the smallest defensible change.>

# Changed files

- `<path>`: <why it changed>

# Contract and acceptance-criteria evidence

Contract sources:

- Canonical Issue/local body: `<source, host revision when available, and exact full-body SHA-256; authoritative persisted-container identity and lifecycle context>`
- Task Contract digest: `<SHA-256 over exact UTF-8 bytes from document start to byte before Blueprint start marker; sole normative contract>`
- Execution Blueprint artifact: `<source and exact digest; supplementary operational evidence>`
- Agent Dispatch Plan artifact: `<source and exact digest; supplementary operational evidence>`
- Thin Goal Prompt: `<supplementary immutable text/reference; adds no obligations>`

Conflict status: `<none, or conflicting clause references and NEEDS_HUMAN decision>`

| Clause / AC | Source reference | Obligation | Evidence | Validation / review | Files | Status / notes |
|---|---|---|---|---|---|---|
| AC-1 |  |  |  |  |  |  |

# Stable implementation snapshot

- Repository/ref: `<repository and ref>`
- Commit: `<full SHA, or not applicable>`
- Git tree digest: `<digest; authoritative freshness identity>`
- Dirty/generated boundary: `<status and excluded/generated artifacts>`
- Captured at: `<ISO-8601 timestamp with timezone>`
- Evidence freshness: `<all evidence references this snapshot, or stale evidence and required reruns>`

# Validation results

- `<command>`: <pass/fail and relevant output summary>

## Independent validation replay

| Required command | Safety class | Isolated temporary-artifact boundary | Snapshot | Result | Relevant evidence / reason not replayed |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

# Review plan and provenance

Contract-prescribed reviews: `<exact required identities, configurations, providers, and procedures, or None>`

Selection basis when no topology is prescribed: `<contract obligations, final diff, affected interfaces/data, validation, and material risks>`

Minimum sufficient capability coverage: `<capabilities selected and why>`

| Reviewer identity/source | Confirmed mode | Configuration provenance | Independent from implementation | Capability | Scope | Instruction boundary | Observable host-isolation evidence | Evidence inspected | Result | Snapshot |
|---|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |  |

# Verifier result

Result: `PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN`

Aggregation basis: `<conflict/human-decision, blocking nonconformance or missing/stale evidence, nonblocking notes, or complete compliance>`

Notes:

- <verifier note>

Smallest next action: `<required for BLOCKED or NEEDS_HUMAN, or None>`

# Dispatch Summary

Use the exact summary fields from the confirmed mode's Agent Dispatch Plan. Do not add fields or guarantees from the other mode.

Confirmed execution mode: `<strict-model-routing | inherited-model-routing>`

Capability evidence: `<visible host-contract evidence>`

Planned tasks: <count>

Actual tasks: <count>

| Task ID | Role | Spawned task identity | Context policy | Execution wave/mode | Status |
|---|---|---|---|---|---|
| `<TASK-ID>` | `<role>` | `<identity>` | `<policy>` | `<wave; parallel/sequential>` | `<complete/blocked/incomplete>` |

Mode-specific task and retry evidence:

- `<only fields supported by the confirmed mode>`

Ownership conflicts:

- <conflict and resolution, or None>

Pause reasons:

- <reason, or None>

Coordination metrics:

- `wait_agent` calls: `<count>`
- Timeouts: `<count>`
- Useful waits: `<count>`
- Maximum consecutive no-information timeouts: `<count>`
- Cumulative wait duration: `<duration>`
- Circuit-breaker events: `<none or exact threshold/action>`
- Per-agent substantive follow-ups: `<agent -> count>`
- `useful_wait_ratio`: `<value or unavailable>`
- Wait-related input/total tokens: `<value or unavailable>`
- `wait_token_ratio`: `<value or unavailable>`
- Total coordination-token ratio: `<value or unavailable>`
- Telemetry provenance: `<exact source or unavailable; never inferred>`

Validation and reviewer snapshot identities:

- <snapshot references>

# Loop decision

Decision: `pr-ready | blocked | needs-human | follow-up-needed | done`

Reason:

- <reason>

# Risks and assumptions

- <risk or assumption>

# Out of scope

- <explicit non-goal preserved>

# Reviewer checklist

- [ ] Check contract alignment.
- [ ] Check acceptance criteria evidence.
- [ ] Check validation relevance.
- [ ] Check execution mode and capability evidence consistency.
- [ ] Check configuration and isolation claims against observable evidence.
- [ ] Check scope and non-goals.
- [ ] Check verifier result and loop decision.
