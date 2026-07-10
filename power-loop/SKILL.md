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

Use these installed profiles when selecting the lowest capable initial tier:

- `power_luna_worker`: Luna Medium for mechanical, deterministic, low-risk work.
- `power_terra_worker`: Terra Medium for normal implementation, tests, fixes, and bounded integration.
- `power_terra_complex_worker`: Terra High for complexity known in advance.
- `power_sol_escalation`: Sol Medium as the implementation ceiling after evidence-backed under-classification.
- `power_code_reviewer`: Sol High, read-only code review.
- `power_verifier`: Sol High, read-only evidence verification.

Do not minimize agent count as a cost target. Preserve useful parallel work with independent deliverables and non-overlapping ownership. Serialize overlapping paths, unstable interfaces, and unresolved dependencies. Keep the main agent as orchestrator rather than a normal implementation writer.

Allow at most one direct model escalation per implementation task, choose the lowest sufficient allowed target, and never exceed Sol Medium. Do not escalate for permission, environment, dependency, validation-infrastructure, or ownership failures.

Always plan two independent Sol High review tasks over the same stable implementation snapshot, using tailored evidence packets:

- Code-review packet: relevant Task Contract and AC excerpts, stable diff, interface changes, tests, and validation output.
- Evidence-verification packet: full Task Contract and confirmed plans, AC evidence, validation results, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals. Provide diff access only for scope and contract mapping.

Run both tracks in parallel when possible. Neither track consumes or substitutes for the other.

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

Fill the Goal Prompt by reference to the persisted contract and confirmed sections. Preserve baseline drift checks, delegated implementation, exact task ownership, bounded escalation, validation, the two tailored Sol High review tracks, PR/MR evidence, Dispatch Summary, loop decisions, and manual execution. Do not copy the full contract or plans into the Goal Prompt.

Use [assets/pr-evidence-template.md](assets/pr-evidence-template.md) for the implementation evidence package. Never merge.

## Output

Before patch confirmation, output the contract source, readiness/risk decision, proposed Blueprint, proposed Dispatch Plan, complete confirmed-state Issue Patch, confirmation request, and `Goal Prompt: withheld until this exact patch is applied and verified.`

After application, output the verification result, persisted reference, ready-to-run Goal Prompt, and an explicit instruction for the user to start it manually.

For a blocked contract, output only the decision, blockers, and smallest useful next action.
