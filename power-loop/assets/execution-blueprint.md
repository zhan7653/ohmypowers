<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

Task Contract digest: `sha256:<exact UTF-8 bytes from document start to the byte before the Blueprint start marker>`

Delivery lane: `<LIGHT | STANDARD | HIGH>`

Normative boundary: `The Task Contract is the sole normative contract. This Blueprint is confirmed operational guidance and cannot add acceptance criteria or requirement-level guarantees.`

Pre-patch Issue identity at planning: `<source plus host revision when available plus exact full-body SHA-256; body digest is authoritative; provenance only because patch application changes the body>`

Source branch: `<branch>`

Source commit: `<full commit SHA>`

Generated at: `<ISO-8601 timestamp with timezone>`

## Capability preflight and execution mode

- Classification: `<strict-selection-supported | inherited-model-only | indeterminate>`
- Evidence inspected: `<visible spawn schema or equivalent host contract evidence>`
- Selectable capabilities exposed: `<model/profile/reasoning/sandbox selectors independently evidenced, or None>`
- Selectable capabilities not exposed or unavailable evidence: `<details or None>`
- Probe agent spawned: `<No when schema evidence was conclusive; otherwise explain separately approved evidence collection>`
- Recommended mode: `<strict-model-routing | inherited-model-routing | no recommendation pending human decision>`
- Confirmed mode: `<strict-model-routing | inherited-model-routing>`
- User confirmation: `<explicit confirmation evidence>`
- Uncertainty or contradictory evidence: `<details or None>`
- Runtime recheck: `Required before implementation; material capability drift requires renewed mode confirmation and replanning`

## Repository facts and assumptions

Facts:

- `<verified repository fact>`

Assumptions:

- `<assumption that does not change the Task Contract>`

Requirement conflicts: `<None, NEEDS_GRILL reason, or NEEDS_HUMAN reason>`

Requirement decisions exposed during planning: `<None, or stop and route each public behavior, compatibility, permission, security, migration, transaction, concurrency, audit, rollback, or recovery choice back to the Task Contract>`

## Affected files and modules

| Path or module | Planned change | Why it is needed | Owning Task ID |
|---|---|---|---|
| `<path-or-module>` | `<change>` | `<contract linkage>` | `<TASK-ID>` |

## Internal interfaces and ownership boundaries

| Interface or boundary | Current shape | Planned shape | Owner | Consumers |
|---|---|---|---|---|
| `<function/module/private contract>` | `<current>` | `<planned>` | `<TASK-ID>` | `<TASK-IDs or modules>` |

## Data and control flow

1. `<ordered runtime or build/test flow>`

## Error handling

| Failure case | Expected handling | Evidence or test seam | Owner |
|---|---|---|---|
| `<failure>` | `<handling>` | `<test seam>` | `<TASK-ID>` |

## Task dependencies and integration order

1. `<TASK-ID and dependency/integration event>`

Stable interface gates:

- `<interface that must be stable before dependent work starts, or None>`

## Work isolation and shared-worktree policy

- Base branch: `<develop or repository-required source branch>`
- Dedicated implementation branch: `<agent/<issue-id>-<short-name> or agent/<brief-slug>>`
- Task-level worktree: `<.worktrees/agent-<issue-id>-<short-name>, .worktrees/agent-<brief-slug>, or not required>`
- Shared-worktree rule: `one task-level branch/worktree; no per-agent worktrees by default`
- Integration-branch rule: `do not perform normal implementation writes directly on the shared base branch`
- Current-worktree handling: `<clean, preserve unrelated changes, or pause condition>`

## Test seams and validation commands

Validation layers:

- `V0 Focused`: `<syntax, unit, and task-owned checks used during implementation>`
- `V1 Integration`: `<relevant module and compatibility regression for the integrated candidate>`
- `V2 Final deterministic`: `<full deterministic repository, installer, packaging, and isolated integration checks for the frozen certification candidate>`
- `V3 External`: `<network, authentication, hosted service, or real runtime discovery checks; run once after V2 passes on the frozen tree and immediately before the final reviewer wave>`

High-risk failure matrix: `<applicable fabrication, scope, authorization, tampering, drift, concurrency, partial failure, rollback, recovery, permission, privacy, and destructive-action cases, or not applicable>`

Review gates:

- Concentrated adversarial development review: `<main-agent self-review with one complete packet and one batched finding set, or not applicable>`
- Concentrated repair rounds: `<0 or 1; same-risk systemic recurrence stops for replanning>`
- Final certification waves: `<planned 1; maximum 2 only for one unexpected blocker repair/recertification cycle>`
- Candidate snapshot ceiling: `3`

| Validation ID | Command or manual check | Proves | Responsible Task ID |
|---|---|---|---|
| `VAL-1` | `<exact command>` | `<acceptance criteria or integration property>` | `<TASK-ID>` |

## Runtime budget and delivery policy

- Host concurrent-agent slots: `<observed count or unavailable>`
- Reliable agent retire/close capability: `<supported with evidence | unavailable>`
- Minimum reviewer capabilities: `contract-conformance reviewer plus code reviewer`
- Additional reviewer capabilities: `<independent risk capabilities justified by the final diff>`
- Selected reviewer count: `<minimum 2; increase up to observed concurrent capacity while scopes remain decoupled>`
- Total distinct subagent-thread ceiling: `<selected reviewer count>`
- Per-agent substantive follow-up limit: `1 consolidated clarification/completion request`
- Reviewer grace period before first wait: `at least 180 seconds when interaction policy permits`
- wait_agent warning threshold: `launched reviewer count + 1`
- wait_agent hard stop per review wave: `launched reviewer count + 3`
- Consecutive no-information timeout stop: `3`
- Wait polling rule: `no 1-, 10-, 20-, 30-, or 60-second polling; use 180 seconds or the longest permitted interaction timeout`
- Coordination telemetry: `<wait calls, timeouts, useful waits, cumulative duration, follow-ups, circuit breakers, and token ratios when available>`
- Candidate snapshot ceiling: `3`
- Concentrated adversarial review waves: `<0 or 1 main-agent self-review>`
- Concentrated repair rounds: `<0 or 1>`
- Final certification wave budget: `<planned 1; hard stop after a second blocking wave>`
- V3 external-check budget: `1 successful final-tree run after V2 and before final review; verifier does not replay it by default`
- Max implementation iterations: `<confirmed limit>`
- Same-failure retry limit: `<confirmed limit>`
- No-progress stop: `<confirmed threshold>`
- Draft PR/MR policy: `<when creation/update is allowed and evidence required>`
- Hosted mutation policy: `<exact confirmation requirement>`
- Protected branch and merge policy: `<no direct protected-branch push/merge unless explicitly authorized>`
- Evidence invalidation: `<implementation tree change invalidates affected validation and review evidence>`
- Pause conditions: `<scope, identity, capability, ownership, validation, or contract-level drift conditions>`

## Staleness and replan conditions

Treat this Blueprint as stale and stop for a new `power-loop` pass or confirmed revision when:

- the Task Contract changes;
- the authoritative complete Issue body digest no longer matches the digest pinned by the launcher;
- the exposed spawn capability materially changes or conflicts with the confirmed execution mode;
- the user changes the confirmed execution mode;
- the source branch or commit changes in a way that materially affects an owned path, interface, dependency, validation command, or assumption;
- a planned internal interface cannot be implemented without changing a public contract or other requirement-level decision;
- ownership paths begin to overlap or a dependency order becomes unsafe;
- a required validation path disappears or becomes unreliable.
<!-- power-loop:execution-blueprint:end -->
