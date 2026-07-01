# Loop Engineering Tutorial

This tutorial shows how to use the full `ohmypowers` Loop Engineering flow on a small machine-learning optimization task.

The goal is not to build an advanced ML system. The goal is to exercise the loop:

```text
power-grill -> power-loop -> Codex /goal -> power-verifier -> PR evidence -> human review
```

By the end, there should be a small linear regression optimizer example, validation evidence, a verifier result, and a PR/MR evidence package that shows why the task is complete.

## Test Problem

Use a minimal batch gradient descent linear regression example.

Task:

```text
Given deterministic synthetic data generated from y = 3x + 2 + noise,
implement a tiny optimizer that learns w and b with batch gradient descent.
```

This is a good Loop Engineering test because it has:

- a clear objective;
- measurable convergence;
- deterministic validation through a fixed random seed;
- obvious failure modes such as bad gradients, too-large learning rates, divergence, and weak stopping rules;
- simple evidence that reviewers can understand without ML expertise.

## Desired Final Artifact

Recommended implementation target:

```text
examples/linear-regression-optimizer/
  README.md
  optimizer.py
  test_optimizer.py
```

The example should be intentionally small. Do not introduce notebooks, external datasets, training frameworks, or heavyweight dependencies unless the task contract explicitly allows them.

## Step 1: Use power-grill To Create The Task Contract

Start with this prompt:

```text
Use $power-grill to prepare an issue contract for a small Loop Engineering test task.

Task idea:
Add a minimal Python linear regression optimizer example using batch gradient descent.
It should generate deterministic synthetic data from y = 3x + 2 + noise, train w and b,
detect divergence for an unsafe learning rate, and include tests that prove convergence.

The purpose is to test the full Loop Engineering flow, not to build a production ML library.
Ask me anything unclear before drafting the issue.
```

During grilling, confirm these boundaries:

- Objective: add a small deterministic optimizer example.
- Current problem: the repository needs a concrete task to demonstrate bounded agent loops.
- User-facing behavior: users can run tests and inspect a simple optimizer example.
- Scope: one example directory with README, implementation, and tests.
- Non-goals: no external datasets, no deep learning framework, no notebook, no production ML package.
- Affected modules: new files under `examples/linear-regression-optimizer/`.
- Data/control flow: generate data, initialize parameters, train with batch gradient descent, return metrics.
- Error handling: detect non-finite loss or rising loss for unsafe learning rates and stop with a clear status.
- Validation: deterministic tests with fixed seed.
- Stop condition: tests pass and PR evidence maps every acceptance criterion to commands and files.

## Step 2: Issue Contract Shape

The issue body should contain a contract like this. Adapt paths or commands to the actual repository.

```markdown
# Problem

The repository has the `power-loop` workflow, but it needs a concrete low-risk task that demonstrates bounded Loop Engineering end to end.

# Goal

Add a minimal Python batch gradient descent linear regression optimizer example that trains on deterministic synthetic data and proves convergence through tests.

# Scope

- Add `examples/linear-regression-optimizer/README.md`.
- Add `examples/linear-regression-optimizer/optimizer.py`.
- Add `examples/linear-regression-optimizer/test_optimizer.py`.
- Generate synthetic data from `y = 3x + 2 + noise` with a fixed seed.
- Implement batch gradient descent for `w` and `b`.
- Return training metrics including initial loss, final loss, learned parameters, iteration count, and convergence/divergence status.
- Include tests for convergence, reproducibility, and divergence handling.

# Non-goals

- Do not add external datasets.
- Do not add notebooks.
- Do not add scikit-learn, PyTorch, TensorFlow, or other ML frameworks.
- Do not turn this into a general ML package.
- Do not modify existing skills unless needed for documentation links.

# Dependencies / blockers

- None known.

# Current context

This repository is a skill/documentation repository. It has no root package manager or test suite. The example should be self-contained and runnable with Python standard library when practical.

# Relevant files and modules

- `examples/linear-regression-optimizer/README.md`: explains the example and loop evidence.
- `examples/linear-regression-optimizer/optimizer.py`: implementation.
- `examples/linear-regression-optimizer/test_optimizer.py`: deterministic tests.

# Proposed approach

Use pure Python and the standard library. Keep implementation small and explicit.

# Implementation notes

- Use deterministic pseudo-random data generation with a fixed seed.
- Implement mean squared error.
- Implement analytic gradients for `w` and `b`.
- Add a training loop with max iterations and tolerance.
- Track loss history or at least initial/final loss.
- Treat non-finite loss or repeated loss growth as divergence.

# API / data contract changes

None expected.

# Constraints

- No runtime dependencies beyond Python standard library unless the repository already has a suitable test dependency.
- No network access required.
- No generated binary artifacts.

# Risks and assumptions

- Risk: if learning rate and data scale are poorly chosen, training may be flaky.
  - Mitigation: fixed seed, bounded input range, conservative default learning rate, deterministic assertions.
- Assumption: Python is available in the implementation environment.

# Validation plan

- Run: `python -m unittest discover examples/linear-regression-optimizer -p 'test_*.py'`
- Run: `python examples/linear-regression-optimizer/optimizer.py`

# Acceptance criteria

- [ ] AC-1: Given fixed-seed synthetic data from `y = 3x + 2 + noise`, when training runs with default settings, then final loss is at least 95% lower than initial loss.
- [ ] AC-2: Given default training, when training completes, then learned `w` is within `0.2` of `3.0` and learned `b` is within `0.2` of `2.0`.
- [ ] AC-3: Given the same fixed seed and settings, when training runs twice, then learned parameters and final loss are identical or equal within a documented floating-point tolerance.
- [ ] AC-4: Given an unsafe learning rate, when training runs, then the optimizer reports divergence or non-convergence without claiming success.
- [ ] AC-5: Given the example README, when reviewed, then it explains how to run the optimizer, how to run tests, and what evidence demonstrates the loop result.

# Stop condition

The task is complete when the example exists, the validation commands pass, and the PR/MR evidence maps all acceptance criteria to test output or file evidence.

# Pause-and-ask conditions

- The implementation requires non-standard Python dependencies.
- The repository structure prevents adding an `examples/` directory.
- Deterministic tests cannot be made stable with reasonable thresholds.
- The implementation needs to change existing skills or workflow files beyond documentation links.

# Change history

- YYYY-MM-DD: Initial task contract created.
```

## Step 3: Use power-loop On The Issue

After the issue exists, invoke `power-loop`:

```text
Use $power-loop on <issue-url> to generate a bounded Codex /goal.
```

Expected `power-loop` result:

```text
Readiness result: LOOP_READY
Risk level: LOW
Execution decision: ALLOW_GOAL
Missing fields: None
Status transition recommendation: agent-ready -> agent-loop-ready
```

The bounded `/goal` should include:

- contract source;
- dedicated branch or worktree;
- branch name such as `agent/<issue-id>-linear-regression-optimizer`;
- checkpoint plan;
- validation loop;
- budget;
- verifier gate;
- PR/MR evidence requirements;
- stop and pause conditions;
- loop decision rules.

If `power-loop` returns `NEEDS_GRILL`, update the issue contract instead of implementing. If it returns `NEEDS_HUMAN`, resolve the human decision before continuing.

## Step 4: Run The Bounded /goal

The implementation runner should work in checkpoints:

1. Read the issue and restate the minimal implementation approach.
2. Create the branch or worktree required by the bounded `/goal`.
3. Add the smallest implementation that can satisfy AC-1 and AC-2.
4. Run targeted validation.
5. If validation fails, diagnose before editing.
6. Add divergence and reproducibility handling.
7. Run full validation.
8. Run the verifier gate.
9. Prepare a draft PR/MR with evidence.

The loop should not continue forever. Use the budget from `power-loop`, usually:

- max implementation iterations: 5;
- same failure retry limit: 3;
- no-progress stop: 3 consecutive iterations.

## Step 5: What Good Loop Evidence Looks Like

The PR/MR should include an evidence table:

```markdown
| AC | Evidence | Validation | Files | Status |
|---|---|---|---|---|
| AC-1 | Final loss dropped from `<initial>` to `<final>`, more than 95%. | `python -m unittest discover ...` | `test_optimizer.py` | Pass |
| AC-2 | Learned `w=<w>`, `b=<b>` within tolerance. | `python -m unittest discover ...` | `test_optimizer.py` | Pass |
| AC-3 | Two fixed-seed runs match within tolerance. | `python -m unittest discover ...` | `test_optimizer.py` | Pass |
| AC-4 | Unsafe learning rate returns divergence/non-convergence status. | `python -m unittest discover ...` | `test_optimizer.py`, `optimizer.py` | Pass |
| AC-5 | README explains run commands and evidence. | Manual README review | `README.md` | Pass |
```

The PR/MR should also state:

```text
Verifier result: PASS or PASS_WITH_NOTES
Loop decision: pr-ready
```

Use `blocked` or `needs-human` instead if validation or verifier checks fail.

## Step 6: Run power-verifier As The Verifier

Use `power-verifier` after implementation and before claiming the loop is ready:

```text
Use $power-verifier to check this issue contract, implementation diff, validation output, and PR evidence.
```

The verifier should check:

- implementation matches the issue;
- no scope expansion;
- no non-goal violations;
- tests actually prove the acceptance criteria;
- divergence handling is tested;
- PR/MR body maps evidence to every AC;
- verifier independence mode and code-review source or skipped reason are disclosed;
- loop decision is justified.

If the verifier returns a fixable `BLOCKED`, repair within the bounded loop budget, rerun validation, and rerun the verifier. If the verifier returns `NEEDS_HUMAN`, or `BLOCKED` remains after the allowed repair attempts, do not mark the loop complete.

`power-critic` remains useful for requirements, spec, plan, or model-reply critique. It should not be used for code diff correctness review.

## Step 7: Final Demonstration

A successful demonstration should show these artifacts:

- Hosted issue with a clear task contract.
- `power-loop` output showing `LOOP_READY`, risk, execution decision, and bounded `/goal`.
- Implementation branch or worktree.
- Passing validation output.
- Verifier result.
- Draft PR/MR with AC evidence.
- Loop decision: `pr-ready`.

This demonstrates the core Loop Engineering idea: the agent did not just "try coding"; it operated inside a contract with validation, budget, verifier, evidence, and human gate.

## Failure Cases To Intentionally Watch For

The loop is working if it catches these problems instead of hiding them:

- Missing acceptance criteria -> `NEEDS_GRILL`.
- No concrete validation command -> `NEEDS_GRILL`.
- Request to use a production dataset or external service -> likely `NEEDS_HUMAN`.
- Tests fail repeatedly for the same reason -> stop after retry budget.
- Learning rate diverges -> report non-convergence instead of claiming success.
- Implementation expands into a general ML framework -> verifier should block for scope expansion.

## Minimal User Script

Use this sequence when testing manually:

```text
1. Use $power-grill with the task idea from Step 1.
2. Confirm the issue draft and create a hosted issue.
3. Use $power-loop on the issue URL.
4. Review the bounded /goal.
5. Manually run the /goal in Codex.
6. Ask $power-verifier to verify the issue, diff, tests, and PR evidence.
7. Review the draft PR/MR. Do not merge until a human is satisfied.
```
