# Loop Engineering Tutorial

This tutorial exercises the full `ohmypowers` flow on a small linear-regression optimizer:

```text
power-grill
-> confirmed requirements issue/local brief
-> confirmed delivery lane and split decision
-> power-loop repository inspection
-> separate Execution Blueprint artifact
-> confirmed compact Blueprint-reference patch
-> ready-to-run Goal Prompt
-> user manually runs /goal
-> runtime Final Review Plan after V2/V3
-> snapshot-bound validation replay plus independent contract-conformance and code review
-> PR evidence and human review
-> power-curator compares verified and final Git trees
-> confirmed lifecycle update or route-back
```

The example is intentionally small. The important part is the contract, Blueprint confirmation, main-agent implementation, validation, and frozen-tree review sequence.

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

Do not require the user to select exact files, function signatures, internal control flow, test seams, validation commands, task ownership, or reviewer models. `power-loop` derives repository details during Blueprint generation and inspects reviewer capability only after the final tree is frozen. An exact reviewer model, profile, provider, reasoning, sandbox, or isolation requirement remains a binding contract constraint.

## Step 2: Persist The Task Contract

A confirmed issue or local brief should resemble:

```markdown
# Task Contract

## Problem

The repository needs a concrete low-risk task that demonstrates Loop Engineering end to end.

## Goal

Add a minimal batch-gradient-descent linear-regression optimizer that trains on deterministic synthetic data and exposes enough metrics to prove convergence or non-convergence.

## Delivery lane and split decision

- Delivery lane: `LIGHT`
- Split assessment: `not needed`
- Delivery boundaries: one bounded, reversible example and its deterministic tests
- Required safety guarantees: unsafe learning rates must not claim success
- Stronger guarantees out of scope: no persistence, permission, migration, concurrency, audit, rollback, or recovery guarantees

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

Artifact: `None`

Artifact digest: `None`

Delivery lane: `LIGHT`
<!-- power-loop:execution-blueprint:end -->

# Curation status

State: open
```

The issue or local brief must exist before final Goal generation. Its exact full persisted body digest is the authoritative container identity, while the Task Contract byte range is the sole normative contract. Record host revision metadata as provenance. The Task Contract identity is the SHA-256 of exact bytes from document start to the byte before `<!-- power-loop:execution-blueprint:start -->`. Embedded planning references, separate planning artifacts, comments, and lifecycle text do not add requirements.

## Step 3: Run power-loop

```text
Use $power-loop on <issue-url-or-local-brief>.
```

`power-loop` should:

1. Run readiness, delivery-lane, split, and residual-risk gating; for this example, confirm `LIGHT`, no split needed, `LOOP_READY`, risk `LOW`, and `ALLOW_GOAL`.
2. Inspect the repository and record its source branch and commit.
3. Derive exact affected files, internal interfaces, error handling, test seams, validation commands, and implementation order in a separately persisted, non-normative Execution Blueprint.
4. Display a short decision summary and exact compact Blueprint-reference patch.
5. Withhold the Goal Prompt and ask for confirmation of the decision summary and exact patch.

Reviewer routing is deliberately absent from pre-implementation planning. Keep exploration, implementation, tests, integration, validation, and repair on the main agent. After V2/V3 and the final diff exist, inspect runtime reviewer capability and create one Final Review Plan.

## Step 4: Review And Confirm The Planning References

Check that:

- the Task Contract is unchanged;
- the delivery lane, split decision, required safety guarantees, and stronger guarantees out of scope are visible in the short decision summary;
- the separate Blueprint has an exact digest and explicitly says it is non-normative;
- the Blueprint reflects the actual repository;
- every write task has exact non-overlapping ownership;
- dependencies and integration order are credible;
- reviewer capability and routing are not precomputed in the Blueprint or Issue;
- validation is layered into V0 focused, V1 integration, V2 final deterministic, and V3 external checks;
- high-risk work has a complete failure matrix before implementation, one batched adversarial review, at most one concentrated repair, and at most three candidate snapshots;
- V2, V3, and final reviewers use one frozen tree; V3 runs once after V2 and the final reviewers inspect that unchanged evidence package without replaying V3 by default.

If anything is wrong, request a revision. The revised patch requires fresh confirmation.

After confirmation, `power-loop` verifies the Blueprint, applies only its compact marked reference block, re-reads the issue/local brief, verifies the Task Contract byte boundary, and only then computes the authoritative full-body SHA-256 and generates the final Goal Prompt.

## Step 5: Manually Run The Goal Prompt

The user starts the returned prompt manually. The orchestrator should:

1. Re-read the confirmed issue/local brief and require its authoritative full-body SHA-256 to match the Goal pin. Host revision drift with identical bytes is provenance; a digest mismatch stops execution.
2. Check for material drift from the recorded branch and commit.
3. Create or enter the one task-level branch/worktree.
4. Execute implementation, tests, integration, and validation in the main agent.
5. Run V0 focused checks and V1 integration checks.
6. For high-risk work, run one main-agent failure-matrix self-review and at most one concentrated repair.
7. Freeze a certification candidate and run V2, then V3 once when applicable.
8. Inspect the runtime spawn contract and create a Final Review Plan. Use selected reviewer fields only when independently exposed; otherwise record inherited configuration provenance.
9. Launch contract-conformance, code, and independently justified risk reviewers concurrently over the same tree and evidence package.
10. Run the verifier and prepare compact PR/MR evidence.

Pause only when an exact Task Contract reviewer/model/profile/provider/reasoning/sandbox/isolation requirement cannot be satisfied.

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

Final review evidence records only reviewer count, `wait_agent` calls, maximum consecutive no-information timeouts, cumulative wait duration, routing provenance, reviewer results, and the frozen tree.

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
- Patch not confirmed, rejected, changed, or not applied -> no Goal Prompt.
- Exact reviewer model, profile, provider, reasoning, sandbox, or isolation constraint unavailable at final review -> pause for a human decision; do not substitute a weaker reviewer.
- Missing either the independent contract-conformance or code-review result -> verifier cannot return `PASS` or `PASS_WITH_NOTES`; add other review capabilities when contract or risk justifies them.
- Material repository drift -> stop for a new `power-loop` pass or confirmed plan revision.
- Final Git tree differs from the verifier tree without fresh verification or a complete confirmed waiver -> closure remains `unresolved`; never apply the stale PASS to the final tree.
- Post-verifier change affects requirements, acceptance criteria, public behavior, security, permissions, or migration -> route back to `power-grill` and `power-loop`.

## Minimal User Script

```text
1. Use $power-grill to draft a requirements-focused Task Contract.
2. Confirm and persist the issue or local brief.
3. Use $power-loop on that persisted source.
4. Review the Blueprint, decision summary, and exact compact reference patch.
5. Confirm the decision summary and exact compact patch.
6. Receive and manually start the ready-to-run Goal Prompt.
7. After V2/V3, review the runtime Final Review Plan and snapshot-bound reviewer results.
8. Review the compact PR/MR evidence and verifier result.
9. Use $power-curator to compare the verified and final Git trees, then confirm the exact lifecycle or waiver record. Do not merge or close until a human is satisfied.
```
