---
name: power-loop
description: Convert a requirements-ready hosted issue, local brief, or pasted task contract into a repository-aware Execution Blueprint, capability-accurate Agent Dispatch Plan, reviewable Issue Patch, and, only after the confirmed patch is applied, a bounded ready-to-run Codex /goal. Use after power-grill or another clarification step has produced a clear task contract.
---

# Power Loop

## Overview

Turn a requirements-ready Task Contract into a confirmed implementation loop for Codex `/goal`.

Use this order without skipping or reordering stages:

```text
Task Contract
-> subagent capability preflight
-> explicit execution-mode confirmation
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
3. Agent Dispatch Plan: confirmed mode-specific tasks, roles, ownership, dependencies, and supported configuration.
4. Goal runtime decisions: operational choices that do not change the three confirmed layers.

Stop when a derived artifact conflicts with the Task Contract. Return `NEEDS_GRILL` for an unresolved requirement boundary and `NEEDS_HUMAN` for a material public, product, business, security, permission, compatibility, schema, or migration decision.

Do not:

- deeply clarify vague requirements;
- implement code or create implementation branches/worktrees during planning;
- mutate requirements or `Curation status`;
- update a hosted issue or local brief before exact patch confirmation;
- generate the Goal Prompt before the patch is applied and verified;
- generate a mode-specific Agent Dispatch Plan before the user confirms the execution mode;
- invoke `/goal` automatically;
- silently replace a missing custom agent with the parent model;
- create, approve, merge, or close PRs/MRs.

After explicit patch confirmation, update only the marked Execution Blueprint and Agent Dispatch Plan blocks.

## Inputs

Prefer a hosted issue, then a persisted local brief, then a pasted Task Contract. A pasted-only contract may receive readiness, Blueprint, and Dispatch drafts, but it must be persisted before a target-specific Issue Patch or final Goal Prompt can be produced.

Treat the `Task Contract` section as canonical. For legacy issues, treat requirement sections before Execution Blueprint, Agent Dispatch Plan, or `Curation status` as the Task Contract. Do not reuse an execution section unless it is explicitly `Planning status: confirmed` and still matches the contract and repository baseline.

## Workflow

### 1. Preflight Subagent Capability And Confirm The Mode

Inspect the currently exposed `spawn_agent` schema or equivalent host contract before readiness gating or repository-aware mode-specific planning. Prefer direct schema inspection. Do not spawn a probe subagent, make an intentionally failing call, or infer capability from installed custom-agent files or the CLI version when the visible contract is conclusive.

Classify the observed capability using exactly one value:

- `strict-selection-supported`: the host exposes a documented, usable per-subagent model or custom-agent/profile selector required for strict routing. Report the exact selector evidence. Treat model, reasoning, profile, and sandbox selection as independent capabilities; do not infer one from another.
- `inherited-model-only`: generic delegation is exposed, but the visible contract exposes no supported model, reasoning, or custom-agent/profile selector. Recommend `inherited-model-routing` and report that no probe was spawned.
- `indeterminate`: evidence is incomplete, unavailable, or contradictory, including conflict between user-reported behavior and the visible schema. Report the uncertainty and ask the user; do not silently choose a mode.

For every classification, report:

- classification;
- evidence inspected;
- selectors or evidence unavailable;
- whether a probe was spawned (`No` whenever schema inspection was conclusive);
- recommended execution mode;
- uncertainty or contradictory evidence;
- explicit user confirmation.

Recommend `strict-model-routing` only for `strict-selection-supported`. Recommend `inherited-model-routing` for `inherited-model-only`. An `indeterminate` result requires a human choice backed by additional usable evidence. User confirmation is mandatory after the recommendation. Until the user confirms, do not generate a mode-specific Agent Dispatch Plan, Issue Patch, or final Goal Prompt. If the user requests strict mode without usable strict-selection evidence, return `NEEDS_HUMAN`.

If the Task Contract requires an exact model, profile, provider, reasoning level, sandbox, or isolation guarantee that the confirmed mode cannot satisfy, return `NEEDS_HUMAN`; do not weaken or substitute the requirement.

### 2. Gate Readiness And Risk

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

### 3. Inspect The Repository

Inspect only enough context to derive the implementation. Record the contract source, source branch and full commit, timestamp, relevant facts and assumptions, worktree state, exact affected paths, internal interfaces, flow, error handling, dependencies, validation commands, and material-drift conditions.

If inspection exposes a requirement decision, stop instead of hiding it in the plan.

### 4. Generate The Execution Blueprint

Read and fill [assets/execution-blueprint.md](assets/execution-blueprint.md) in its existing field order. Set the standalone draft to `Planning status: proposed`.

Plan one dedicated task-level implementation branch, optionally with one repository-local worktree. Base it on repository guidance such as `develop`; do not plan normal writes directly on the shared integration branch and do not create one worktree per subagent.

### 5. Generate The Agent Dispatch Plan

After the Blueprint exists, use exactly one separately maintained template selected by the confirmed mode:

- `strict-model-routing`: read and fill [assets/agent-dispatch-plan-strict.md](assets/agent-dispatch-plan-strict.md).
- `inherited-model-routing`: read and fill [assets/agent-dispatch-plan-inherited.md](assets/agent-dispatch-plan-inherited.md).

[assets/agent-dispatch-plan.md](assets/agent-dispatch-plan.md) is only a routing notice and must not be filled as a plan. The issue must contain exact task assignments, not the static routing table. Record the confirmed execution mode and capability evidence in the selected plan.

For `strict-model-routing`, preserve the following routing policy. A usable model selector or custom-agent/profile selector is sufficient to select this mode, but it does not prove any other capability dimension. Record separate evidence for model selection, custom-agent/profile selection, reasoning selection or configured effect, and sandbox or isolation enforcement. Populate each strict task field only when its own dimension is supported; otherwise mark it `unavailable — not independently selectable` and make no guarantee. An instruction-level allowed-path or no-write boundary may replace an unavailable sandbox claim, but must not be described as host enforcement.

Use these installed profiles as selectable capabilities only when the host exposes a usable profile selector and every claimed profile-configured effect is separately evidenced. With a model-only selector, preserve the routing tier through the selected model while marking profile, reasoning, and sandbox fields unavailable unless independently supported. A contract may require a different exact reviewer, agent, model, provider, or procedure; do not substitute it silently.

- `power_luna_worker`: lower implementation route for stable, bounded work; call the resolved configuration Luna Max only when the profile and Max reasoning effect are both evidenced.
- `power_sol_worker`: higher implementation route and the only direct replacement for the lower route; call the resolved configuration Sol Medium only when the profile and Medium reasoning effect are both evidenced.
- `power_terra_reviewer`: explicitly simple, low-risk, highly structured review route; call the resolved configuration Terra High only when the profile and High reasoning effect are both evidenced.
- `power_sol_reviewer`: default ordinary-review route; call the resolved configuration Sol Medium only when the profile and Medium reasoning effect are both evidenced.
- `power_sol_high_reviewer`: high-risk or semantically complex review route; call the resolved configuration Sol High only when the profile and High reasoning effect are both evidenced.

Do not minimize agent count as a cost target. Preserve useful parallel work with independent deliverables and non-overlapping ownership. Serialize overlapping paths, unstable interfaces, and unresolved dependencies. Keep the main agent as orchestrator rather than a normal implementation writer.

Classify implementation directly into the two supported tiers. Use the lower implementation route when the task has clear requirements, stable interfaces, bounded ownership, deterministic validation, and no unresolved architecture, security, permission, migration, compatibility, concurrency, or complex-state decision. Use its fully evidenced Luna Max label only when Max reasoning is separately supported or its profile-configured effect is demonstrably applied. Use the higher implementation route initially when any of those conditions are absent or the task needs complex diagnosis or cross-module design; use its fully evidenced Sol Medium label only when Medium reasoning is separately supported.

Allow at most one direct implementation replacement from the Luna route to the Sol route, backed by concrete capability or reasoning mismatch evidence. Use `power_luna_worker` to `power_sol_worker` when profile selection and the claimed configuration effects are supported; use the corresponding direct model selection when only model selection is supported. Do not claim a reasoning change unless reasoning is independently supported. Do not use a model ladder or escalate for permission, environment, dependency, validation-infrastructure, or ownership failures. The Sol route is the implementation ceiling.

Plan review only after the final implementation diff, affected interfaces/data, validation requirements, and material risks are known. Preserve this review-plan record with the stable snapshot:

- If the contract names reviewers, agents, models, providers, or procedures, assign and verify those requirements exactly. Record an unavailable prescribed capability as a blocker or `NEEDS_HUMAN` decision; do not substitute it silently.
- Otherwise, select the minimum sufficient independent, read-only review capabilities for contract conformance and the identified code, test, security, compatibility, migration, data, permission, concurrency, or domain risks. Capability names and reviewer count remain dynamic; apply the reviewer tier policy below instead of imposing a fixed identity or specialization.
- Require at least one reviewer independent from implementation to check contract conformance before a `PASS` or `PASS_WITH_NOTES` result. Add a separate code-review capability only when the contract or final-diff risk justifies it.
- Select the default Sol reviewer route for ordinary review. Use the Terra reviewer route only when the review is demonstrably small, low risk, highly structured, and does not require deep cross-source reasoning or security, permission, migration, compatibility, concurrency, or complex lifecycle analysis. Use the higher-complexity Sol reviewer route for those high-risk areas, large cross-module diffs, conflicting evidence, or other semantically complex verification. Use Medium or High effort labels only when that reasoning effect is separately evidenced. Populate `power_sol_reviewer`, `power_terra_reviewer`, or `power_sol_high_reviewer` only when profile selection is supported; otherwise use a supported model selector and mark the custom-agent field unavailable.
- For every selected reviewer, record identity/source, supported configuration evidence, model-selection rationale, implementation independence, capability, scope, boundary provenance, evidence inspected, result, and snapshot identity. Record model, reasoning effort, and host-enforced isolation only when each is separately evidenced. Tailor packets to that scope; give the contract-conformance reviewer the complete canonical Issue/local body, final Goal Prompt, clause evidence, snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals.
- A reviewer that cannot produce a reliable conclusion within its assigned tier must return `BLOCKED` with reclassification evidence. The orchestrator may select a higher appropriate reviewer directly; do not silently walk every tier.

Run independent selected reviews in parallel over the same stable snapshot when possible. They may cover different capabilities but do not substitute for any contract-prescribed review.

For `inherited-model-routing`, subagents inherit the parent configuration. Do not specify or report an independently selected model, reasoning effort, custom profile, profile-specific sandbox, model escalation, reviewer tier, assignment accuracy, or model-cost guarantee. Plan generic subagents by role, objective, spawn/context policy, ownership, dependencies, deliverable, validation responsibility, parallelism, and failure behavior. A retry remains in the same inherited mode and is not a model upgrade.

Inherited-mode independent review may require a distinct non-implementing subagent and `fork_turns: none` when exposed. A no-write or read-only instruction is an instruction-level boundary unless the host separately exposes verifiable enforcement; never call it a host-enforced sandbox or isolation guarantee without that evidence.

### 6. Generate, Confirm, And Apply The Issue Patch

Read [assets/issue-patch.md](assets/issue-patch.md).

For pasted-only input, display the proposed artifacts and ask the user to persist the unchanged Task Contract. Re-read the persisted source before generating a target-specific patch.

For a persisted target:

1. Build complete replacement blocks whose planning status is `confirmed` after application.
2. Display one exact patch that changes only the marked Blueprint and Dispatch blocks.
3. State that Task Contract and `Curation status` remain byte-for-byte unchanged.
4. Ask the user to confirm that exact patch and withhold the Goal Prompt.

Treat confirmation as patch-specific. Any revision requires a complete regenerated patch and new confirmation.

After confirmation, re-read the target, verify the Task Contract is unchanged, apply only the two blocks, re-read again, and compare them exactly. On any failure, return `PATCH_NOT_APPLIED` or `PATCH_VERIFICATION_FAILED` and withhold the Goal Prompt.

### 7. Generate The Final Goal Prompt

Read [assets/codex-loop-goal.txt](assets/codex-loop-goal.txt) only after successful patch verification.

Reinspect the exposed spawn contract at Goal preflight without a probe when its schema is conclusive. Require the runtime classification to remain compatible with the confirmed execution mode. Material capability drift, contradictory evidence, or newly available selection in an inherited-mode plan requires renewed user confirmation and a new or revised `power-loop` plan.

In strict mode, check required selector and custom-agent availability when the host exposes it. If a required profile is known missing, stop for installation or explicit approval of a named alternative. In inherited mode, confirm generic delegation remains available and do not add unsupported selector arguments.

Fill the Goal Prompt by reference to the persisted contract and confirmed sections. Preserve baseline drift checks, delegated implementation, exact task ownership, mode-specific failure handling, dynamic verifier handoff, review-plan selection after the final diff, snapshot freshness, safe validation replay, PR/MR evidence, a mode-accurate Dispatch Summary, loop decisions, and manual execution. Include only guarantees supported by the confirmed mode. Do not copy the full contract or plans into the Goal Prompt.

Use [assets/pr-evidence-template.md](assets/pr-evidence-template.md) for the implementation evidence package. Never merge.

## Output

Before execution-mode confirmation, output only the capability result, evidence, recommendation, uncertainty, and confirmation request. After mode confirmation but before patch confirmation, output the contract source, confirmed mode, capability evidence, readiness/risk decision, proposed Blueprint, proposed mode-specific Dispatch Plan, complete confirmed-state Issue Patch, confirmation request, and `Goal Prompt: withheld until this exact patch is applied and verified.`

After application, output the verification result, persisted reference, ready-to-run Goal Prompt, and an explicit instruction for the user to start it manually.

For a blocked contract, output only the decision, blockers, and smallest useful next action.
