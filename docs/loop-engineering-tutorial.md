# Loop Engineering Tutorial

This tutorial exercises the full `ohmypowers` flow on a small linear-regression optimizer:

```text
power-grill
-> confirmed requirements issue/local brief
-> power-loop repository inspection
-> Execution Blueprint
-> Agent Dispatch Plan
-> confirmed Issue Patch
-> ready-to-run Goal Prompt
-> user manually runs /goal
-> snapshot-bound validation replay and independent contract-conformance review
-> PR evidence and human review
```

The example is intentionally small. The important part is the contract, planning, dispatch, confirmation, validation, and review sequence.

## Test Problem

```text
Given deterministic synthetic data generated from y = 3x + 2 + noise,
add a tiny batch-gradient-descent optimizer that learns w and b,
reports convergence metrics, and detects an unsafe learning rate.
```

## Step 1: Use power-grill For Requirements

Start with:

```text
Use $power-grill to prepare a requirements-focused issue contract for a small
Loop Engineering test task.

Add a minimal Python linear-regression optimizer using batch gradient descent.
It should use deterministic synthetic data, prove convergence, and report an
unsafe learning rate without claiming success.
```

Confirm requirement-level boundaries:

- Problem: the repository needs a concrete end-to-end Loop Engineering example.
- Goal: add a deterministic optimizer example with observable convergence and divergence behavior.
- User behavior: users can run the example and its tests locally.
- Scope: implementation, usage documentation, and deterministic tests.
- Non-goals: no notebook, external dataset, ML framework, or production library.
- External contracts: no public service API or migration.
- Constraints: avoid unnecessary runtime dependencies and network access.
- Validation expectations: prove convergence, reproducibility, unsafe-learning-rate handling, and documented usage.
- Stop condition: required behavior exists and every acceptance criterion has evidence.

Do not require the user to select exact files, function signatures, internal control flow, test seams, validation commands, task ownership, or models. `power-loop` derives those details after inspecting the repository.

## Step 2: Persist The Task Contract

A confirmed issue or local brief should resemble:

```markdown
# Task Contract

## Problem

The repository needs a concrete low-risk task that demonstrates Loop Engineering end to end.

## Goal

Add a minimal batch-gradient-descent linear-regression optimizer that trains on deterministic synthetic data and exposes enough metrics to prove convergence or non-convergence.

## User-observable behavior

- Users can run the optimizer locally.
- Users can run deterministic tests.
- Unsafe learning rates report divergence or non-convergence without claiming success.

## Scope

- Add a small self-contained Python example.
- Generate fixed-seed data from `y = 3x + 2 + noise`.
- Train `w` and `b` with batch gradient descent.
- Return initial/final loss, learned parameters, iteration count, and status.
- Add usage documentation and deterministic tests.

## Non-goals

- No external datasets.
- No notebooks.
- No scikit-learn, PyTorch, TensorFlow, or general ML package.

## Dependencies / blockers

- None known.

## Current context

This repository includes small examples and favors minimal, reviewable changes.

## External API / data contracts

None expected.

## Constraints

- No network access at runtime.
- Avoid non-standard dependencies unless repository inspection proves they are already required.

## Risks and assumptions

- Poor learning-rate or data-scale choices could make tests flaky.
- Assume Python is available in the implementation environment.

## Validation expectations

- Prove at least 95% loss reduction with default settings.
- Prove learned parameters are within documented tolerances.
- Prove repeated fixed-seed runs are reproducible.
- Prove an unsafe learning rate does not report success.
- Prove usage documentation is complete.

## Acceptance criteria

- [ ] AC-1: Given fixed-seed data, when default training runs, then final loss is at least 95% lower than initial loss.
- [ ] AC-2: Given default training, when it completes, then learned `w` is within `0.2` of `3.0` and `b` is within `0.2` of `2.0`.
- [ ] AC-3: Given identical seed and settings, when training runs twice, then parameters and final loss match within documented floating-point tolerance.
- [ ] AC-4: Given an unsafe learning rate, when training runs, then it reports divergence or non-convergence without claiming success.
- [ ] AC-5: Given the usage documentation, when reviewed, then it explains how to run the optimizer, tests, and evidence.

## Stop condition

All acceptance criteria have concrete implementation and validation evidence.

## Pause-and-ask conditions

- A non-standard dependency becomes necessary.
- Deterministic tests cannot be made stable with reasonable thresholds.
- The requested behavior requires a broader framework or public contract.

## Change history

- YYYY-MM-DD: Initial task contract created.

<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `not-generated`
<!-- power-loop:execution-blueprint:end -->

<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `not-generated`
<!-- power-loop:agent-dispatch-plan:end -->

# Curation status

State: open
```

The issue or local brief must exist before final Goal generation because it is the canonical home for the confirmed execution sections.

## Step 3: Run power-loop

```text
Use $power-loop on <issue-url-or-local-brief>.
```

`power-loop` should:

1. Return `LOOP_READY`, risk `LOW`, and `ALLOW_GOAL`.
2. Inspect the repository and record its source branch and commit.
3. Derive exact affected files, internal interfaces, error handling, test seams, validation commands, isolation, and integration order in the Execution Blueprint.
4. Split independently useful work into an Agent Dispatch Plan with explicit ownership and models.
5. Display an exact Issue Patch whose replacement blocks say `Planning status: confirmed`.
6. Withhold the Goal Prompt and ask for confirmation.

A plausible initial routing is:

- Luna Medium for a narrowly specified README update if it is independently writable.
- Terra Medium for the optimizer implementation and deterministic tests.
- Terra High only if repository inspection shows cross-module complexity in advance.
- Sol Medium only as an evidence-backed, one-time implementation escalation ceiling.
- An implementation-independent contract-conformance reviewer, plus any code, security, compatibility, migration, test, or domain capability justified by the final diff and risks. Contract-prescribed reviewers are honored exactly.

Do not combine independently useful tasks merely to reduce agent count. Do not run write tasks concurrently when they own overlapping paths or unstable interfaces.

## Step 4: Review And Confirm The Issue Patch

Check that:

- the Task Contract is unchanged;
- the Blueprint reflects the actual repository;
- every write task has exact non-overlapping ownership;
- dependencies and integration order are credible;
- each initial model is the lowest capable tier;
- implementation escalation is limited to one transition and capped at Sol Medium;
- code review and evidence verification are separate Sol High tasks;
- the main agent remains the orchestrator rather than the normal implementation worker.

If anything is wrong, request a revision. The revised patch requires fresh confirmation.

After confirmation, `power-loop` applies only the two marked blocks, re-reads the issue/local brief, verifies the exact content, and only then generates the final Goal Prompt.

## Step 5: Manually Run The Goal Prompt

The user starts the returned prompt manually. The orchestrator should:

1. Re-read the confirmed issue/local brief.
2. Check for material drift from the recorded branch and commit.
3. Confirm every named custom agent is available with the expected model, reasoning effort, and sandbox.
4. Create or enter the one task-level branch/worktree.
5. Dispatch tasks according to dependency waves and ownership.
6. Run targeted and full validation.
7. Capture the stable implementation snapshot, replay safe contract-required validation, and run the selected independent reviews over that snapshot. Give the contract-conformance reviewer the complete Issue/local contract, final Goal Prompt, clause evidence, validation replay, provenance, scope, risks, and non-goals; tailor additional reviewers to their capabilities.
8. Repair fixable blockers within budget.
9. Prepare draft PR/MR evidence.
10. Produce the Dispatch Summary and loop decision.

If a required custom agent is missing, do not inherit the parent Sol Ultra model. Pause and report the missing profile or ask for explicit approval of a named alternative.

## Step 6: Review Evidence

The PR/MR evidence should map every acceptance criterion:

```markdown
| AC | Evidence | Validation | Files | Status |
|---|---|---|---|---|
| AC-1 | Loss fell by more than 95%. | `<exact command>` | `<test file>` | Pass |
| AC-2 | Learned parameters are within tolerance. | `<exact command>` | `<test file>` | Pass |
| AC-3 | Fixed-seed runs match. | `<exact command>` | `<test file>` | Pass |
| AC-4 | Unsafe rate reports non-success. | `<exact command>` | `<implementation/test files>` | Pass |
| AC-5 | Usage and evidence are documented. | Sol High review | `<README path>` | Pass |
```

The Dispatch Summary should record:

- planned and actual tasks;
- initial and final model for every implementation task;
- escalation and reason;
- parallel/sequential execution waves;
- ownership conflicts;
- incomplete tasks and pause reasons;
- Initial Assignment Accuracy.

Calculate Initial Assignment Accuracy as tasks completed without escalation divided by completed or attempted implementation tasks that received an initial assignment.

## Expected Failure Handling

- Missing requirement-level behavior or acceptance criteria -> `NEEDS_GRILL`.
- Missing exact files or commands that repository inspection can safely discover -> derive them; do not grill again solely for that reason.
- Unresolved public API, schema, security, permission, migration, compatibility, or business decision -> `NEEDS_GRILL` or `NEEDS_HUMAN`.
- Patch not confirmed, rejected, changed, or not applied -> no Goal Prompt.
- Missing custom agent -> pause; no silent parent-model fallback.
- Permission, environment, dependency, validation-infrastructure, or interface-conflict failure -> no model escalation.
- Evidence-backed capability mismatch -> at most one direct escalation, never above Sol Medium.
- Missing the implementation-independent contract-conformance review -> verifier cannot return `PASS` or `PASS_WITH_NOTES`; additional review capabilities are required only when contract or risk justifies them.
- Material repository drift -> stop for a new `power-loop` pass or confirmed plan revision.

## Minimal User Script

```text
1. Use $power-grill to draft a requirements-focused Task Contract.
2. Confirm and persist the issue or local brief.
3. Use $power-loop on that persisted source.
4. Review the Blueprint, Dispatch Plan, and exact Issue Patch.
5. Confirm the exact patch.
6. Receive the ready-to-run Goal Prompt.
7. Manually start the Goal Prompt.
8. Review the independent contract-conformance result and any additional capability-specific review results.
9. Review the draft PR/MR and Dispatch Summary. Do not merge until a human is satisfied.
```
