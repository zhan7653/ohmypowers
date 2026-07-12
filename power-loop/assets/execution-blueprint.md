<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Delivery lane: `<LIGHT | STANDARD | HIGH>`

Normative boundary: `The Task Contract is the sole normative contract. This Blueprint is confirmed operational guidance and cannot add acceptance criteria or requirement-level guarantees.`

Pre-patch Issue identity: `<source, host revision when available, and exact complete-body SHA-256>`

Source baseline: `<branch>@<full commit SHA>`

Generated at: `<ISO-8601 timestamp with timezone>`

## Repository facts and assumptions

Facts:

- `<verified fact>`

Assumptions:

- `<assumption that does not change the Task Contract>`

Requirement conflicts or newly exposed decisions: `<None, NEEDS_GRILL, or NEEDS_HUMAN with exact reason>`

## Planned changes

| Path or module | Planned change | Contract linkage |
|---|---|---|
| `<path-or-module>` | `<smallest required change>` | `<clause or AC>` |

## Internal interfaces and flow

| Interface or boundary | Current shape | Planned shape | Consumers |
|---|---|---|---|
| `<private interface>` | `<current>` | `<planned>` | `<modules>` |

Ordered data/control flow:

1. `<step>`

## Failure handling and test seams

| Failure case | Expected handling | Evidence or test seam |
|---|---|---|
| `<failure>` | `<handling>` | `<test>` |

## Implementation order

1. `<main-agent implementation step and dependency>`

Stable interface gates:

- `<gate or None>`

## Work isolation

- Base branch: `<repository-required base>`
- Implementation branch: `<branch>`
- Task-level worktree: `<path or not required>`
- Protected-branch rule: `no normal implementation writes or merge without explicit authorization`
- Current-worktree handling: `<clean, preserve unrelated changes, or pause>`

## Validation

- `V0 Focused`: `<syntax, unit, and task-owned checks>`
- `V1 Integration`: `<relevant module and compatibility regression>`
- `V2 Final deterministic`: `<full deterministic repository/installer/packaging/integration checks>`
- `V3 External`: `<network/authentication/hosted/runtime checks after V2, or not applicable>`

High-risk failure matrix: `<applicable authorization, tampering, drift, concurrency, partial failure, rollback, recovery, permission, privacy, and destructive-action cases, or not applicable>`

## Runtime bounds and delivery policy

- Execution sequence: `main-agent implementation -> V0 -> V1 -> optional HIGH failure-matrix review and one repair -> freeze tree -> V2 -> V3 when applicable -> runtime Final Review Plan -> concurrent independent reviewers -> verifier -> compact PR/MR evidence`
- Candidate snapshot ceiling: `3`
- Concentrated repair rounds: `<0 or 1>`
- Final certification waves: `<planned 1; maximum 2 after one blocker repair>`
- Max implementation iterations: `<confirmed limit>`
- Same-failure retry limit: `<confirmed limit>`
- No-progress stop: `<confirmed threshold>`
- Draft PR/MR policy: `<when creation/update is allowed>`
- Hosted mutation policy: `<exact confirmation requirement>`
- Evidence invalidation: `<tree change invalidates affected V2/V3/review evidence>`
- Pause conditions: `<scope, identity, repository, validation, or contract drift>`

## Staleness

This Blueprint is stale when:

- the Task Contract or confirmed compact reference changes;
- the source baseline materially changes an affected path, interface, validation command, or assumption;
- implementation exposes a new requirement-level decision;
- the planned interface or validation path becomes unsafe or unavailable.

Reviewer capability, routing, count, and waiting are intentionally absent. They are decided after the final tree is frozen in the runtime Final Review Plan.
<!-- power-loop:execution-blueprint:end -->
