---
name: power-verifier
description: Read-only implementation verifier for Loop Engineering tasks. Use after a bounded Codex /goal has produced a diff, validation output, and PR evidence that must be checked against an issue contract.
---

# Power Verifier

## Overview

Verify implementation evidence against a Loop Engineering task contract without changing files or project state.

`power-verifier` is the maker-checker counterpart to a bounded Codex implementation loop. The bundled `power_verifier` custom agent uses `gpt-5.6-sol` High in read-only mode to audit whether the implementation diff, validation output, acceptance-criteria evidence, PR/MR evidence package, code-review findings, and loop decision satisfy the canonical Task Contract and confirmed execution sections.

It returns one verifier result:

- `PASS`
- `PASS_WITH_NOTES`
- `BLOCKED`
- `NEEDS_HUMAN`

## When To Use

Use this skill after implementation work exists and before claiming PR/MR readiness.

Good inputs:

- A hosted issue or local issue contract.
- Its confirmed Execution Blueprint and Agent Dispatch Plan.
- The implementation diff or PR/MR URL.
- Validation commands and outputs.
- Acceptance-criteria evidence.
- PR/MR body or draft evidence package, including issue linkage and curation handoff evidence.
- Risks, assumptions, out-of-scope notes, and loop decision.
- Code-review output from `power_code_reviewer` using `gpt-5.6-sol` High in read-only mode.

Do not use this skill to clarify vague requirements before implementation. Send unclear contracts back to `power-grill` or `power-loop`.

## Evidence Verifier And Code Review

Run evidence verification and code review as separate read-only tracks:

1. Evidence verification: use the bundled `power_verifier` custom agent with `gpt-5.6-sol` High in read-only mode to audit the contract and implementation evidence.
2. Code review: use the bundled `power_code_reviewer` custom agent with `gpt-5.6-sol` High in read-only mode to inspect implementation-diff risks.

When both tracks can inspect the same stable contract, diff, validation output, and PR/MR evidence package, start them in parallel. If the environment cannot run them in parallel, run them sequentially and record the reason.

Do not make `power_verifier` wait for or consume `power_code_reviewer` output during the parallel pass. After both independent results exist, the invoking orchestrator or `power-verifier` workflow combines them into the final verifier result.

Do not substitute either track for the other. If either required custom agent is missing, return `BLOCKED` or `NEEDS_HUMAN` instead of inheriting the parent model or claiming `PASS` or `PASS_WITH_NOTES`. Use a different profile only after explicit approval names the substitute and confirms equivalent Sol High read-only behavior.

Record a missing-profile reason when either required custom agent is unavailable. Missing-profile mode must not produce `PASS` or `PASS_WITH_NOTES`.

The evidence verifier and code reviewer must inspect primary evidence directly. Parent-agent summaries, implementation-runner claims, PR descriptions, or pasted conclusions can orient the review, but they cannot be the sole evidence for completion.

## Code-Review Integration

Run `power_code_reviewer` before final verifier selection for every implementation diff, including documentation-only changes. The review focus may change by diff type, but the code-review track remains separate from evidence verification.

If the diff cannot receive the required Sol High read-only code-review pass, return `BLOCKED` when the missing review can be supplied within the current loop, or `NEEDS_HUMAN` when resolving the missing profile requires a human or tool decision. Do not return `PASS` or `PASS_WITH_NOTES` until both review tracks exist.

Handle code-review findings as follows:

- Blocker or should-fix findings that affect correctness, contract satisfaction, tests, validation, security, compatibility, or disclosed risk prevent `PASS`.
- Findings that are fixable within the current contract produce `BLOCKED` with the smallest next action. The implementation runner should repair within the bounded loop budget, rerun validation, and rerun the verifier.
- Nice-to-have findings may allow `PASS_WITH_NOTES` when the contract is otherwise satisfied.
- Use `NEEDS_HUMAN` only when the finding requires scope expansion, a contract change, a high-risk decision, or repeated repair failure beyond budget.

## Hard Boundaries

You must stay read-only:

- Do not edit files.
- Do not write patches.
- Do not run implementation changes.
- Do not create branches or worktrees.
- Do not create, approve, merge, close, or retarget PRs/MRs.
- Do not approve your own work.
- Do not mutate hosted issues, labels, milestones, assignees, or comments unless the user explicitly asks.
- Do not expand scope or decide product/security/business tradeoffs.

You may inspect files, diffs, issue bodies, PR/MR bodies, validation output, and code-review output. You may run read-only commands that gather evidence, such as `git diff`, `git status`, `rg`, `find`, and test-result inspection commands.

## Inputs

Prefer inputs in this order:

1. Contract source: hosted issue, local brief, or pasted contract.
2. Implementation source: branch, worktree, diff, commit range, or PR/MR URL.
3. Validation evidence: commands and output.
4. Acceptance-criteria evidence.
5. PR/MR evidence package with issue linkage, closing intent, follow-up handling, and curator mutation status.
6. `power_code_reviewer` output.
7. Risks, assumptions, out-of-scope notes, and loop decision.

If required evidence is unavailable, return `BLOCKED` or `NEEDS_HUMAN` instead of guessing.

## Verification Checklist

Use [assets/implementation-verifier-checklist.md](assets/implementation-verifier-checklist.md).

Check:

- Contract reread and contradiction check.
- Diff-to-contract mapping.
- Objective satisfaction.
- Scope adherence.
- Non-goal preservation.
- Acceptance criteria evidence.
- Validation relevance, trustworthiness, and failure disclosure.
- Test relevance to the acceptance criteria.
- Issue linkage and curation handoff evidence, including closing intent and follow-up handling.
- `power_code_reviewer` output.
- Forbidden path or high-risk area violations.
- Generated artifact handling.
- Risks and assumptions disclosure.
- PR/MR evidence completeness.
- Loop decision justification.
- Evidence verifier source, code-review source, parallel/sequential execution disclosure, and missing-profile disclosure.

## Outcomes

### PASS

Use when the implementation satisfies the contract, required evidence is sufficient, validation is trustworthy, and no blocking or should-fix code-review findings remain.

### PASS_WITH_NOTES

Use when the implementation satisfies the contract and both required review tracks exist, but reviewers should notice minor limitations, sequential verifier/review execution, residual risks, or follow-up candidates that do not block the current contract.

### BLOCKED

Use when the implementation does not satisfy the contract, validation fails, required evidence is missing, scope/non-goal violations are present, or code-review findings identify fixable problems inside the current contract.

When a blocker is fixable within the current contract, state the smallest next action so the implementation runner can repair within the bounded loop budget and rerun validation and verifier.

### NEEDS_HUMAN

Use when a human decision is required before verification can complete, such as approving scope expansion, resolving a contract contradiction, accepting a high-risk change, or deciding what to do after repeated repair failure beyond budget.

## Output Format

Use [assets/verifier-result-template.md](assets/verifier-result-template.md).

Always include:

- Verifier result.
- Evidence Verifier Source.
- Code-review source.
- Parallel execution status.
- Contract source.
- Implementation source.
- Validation evidence reviewed.
- Review Findings Considered.
- Issue linkage and curation handoff assessment.
- Missing Profile Reason, if any.
- Acceptance-criteria evidence table.
- Scope and non-goal assessment.
- Validation assessment.
- Risks or assumptions.
- Required human decisions, if any.
- Reviewer notes.
- Smallest Next Action for `BLOCKED` or `NEEDS_HUMAN`.

If the result is `BLOCKED` or `NEEDS_HUMAN`, state the smallest next action that would unblock the loop.
