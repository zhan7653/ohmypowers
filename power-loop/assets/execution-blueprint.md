<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Source baseline: `<branch>@<full commit SHA>`

Generated at: `<ISO-8601 timestamp with timezone>`

Boundary: `Non-normative operational guidance; cannot add Task Contract requirements.`

## Implementation plan

| Path or module | Smallest required change | Contract linkage | Focused validation |
|---|---|---|---|
| `<path-or-module>` | `<change>` | `<clause or AC>` | `<check>` |

Implementation order: `<short ordered sequence when dependencies exist, otherwise follow the table>`

## Material interfaces, risks, and assumptions

- `<Only items that change implementation or validation; otherwise None>`

## Work isolation

- Implementation branch: `<branch>`
- Task worktree/current-worktree handling: `<path, not required, or preserve unrelated changes>`

## Validation

- `V0 Focused`: `<task-owned checks>`
- `V1 Integration`: `<relevant regression checks>`
- `V2 Final deterministic`: `<full deterministic checks>`
- `V3 External`: `<post-V2 external check or not applicable>`
- `HIGH` failure matrix: `<material failure cases or not applicable>`

## Execution bounds

- Sequence: `main implementation -> V0 -> V1 -> optional HIGH self-review -> at most one repair -> freeze -> V2 -> V3 when applicable -> Final Review Record -> verifier -> PR/MR evidence`
- No-progress stop: `<stop after the same diagnosed failure repeats, normally twice>`
- Pause conditions: `<contract, authority, source, repository, or validation drift>`

## Staleness

This Blueprint is stale when the Task Contract changes, the source baseline materially invalidates an affected path/interface/check, or implementation exposes a new requirement-level decision.

Reviewer routing and waiting are decided only after the final tree is frozen and are recorded once in the Final Review Record.
<!-- power-loop:execution-blueprint:end -->
