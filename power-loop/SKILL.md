---
name: power-loop
description: Check whether a requirements-ready Issue can execute directly or needs a persisted repository-aware Execution Blueprint. Final reviewer routing is recorded only after the implementation tree is frozen.
---

# Power Loop

## Overview

Use the smallest applicable path:

```text
Task Contract
-> readiness and delivery-lane check
-> LIGHT: direct Issue execution
-> STANDARD/HIGH: repository inspection -> confirmed Execution Blueprint reference
-> main-agent implementation and validation
-> freeze tree and run V2/V3
-> one runtime Final Review Record
-> parallel independent reviewers
-> verifier and compact PR evidence
```

The main agent owns exploration, implementation, tests, integration, validation, documentation, evidence packaging, and repair. Subagents are used only for final independent review of a frozen tree.

## Sources And Boundaries

Use this precedence:

1. Task Contract byte range in the persisted Issue/local body: sole normative contract.
2. Complete persisted Issue/local body: authoritative source identity and lifecycle context.
3. Confirmed Execution Blueprint, when present: non-normative implementation guidance.
4. Runtime Final Review Record: supplementary frozen-tree review evidence.

The persisted Issue is the execution entry point. `LIGHT` work may execute without a persisted Blueprint. `STANDARD` and `HIGH` work require a confirmed Blueprint reference unless the user explicitly chooses a simpler direct-execution path after seeing the tradeoff.

Do not deeply clarify vague requirements, implement during planning, mutate requirements or `Curation status`, plan reviewer routing before the final tree exists, or create/merge/close PRs/MRs.

## Identity

Treat only the Task Contract byte range as normative. Comments, Blueprint, Final Review Record, sessions, PR/MR bodies, runner output, and reviewer conclusions are supplementary evidence.

Use exact bytes without normalization:

- Task Contract digest: SHA-256 from document start to the byte immediately before `<!-- power-loop:execution-blueprint:start -->`.
- Canonical Issue identity: source URL/path, host revision metadata when exposed, and SHA-256 of the complete persisted UTF-8 body. The body digest is authoritative when metadata disagrees.

## Workflow

### 1. Check Readiness And Lane

Read [assets/loop-readiness-checklist.md](assets/loop-readiness-checklist.md).

Return exactly one result:

- `LOOP_READY`: the Task Contract is executable.
- `NEEDS_GRILL`: a requirement-level decision is missing or vague.
- `NEEDS_HUMAN`: authority, permission, contradiction, or irreversible action requires a human decision.

Use the delivery lane already recorded in the Task Contract. Reclassify only when repository facts prove that the recorded lane or split decision is wrong; route that conflict back to the Task Contract.

For a blocked result, return only the result, blockers, and smallest next action.

### 2. Choose The Planning Path

For `LIGHT`, prefer direct execution. At execution start, inspect the repository, state a short in-session plan, and proceed without creating or patching a persisted Blueprint.

Use a persisted Blueprint for `STANDARD`, `HIGH`, an explicit user request for a reviewable implementation plan, or work that needs cross-session/model handoff.

### 3. Generate A Blueprint When Required

Inspect only enough repository context to fill [assets/execution-blueprint.md](assets/execution-blueprint.md). Persist it normally under `.codex/power-loop/<issue-or-task>-execution-blueprint.md` with `Planning status: proposed`.

The Blueprint cannot add requirements. It contains the affected paths, material interfaces/risks, work isolation, validation commands, execution bounds, and staleness conditions. Omit optional material that does not affect the implementation.

Read [assets/issue-patch.md](assets/issue-patch.md), display the complete Blueprint and exact compact reference patch, and ask for one confirmation covering both. After confirmation:

1. re-read the target and require its complete-body and Task Contract digests to match the reviewed version;
2. persist and verify the Blueprint digest;
3. apply only the marked Blueprint reference block;
4. verify the unchanged Task Contract bytes and exact reference block;
5. capture the resulting Issue identity as execution evidence.

A revised Blueprint or patch requires fresh confirmation.

### 4. Execute The Issue

At execution start, the implementing model must:

1. read the complete current persisted Issue and capture its identity;
2. treat only the Task Contract byte range as normative;
3. if a confirmed Blueprint is referenced, verify its Task Contract and artifact digests;
4. inspect the current repository and stop on material contract, plan, source-access, or repository drift;
5. state the shortest useful implementation plan and proceed without adding requirements.

## Runtime Validation

Use this lifecycle:

1. main-agent implementation with `V0 Focused` checks;
2. integrated candidate with `V1 Integration` checks;
3. for `HIGH`, one batched failure-matrix self-review;
4. at most one concentrated repair;
5. freeze the candidate and capture its Git tree digest;
6. run `V2 Final deterministic` and then `V3 External` when applicable;
7. create one runtime Final Review Record and launch reviewers;
8. run `power-verifier` against the unchanged tree;
9. prepare compact PR/MR evidence.

One tree-changing blocker repair may receive one recertification cycle. A second blocking final wave stops for replanning.

## Runtime Final Review

Only after V2/V3 and the final diff are known, inspect the visible `spawn_agent` contract and fill [assets/final-review-record.md](assets/final-review-record.md).

- Record selected model/profile/reasoning/sandbox fields only when independently exposed; otherwise record inherited configuration provenance.
- Always include independent contract-conformance and code-review capabilities.
- Add distinct risk scopes only when justified by the final diff.
- Combine compatible risk scopes and launch with maximum available concurrency. If the two baseline independent reviews cannot fit simultaneously, run the remaining fresh-context review next rather than requiring human intervention.
- Return `NEEDS_HUMAN` only when an exact Task Contract reviewer or configuration requirement is unavailable.

The Final Review Record is the sole location for reviewer assignments, results, and coordination metrics. Use its patient waiting policy; do not copy `wait_agent` telemetry into PR or verifier evidence.

## Final Handoff

Include:

- canonical Issue and Task Contract identity;
- optional confirmed Blueprint source and digest;
- final Git tree digest and V2/V3 results;
- Final Review Record source, digest, and result;
- verifier result;
- compact PR/MR evidence;
- smallest next action for any blocker.
