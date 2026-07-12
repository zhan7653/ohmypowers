# Loop Engineering Tutorial

This tutorial exercises the full `ohmypowers` flow on a small linear-regression optimizer:

```text
power-grill
-> confirmed requirements issue/local brief
-> confirmed delivery lane and split decision
-> LIGHT direct execution, or optional STANDARD/HIGH Blueprint confirmation
-> user asks the model to execute the confirmed Issue
-> runtime Final Review Record after V2/V3
-> snapshot-bound validation replay plus independent contract-conformance and code review
-> PR evidence and human review
-> power-curator compares verified and final Git trees
-> confirmed lifecycle update or route-back
```

The example is intentionally small and uses the LIGHT direct-execution path. A persisted Blueprint is reserved for work that benefits from plan review or handoff.

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

Do not require the user to select exact files, function signatures, internal control flow, test seams, validation commands, task ownership, or reviewer models. Repository details are derived during direct execution or optional Blueprint generation; reviewer capability is inspected only after the final tree is frozen. An exact reviewer model, profile, provider, reasoning, sandbox, or isolation requirement remains binding.

## Step 2: Persist The Task Contract

A confirmed issue or local brief should resemble:

```markdown
# Task Contract

## Problem and observable outcome

- Current problem: the repository needs a concrete low-risk task that demonstrates Loop Engineering end to end.
- Required outcome: users can run a deterministic batch-gradient-descent example and observe convergence or a clear non-success result for unsafe learning rates.

## Delivery lane and split decision

- Delivery lane: `LIGHT`
- Split assessment and boundaries: `not needed; one bounded reversible example and its tests`
- Required safety guarantees: unsafe learning rates must not claim success
- Stronger guarantees out of scope: no persistence, permission, migration, concurrency, audit, rollback, or recovery guarantees

## Scope and non-goals

In scope:

- Add a small self-contained Python example.
- Generate fixed-seed data from `y = 3x + 2 + noise`.
- Train `w` and `b` with batch gradient descent.
- Return initial/final loss, learned parameters, iteration count, and status.
- Add usage documentation and deterministic tests.

Out of scope:

- No external datasets.
- No notebooks.
- No scikit-learn, PyTorch, TensorFlow, or general ML package.

## External constraints and dependencies

- Dependencies/blockers: None known.
- Public API/data/config/compatibility/security/permission/migration decisions: None expected.
- Other constraints or repository context: no runtime network access; avoid non-standard dependencies; keep the change minimal and reviewable.

## Risks and assumptions

- Poor learning-rate or data-scale choices could make tests flaky.
- Assume Python is available in the implementation environment.

## Acceptance and validation

| AC | Observable acceptance | Required validation/evidence |
|---|---|---|
| AC-1 | Default training reduces loss by at least 95%. | Deterministic automated test. |
| AC-2 | Learned `w` and `b` are within `0.2` of `3.0` and `2.0`. | Parameter assertions. |
| AC-3 | Repeated fixed-seed runs match within tolerance. | Reproducibility test. |
| AC-4 | Unsafe learning rate reports divergence/non-convergence and never success. | Negative-path test. |
| AC-5 | Documentation explains how to run the example and tests. | Documentation review. |

Completion condition: `Every applicable AC has implementation and validation evidence.`

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

Task Contract digest: `None`

Delivery lane: `LIGHT`

Execution entry: `LIGHT may execute directly from this Issue after readiness checks. STANDARD/HIGH require a confirmed Blueprint unless the user explicitly chooses direct execution.`
<!-- power-loop:execution-blueprint:end -->

# Curation status

State: open
```

The issue or local brief must exist before repository-aware planning and direct execution. Its exact full persisted body digest is the authoritative container identity, while the Task Contract byte range is the sole normative contract. Record host revision metadata as provenance. The Task Contract identity is the SHA-256 of exact bytes from document start to the byte before `<!-- power-loop:execution-blueprint:start -->`. Embedded planning references, separate planning artifacts, comments, and lifecycle text do not add requirements.

## Step 3: Check The Execution Path

```text
Use $power-loop on <issue-url-or-local-brief>.
```

For this `LIGHT` example, `power-loop` should:

1. Verify that the Task Contract is `LOOP_READY` and the recorded `LIGHT` lane is credible.
2. Select direct execution without creating a persisted Blueprint or Issue Patch.
3. Tell the user that the Issue is ready and repository details will be derived at execution time.

Use a persisted Blueprint only for `STANDARD`, `HIGH`, explicit plan review, or cross-session handoff. In that path, confirm the complete compact Blueprint and its exact Issue reference patch once.

Reviewer routing is deliberately absent from pre-implementation planning. Keep exploration, implementation, tests, integration, validation, and repair on the main agent. After V2/V3 and the final diff exist, create one Final Review Record.

## Step 4: Execute The Confirmed Issue Directly

The user asks the model to execute the confirmed Issue URL or local brief. The implementing model should:

1. Re-read the complete confirmed issue/local brief and treat only its Task Contract byte range as normative.
2. Inspect the repository and state a short implementation plan; verify a referenced Blueprint only when one exists.
3. Create or enter the task branch/worktree when required.
4. Execute implementation, tests, integration, and validation in the main agent.
5. Run V0 focused checks and V1 integration checks.
6. For high-risk work, run one main-agent failure-matrix self-review and at most one concentrated repair.
7. Freeze a certification candidate and run V2, then V3 once when applicable.
8. Inspect runtime reviewer capability and create one Final Review Record.
9. Launch contract-conformance, code, and independently justified risk reviewers concurrently over the same tree and evidence package.
10. Run the verifier and prepare compact PR/MR evidence that references the Final Review Record.

Pause only when an exact Task Contract reviewer/model/profile/provider/reasoning/sandbox/isolation requirement cannot be satisfied.

## Step 5: Review Evidence

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

Reviewer assignments, results, routing provenance, and `wait_agent` metrics exist only in the Final Review Record. PR and verifier evidence reference that record rather than copying it.

## Step 6: Reconcile The Final Tree

Before lifecycle closure, run `power-curator` against the verifier snapshot and the final PR or merge snapshot.

- The comparison uses Git tree digest, not commit identity. Different commits with the same tree are `tree-equivalent` and may reuse the verifier evidence.
- A changed tree invalidates the old PASS for the final tree. Inventory changed paths, behavior impact, validations, and uncovered content, then classify exactly one of `reverified`, `human-waived`, `contract-changing`, or `unresolved`.
- A human waiver records the verified snapshot, final snapshot, diff summary, validations run, uncovered content, reason, scope, confirmer, confirmation time, and residual risk. State explicitly that the old PASS covers only the verified snapshot and the final tree is human-waived, not verifier PASS.
- Changes to the Task Contract, acceptance criteria, public behavior, security, permissions, or migration decisions are `contract-changing` and return to `power-grill`; use `power-loop` only when the revised work needs a persisted Blueprint.

Persist only `open`, `in-progress`, `pr-ready`, `merged`, `done`, `superseded`, or `follow-up-needed`. `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, `NEEDS_HUMAN`, and curator classifications are outcomes or assessments, not lifecycle states. Labels remain optional and non-normative. Any Curation status or hosted mutation still requires the user to confirm the exact proposed change.

## Expected Failure Handling

- Missing requirement-level behavior or acceptance criteria -> `NEEDS_GRILL`.
- Missing exact files or commands that repository inspection can safely discover -> derive them; do not grill again solely for that reason.
- Unresolved public API, schema, security, permission, migration, compatibility, or business decision -> `NEEDS_GRILL` or `NEEDS_HUMAN`.
- Required STANDARD/HIGH Blueprint or reference patch not confirmed -> Issue is not ready for that planned execution path.
- Exact reviewer model, profile, provider, reasoning, sandbox, or isolation constraint unavailable at final review -> pause for a human decision; do not substitute a weaker reviewer.
- Missing either the independent contract-conformance or code-review result -> verifier cannot return `PASS` or `PASS_WITH_NOTES`; add other review capabilities when contract or risk justifies them.
- Material repository drift -> stop for a new `power-loop` pass or confirmed plan revision.
- Final Git tree differs from the verifier tree without fresh verification or a complete confirmed waiver -> closure remains `unresolved`; never apply the stale PASS to the final tree.
- Post-verifier change affects requirements, acceptance criteria, public behavior, security, permissions, or migration -> route back to `power-grill`, then use `power-loop` only when a persisted Blueprint is needed.

## Minimal User Script

```text
1. Use $power-grill to draft a requirements-focused Task Contract.
2. Confirm and persist the issue or local brief.
3. Execute a LIGHT Issue directly, or use $power-loop when a persisted STANDARD/HIGH Blueprint is useful.
4. Ask the model to execute the confirmed Issue.
5. After V2/V3, review the single Final Review Record.
6. Review the compact PR/MR evidence and verifier result.
7. Use $power-curator to compare the verified and final Git trees, then confirm the exact lifecycle or waiver record. Do not merge or close until a human is satisfied.
```
