# Orchestration

Read this reference when delegation may provide independently useful work. Keep work in the main context when coordination overhead exceeds the benefit.

## When To Delegate

Delegate only for:

- a bounded implementation chunk fully specifiable in one task packet;
- a bounded read-only investigation over stable inputs;
- write tasks with strictly non-overlapping ownership;
- a genuinely independent review of completed implementation.

Do not target an agent count, split work to fill slots, or duplicate searches. For `power_worker`, preserving the main context for material judgment and avoiding unnecessary stronger-model work are secondary benefits only; cost alone never justifies delegation or splitting implementation or tests.

### Read-routing gate

Before entering a second independent fact domain, check whether at least two stable, non-dependent domains each require more than one direct read. If so, divide them into non-overlapping lanes and dispatch every ready qualifying lane in the same wave before continuing cross-domain collection.

Keep one or two total reads, sequential queries, changing inputs, the immediate critical path, and final synthesis in the main context. The main context may continue non-dependent critical work while lanes run, but must not rescan a delegated lane unless new evidence invalidates its boundary or an immediate decision cannot wait. Stop dispatching when the evidence is sufficient.

Parallelize only read-only work over stable inputs or writes with non-overlapping ownership. Tell every spawned agent not to delegate further.

## Roles

Route by task shape. Each profile owns its model and reasoning-effort configuration in its agent file — do not restate or override them at spawn time:

| Profile | Task shape |
| --- | --- |
| `power_worker` | Clear, bounded implementation, tests, fixes, documentation, deterministic validation. |
| `power_scout` | Bounded evidence collection, inventories, direct documentation or history lookup, log or test summarization. Behaviorally read-only. |
| `power_explorer` | Multi-hypothesis exploration, repository investigation, root-cause analysis, cross-module tracing. Behaviorally read-only. |
| `power_planner` | Genuinely ambiguous planning and decomposition, cross-agent synthesis, conflict analysis. Behaviorally read-only. |
| `power_reviewer` | Completed implementation review and required `$power-check` (see the power-check skill for its contract). |

Use `power_scout` for factual, bounded collection and `power_explorer` for competing hypotheses, causal tracing, or scope discovery. Neither belongs on a one- or two-command read.

The host does not support per-subagent sandbox overrides, so read-only means instruction-enforced behavior in the profile. Do not claim sandbox-level hardening that was not provided. When a behaviorally read-only agent ran alongside uncommitted work and its result informs a check, merge, or handoff, verify afterward that the working tree is unchanged.

## Task Packet

Launch authorization stays in the main context. Before Snapshot confirmation, delegated packets must permit no source writes and use a behaviorally read-only profile or adequate read-only fallback. A source-writing packet may be dispatched only after the complete Snapshot is confirmed, recorded, and accepted by `validate-decision-state.mjs --phase authorized`; it must remain within that baseline. The user confirms the Snapshot, not the packet; changing routes does not invalidate confirmation unless it changes a material boundary or final carrier.

Send a compact packet containing the objective, confirmed decisions from 已确认 and 已委托, repository evidence, scope, allowed writes, dependencies, deliverable, validation, and stop conditions. The packet is runtime state — do not persist it as a Blueprint or Agent Dispatch Plan. For explicit overrides, use `fork_turns: none` or the smallest supported positive history slice; do not use a full-history fork when the host forbids overrides.

## Escalation

When `power_scout` encounters conflicting evidence, ambiguous scope, or a need for causal judgment, it returns its evidence for escalation to `power_explorer`. When `power_worker` encounters material ambiguity, an unstable interface, or work outside its packet, it returns evidence instead of guessing; route the uncertainty to `power_explorer` or `power_planner` before reissuing implementation work.

Any newly discovered **material** boundary returns to the main context, ledger, and grill loop. A subagent never resolves it or owns Snapshot creation, confirmation, or handoff.

## Degradation

If a profile is unavailable or the host cannot honor its configuration, use generic delegation or the main context only when that remains adequate. Never claim a model, effort, or independent context that was not provided. When exact independence is required and unavailable, report `CHECK_REQUIRED` for checks or tell the user plainly for other work; require intervention only then.
