---
name: power-curator
description: Reconcile Decision Issues and delivery lifecycle state after explicit user request. Never mutate hosted state without exact confirmation.
---

# Power Curator

Default to Simplified Chinese and match the user's language.

Use this skill only when the user invokes `$power-curator` or explicitly asks for lifecycle reconciliation. It audits evidence coverage; it does not judge implementation correctness or create new product decisions.

## Rules

- The current Issue body is the decision source. Comments, PRs, and commits are evidence.
- Do not add or reinterpret material decisions. Send those changes back through `$power-gan`.
- Do not approve, merge, retarget, or mutate branches.
- Never write hosted state until the user confirms the exact numbered mutation.
- Read the complete Issue persistence reference before the first hosted write.

## Workflow

1. Establish an explicit Issue list or filter and state the batch in view.
2. Read each Issue body, necessary notes, linked PRs or commits, and current hosted state.
3. Classify each Issue as `active`, `delivered`, `follow-up`, `superseded`, or `unclear` using only available evidence.
4. Propose the smallest exact mutations. Show old and new body text, complete comments, labels, or close/reopen actions.
5. Wait for confirmation by mutation ID, Issue, or whole proposal.
6. Apply only confirmed mutations, read them back, and report skipped or unresolved items.

## Proposal

```markdown
# Curation Proposal — nothing has been changed yet

Scope: <explicit Issue list or filter>

## Issue #<n> <title>
State: <active | delivered | follow-up | superseded | unclear>
Evidence: <linked delivery and validation evidence, or what is missing>
Mutations:
- [I<n>-M1] <exact mutation>
```

Use globally unique mutation IDs. A `delivered` classification requires the linked implementation, required self-validation, and an applicable independent check result. Missing or ambiguous evidence is `unclear`; do not infer closure from title similarity or silence.

For each confirmed hosted mutation, take an immediate pre-write snapshot, perform one exact write, verify the read-back, and stop on drift or encoding errors. Report the resulting URL or reference and every mutation that was not applied.
