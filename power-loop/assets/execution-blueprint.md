<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

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

| Validation ID | Command or manual check | Proves | Responsible Task ID |
|---|---|---|---|
| `VAL-1` | `<exact command>` | `<acceptance criteria or integration property>` | `<TASK-ID>` |

## Staleness and replan conditions

Treat this Blueprint as stale and stop for a new `power-loop` pass or confirmed revision when:

- the Task Contract changes;
- the exposed spawn capability materially changes or conflicts with the confirmed execution mode;
- the user changes the confirmed execution mode;
- the source branch or commit changes in a way that materially affects an owned path, interface, dependency, validation command, or assumption;
- a planned internal interface cannot be implemented without changing a public contract or other requirement-level decision;
- ownership paths begin to overlap or a dependency order becomes unsafe;
- a required validation path disappears or becomes unreliable.
<!-- power-loop:execution-blueprint:end -->
