# ohmypowers

Codex skills for decision alignment, adaptive delivery, independent checking, lifecycle curation, and work reporting.

## Core Workflow

`$power-gan` is the main coding entry point. It separates user-owned material decisions from reversible implementation details that the agent executes autonomously after the launch baseline is confirmed, while the user retains visibility and stop authority.

It infers whether the user wants discussion only or delivery and whether the task needs a focused pass or a Deep Grill. `ALIGN_ONLY`, `DELIVER`, `FAST`, and `DEEP` remain optional shorthand when the user supplies them; they are not a menu the agent should recite.

Deep Grill follows the actual decision tree in focused rounds of one to three questions. The agent asks one when later questions depend on that answer, and batches two or three only when they are independent questions from the same decision layer. It inspects discoverable facts first, asks only about unresolved user-owned boundaries, gives a recommendation for each question, and lets the answers determine the next branch until both sides share the same understanding.

From the first material item, `$power-gan` maintains one delivery-scoped Decision Ledger under `${CODEX_HOME:-$HOME/.codex}/power-gan/records/<repository-key>/<delivery-id>/decision-snapshot.md`. Version 5 keeps one active note during alignment; after a durable carrier write and exact read-back it seals that note, creates a new predecessor-linked note, validates it, and deletes only the sealed local file. Verified handoff deletes the final local note. Issue/PR/commit bodies carry the current decision and evidence; hosted bodies and comments are not auto-deleted. Version 2, version 3, and version 4 Ledgers keep their existing behavior and are never migrated automatically.

The workflow freezes outcomes, scope, public contracts, material cost/risk, and authorization. It does not freeze files, local private signatures, implementation order, test matrices, agent assignments, or reviewer topology.

The agent keeps independent judgment throughout alignment and delivery. It does not flatter, appease, or mirror the user's framing, and it does not treat user preference or confidence as evidence. Credible contradictory evidence is stated plainly, without manufacturing disagreement for its own sake.

“Internal” does not automatically mean reversible. A durable subsystem, runtime/deployment/storage/data-ownership boundary, shared cross-module contract, long-lived production dependency, or architecture choice costly to reverse is aligned as a material decision. Local private signatures and replaceable abstractions remain autonomous.

Before the first source write, the Ledger receives the completion basis, hard constraints, current smallest approach, validation direction, stop conditions, and final carrier. For version 5, the bundled validator derives a launch projection containing only those launch fields and active confirmed/delegated decision statements; recommendations, process evidence, rejected/superseded history, metadata, and Working defaults stay outside the projection and its SHA-256. The agent forwards the marker-delimited projection verbatim. A direct request to implement establishes delivery intent only; source writing starts only after the user explicitly confirms that complete projection. A change to active content invalidates the confirmation, while excluded history changes do not.

When implementation reveals a new material boundary, `$power-gan` pauses only for that delta. Internal reversible changes continue without user confirmation.

## Persistence

Before non-mechanical source work, `$power-gan` searches for a relevant existing Decision Issue and proposes updating it, or proposes creating one when none fits. A directly related new Ledger may revise the same Issue after recording the predecessor delivery, exact pre-write body SHA-256, and prior handoff carrier; reusing the Issue never reactivates its terminal Ledger. The workflow shows the exact hosted mutation, requires explicit user authorization, and verifies the write by reading it back before launch. A purely mechanical edit can request an Issue exemption in the complete launch Snapshot; uncertainty favors an Issue.

For the implementation handoff, use the carrier justified by repository conventions and coordination needs:

- Issue: high-risk, long or cross-session work, or collaboration that needs a canonical decision home.
- PR: normal PR-sized delivery rationale and evidence.
- Commit: tiny local changes.

Hosted mutations always require explicit authorization; confirming an Issue does not authorize source changes, and confirming source launch does not authorize a later Issue update.

At the end of alignment, `$power-gan` records the verified Decision Issue or the visible mechanical exemption and selects the implementation handoff carrier.

Version 5 does not accumulate a local index: a successful durable write ends the current note, creates a predecessor-linked successor, and deletes only the sealed predecessor; verified handoff deletes the final note. Issue/PR/commit bodies carry the current decision and evidence. Handoff or cleanup failures keep the active local note. Version 2/3/4 Ledgers retain their existing behavior and are never migrated. The workflow does not maintain a second Journal or repository-local decision database.

An Issue body contains the current `Decision Record`: status, outcome, scope/non-goals, confirmed material decisions, short rationale, an optional closest alternative not chosen when it adds useful context, accepted cost/risk, stop/reopen conditions, and a revision only when the repository uses one. Comments hold short `Decision Notes`; they do not add current obligations by themselves.

When persistence is needed, `$power-gan` loads a compact GitHub/GitLab reference for repository discovery, authenticated creation or update, read-back verification, Decision Notes, and PR/MR linkage.

Delivery PRs/MRs and external handoffs use a compact evidence format containing only the decision source, delivered outcome, material deviations, validation, independent-check status, and remaining risks.

Do not create repository decision Markdown by default. Code, tests, schema, types, and configuration remain the primary current implementation truth.

## Skills

- `$power-gan`: align, Deep Grill, implement, and self-validate.
- `$power-check`: independently and read-only check a completed implementation against current decisions and the final diff.
- `$power-critic`: explicit-only fresh-context critique of requirements, specs, plans, or model replies; not code review.
- `$power-curator`: explicitly requested, evidence-based reconciliation of Decision Issue and PR lifecycle state, with exact confirmed mutations only.

The retired `$power-think`, `$power-grill`, `$power-loop`, and `$power-verifier` flow is intentionally not installed or compatibility-wrapped. `$power-work-report` V1 (archaeology-based daily reports) is retired as well; its successor ships from the standalone `worklog` repository, which installs the event-capture daily report system and the V2 skill.

## Proportional Subagents

Small tasks stay in the main context. When at least two stable, non-dependent fact domains each need more than one direct read, `$power-gan` dispatches the ready read-only lanes in the same wave; one or two total reads and sequential dependencies stay in the main context.

Task shape determines the profile: `power_worker` handles bounded implementation and tests; behaviorally read-only `power_scout`, `power_explorer`, and `power_planner` handle bounded evidence, multi-hypothesis investigation, and ambiguous planning or synthesis; `power_reviewer` handles completed review and required `$power-check`. Routing remains agent-owned runtime state and never bypasses the Snapshot launch gate. Each profile owns its configuration; the workflow does not rely on the host sandbox being downgraded, and unavailable profiles degrade only when the fallback remains adequate.

## Independent Checks

Every `$power-gan` delivery performs proportional self-validation. `$power-check` owns the single runtime Applicability contract: require it for an explicit user request, a material effect or credible production risk in a protected category, material drift, an important merge/release/handoff, or a Decision Record that requires independent evidence. Merely touching one of these categories is not enough.

Use a fresh non-implementation context when an independent check is required. The caller builds and validates a Check Packet, then delegates it to the managed `power_reviewer`; a reviewer already in a fresh context checks directly without spawning recursively. Prefer a committed candidate only when the index, working tree, untracked set, and submodule state are clean before and after review. Otherwise bind the result to `HEAD`, a SHA-256 of the binary full-index diff, and a NUL-safe manifest that hashes every untracked path, entry type, and content. If adequate independence is unavailable, report `CHECK_REQUIRED` instead of claiming it.

Start that check only after planned implementation edits and proportional self-validation are complete and the final candidate is stable. The first check covers the complete final diff. When findings lead to fixes, resume the same reviewer when possible; otherwise a new independent reviewer may consume a delta packet containing the prior identity, result, findings, and dispositions. Inspect only the delta plus affected decisions and evidence unless material scope, decisions, the decision source, or the evidence boundary changed. Ordinary packet omissions are repaired by the caller or returned as `BLOCKED`; `NEEDS_HUMAN` is reserved for genuinely missing decisions, interpretations, or authorization.

## Installation

Run:

```bash
./scripts/install.sh
```

The installer copies the managed skills into `${CODEX_HOME:-$HOME/.codex}/skills`, installs the managed `power_worker`, `power_scout`, `power_explorer`, `power_planner`, `power_reviewer`, and `power_critic` agent profiles, and removes retired ohmypowers skills and profiles. Managed profiles replace existing files with the same basename; unrelated agent profiles are preserved. Custom-agent routing was verified with Codex CLI 0.145.0 multi-agent V2; 0.144.1 is not a supported baseline for these profiles. Restart Codex afterward.

## Testing

Run the deterministic, model-free suite with `node --test tests/*.test.js`. These tests execute the installer, Decision Snapshot validator, and embedded PowerShell helpers; they do not treat skill or documentation wording as runtime-behavior evidence.

Run `node tests/model-evidence.eval.mjs` explicitly to evaluate test-evidence judgment through the installed `$power-gan`. This opt-in check uses the local Codex credentials and model tokens, requires the installed power-gan files to match the repository, captures Codex JSONL tool events, runs read-only, and verifies that the repository state is unchanged. It is intentionally excluded from default CI and is representative rather than exhaustive.

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
