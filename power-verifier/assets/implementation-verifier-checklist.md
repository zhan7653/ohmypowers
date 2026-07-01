# Implementation Verifier Checklist

Use this checklist for a read-only verifier pass over implementation evidence.

## Required Inputs

- Contract source: hosted issue, local brief, or pasted task contract.
- Implementation diff: branch, commit range, PR/MR diff, or pasted diff.
- Validation commands and outputs.
- Acceptance-criteria evidence.
- PR/MR body or draft evidence package.
- Risks, assumptions, out-of-scope notes, and loop decision.

## Checks

- Objective: the diff satisfies the contract objective.
- Scope: changed files and behavior stay within the in-scope work.
- Non-goals: excluded work was not implemented or modified.
- Acceptance criteria: every AC maps to concrete evidence.
- Validation: commands are relevant, results are concrete, and failures are disclosed.
- Forbidden paths: protected or out-of-scope paths were not touched without approval.
- Generated artifacts: generated or local-only artifacts are handled according to the contract.
- Risks and assumptions: residual risk is disclosed and not hidden as completion.
- PR/MR evidence: summary, rationale, changed files, validation, AC evidence, verifier result, risks, out-of-scope items, reviewer checklist, and loop decision are present.
- Loop decision: `pr-ready`, `blocked`, `needs-human`, `follow-up-needed`, or `done` is justified by the evidence.

## Result Selection

- `PASS`: all checks are satisfied with sufficient evidence.
- `PASS_WITH_NOTES`: checks are satisfied, with minor limitations or follow-up candidates.
- `BLOCKED`: implementation, validation, or evidence is insufficient.
- `NEEDS_HUMAN`: a human decision is required before verification can complete.

Do not infer completion from intent, partial evidence, or passing commands that do not cover the contract.
