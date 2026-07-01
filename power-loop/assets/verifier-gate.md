# Verifier Gate

The verifier gate is a read-only check before final PR/MR readiness. `power-loop` defines this gate in the bounded `/goal`; `power-verifier` is the recommended skill for executing it against implementation evidence.

## Inputs

- Contract source: hosted issue, local brief, or pasted contract.
- Implementation diff.
- Validation commands and results.
- Acceptance criteria evidence.
- PR/MR body or draft evidence package.
- Code-review output from Codex `/review` or an equivalent read-only code-review subagent when relevant, or a skipped reason.
- Risks, assumptions, and out-of-scope notes.

## Checks

- The diff satisfies the contract objective.
- The diff stays within scope.
- The diff does not violate non-goals.
- Every acceptance criterion has evidence.
- Validation evidence is concrete and relevant.
- Tests or manual checks prove the acceptance criteria they are cited for.
- Code-review findings are reviewed and either resolved, routed back for repair, documented as notes, or escalated to a human decision.
- Forbidden paths or high-risk areas were not touched without approval.
- Risks and assumptions are disclosed.
- The PR/MR evidence package is complete enough for review.
- The loop decision is justified by the diff, validation, and evidence.
- The verifier result states the independence mode, independent review source, and degraded-mode reason if applicable.

## Outcomes

### PASS

The implementation satisfies the contract and has sufficient validation evidence.

### PASS_WITH_NOTES

The implementation satisfies the contract, but reviewers should notice minor limitations, residual risks, or follow-up candidates.

### BLOCKED

The implementation does not satisfy the contract, validation is failing, required evidence is missing, scope/non-goal violations are present, or code-review findings identify fixable problems inside the current contract.

### NEEDS_HUMAN

A human decision is required before the loop can continue, such as approving a risk, resolving a contract contradiction, deciding whether to expand scope, approving high-risk work, or resolving repeated repair failure beyond budget.

## Rule

If the verifier result is `BLOCKED` or `NEEDS_HUMAN`, the implementation runner must not claim completion.

If the result is a fixable `BLOCKED`, the implementation runner should repair within the bounded loop budget, rerun validation, and rerun the verifier gate. Escalate to `NEEDS_HUMAN` only when repair requires scope expansion, a contract change, high-risk work, or repeated failure beyond budget.
