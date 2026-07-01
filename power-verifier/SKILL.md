---
name: power-verifier
description: Read-only implementation verifier for Loop Engineering tasks. Use after a bounded Codex /goal has produced a diff, validation output, and PR evidence that must be checked against an issue contract.
---

# Power Verifier

## Overview

Verify implementation evidence against a Loop Engineering task contract without changing files or project state.

`power-verifier` is the maker-checker counterpart to a bounded Codex implementation loop. It independently audits whether the implementation diff, validation output, acceptance-criteria evidence, PR/MR evidence package, code-review findings when relevant, and loop decision satisfy the contract produced by `power-grill` and bounded by `power-loop`.

It returns one verifier result:

- `PASS`
- `PASS_WITH_NOTES`
- `BLOCKED`
- `NEEDS_HUMAN`

## When To Use

Use this skill after implementation work exists and before claiming PR/MR readiness.

Good inputs:

- A hosted issue or local issue contract.
- The implementation diff or PR/MR URL.
- Validation commands and outputs.
- Acceptance-criteria evidence.
- PR/MR body or draft evidence package.
- Risks, assumptions, out-of-scope notes, and loop decision.
- Code-review output from Codex `/review` or an equivalent read-only code-review subagent, when the diff includes code, behavior, tests, dependencies, or config.

Do not use this skill to clarify vague requirements before implementation. Send unclear contracts back to `power-grill` or `power-loop`.

## Independence Modes

Prefer the strongest available verifier independence mode:

1. `fresh-context verifier agent`: use the bundled read-only verifier custom-agent configuration, or an equivalent fresh-context verifier, to audit the contract and implementation evidence.
2. `external code review plus verifier`: use Codex `/review` or an equivalent read-only code-review pass for implementation-diff risks, then incorporate those findings into this verifier result.
3. `self-review degraded mode`: use only when fresh-context or external review is unavailable. The verifier result must state the degraded mode reason.

The verifier must inspect primary evidence directly. Parent-agent summaries, implementation-runner claims, PR descriptions, or pasted conclusions can orient the review, but they cannot be the sole evidence for completion.

## Code-Review Integration

For implementation diffs that include code, behavior, tests, dependencies, or config, strongly prefer Codex `/review` or an equivalent read-only code-review subagent before final verifier selection.

Pure documentation-only changes may skip code review. If skipped, the verifier result must state the reason.

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
5. PR/MR evidence package.
6. Code-review output or skipped reason.
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
- Code-review output or skipped reason.
- Forbidden path or high-risk area violations.
- Generated artifact handling.
- Risks and assumptions disclosure.
- PR/MR evidence completeness.
- Loop decision justification.
- Verifier independence mode and degraded-mode disclosure.

## Outcomes

### PASS

Use when the implementation satisfies the contract, required evidence is sufficient, validation is trustworthy, and no blocking or should-fix code-review findings remain.

### PASS_WITH_NOTES

Use when the implementation satisfies the contract, but reviewers should notice minor limitations, residual risks, degraded verifier independence, or follow-up candidates that do not block the current contract.

### BLOCKED

Use when the implementation does not satisfy the contract, validation fails, required evidence is missing, scope/non-goal violations are present, or code-review findings identify fixable problems inside the current contract.

When a blocker is fixable within the current contract, state the smallest next action so the implementation runner can repair within the bounded loop budget and rerun validation and verifier.

### NEEDS_HUMAN

Use when a human decision is required before verification can complete, such as approving scope expansion, resolving a contract contradiction, accepting a high-risk change, or deciding what to do after repeated repair failure beyond budget.

## Output Format

Use [assets/verifier-result-template.md](assets/verifier-result-template.md).

Always include:

- Verifier result.
- Verifier Independence Mode.
- Independent Review Source.
- Contract source.
- Implementation source.
- Validation evidence reviewed.
- Code-review source or skipped reason.
- Review Findings Considered.
- Degraded Mode Reason, if any.
- Acceptance-criteria evidence table.
- Scope and non-goal assessment.
- Validation assessment.
- Risks or assumptions.
- Required human decisions, if any.
- Reviewer notes.
- Smallest Next Action for `BLOCKED` or `NEEDS_HUMAN`.

If the result is `BLOCKED` or `NEEDS_HUMAN`, state the smallest next action that would unblock the loop.
