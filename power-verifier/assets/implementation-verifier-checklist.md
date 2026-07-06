# Implementation Verifier Checklist

Use this checklist for a read-only verifier pass over implementation evidence.

## Required Inputs

- Contract source: hosted issue, local brief, or pasted task contract.
- Implementation diff: branch, commit range, PR/MR diff, or pasted diff.
- Validation commands and outputs.
- Acceptance-criteria evidence.
- PR/MR body or draft evidence package.
- Fresh-context evidence-verifier output from `power_verifier`, `power-verifier` in a fresh context, or an equivalent read-only verifier subagent.
- Code-review output from Codex `/review`, `codex review`, or an equivalent read-only code-review pass, or a skipped reason for documentation-only diffs.
- Risks, assumptions, out-of-scope notes, and loop decision.

## Evidence Audit

- Contract reread: inspect the contract directly and identify objective, scope, non-goals, validation, acceptance criteria, stop condition, and pause conditions.
- Contradiction check: compare the contract with repository facts and return `NEEDS_HUMAN` if they conflict.
- Diff-to-contract mapping: inspect the implementation diff directly and map each changed file to in-scope contract work.
- Objective: confirm the diff satisfies the contract objective.
- Scope: confirm changed files and behavior stay within the in-scope work.
- Non-goals: confirm excluded work was not implemented or modified.
- Acceptance criteria: map every AC to concrete evidence, files, and validation.
- Validation: confirm commands are relevant, outputs are concrete, failures are disclosed, and passing commands actually cover the ACs.
- Test relevance: confirm tests or manual checks prove the behavior claimed by the acceptance criteria.
- Evidence verifier: confirm a fresh-context verifier or equivalent read-only verifier subagent inspected the primary contract, diff, validation, acceptance-criteria evidence, PR/MR evidence, risks, assumptions, out-of-scope notes, and loop decision.
- Code-review findings: inspect `/review`, `codex review`, or equivalent output for code, behavior, test, dependency, or config diffs; if skipped, confirm the diff is documentation-only.
- Forbidden paths: confirm protected or out-of-scope paths were not touched without approval.
- Generated artifacts: confirm generated or local-only artifacts are handled according to the contract.
- Risks and assumptions: confirm residual risk is disclosed and not hidden as completion.
- PR/MR evidence: confirm summary, rationale, changed files, validation, AC evidence, verifier result, risks, out-of-scope items, reviewer checklist, and loop decision are present.
- Loop decision: confirm `pr-ready`, `blocked`, `needs-human`, `follow-up-needed`, or `done` is justified by the evidence.
- Parallelism: confirm evidence verification and code review were started in parallel when they could inspect the same stable inputs, or record why they ran sequentially.
- Verifier independence: record the evidence-verifier source and code-review source separately. Do not treat code review as a substitute for a fresh-context evidence verifier.

## Code-Review Finding Handling

- Blocker or should-fix findings that affect correctness, contract satisfaction, tests, validation, security, compatibility, or disclosed risk prevent `PASS`.
- Fixable findings inside the current contract produce `BLOCKED` with the smallest next action.
- Nice-to-have findings may allow `PASS_WITH_NOTES`.
- Findings that require scope expansion, contract changes, high-risk decisions, or repeated failed repair attempts produce `NEEDS_HUMAN`.
- Missing fresh-context evidence verification prevents `PASS` and `PASS_WITH_NOTES`.
- Missing code review for code, behavior, test, dependency, or config diffs prevents `PASS` and `PASS_WITH_NOTES`.

## Result Selection

- `PASS`: all checks are satisfied with sufficient evidence, and no blocking or should-fix findings remain.
- `PASS_WITH_NOTES`: checks are satisfied and both required review tracks exist, with minor limitations, sequential verifier/review execution, or follow-up candidates.
- `BLOCKED`: implementation, validation, code-review findings, or evidence is insufficient but can be repaired or supplied within the current contract.
- `NEEDS_HUMAN`: a human decision is required before verification can complete.

Do not infer completion from intent, partial evidence, implementation-runner claims, or passing commands that do not cover the contract.
