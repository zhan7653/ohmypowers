# Orchestration

Read this reference only when the current task is large enough that delegation is on the table. Small tasks — a few file edits, an investigation one or two greps deep, anything where coordination overhead would exceed the work — stay in the main context and never need this document.

## When To Delegate

Delegate only for:

- a bounded implementation chunk that is independently useful and fully specifiable in one task packet;
- parallel read-only investigation over stable inputs;
- write tasks with strictly non-overlapping ownership;
- a genuinely independent review of a completed implementation.

Parallelize only read-only work over stable inputs or writes with non-overlapping ownership. Tell every spawned agent not to delegate further.

## Roles

Route by task shape. Each profile owns its model and reasoning-effort configuration in its agent file — do not restate or override them at spawn time:

| Profile | Task shape |
| --- | --- |
| `power_worker` | Clear, bounded implementation, tests, fixes, documentation, deterministic validation. |
| `power_explorer` | Multi-hypothesis exploration, repository investigation, root-cause analysis, cross-module tracing. Behaviorally read-only. |
| `power_planner` | Genuinely ambiguous planning and decomposition, cross-agent result synthesis, conflict analysis. Behaviorally read-only. |
| `power_reviewer` | Completed implementation review and required `$power-check` (see the power-check skill for its contract). |

The host does not support per-subagent sandbox overrides, so read-only means instruction-enforced behavior in the agent profile — the same pattern `power_reviewer` uses. Do not claim sandbox-level hardening that was not provided. When a behaviorally read-only agent ran alongside uncommitted work and its result feeds a check, merge, or handoff decision, verify the working tree is unchanged after it returns.

## Task Packet

Send a compact packet: objective, confirmed decisions (drawn from the ledger's 已确认 and 已委托), repository evidence, scope, allowed writes, dependencies, expected deliverable, validation, and stop conditions. The packet is runtime state — do not persist it as a Blueprint or Agent Dispatch Plan, and do not put it through a user confirmation loop.

For explicit overrides, use `fork_turns: none` or the smallest supported positive history slice; do not use a full-history fork when the host forbids overrides.

## Escalation

When `power_worker` encounters material ambiguity, unstable interfaces, or work that cannot be safely completed within its packet, it must return evidence instead of guessing or retrying blindly. Route the uncertainty to `power_explorer` or `power_planner`, then reissue a clear implementation packet when possible.

Any newly discovered **material** boundary goes back to the main context, into the ledger, and to the user through the grill loop. A subagent never resolves a material boundary.

## Degradation

If a profile is unavailable or the host cannot honor its configuration, use generic delegation or the main context only when that remains adequate for the task. Never claim an exact model, effort, or independent context that was not actually provided. When exact independence is itself required and unavailable, report `CHECK_REQUIRED` (for checks) or tell the user plainly (for other work); require user intervention only in that case.
