# Verifier Gate

The verifier gate is a read-only check before final PR/MR readiness.

## Inputs

- Contract source: hosted issue, local brief, or pasted contract.
- Implementation diff.
- Validation commands and results.
- Acceptance criteria evidence.
- PR/MR body or draft evidence package.
- Risks, assumptions, and out-of-scope notes.

## Checks

- The diff satisfies the contract objective.
- The diff stays within scope.
- The diff does not violate non-goals.
- Every acceptance criterion has evidence.
- Validation evidence is concrete and relevant.
- Forbidden paths or high-risk areas were not touched without approval.
- Risks and assumptions are disclosed.
- The PR/MR evidence package is complete enough for review.

## Outcomes

### PASS

The implementation satisfies the contract and has sufficient validation evidence.

### PASS_WITH_NOTES

The implementation satisfies the contract, but reviewers should notice minor limitations, residual risks, or follow-up candidates.

### BLOCKED

The implementation does not satisfy the contract, validation is failing, required evidence is missing, or scope/non-goal violations are present.

### NEEDS_HUMAN

A human decision is required before the loop can continue, such as approving a risk, resolving a contract contradiction, or deciding whether to expand scope.

## Rule

If the verifier result is `BLOCKED` or `NEEDS_HUMAN`, the implementation runner must not claim completion.

