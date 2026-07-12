# Loop Engineering Tutorial

This tutorial exercises the full `ohmypowers` flow on a small linear-regression optimizer:

```text
power-grill
-> confirmed requirements issue/local brief
-> capability preflight and confirmed execution mode
-> power-loop repository inspection
-> Execution Blueprint
-> Agent Dispatch Plan
-> confirmed Issue Patch
-> ready-to-run Goal Prompt
-> user manually runs /goal
-> snapshot-bound validation replay and independent contract-conformance review
-> PR evidence and human review
-> power-curator compares verified and final Git trees
-> confirmed lifecycle update or route-back
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

Do not require the user to select exact files, function signatures, internal control flow, test seams, validation commands, task ownership, or models. `power-loop` derives repository details after capability preflight and execution-mode confirmation. An exact model, profile, provider, reasoning, sandbox, or isolation requirement is still a binding contract constraint.

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

This repository favors minimal, reviewable changes.

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

The issue or local brief must exist before final Goal generation because its complete persisted body is the sole normative contract. Record host revision metadata as provenance and use SHA-256 of the exact full persisted UTF-8 body, without normalization, as the authoritative identity. The Task Contract identity is the SHA-256 of exact bytes from document start to the byte before `<!-- power-loop:execution-blueprint:start -->`.

## Step 3: Run power-loop

```text
Use $power-loop on <issue-url-or-local-brief>.
```

`power-loop` should:

1. Inspect the visible subagent-spawn schema or equivalent host contract. Do not launch a probe agent when that evidence is conclusive.
2. Report the classification, evidence inspected, relevant uncertainty, and recommended mode:
   - `strict-selection-supported` recommends `strict-model-routing` when a supported model or custom-profile selector is demonstrably available;
   - `inherited-model-only` recommends `inherited-model-routing` when no supported model, reasoning, or custom-profile selector is exposed;
   - `indeterminate` asks the user for more evidence instead of guessing.
3. Ask the user to confirm the execution mode. Do not run readiness/risk gating or generate a mode-specific Agent Dispatch Plan or final Goal Prompt before confirmation.
4. Run readiness and risk gating; for this example, return `LOOP_READY`, risk `LOW`, and `ALLOW_GOAL`.
5. Inspect the repository and record its source branch and commit.
6. Derive exact affected files, internal interfaces, error handling, test seams, validation commands, instruction boundaries, and integration order in the Execution Blueprint.
7. Split independently useful work into the separate Agent Dispatch Plan template for the confirmed mode.
8. Display an exact Issue Patch whose replacement blocks say `Planning status: confirmed`.
9. Withhold the Goal Prompt and ask for confirmation of the exact patch.

The supported model-or-profile selector establishes the strict recommendation; it does not prove reasoning, profile, model, or sandbox selection that the evidence did not show. Record those capabilities independently. Preserve the full Luna/Sol/Terra profile routing only when the selectors it requires are demonstrably supported, and pause if a required strict configuration is unavailable.

Under `strict-model-routing`, a plausible routing is:

- Luna Max for the README update and any optimizer/test task classified as simple through lower-medium.
- Sol Medium initially for any implementation task already slightly complex or above, and as the only direct replacement for an underestimated Luna task.
- Terra High only for an explicitly simple review, Sol Medium for ordinary review, and Sol High for the most complex or high-risk review.
- An implementation-independent contract-conformance capability, plus any code, security, compatibility, migration, test, or domain capability justified by the final diff and risks. Reviewer capabilities are dynamic, and contract-prescribed reviewers are honored exactly.

Under `inherited-model-routing`, subagents inherit the parent configuration. The plan still specifies independent roles, objectives, allowed write paths, dependencies, deliverables, validation responsibilities, parallelization constraints, and fresh-context reviews, but it does not select or guarantee a subagent model, reasoning effort, custom profile, reviewer tier, sandbox, model escalation, or model-cost outcome. An instruction such as “do not write files” is a behavioral boundary, not host-enforced read-only isolation.

Do not combine independently useful tasks merely to reduce agent count. Do not run write tasks concurrently when they own overlapping paths or unstable interfaces.

## Step 4: Review And Confirm The Issue Patch

Check that:

- the Task Contract is unchanged;
- the capability classification, inspected evidence, recommended mode, and confirmed mode are recorded consistently;
- the Blueprint reflects the actual repository;
- every write task has exact non-overlapping ownership;
- dependencies and integration order are credible;
- in `strict-model-routing`, each model, profile, reasoning, and sandbox field is backed by its corresponding selector evidence; when all required selectors are supported, implementation follows the full Luna/Sol policy, replacement is bounded, and the reviewer profile policy is preserved;
- in `inherited-model-routing`, the plan contains none of the unsupported model, reasoning, profile, sandbox, escalation, cost, reviewer-tier, or assignment-accuracy fields or claims;
- independent review capabilities are selected from the contract and implementation risks; fresh context is required where independence matters, while read-only isolation is claimed only if the host separately exposes and verifies it;
- the main agent remains the orchestrator rather than the normal implementation worker.

If anything is wrong, request a revision. The revised patch requires fresh confirmation.

After confirmation, `power-loop` applies only the two marked blocks, re-reads the issue/local brief, verifies the exact content and Task Contract byte boundary, and only then computes the authoritative full-body SHA-256 and generates the final Goal Prompt.

## Step 5: Manually Run The Goal Prompt

The user starts the returned prompt manually. The orchestrator should:

1. Re-read the confirmed issue/local brief and require its authoritative full-body SHA-256 to match the Goal pin. Host revision drift with identical bytes is provenance; a digest mismatch stops execution.
2. Reinspect the spawn contract without a probe when its schema is conclusive, and verify that it still supports the confirmed execution mode.
3. Check for material drift from the recorded branch and commit.
4. In strict mode, verify each required selector and configuration independently. In inherited mode, verify generic delegation remains available and do not add per-agent configuration claims.
5. Create or enter the one task-level branch/worktree.
6. Dispatch tasks according to dependency waves and ownership.
7. Run targeted and full validation.
8. Capture repository/ref, commit, Git tree digest, dirty/generated boundary, and capture time; replay safe contract-required validation and run selected independent reviews over that snapshot. Give the contract-conformance reviewer the complete Issue/local contract and identity, with the thin Goal, session, PR text, and runner summaries only as supplementary evidence. Record only model, reasoning, profile, or isolation evidence that the host actually exposes.
9. Repair fixable blockers within budget.
10. Prepare draft PR/MR evidence.
11. Produce the mode-accurate Dispatch Summary and loop decision.

If runtime capability evidence has materially changed, pause for renewed mode confirmation and replanning. Also pause when the confirmed mode cannot satisfy an exact model, profile, provider, reasoning, sandbox, or isolation requirement; do not silently weaken the contract.

## Step 6: Review Evidence

The PR/MR evidence should map every acceptance criterion:

```markdown
| AC | Evidence | Validation | Files | Status |
|---|---|---|---|---|
| AC-1 | Loss fell by more than 95%. | `<exact command>` | `<test file>` | Pass |
| AC-2 | Learned parameters are within tolerance. | `<exact command>` | `<test file>` | Pass |
| AC-3 | Fixed-seed runs match. | `<exact command>` | `<test file>` | Pass |
| AC-4 | Unsafe rate reports non-success. | `<exact command>` | `<implementation/test files>` | Pass |
| AC-5 | Usage and evidence are documented. | Contract-prescribed or risk-justified independent review | `<README path>` | Pass |
```

The Dispatch Summary should record:

- the confirmed execution mode and capability evidence;
- planned and actual tasks;
- parallel/sequential execution waves;
- ownership conflicts;
- incomplete tasks and pause reasons.

In `strict-model-routing`, also record supported initial/final model assignments, bounded escalation, reviewer configuration, and Initial Assignment Accuracy. In `inherited-model-routing`, omit those strict-only metrics and do not describe the inherited parent configuration as a selected subagent assignment.

## Step 7: Reconcile The Final Tree

Before lifecycle closure, run `power-curator` against the verifier snapshot and the final PR or merge snapshot.

- The comparison uses Git tree digest, not commit identity. Different commits with the same tree are `tree-equivalent` and may reuse the verifier evidence.
- A changed tree invalidates the old PASS for the final tree. Inventory changed paths, behavior impact, validations, and uncovered content, then classify exactly one of `reverified`, `human-waived`, `contract-changing`, or `unresolved`.
- A human waiver records the verified snapshot, final snapshot, diff summary, validations run, uncovered content, reason, scope, confirmer, confirmation time, and residual risk. State explicitly that the old PASS covers only the verified snapshot and the final tree is human-waived, not verifier PASS.
- Changes to the Task Contract, acceptance criteria, public behavior, security, permissions, or migration decisions are `contract-changing` and return to `power-grill` and `power-loop`; curator does not waive them into completion.

Persist only `open`, `in-progress`, `pr-ready`, `merged`, `done`, `superseded`, or `follow-up-needed`. `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, `NEEDS_HUMAN`, and curator classifications are outcomes or assessments, not lifecycle states. Labels remain optional and non-normative. Any Curation status or hosted mutation still requires the user to confirm the exact proposed change.

## Expected Failure Handling

- Missing requirement-level behavior or acceptance criteria -> `NEEDS_GRILL`.
- Missing exact files or commands that repository inspection can safely discover -> derive them; do not grill again solely for that reason.
- Unresolved public API, schema, security, permission, migration, compatibility, or business decision -> `NEEDS_GRILL` or `NEEDS_HUMAN`.
- Conclusive schema lacks model/profile selectors -> recommend `inherited-model-routing`; do not spawn a model-specific probe.
- Incomplete or contradictory capability evidence -> classify `indeterminate` and ask; do not choose a mode silently.
- Execution mode not explicitly confirmed -> no mode-specific Dispatch Plan or Goal Prompt.
- Patch not confirmed, rejected, changed, or not applied -> no Goal Prompt.
- Strict selector/configuration missing at planning or runtime -> pause for a human decision; no silent inherited fallback.
- Exact model, profile, provider, reasoning, sandbox, or isolation constraint unavailable in inherited mode -> pause for a human decision.
- Strict-mode permission, environment, dependency, validation-infrastructure, or interface-conflict failure -> no model escalation.
- Strict-mode evidence-backed Luna capability mismatch -> at most one direct replacement by Sol Medium.
- Missing the implementation-independent contract-conformance review -> verifier cannot return `PASS` or `PASS_WITH_NOTES`; additional review capabilities are required only when contract or risk justifies them.
- Material repository drift -> stop for a new `power-loop` pass or confirmed plan revision.
- Final Git tree differs from the verifier tree without fresh verification or a complete confirmed waiver -> closure remains `unresolved`; never apply the stale PASS to the final tree.
- Post-verifier change affects requirements, acceptance criteria, public behavior, security, permissions, or migration -> route back to `power-grill` and `power-loop`.

## Minimal User Script

```text
1. Use $power-grill to draft a requirements-focused Task Contract.
2. Confirm and persist the issue or local brief.
3. Use $power-loop on that persisted source.
4. Review the capability evidence and confirm `strict-model-routing` or `inherited-model-routing`.
5. Review the Blueprint, mode-specific Dispatch Plan, and exact Issue Patch.
6. Confirm the exact patch.
7. Receive the ready-to-run Goal Prompt.
8. Manually start the Goal Prompt.
9. Review the snapshot-bound contract-conformance result and any additional capability-specific review results.
10. Review the draft PR/MR and mode-accurate Dispatch Summary.
11. Use $power-curator to compare the verified and final Git trees, then confirm the exact lifecycle or waiver record. Do not merge or close until a human is satisfied.
```
