---
name: power-gan
description: Align and deliver coding work with progressive commitment. Use when the user invokes $power-gan, asks to clarify and implement a coding task, needs a deep design grill, or wants an existing Decision Issue delivered without freezing reversible implementation details.
---

# Power Gan

Work in Simplified Chinese by default. Keep the process proportional to the task.

## Start With Two Choices

1. Set the work goal:
   - `ALIGN_ONLY`: inspect and align decisions, then stop without implementation.
   - `DELIVER`: align what is necessary, implement, and self-validate.
2. Set alignment depth:
   - `FAST`: resolve only blockers and material decisions. This is the default.
   - `DEEP`: run Deep Grill for a dependent or high-risk decision tree.

Infer an explicit goal from the user's request. If implementation intent is unclear, ask only whether they want alignment or delivery. Never switch from `ALIGN_ONLY` to `DELIVER` without explicit authorization.

Inspect repository, Git, Issue, and PR facts instead of asking the user for discoverable information.

## Align Material Decisions

The user owns observable outcomes, scope, public contracts, material cost and risk, irreversible choices, and authorization. The agent owns reversible implementation details such as files, private interfaces, algorithms, work order, and test technique.

A decision is material when it changes observable behavior, scope or non-goals, public API/data/config/compatibility, security/privacy/permission/migration/concurrency/persistent state, an independently deliverable feature, or a cost or operational burden the user must accept.

For each material decision:

1. State the question and its consequence.
2. Present credible choices symmetrically, including a smaller or no-build choice when credible.
3. Give a recommendation and evidence.
4. Give the strongest credible argument against that recommendation.
5. Ask the user to choose, combine, or correct the choices.

Object clearly when evidence shows contradiction, excessive complexity, poor value for cost, or ignored risk. If the user first insists without addressing the objection, state the unresolved consequence once more. After the user shows understanding, accept ordinary product tradeoffs. Still stop for safety, law, permission, factual impossibility, unverifiable completion, or missing irreversible authorization. Do not invent objections for balance.

Do not treat a generic reply such as “可以”, “确认”, or “应用” as approval of several bundled material decisions. Ask which boundary was accepted. A short reply is sufficient for one clearly restated, low-cost decision.

## Deep Grill

Enter `DEEP` when the user requests it, or after explaining why a dependent or high-risk decision tree warrants it and the user agrees. Continue in the current context; do not call or depend on `grill-me`.

Ask one question at a time. Resolve upstream choices before dependent branches. Revisit a branch when new evidence invalidates it. Stop when no material user-owned branch remains; do not grill implementation detail for its own sake.

## Persist Only Decisions Worth Keeping

- Use an Issue for material decisions, high risk, long or cross-session work, or collaboration.
- A normal PR-sized task may keep rationale and evidence in the PR.
- A tiny local change may rely on its commit.
- Do not create repository decision Markdown unless the document itself is requested as a deliverable.

When an Issue is needed, read [references/issue-persistence.md](references/issue-persistence.md) in full before creating or updating hosted state.

Keep an Issue body as the current `Decision Record` with only: `Decision status`, `Decision revision`, outcome, scope/non-goals, confirmed material decisions with short rationale and main rejected alternative, accepted cost/risk, and stop/reopen conditions. Exclude blueprints, file lists, internal interfaces, test matrices, agent assignments, and full transcripts.

Increment `Decision revision` only after the user confirms a changed material decision and the body is updated. Use short `Decision Note` comments for the change, evidence, objection, final choice, rationale, and confirmation source. Comments alone never add current obligations. Normal delivery reads the Issue body; read relevant comments only for re-alignment, decision conflict, revision change, or check provenance.

For historical context, start from the user-provided Issue/PR or affected code, then follow code to commit, commit to PR/MR, PR/MR to Decision Issue, and any `supersedes` link. Use narrow keyword search only when no code or link provides an entry point; do not scan every closed Issue for a small task.

The delivery PR/MR for a material Decision Issue must link it explicitly. Close the Issue after delivery, necessary validation, and a linked PR/MR or commit. Later material change gets a new Issue linked with `supersedes`; reopen the old Issue only when its original delivery was incomplete or its evidence was wrong.

## Deliver Adaptively

In `DELIVER`, keep a short Working Strategy in the current session. Do not ask the user to confirm it or persist it as a contract. Change it freely while outcomes, material cost, and risk stay within the confirmed boundary.

Pause and re-align only when implementation exposes a new material boundary or contradicts the current decision. Show the delta and discuss at least shrinking, splitting, or continuing. Cost is materially larger when it exceeds an explicit budget/timeline or makes the earlier size, risk, or delivery description dishonest; line counts alone do not decide this.

Validate against the current decisions, final diff, actual risks, and relevant regressions. Earlier plans, rejected options, and speculative tests add no obligation.

An independent `$power-check` is required when the user requests it; the change involves security, privacy, permission, persistent state, migration, compatibility, concurrency, or irreversible behavior; it is an important merge/release/handoff; material drift occurred; or the Decision Record requires it. The current main agent announces and selects `$power-check`; this skill does not call another skill. If a fresh non-implementation context is required but unavailable, return `CHECK_REQUIRED` with the exact decision source and final implementation entry point.

Finish `ALIGN_ONLY` with the decisions, unresolved material questions, and persistence recommendation. Finish `DELIVER` with the delivered outcome, material deviations, validation evidence, and any required next check.
