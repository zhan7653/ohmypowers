# Orchestration

Read this reference when delegation is on the table. One or two total direct reads, a single-file lookup, or work where task-packet and synthesis overhead would exceed the work stays in the main context. A small eventual diff does not make a cross-domain investigation small.

## When To Delegate

Delegate only for:

- a bounded implementation chunk that is independently useful and fully specifiable in one task packet;
- a bounded read-only investigation over stable inputs that is independently useful, whether it is one deep lane or one of several parallel lanes;
- write tasks with strictly non-overlapping ownership;
- a genuinely independent review of a completed implementation.

Do not target an agent count, split work to fill slots, or delegate duplicate searches. Outside the mandatory read-routing gate below, delegate only when the expected wall-clock, context-isolation, or coverage benefit exceeds task-packet and synthesis overhead. For `power_worker` routing, count keeping the main context focused on material judgment and avoiding unnecessary stronger-model implementation or test work as secondary benefits when the decision is otherwise close, but never delegate or split implementation or test work for cost alone; delivery quality and coordination safety come first.

### Read-routing gate

At the first point where a second independent fact domain can be named, apply this gate before continuing evidence collection. If at least two stable, non-dependent domains each require more than one direct read, define non-overlapping lanes and dispatch all currently ready qualifying lanes in the same wave. Do not serialize one lane in the main context and spawn the next later; satisfy the gate before cross-domain collection continues. Repository code and configuration versus scheduler and runtime state, or local data versus independent external verification, are separate fact domains when each needs multiple reads.

The gate does not authorize fan-out for one or two total direct reads, a single-command lookup, a later query that depends on the preceding result, inputs being changed concurrently, or duplicate confirmation of the same fact. Keep those cases, the immediate critical path, and final synthesis in the main context. If a qualifying profile is unavailable, follow Degradation rather than silently pretending the gate did not apply.

For inspection, divide work by independent fact domains rather than file count — for example external protocols or official documentation, repository execution and storage paths, tests and failure evidence, or project and Git history. When multiple qualifying read-only lanes are ready, non-overlapping, and based on stable inputs, dispatch them in the same wave up to available capacity. The main context may continue a non-dependent critical path, but it must not rescan a delegated responsibility while that agent is running unless new evidence invalidates the boundary or an immediate decision cannot wait. Start another lane only while it retains independent value, and stop fan-out once the evidence is sufficient.

Keep immediate critical-path reads, queries whose next step depends on the answer, and inspection of state being changed concurrently in the main context. Parallelize writes only with non-overlapping ownership. Tell every spawned agent not to delegate further.

## Roles

Route by task shape. Each profile owns its model and reasoning-effort configuration in its agent file — do not restate or override them at spawn time:

| Profile | Task shape |
| --- | --- |
| `power_worker` | Clear, bounded implementation, tests, fixes, documentation, deterministic validation. |
| `power_scout` | Clear, bounded evidence collection, inventories, direct documentation or history lookup, and log or test summarization. Behaviorally read-only. |
| `power_explorer` | Multi-hypothesis exploration, repository investigation, root-cause analysis, cross-module tracing. Behaviorally read-only. |
| `power_planner` | Genuinely ambiguous planning and decomposition, cross-agent result synthesis, conflict analysis. Behaviorally read-only. |
| `power_reviewer` | Completed implementation review and required `$power-check` (see the power-check skill for its contract). |

Use `power_scout` when the requested result is factual and bounded; use `power_explorer` when the work includes competing hypotheses, causal tracing, or discovering the scope. Do not use either for a one- or two-command read that belongs in the main context.

The host does not support per-subagent sandbox overrides, so read-only means instruction-enforced behavior in the agent profile — the same pattern `power_reviewer` uses. Do not claim sandbox-level hardening that was not provided. When a behaviorally read-only agent ran alongside uncommitted work and its result feeds a check, merge, or handoff decision, verify the working tree is unchanged after it returns.

## Task Packet

Send a compact packet: objective, confirmed decisions (drawn from the ledger's 已确认 and 已委托), repository evidence, scope, allowed writes, dependencies, expected deliverable, validation, and stop conditions. The packet is runtime state — do not persist it as a Blueprint or Agent Dispatch Plan, and do not put it through a user confirmation loop.

For explicit overrides, use `fork_turns: none` or the smallest supported positive history slice; do not use a full-history fork when the host forbids overrides.

## Escalation

When `power_scout` encounters conflicting evidence, ambiguous scope, or a need for causal judgment, it must return evidence instead of expanding its task; route that uncertainty to `power_explorer`. When `power_worker` encounters material ambiguity, unstable interfaces, or work that cannot be safely completed within its packet, it must return evidence instead of guessing or retrying blindly. Route the uncertainty to `power_explorer` or `power_planner`, then reissue a clear implementation packet when possible.

Any newly discovered **material** boundary goes back to the main context, into the ledger, and to the user through the grill loop. A subagent never resolves a material boundary.

## Degradation

If a profile is unavailable or the host cannot honor its configuration, use generic delegation or the main context only when that remains adequate for the task. Never claim an exact model, effort, or independent context that was not actually provided. When exact independence is itself required and unavailable, report `CHECK_REQUIRED` (for checks) or tell the user plainly (for other work); require user intervention only in that case.
