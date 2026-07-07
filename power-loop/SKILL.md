---
name: power-loop
description: Convert an agent-ready hosted issue, local brief, or pasted task contract into a bounded implementation loop for Codex /goal. Use after power-grill or another clarification step has produced a clear task contract.
---

# Power Loop

## Overview

Convert an agent-ready task contract into a bounded implementation loop for Codex `/goal`.

Loop Engineering in this repository means wrapping a coding task so it is executable, verifiable, stoppable, reviewable, and handoff-ready within explicit boundaries.

`power-loop` is an orchestrator. It does not implement code directly. Its output is a readiness decision and, only when the contract is loop-ready, a ready-to-run bounded `/goal`. It owns bounded `/goal` generation; `power-grill` owns issue contracts.

Recommended flow:

```text
power-grill -> power-loop -> Codex /goal -> power-verifier -> PR evidence -> human review
```

## When To Use

Use this skill when the user has a clear task contract and wants a bounded implementation loop for Codex.

Good inputs:

- A GitHub or GitLab issue URL or issue number.
- A local issue brief created by `power-grill`.
- A pasted task contract with objective, scope, validation, acceptance criteria, stop conditions, and pause conditions.

Do not use this skill to clarify vague requirements. Send vague or incomplete tasks back to `power-grill`.

## Hard Boundaries

You must not:

- deeply clarify vague requirements;
- implement code directly;
- modify production files;
- create branches or worktrees yourself;
- create, approve, merge, or close PRs/MRs;
- approve your own work;
- ignore missing validation;
- ignore high-risk operations;
- generate an implementation `/goal` for incomplete or high-risk contracts.

You may inspect the repository and read hosted issues or local briefs. If a hosted issue cannot be read through `gh`, `glab`, or an available browser/source, ask the user to paste the issue body or provide a local brief.

## Inputs

Prefer inputs in this order:

1. Hosted issue: GitHub or GitLab issue URL or issue number.
2. Local brief: a saved issue contract file.
3. Pasted task contract.

Hosted issue support is provider-agnostic. Use repository context and available tools to choose `gh issue view` or `glab issue view`. If authentication, network, or host detection is unavailable, fall back to a pasted issue body or local brief.

## Phase 1: Read The Contract

Read the task contract before deciding anything. Treat the contract as the canonical source of truth.

If the contract contradicts repository facts, do not silently resolve the contradiction. Output `NEEDS_HUMAN` and list the contradiction.

## Phase 2: Loop Readiness Check

Use [assets/loop-readiness-checklist.md](assets/loop-readiness-checklist.md).

Required fields:

- Objective
- Background or current problem
- Scope
- Non-goals
- Affected files or modules
- Constraints
- Validation plan
- Acceptance criteria
- Stop condition
- Pause-and-ask conditions

Readiness results:

- `LOOP_READY`: the contract is clear enough to generate a bounded `/goal`.
- `NEEDS_GRILL`: the contract is vague, incomplete, or missing required implementation-loop fields.
- `NEEDS_HUMAN`: repository facts, risk, permissions, or business decisions block automatic implementation-loop generation.

If the result is `NEEDS_GRILL` or `NEEDS_HUMAN`, do not generate an implementation `/goal`. Return the result, blockers, and the smallest useful next action.

## Phase 3: Risk Level And Execution Decision

Classify risk:

- `LOW`: docs, tests, small bug fixes, small utility changes, simple styling, low-risk refactors.
- `MEDIUM`: new features, API/data contract changes, multi-module changes, non-core refactors.
- `HIGH`: auth, permissions, security, database migrations, production config, payment, destructive data changes, irreversible operations, or broad architecture changes.

Execution decisions:

- `ALLOW_GOAL`: risk is `LOW` and the contract is `LOOP_READY`.
- `GOAL_WITH_STRICT_GATE`: risk is `MEDIUM` and the contract is `LOOP_READY`.
- `HUMAN_ONLY`: risk is `HIGH` or an unresolved human decision is present.

For `HUMAN_ONLY`, do not generate an implementation `/goal`. Output the human decision checklist instead.

## Phase 4: Work Isolation

Every bounded `/goal` must define work isolation. `power-loop` does not create the branch or worktree itself.

Default policy:

- Use a dedicated branch for ordinary single-agent work.
- Use a dedicated worktree when the current worktree has unrelated changes, multiple agents may run in parallel, the task has medium risk across multiple files, or the user requests stronger isolation.
- Pause if a branch or worktree cannot be created safely.

Naming:

- Branch: `agent/<issue-id>-<short-name>`
- Worktree: `.worktrees/agent-<issue-id>-<short-name>`
- If there is no hosted issue, use a local brief slug instead of `<issue-id>`.
- Never recommend worktree paths outside the repository root.
- If an older issue, local brief, or pasted contract mentions an outside-root worktree path, override that stale path with `.worktrees/agent-<issue-id>-<short-name>` in the generated `/goal`.

Repository-local worktrees keep sibling directories tidy, but they require `.worktrees/` to be ignored by Git. Do not run destructive clean commands such as `git clean -fdx` from the parent worktree unless `.worktrees/` is explicitly excluded or the nested worktrees have already been removed safely.

## Phase 5: Checkpoints, Validation Loop, And Budget

Every bounded `/goal` must include:

- checkpoints;
- validation loop;
- iteration budget;
- verifier gate;
- PR/MR evidence requirements;
- issue linkage, closing intent, and follow-up handling requirements;
- stop conditions;
- pause-and-ask conditions;
- loop decision rules.

Default checkpoints:

1. Inspect the contract and relevant code.
2. Restate the minimal implementation approach.
3. Implement the smallest required change.
4. Run targeted validation.
5. Fix validation failures within budget.
6. Run full required validation.
7. Run the read-only verifier gate.
8. Prepare draft PR/MR evidence, including issue curation handoff.
9. Output a loop decision.

Default budget:

- Max implementation iterations: 5.
- same failure retry limit: 3.
- No-progress stop: 3 consecutive iterations.
- Pause on scope expansion.
- Pause on missing or unreliable validation.
- Pause if forbidden paths become necessary.
- Pause on high-risk operations.

## Phase 6: Verifier Gate

Use [assets/verifier-gate.md](assets/verifier-gate.md).

The verifier gate must be read-only. It checks the implementation diff, validation evidence, acceptance criteria evidence, scope boundaries, non-goals, forbidden paths, disclosed risks, and code-review findings when relevant. `power-loop` defines the verifier gate in the bounded `/goal`; the gate must use `power_verifier`, `power-verifier` in a fresh context, or an equivalent read-only verifier subagent for evidence verification. For code, behavior, test, dependency, or config diffs, it must also use Codex `/review`, `codex review`, or an equivalent read-only code-review subagent as a separate code-review track. These tracks should run in parallel whenever they can inspect the same stable inputs.

Verifier outcomes:

- `PASS`
- `PASS_WITH_NOTES`
- `BLOCKED`
- `NEEDS_HUMAN`

If the verifier returns `BLOCKED` or `NEEDS_HUMAN`, the implementation runner must not claim completion.

If the verifier or code-review pass returns a fixable `BLOCKED` inside the current contract, the implementation runner should repair within the bounded loop budget, rerun validation, and rerun the verifier gate. Use `NEEDS_HUMAN` only when the fix requires scope expansion, a contract change, high-risk work, or repeated failure beyond budget.

## Phase 7: Generate The Bounded /goal

Generate a bounded `/goal` from [assets/codex-loop-goal.txt](assets/codex-loop-goal.txt) only when:

- readiness result is `LOOP_READY`;
- execution decision is `ALLOW_GOAL` or `GOAL_WITH_STRICT_GATE`;
- validation plan is concrete enough to run;
- pause-and-ask conditions are explicit.

Output:

- contract source;
- readiness result;
- risk level;
- execution decision;
- missing fields or blockers, if any;
- bounded `/goal`, only when allowed;
- PR/MR evidence requirements;
- issue linkage, closing intent, and follow-up handling requirements;
- verifier instructions;
- status transition recommendation;
- loop decision rules.

## Status Protocol

Use [assets/status-transitions.md](assets/status-transitions.md) as a recommended protocol, not a hard dependency. If a project cannot create labels, record equivalent status in the issue discussion, PR/MR body, or PR/MR comments.

## Sample Contracts

Use [assets/sample-contracts.md](assets/sample-contracts.md) for manual dry-runs of:

- `LOOP_READY`
- `NEEDS_GRILL`
- `NEEDS_HUMAN`
