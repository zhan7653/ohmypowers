---
name: power-gan
description: Align and deliver coding work with a short decision loop, explicit authorization for material changes, and proportional validation.
---

# Power Gan

Default to Simplified Chinese and match the user's language. Keep the process proportional: use a short confirmation for clearly local, reversible work and the material path only when a decision changes an observable outcome, public contract, durable cost or risk, or is costly to reverse.

## Core contract

1. The user owns outcomes, scope, public contracts, material cost and risk, irreversible choices, and authorization. The agent owns files, private helpers, algorithms, work order, and test technique.
2. Inspect the repository and available evidence before asking a question. Ask only about unresolved user-owned boundaries, give one recommendation per question, and stop for the answer.
3. A material delivery uses one current v5 Decision Ledger at `${CODEX_HOME:-$HOME/.codex}/power-gan/records/<repository-key>/<delivery-id>/decision-snapshot.md`. Low-risk work does not create a Ledger only to obtain confirmation. This branch supports v5 only; historical Ledger versions are outside the contract.
4. Never write source or hosted state beyond the confirmed boundary. Hosted mutations require separate explicit authorization and an exact read-back.

## Alignment

- Infer whether the user wants discussion or delivery. A direct implementation request establishes intent, not material launch authorization.
- Resolve the highest-leverage unresolved material boundary first. Ask one question when later questions depend on it; batch two or three only when independent.
- After each answer, reread and update the Ledger, then run `node <skill-dir>/scripts/validate-decision-state.mjs <ledger> --phase alignment`.
- Render only the current confirmed, pending, delegated, and visible working defaults. Do not invent alternatives or precompute a private blueprint.
- Stop when no material decision is pending. Keep reversible implementation choices autonomous.

## Delivery

For low-risk work, state the observable change, scope, and validation command; wait for the user's short confirmation, then implement.

For material work, complete `Outcome`, `Scope / non-goals`, `Launch basis`, `Stop / reopen conditions`, `Final carrier`, and `Issue persistence` in the v5 Ledger. Run the validator with `--phase launch`, forward the generated Snapshot verbatim, and wait for whole-baseline confirmation. Record its SHA-256 and run `--phase authorized` before the first source write.

During implementation, continue within the confirmed boundary. If a new material boundary appears, add it as the next pending decision and pause only for that delta. Reversible surprises do not reopen settled decisions.

## Validation

Use the repository's existing tools and run tests that can falsify the behavior they claim. Do not add tests that only match skill, prompt, documentation, or implementation wording. Report an evidence gap instead of weakening the promised validation.

Use `$power-check` when its Applicability section requires an independent read-only check: an explicit request, a material security/privacy/permission/state/migration/compatibility/concurrency/irreversibility risk, material drift, an important handoff, or a Decision Record that requires it.

## Persistence and handoff

When a durable project standard changes, identify the relevant Decision Issue and propose the exact hosted mutation before writing it. If no durable standard changes, use the smallest adequate carrier: commit for a tiny local change, PR for ordinary delivery, Issue when a canonical long-lived decision is needed.

Before any hosted Issue, PR, or MR mutation, read [references/issue-persistence.md](references/issue-persistence.md) in full and follow its host-specific read-back and failure rules.

Before handoff, reconcile the final diff against active decisions and validation evidence. Set `Handoff status`, validate with `--phase handoff`, and use `manage-decision-note.mjs handoff` only after the carrier has been verified. Do not delete historical hosted records or local runtime artifacts.

## Agents

Use Codex's built-in `default`, `worker`, and `explorer` agents for ordinary delegation. The project keeps one custom profile at `.codex/agents/reviewer.toml` for independent read-only review. Custom profiles are narrow role descriptions; Codex owns spawning, scheduling, waiting, and lifecycle.
