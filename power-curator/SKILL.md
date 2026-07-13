---
name: power-curator
description: Manually reconcile Decision Issues, PRs, comments, labels, branches, commits, and issue lifecycle state. Use for stale open Issues, merged PRs that did not close Issues, follow-up work, duplicate or superseded decisions, or comment-only context that may need a confirmed Decision Record update.
---

# Power Curator

Inspect and propose lifecycle cleanup. Never mutate hosted state until the user confirms the exact body edit, comment, label change, close/reopen action, or new Issue.

## Boundaries

- Treat the current Issue body `Decision Record` as current truth. Comments are history and evidence only.
- Do not add or reinterpret product decisions. Send material decision changes back through `$power-gan`.
- Do not decide implementation correctness. Use existing self-validation and, when required, `$power-check` evidence.
- Do not approve, merge, retarget, or mutate branches.
- Do not build a daemon, index, database, or repository decision Markdown archive.
- Do not copy full conversations into Issues.

## Workflow

1. Read the relevant Issue body, necessary Decision Notes, linked PRs or commits, and current hosted state.
   Match candidates conservatively using explicit links, affected code or paths, branch/commit evidence, and narrow keywords. Never collapse or supersede Issues from title similarity alone.
2. Map each Issue to one state:
   - `active`: the confirmed result is unfinished;
   - `delivered`: implementation and necessary validation exist with a linked PR or commit;
   - `follow-up`: the original result is delivered but new work is separate;
   - `superseded`: a newer Decision Issue owns the material decision;
   - `unclear`: evidence is insufficient.
3. Propose the smallest exact mutations and explain the evidence for each.
4. Ask the user to confirm those exact mutations.
5. Apply only confirmed mutations, then re-read and report the resulting state.

## Decision Record Rules

- Update `Decision status` for ordinary lifecycle changes without incrementing `Decision revision`.
- Increment `Decision revision` only when a user-confirmed material decision changes and the body is updated.
- A Decision Note may record the change, evidence, objection, final choice, rationale, and confirmation source, but never creates an obligation by itself.
- Do not add Blueprint, file lists, internal interfaces, test matrices, agent assignments, reviewer topology, or full transcripts.

## Close, Reopen, And Supersede

Recommend closing an Issue only when its result is implemented, necessary validation is complete, and a PR or commit is linked. Independent check evidence is required only when the Decision Record, user, delivery risk, or `$power-gan` requires it.

When check evidence exists, verify that it covers the final implementation. A later tree or diff change invalidates the old result for changed content until the affected checks are repeated. A user may explicitly accept a non-material uncovered change, but that acceptance cannot authorize a material decision change.

Do not keep a closed Issue synchronized with later internal refactors or compatible bug fixes. Create a new Issue linked with `supersedes` when a later request changes a material decision. Reopen the old Issue only when its original delivery was incomplete or its completion evidence was wrong.

## Output

Before confirmation, report evidence, lifecycle assessment, and exact proposed mutations, and state that nothing was changed. After confirmation, report applied mutations with URLs or references and any unresolved item.
