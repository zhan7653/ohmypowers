---
name: power-curator
description: Manually reconcile Decision Issues, PRs, comments, labels, branches, commits, and issue lifecycle state. Use only when the user explicitly invokes $power-curator or explicitly asks to reconcile lifecycle state — for stale open Issues, merged PRs that did not close Issues, follow-up work, duplicate or superseded decisions, or comment-only context that may need a confirmed Decision Record update.
---

# Power Curator

Default to Simplified Chinese; follow the user's language when they use another.

This skill is explicit-only: run it when the user invokes `$power-curator` or explicitly asks for lifecycle reconciliation. Never start an assessment proactively after a merge, release, or delivery.

Inspect and propose lifecycle cleanup. Never mutate hosted state until the user has confirmed the exact numbered mutation. Curation audits the **presence and coverage of evidence** — validation was run, a PR or commit is linked, a check result is bound to the current implementation identity — never implementation correctness itself.

## Boundaries

- Treat the current Issue body `Decision Record` as current truth. Comments are history and evidence only.
- Do not add or reinterpret product decisions. Send material decision changes back through `$power-gan`.
- Do not decide implementation correctness. Rely on existing self-validation evidence and, where power-check's Applicability section requires independent evidence, on `$power-check` results.
- Do not approve, merge, retarget, or mutate branches.
- Do not build a daemon, index, database, or repository decision Markdown archive.
- Do not copy full conversations into Issues.

## Workflow

1. **Scope first.** Establish the working set with the user: an explicit Issue list, or a filter (label, date range, area, author). Process large sets in small batches and say which batch is in view. Never claim a full-repository sweep that was not performed.
2. **Read.** For each Issue in scope: the body, necessary Decision Notes, linked PRs or commits, and current hosted state. Match related candidates conservatively using explicit links, affected code or paths, branch or commit evidence, and narrow keywords. Never collapse or supersede Issues from title similarity alone.
3. **Classify** each Issue into exactly one state using the evidence minima below.
4. **Propose** the smallest exact mutations using the Curation Proposal template, with the evidence for each.
5. **Confirm.** The user confirms by mutation number, by Issue, or in whole. Anything not explicitly covered by a confirmation stays unapplied.
6. **Apply and report.** Execute only confirmed mutations under the hosted-write discipline below, then re-read the resulting state and report it.

## States And Evidence Minima

- `active`: the confirmed result is unfinished — no delivery evidence, or delivery evidence is partial against the Decision Record.
- `delivered`: implementation is linked by PR or commit and all required self-validation completed successfully; when independent evidence is required (per power-check's Applicability, the Decision Record, the user, or `$power-gan`), the linked delivery has a `PASS` or `PASS_WITH_NOTES` result bound to its implementation identity. `BLOCKED`, `NEEDS_HUMAN`, and `CHECK_REQUIRED` never satisfy this state.
- `follow-up`: the original result meets the `delivered` minima, and the remaining work has its own distinct outcome rather than completing the original one.
- `superseded`: a newer Decision Issue explicitly owns the material decision — through a `supersedes` link or an explicit statement in the newer Record. Never inferred.
- `unclear`: evidence is insufficient for any state above. Propose no lifecycle mutation; list the missing evidence instead.

Failed required validation keeps work `active`; missing or ambiguous validation evidence makes it `unclear`. A `BLOCKED`, `NEEDS_HUMAN`, or `CHECK_REQUIRED` independent result is not delivery evidence and must never be treated as a successful check.

When check evidence exists, verify that the implementation identity it is bound to still matches the linked delivery. A later identity change invalidates the old result for changed content until the affected checks are repeated as a delta per power-check. The user may explicitly accept a non-material uncovered change; that acceptance cannot authorize a material decision change.

## Curation Proposal

Present every assessment in this shape before any confirmation request:

```markdown
# Curation Proposal — nothing has been changed yet

Scope: <explicit list or filter, and which batch this covers>

## Issue #<n> <title>
State: <active | delivered | follow-up | superseded | unclear>
Evidence: <linked PRs/commits, validation or check evidence and its bound identity, or what is missing>
Mutations:
- [I<n>-M1] <body-edit | comment | label | close | reopen | create>: <exact content>
- [I<n>-M2] ...

(repeat per Issue; "Mutations: none" is a valid outcome)

Confirm by globally unique mutation ID (e.g. "I42-M1, I57-M3"), by Issue, or in whole. Unconfirmed mutations will not be applied.
```

Mutation IDs must be globally unique across the entire proposal: include the Issue number, start at `M1` within that Issue, and never reset or reuse the same full ID for another Issue in the proposal.

Exactness requirements: a `body-edit` shows the exact old text and the exact replacement; a `comment` shows the full comment body; a `label` names the exact additions and removals; `close`/`reopen` includes any closing comment verbatim; `create` includes the complete proposed body. Prose descriptions of a change ("update the status section") are not proposals.

## Hosted-Write Discipline

Before the first hosted write in a curation run, read [../power-gan/references/issue-persistence.md](../power-gan/references/issue-persistence.md) in full. For every confirmed mutation, separately perform its pre-write snapshot with UTF-8 body hash, immediate pre-write re-read and comparison, one UTF-8 (no BOM) write, and post-write read-back verification, with the mojibake hard stop throughout. The proposal's exact old text is the initial comparison anchor.

For multiple confirmed mutations on the same Issue, the verified read-back after each successful mutation becomes that Issue's expected rolling baseline for the next mutation. Compare the next immediate pre-write read against this rolling baseline; only unexpected deviations are drift. If external drift appears, stop the remaining mutations for that Issue, re-assess it, and re-propose; continue with other confirmed Issues unaffected by the drift.

## Decision Record Rules

- Update `Decision status` for ordinary lifecycle changes without incrementing `Decision revision`.
- Increment `Decision revision` only when a user-confirmed material decision changes and the body is updated — and that confirmation comes through `$power-gan`, not through curation.
- A Decision Note may record the change, evidence, objection, final choice, rationale, and confirmation source, but never creates an obligation by itself.
- Do not add Blueprint, file lists, internal interfaces, test matrices, agent assignments, reviewer topology, or full transcripts.

## Close, Reopen, And Supersede

Recommend closing an Issue only when it meets the `delivered` minima. Do not keep a closed Issue synchronized with later internal refactors or compatible bug fixes: a closed Issue is a decision-and-delivery event, not a living document. When a later request changes a material decision, create a new Issue linked with `supersedes` (through `$power-gan` alignment) and keep the old Issue closed with the link. Reopen the old Issue only when its original delivery was incomplete or its completion evidence was wrong.

## Output

Before confirmation: the Curation Proposal, with evidence and lifecycle assessment per Issue, and the explicit statement that nothing has been changed. After confirmation: each applied mutation with its URL or reference, any mutation skipped for drift or missing confirmation, and any unresolved item.
