---
name: power-loop
description: Convert a requirements-ready hosted issue, local brief, or pasted task contract into a repository-aware Execution Blueprint, cost-aware Agent Dispatch Plan, reviewable Issue Patch, and, only after the confirmed patch is applied, a bounded ready-to-run Codex /goal. Use after power-grill or another clarification step has produced a clear task contract.
---

# Power Loop

## Overview

Turn a requirements-ready Task Contract into a confirmed implementation loop for Codex `/goal`.

Use this order without skipping or reordering stages:

```text
Task Contract
-> readiness and risk gates
-> repository inspection
-> Execution Blueprint
-> Agent Dispatch Plan
-> exact Issue Patch
-> explicit user confirmation
-> apply and verify the patch
-> final Goal Prompt
-> user manually starts /goal
```

Do not detect Ultra mode. Generate the same planning artifacts whenever the contract passes the gates. Ultra is a user-selected runtime, not a feature flag.

## Sources And Boundaries

Use this precedence:

1. Task Contract: canonical what and why.
2. Execution Blueprint: confirmed repository-aware how.
3. Agent Dispatch Plan: confirmed tasks, agents, models, ownership, dependencies, and escalation targets.
4. Goal runtime decisions: operational choices that do not change the three confirmed layers.

Stop when a derived artifact conflicts with the Task Contract. Return `NEEDS_GRILL` for an unresolved requirement boundary and `NEEDS_HUMAN` for a material public, product, business, security, permission, compatibility, schema, or migration decision.

Do not:

- deeply clarify vague requirements;
- implement code or create implementation branches/worktrees during planning;
- mutate requirements or `Curation status`;
- update a hosted issue or local brief before exact patch confirmation;
- generate the Goal Prompt before the patch is applied and verified;
- invoke `/goal` automatically;
- silently replace a missing custom agent with the parent model;
- create, approve, merge, or close PRs/MRs.

After explicit patch confirmation, update only the marked Execution Blueprint and Agent Dispatch Plan blocks.

## Inputs

Prefer a hosted issue, then a persisted local brief, then a pasted Task Contract. A pasted-only contract may receive readiness, Blueprint, and Dispatch drafts, but it must be persisted before a target-specific Issue Patch or final Goal Prompt can be produced.

Treat the `Task Contract` section as canonical. For legacy issues, treat requirement sections before Execution Blueprint, Agent Dispatch Plan, or `Curation status` as the Task Contract. Do not reuse an execution section unless it is explicitly `Planning status: confirmed` and still matches the contract and repository baseline.

## Workflow

### 1. Gate Readiness And Risk

Read [assets/loop-readiness-checklist.md](assets/loop-readiness-checklist.md).

Return one readiness result:

- `LOOP_READY`: requirement decisions are sufficient for repository-aware planning.
- `NEEDS_GRILL`: externally observable behavior, scope, acceptance criteria, validation expectations, stop condition, or pause condition is missing or vague.
- `NEEDS_HUMAN`: repository facts, permissions, high-risk work, or a material human decision blocks planning.

Classify risk as `LOW`, `MEDIUM`, or `HIGH` and select:

- `ALLOW_GOAL`: `LOW` and `LOOP_READY`.
- `GOAL_WITH_STRICT_GATE`: `MEDIUM` and `LOOP_READY`.
- `HUMAN_ONLY`: `HIGH` or an unresolved human decision.

For any blocked result, return only the decision, blockers, and smallest next action. Do not generate execution artifacts.

### 2. Inspect The Repository

Inspect only enough context to derive the implementation. Record the contract source, source branch and full commit, timestamp, relevant facts and assumptions, worktree state, exact affected paths, internal interfaces, flow, error handling, dependencies, validation commands, and material-drift conditions.

If inspection exposes a requirement decision, stop instead of hiding it in the plan.

### 3. Generate The Execution Blueprint

Read and fill [assets/execution-blueprint.md](assets/execution-blueprint.md) in its existing field order. Set the standalone draft to `Planning status: proposed`.

Plan one dedicated task-level implementation branch, optionally with one repository-local worktree. Base it on repository guidance such as `develop`; do not plan normal writes directly on the shared integration branch and do not create one worktree per subagent.

### 4. Generate The Agent Dispatch Plan

Read and fill [assets/agent-dispatch-plan.md](assets/agent-dispatch-plan.md) after the Blueprint exists. The issue must contain exact task assignments, not the static routing table.

Use these installed profiles as available capabilities when they fit the confirmed task. A contract may require a different exact reviewer, agent, model, provider, or procedure; do not substitute it silently.

- `power_luna_worker`: Luna Max for simple through lower-medium implementation with stable boundaries and clear validation.
- `power_sol_worker`: Sol Medium for implementation above the Luna boundary and as the only direct replacement for an under-classified Luna task.
- `power_terra_reviewer`: Terra High for explicitly simple, low-risk, highly structured read-only verification.
- `power_sol_reviewer`: Sol Medium as the default read-only reviewer for ordinary selected capabilities.
- `power_sol_high_reviewer`: Sol High for high-risk or semantically complex read-only verification.

Do not minimize agent count as a cost target. Preserve useful parallel work with independent deliverables and non-overlapping ownership. Serialize overlapping paths, unstable interfaces, and unresolved dependencies. Keep the main agent as orchestrator rather than a normal implementation writer.

Classify implementation directly into the two supported tiers. Use Luna Max when the task has clear requirements, stable interfaces, bounded ownership, deterministic validation, and no unresolved architecture, security, permission, migration, compatibility, concurrency, or complex-state decision. Use Sol Medium initially when any of those conditions are absent or the task needs complex diagnosis or cross-module design.

Allow at most one direct implementation replacement: `power_luna_worker` to `power_sol_worker`, backed by concrete capability or reasoning mismatch evidence. Do not use a model ladder or escalate for permission, environment, dependency, validation-infrastructure, or ownership failures. Sol Medium is the implementation ceiling.

Plan review only after the final implementation diff, affected interfaces/data, validation requirements, and material risks are known. Preserve this review-plan record with the stable snapshot:

- If the contract names reviewers, agents, models, providers, or procedures, assign and verify those requirements exactly. Record an unavailable prescribed capability as a blocker or `NEEDS_HUMAN` decision; do not substitute it silently.
- Otherwise, select the minimum sufficient independent, read-only review capabilities for contract conformance and the identified code, test, security, compatibility, migration, data, permission, concurrency, or domain risks. Capability names and reviewer count remain dynamic; apply the reviewer tier policy below instead of imposing a fixed identity or specialization.
- Require at least one reviewer independent from implementation to check contract conformance before a `PASS` or `PASS_WITH_NOTES` result. Add a separate code-review capability only when the contract or final-diff risk justifies it.
- Select `power_sol_reviewer` by default. Use `power_terra_reviewer` only when the review is demonstrably small, low risk, highly structured, and does not require deep cross-source reasoning or security, permission, migration, compatibility, concurrency, or complex lifecycle analysis. Use `power_sol_high_reviewer` for those high-risk areas, large cross-module diffs, conflicting evidence, or other semantically complex verification.
- For every selected reviewer, record identity/source, model, reasoning effort, model-selection rationale, implementation independence, capability, scope, read-only boundary, evidence inspected, result, and snapshot identity. Tailor packets to that scope; give the contract-conformance reviewer the complete canonical Issue/local body, final Goal Prompt, clause evidence, snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals.
- A reviewer that cannot produce a reliable conclusion within its assigned tier must return `BLOCKED` with reclassification evidence. The orchestrator may select a higher appropriate reviewer directly; do not silently walk every tier.

Run independent selected reviews in parallel over the same stable snapshot when possible. They may cover different capabilities but do not substitute for any contract-prescribed review.

### 5. Generate, Confirm, And Apply The Issue Patch

Read [assets/issue-patch.md](assets/issue-patch.md).

For pasted-only input, display the proposed artifacts and ask the user to persist the unchanged Task Contract. Re-read the persisted source before generating a target-specific patch.

For a persisted target:

1. Build complete replacement blocks whose planning status is `confirmed` after application.
2. Display one exact patch that changes only the marked Blueprint and Dispatch blocks.
3. State that Task Contract and `Curation status` remain byte-for-byte unchanged.
4. Ask the user to confirm that exact patch and withhold the Goal Prompt.

Treat confirmation as patch-specific. Any revision requires a complete regenerated patch and new confirmation.

After confirmation, re-read the target, verify the Task Contract is unchanged, apply only the two blocks, re-read again, and compare them exactly. On any failure, return `PATCH_NOT_APPLIED` or `PATCH_VERIFICATION_FAILED` and withhold the Goal Prompt.

### 6. Generate The Final Goal Prompt

Read [assets/codex-loop-goal.txt](assets/codex-loop-goal.txt) only after successful patch verification.

Check custom-agent availability when the host exposes it. If a required profile is known missing, stop for installation or explicit approval of a named alternative. Otherwise keep the mandatory check in Goal preflight.

Fill the Goal Prompt by reference to the persisted contract and confirmed sections. Preserve baseline drift checks, delegated implementation, exact task ownership, bounded escalation, dynamic verifier handoff, review-plan selection after the final diff, snapshot freshness, safe validation replay, PR/MR evidence, Dispatch Summary, loop decisions, and manual execution. Do not copy the full contract or plans into the Goal Prompt.

Use [assets/pr-evidence-template.md](assets/pr-evidence-template.md) for the implementation evidence package. Never merge.

## Output

Before patch confirmation, output the contract source, readiness/risk decision, proposed Blueprint, proposed Dispatch Plan, complete confirmed-state Issue Patch, confirmation request, and `Goal Prompt: withheld until this exact patch is applied and verified.`

After application, output the verification result, persisted reference, ready-to-run Goal Prompt, and an explicit instruction for the user to start it manually.

For a blocked contract, output only the decision, blockers, and smallest useful next action.
