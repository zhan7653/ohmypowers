# ohmypowers

Codex skills for decision alignment, adaptive delivery, independent checking, lifecycle curation, and work reporting.

## Core Workflow

`$power-gan` is the main coding entry point. It separates user-owned material decisions from reversible implementation details that the agent executes by default while the user retains visibility and stop authority.

It infers whether the user wants discussion only or delivery and whether the task needs a focused pass or a Deep Grill. `ALIGN_ONLY`, `DELIVER`, `FAST`, and `DEEP` remain optional shorthand when the user supplies them; they are not a menu the agent should recite.

Deep Grill follows the actual decision tree in focused rounds of one to three questions. The agent asks one when later questions depend on that answer, and batches two or three only when they are independent questions from the same decision layer. It inspects discoverable facts first, asks only about unresolved user-owned boundaries, gives a recommendation for each question, and lets the answers determine the next branch until both sides share the same understanding.

Throughout alignment, `$power-gan` maintains a compact Decision Ledger with confirmed decisions, pending material boundaries, visible reversible defaults, and explicitly delegated boundaries. Unanswered recommendations remain pending, and the ledger—not conversational memory—seeds any later Decision Record.

The workflow freezes outcomes, scope, public contracts, material cost/risk, and authorization. It does not freeze files, local private signatures, implementation order, test matrices, agent assignments, or reviewer topology.

The agent keeps independent judgment throughout alignment and delivery. It does not flatter, appease, or mirror the user's framing, and it does not treat user preference or confidence as evidence. Credible contradictory evidence is stated plainly, without manufacturing disagreement for its own sake.

“Internal” does not automatically mean reversible. A durable subsystem, runtime/deployment/storage/data-ownership boundary, shared cross-module contract, long-lived production dependency, or architecture choice costly to reverse is aligned as a material decision. Local private signatures and replaceable abstractions remain autonomous.

Before the first source write, the agent briefly states the completion basis, hard constraints, current smallest approach, validation direction, and real stop conditions. A direct request to implement already authorizes reversible work inside the stated scope; another confirmation is needed only when the boundary introduces a new material commitment, the user requested design approval first, or external or irreversible authorization is missing.

When implementation reveals a new material boundary, `$power-gan` pauses only for that delta. Internal reversible changes continue without user confirmation.

## Persistence

Use the smallest durable record justified by repository conventions and coordination needs:

- Issue: high-risk, long or cross-session work, or collaboration that needs a canonical decision home.
- PR: normal PR-sized delivery rationale and evidence.
- Commit: tiny local changes.

Materiality alone does not authorize hosted mutation or force creation of an Issue.

At the end of alignment, `$power-gan` always selects and states the smallest adequate persistence carrier. When a new Issue is warranted and no canonical Issue exists, it proactively presents the Decision Record and requests hosted-write authorization instead of waiting for the user to mention Issue creation.

An Issue body contains the current `Decision Record`: status, outcome, scope/non-goals, confirmed material decisions, short rationale, an optional closest alternative not chosen when it adds useful context, accepted cost/risk, stop/reopen conditions, and a revision only when the repository uses one. Comments hold short `Decision Notes`; they do not add current obligations by themselves.

When persistence is needed, `$power-gan` loads a compact GitHub/GitLab reference for repository discovery, authenticated creation or update, read-back verification, Decision Notes, and PR/MR linkage.

Delivery PRs/MRs and external handoffs use a compact evidence format containing only the decision source, delivered outcome, material deviations, validation, independent-check status, and remaining risks.

Do not create repository decision Markdown by default. Code, tests, schema, types, and configuration remain the primary current implementation truth.

## Skills

- `$power-gan`: align, Deep Grill, implement, and self-validate.
- `$power-check`: independently and read-only check a completed implementation against current decisions and the final diff.
- `$power-critic`: explicit-only fresh-context critique of requirements, specs, plans, or model replies; not code review.
- `$power-curator`: manually reconcile Decision Issue and PR lifecycle state after explicit confirmation.
- `$power-work-report`: create reviewed daily work reports and confirmed memory updates.

The retired `$power-think`, `$power-grill`, `$power-loop`, and `$power-verifier` flow is intentionally not installed or compatibility-wrapped.

## Proportional Subagents

Small tasks stay in the main context. For delegation, `$power-gan` routes clear implementation and tests to the managed Terra/high `power_worker`, multi-hypothesis exploration to the behaviorally read-only Sol/medium `power_explorer`, and genuinely ambiguous planning or cross-agent synthesis to the behaviorally read-only Sol/xhigh `power_planner`. Completed implementation review and required `$power-check` use the uniquely named, behaviorally read-only Sol/high `power_reviewer`. Each profile owns its model, reasoning effort, and behavioral constraints; the workflow does not rely on the host sandbox being downgraded for a child.

Routing and task packets remain reversible implementation details: they are not persisted as an Agent Dispatch Plan or put through a user confirmation loop. The main context keeps material decisions, final arbitration, and user communication. If a managed profile is unavailable or its configuration cannot be honored, the workflow uses generic delegation or the main context only when that is still adequate; it does not claim an exact model or independent context that was not provided.

## Independent Checks

Every `$power-gan` delivery performs proportional self-validation. Add `$power-check` when the user requests it; when the completed change materially affects or creates credible production risk in security, privacy, permissions, production persistent state, data migration, external or cross-version compatibility, concurrency correctness, or irreversible behavior; or for material drift or an important merge, release, or handoff. Merely touching one of these categories is not enough.

Use a fresh non-implementation context when an independent check is required. From the main or implementation context, `$power-check` delegates to the managed `power_reviewer`; a reviewer already in a fresh context checks directly without spawning recursively. The main context binds the check to the final tree and diff immediately before delegation and verifies that identity again afterward. If adequate independence is unavailable, report `CHECK_REQUIRED` instead of claiming it.

Start that check only after planned implementation edits and proportional self-validation are complete and the final candidate is stable. The first check covers the complete final diff. When findings lead to fixes, reuse the same independent reviewer and inspect only the delta plus affected decisions and evidence; unchanged mappings, source inspection, validation, and verified local Decision Record snapshots are reused rather than reacquired. A material scope or decision change still requires a new full check.

## Installation

Run:

```bash
./scripts/install.sh
```

The installer copies the managed skills into `${CODEX_HOME:-$HOME/.codex}/skills`, installs the managed `power_worker`, `power_explorer`, `power_planner`, `power_reviewer`, and `power_critic` agent profiles, and removes retired ohmypowers skills and profiles. Managed profiles replace existing files with the same basename; unrelated agent profiles are preserved. Custom-agent routing was verified with Codex CLI 0.145.0 multi-agent V2; 0.144.1 is not a supported baseline for these profiles. Restart Codex afterward.

## Examples

```text
Use $power-gan to implement this small bug fix.
```

```text
Use $power-gan to grill this permission workflow until the decisions are clear; do not implement it.
```

```text
Use $power-check to independently verify this final diff against Issue #42.
```

```text
Use $power-critic to challenge this Decision Record before implementation.
```

The accepted design is documented in [the power-gan adaptive workflow spec](docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md).
