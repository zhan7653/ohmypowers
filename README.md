# ohmypowers

Codex skills for decision alignment, adaptive delivery, independent checking, lifecycle curation, and work reporting.

## Core Workflow

`$power-gan` is the main coding entry point. It separates user-owned material decisions from agent-owned reversible implementation details.

- `ALIGN_ONLY`: align decisions and stop before implementation.
- `DELIVER`: align what is necessary, implement adaptively, and self-validate.
- `FAST`: ask only about blockers and material boundaries.
- `DEEP`: Deep Grill one material question at a time in the same context.

Deep Grill is built into `$power-gan`; it does not call or depend on third-party `$grill-me`.

The workflow freezes outcomes, scope, public contracts, material cost/risk, and authorization. It does not freeze files, private interfaces, implementation order, test matrices, agent assignments, or reviewer topology.

When implementation reveals a new material boundary, `$power-gan` pauses only for that delta. Internal reversible changes continue without user confirmation.

## Persistence

Use the smallest durable record that fits the task:

- Issue: material decisions, high risk, long or cross-session work, or collaboration.
- PR: normal PR-sized delivery rationale and evidence.
- Commit: tiny local changes.

An Issue body contains the current `Decision Record`: status, revision, outcome, scope/non-goals, confirmed material decisions, short rationale and rejected alternative, accepted cost/risk, and stop/reopen conditions. Comments hold short `Decision Notes`; they do not add current obligations by themselves.

When persistence is needed, `$power-gan` loads a compact GitHub/GitLab reference for repository discovery, authenticated creation or update, read-back verification, Decision Notes, and PR/MR linkage.

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

The current main agent selects `$power-check`; `$power-gan` does not call another skill. If required fresh non-implementation context is unavailable, report `CHECK_REQUIRED` instead of claiming independence.

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
Use $power-gan in ALIGN_ONLY and DEEP mode to redesign this permission workflow.
```

```text
Use $power-check to independently verify this final diff against Issue #42.
```

```text
Use $power-critic to challenge this Decision Record before implementation.
```

The accepted design is documented in [the power-gan adaptive workflow spec](docs/specs/2026-07-13-power-gan-adaptive-workflow-spec.md).
