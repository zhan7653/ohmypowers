---
name: power-loop
description: Convert a requirements-ready hosted issue, local brief, or pasted Task Contract into a repository-aware Execution Blueprint and a compact confirmable reference patch so the confirmed Issue can be executed directly. Final reviewer routing is planned at runtime after the implementation tree is frozen.
---

# Power Loop

## Overview

Use this order:

```text
Task Contract
-> readiness, delivery-lane, and split gates
-> repository inspection
-> separate Execution Blueprint artifact
-> compact exact Issue reference patch
-> explicit user confirmation
-> apply and verify the patch
-> user asks the model to execute the confirmed Issue
-> main-agent implementation and validation
-> freeze final tree and run V2/V3
-> runtime Final Review Plan
-> parallel independent reviewers
-> verifier and compact PR evidence
```

The main agent owns exploration, implementation, tests, integration, validation, documentation, evidence packaging, and repair. Subagents are used only for final independent review of a frozen tree.

## Sources And Boundaries

Use this precedence:

1. Task Contract byte range in the persisted Issue/local body: sole normative contract.
2. Complete persisted Issue/local body: authoritative source identity and lifecycle context.
3. Execution Blueprint: confirmed, non-normative implementation guidance.
4. Runtime Final Review Plan: supplementary frozen-tree review evidence.

The confirmed persisted Issue is the execution entry point. Its compact Blueprint reference pins the Task Contract and Blueprint digests needed for preflight; no separate launcher prompt is generated.

Do not:

- deeply clarify vague requirements;
- implement during planning;
- mutate requirements or `Curation status`;
- generate or confirm reviewer routing before the final tree exists;
- update a hosted issue or local brief before exact patch confirmation;
- create, approve, merge, or close PRs/MRs.

## Inputs And Identity

Prefer a hosted issue, then a persisted local brief, then a pasted Task Contract. Persist pasted-only contracts before producing a target-specific patch or declaring the work ready for direct execution.

Treat only the Task Contract byte range as normative. Comments, the Blueprint, runtime review plan, execution session summaries, PR/MR bodies, runner output, and reviewer conclusions are supplementary evidence.

Use exact bytes without normalization:

- Task Contract digest: SHA-256 from document start to the byte immediately before `<!-- power-loop:execution-blueprint:start -->`.
- Canonical Issue identity: source URL/path, host revision metadata when exposed, and SHA-256 of the complete persisted UTF-8 body. The body digest is authoritative when metadata disagrees.

Capture the Task Contract digest before generating a patch, recheck it immediately before application, and prove it is unchanged afterward. Compute the final complete-body digest only after the confirmed compact Blueprint reference is applied.

## Workflow

### 1. Gate Readiness And Risk

Read [assets/loop-readiness-checklist.md](assets/loop-readiness-checklist.md).

Return exactly one readiness result:

- `LOOP_READY`: requirement decisions are sufficient for repository-aware planning.
- `NEEDS_GRILL`: observable behavior, scope, acceptance criteria, validation expectations, stop condition, pause condition, split decision, or safety guarantee is missing or vague.
- `NEEDS_HUMAN`: permissions, irreversible action, contradictory repository facts, or a material human decision blocks planning.

Use exactly one delivery lane:

- `LIGHT`: one bounded, reversible behavior without persistent global state, permission, migration, concurrency, destructive, or material compatibility boundaries.
- `STANDARD`: multi-module or compatibility-sensitive work whose risks remain local and reversible.
- `HIGH`: persistent configuration, authentication/authorization, sensitive data, migration, concurrency, destructive/irreversible behavior, or another security-critical boundary.

Return `NEEDS_GRILL` when an independently valuable `LIGHT` or `STANDARD` outcome is bundled with a separable `HIGH`-risk boundary without an explicit split or bundling decision. Also return `NEEDS_GRILL` when “safe”, “atomic”, or “recoverable” would require choosing transaction, concurrency, audit, rollback, or recovery guarantees absent from the Task Contract.

Classify residual risk as `LOW`, `MEDIUM`, or `HIGH` and select:

- `ALLOW_EXECUTION`: `LOW` and `LOOP_READY`.
- `EXECUTION_WITH_STRICT_GATE`: `MEDIUM` or fully specified `HIGH` and `LOOP_READY`.
- `HUMAN_ONLY`: unresolved high-risk decisions, unavailable authority, or unauthorized irreversible action.

For a blocked result, return only the decision, blockers, and smallest next action.

### 2. Inspect The Repository

Inspect only enough context to derive implementation guidance. Record source branch and commit, worktree state, affected paths, internal interfaces, data/control flow, error handling, dependencies, validation commands, branch/worktree policy, runtime bounds, and material-drift conditions.

If inspection exposes a requirement-level decision, stop and route it back to the Task Contract.

### 3. Generate The Execution Blueprint

Read and fill [assets/execution-blueprint.md](assets/execution-blueprint.md) in field order. Persist it separately, normally under `.codex/power-loop/<issue-or-task>-execution-blueprint.md`, with `Planning status: proposed`.

The Blueprint is operational guidance and cannot add acceptance criteria. Plan one task-level implementation branch and at most one repository-local worktree. Do not plan normal writes directly on a protected integration branch.

The Blueprint contains implementation, validation, budget, and staleness guidance only. It does not contain reviewer routing, subagent capability evidence, wait metrics, or a predicted reviewer count.

### 4. Confirm And Apply The Compact Reference Patch

Read [assets/issue-patch.md](assets/issue-patch.md).

For a persisted target:

1. Persist the proposed Blueprint and compute its exact SHA-256.
2. Display the decision summary and exact compact Blueprint-reference patch.
3. Ask the user to confirm the summary and exact patch.
4. Immediately before application, re-read the target and require the authoritative complete-body and Task Contract digests to match.
5. Apply only the marked Blueprint reference block.
6. Re-read the target, verify the exact block, its pinned Task Contract digest, and the unchanged Task Contract bytes, then capture the new canonical complete-body digest and host revision provenance.

Do not place a Final Review Plan or reviewer capability decision in the Issue. A revised patch requires fresh confirmation.

### 5. Hand Off The Confirmed Issue For Direct Execution

After the Blueprint and compact reference patch are confirmed, persisted, applied, and verified, report that the canonical Issue is ready for direct execution. Do not generate a launcher prompt or restate the contract as another execution artifact.

At execution start, the implementing model must:

1. read the complete current persisted Issue and capture its source, host revision provenance, and exact complete-body digest as the execution identity;
2. treat only the Task Contract byte range as normative;
3. recompute the Task Contract digest and require it to match the digest in the confirmed Blueprint reference;
4. load the referenced Blueprint and require its exact digest to match;
5. inspect the current repository baseline and stop on material Task Contract, Blueprint, source-access, or repository drift;
6. follow the confirmed Blueprint without adding requirements.

## Runtime Implementation And Validation

Use this lifecycle:

1. main-agent implementation with `V0 Focused` checks;
2. integrated candidate with `V1 Integration` checks;
3. for `HIGH`, main-agent failure-matrix self-review returning one batched finding set;
4. at most one concentrated repair, then rerun affected V0/V1;
5. freeze a certification candidate and capture its Git tree digest;
6. run `V2 Final deterministic` on that tree;
7. run `V3 External` once after V2 when applicable;
8. generate the runtime Final Review Plan and launch reviewers;
9. run `power-verifier` against the unchanged tree;
10. prepare compact PR evidence.

Normal execution records at most three candidate snapshots: integrated, optional repaired, and final. One unexpected blocking final review may receive one repair/recertification cycle; a second blocking final wave stops for replanning.

## Runtime Final Review

Only after V2/V3 and the final diff are known, inspect the visible `spawn_agent` contract and fill [assets/final-review-plan.md](assets/final-review-plan.md).

- If model/profile/reasoning/sandbox selectors are independently exposed, record and use only supported fields.
- Otherwise use generic fresh-context reviewers and record inherited configuration provenance.
- Do not ask for routing confirmation unless an exact Task Contract reviewer/model/profile/provider/reasoning/sandbox/isolation requirement cannot be satisfied without a human decision.
- Never infer model, reasoning, profile, or host isolation from installed files or inherited values.

Always include independent contract-conformance and code-review capabilities. Add decoupled test, security, compatibility, migration, data, permission, concurrency, or domain reviewers justified by the final diff. Launch the complete wave concurrently over the same frozen tree and evidence package.

Waiting policy:

- finish useful evidence consolidation before the first wait;
- allow at least 180 seconds of reviewer grace when interaction policy permits;
- use 180-second waits or the longest permitted interval;
- continue through two consecutive no-information timeouts while reviewers remain active;
- after the third, inspect status once and interrupt/replan only when no concrete progress is observable;
- allow one consolidated clarification/completion follow-up per reviewer and no status-only messages.

Record only reviewer count, wait call count, maximum consecutive no-information timeouts, and cumulative wait duration.

## Final Handoff

The final handoff includes:

- canonical Issue and Task Contract identity;
- confirmed Blueprint source and digest;
- direct-execution preflight result;
- final Git tree digest;
- V2/V3 results;
- Final Review Plan and reviewer results;
- verifier result;
- compact PR/MR evidence;
- risks, notes, and smallest next action for any blocker.
