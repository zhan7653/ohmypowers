# ohmypowers

Codex skills for decision alignment, adaptive delivery, independent checking, lifecycle curation, and work reporting.

## Core Workflow

`$power-gan` is the main coding entry point. It separates user-owned material decisions from reversible implementation details that the agent executes by default while the user retains visibility and stop authority.

It infers whether the user wants discussion only or delivery and whether the task needs a focused pass or a Deep Grill. `ALIGN_ONLY`, `DELIVER`, `FAST`, and `DEEP` remain optional shorthand when the user supplies them; they are not a menu the agent should recite.

Deep Grill follows the actual decision tree one question at a time. The agent inspects discoverable facts first, asks only about unresolved user-owned boundaries, gives its recommended answer, and lets each response determine the next branch until both sides share the same understanding.

The workflow freezes outcomes, scope, public contracts, material cost/risk, and authorization. It does not freeze files, local private signatures, implementation order, test matrices, agent assignments, or reviewer topology.

“Internal” does not automatically mean reversible. A durable subsystem, runtime/deployment/storage/data-ownership boundary, shared cross-module contract, long-lived production dependency, or architecture choice costly to reverse is aligned as a material decision. Local private signatures and replaceable abstractions remain autonomous.

Before the first source write, the agent briefly states the completion basis, hard constraints, current smallest approach, validation direction, and real stop conditions. A direct request to implement already authorizes reversible work inside the stated scope; another confirmation is needed only when the boundary introduces a new material commitment, the user requested design approval first, or external or irreversible authorization is missing.

When implementation reveals a new material boundary, `$power-gan` pauses only for that delta. Internal reversible changes continue without user confirmation.

## Persistence

Use the smallest durable record justified by repository conventions and coordination needs:

- Issue: high-risk, long or cross-session work, or collaboration that needs a canonical decision home.
- PR: normal PR-sized delivery rationale and evidence.
- Commit: tiny local changes.

Materiality alone does not authorize hosted mutation or force creation of an Issue.

An Issue body contains the current `Decision Record`: status, revision, outcome, scope/non-goals, confirmed material decisions, short rationale, an optional closest alternative not chosen when it adds useful context, accepted cost/risk, and stop/reopen conditions. Comments hold short `Decision Notes`; they do not add current obligations by themselves.

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

## Independent Checks

Every `$power-gan` delivery performs proportional self-validation. Add `$power-check` when the user requests it or the change involves security, privacy, permissions, persistent state, migration, compatibility, concurrency, irreversible behavior, material drift, or an important merge, release, or handoff.

Use a fresh non-implementation context when an independent check is required. If that independence is unavailable, report `CHECK_REQUIRED` instead of claiming it.

## Installation

Run:

```bash
./scripts/install.sh
```

The installer copies the managed skills into `${CODEX_HOME:-$HOME/.codex}/skills`, installs the optional `power_critic` agent profile, and removes retired ohmypowers skills and profiles. Restart Codex afterward.

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
