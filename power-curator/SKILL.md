---
name: power-curator
description: Manually curate Loop Engineering issue, PR, comment, label, branch, and local git state. Use when Codex needs to reconcile accumulated issues, merged PRs that did not close issues, follow-up work, comment-only context, duplicate or superseded contracts, or post-merge/post-change issue lifecycle state.
---

# Power Curator

## Overview

Curate Loop Engineering issue and PR lifecycle state after task contracts, implementation loops, reviews, or merges. The skill produces a curation plan first, asks for explicit confirmation before every GitHub or GitLab mutation, and treats the issue body as canonical.

`power-curator` is not an implementation verifier. Use `power-verifier` to decide whether an implementation satisfies a contract; use `power-curator` to organize, link, update, close, or split issue lifecycle records after the evidence exists.

Closure evidence is snapshot-bound. A verifier result covers only the Git tree digest it records. Commit identity is provenance, but the Git tree digest controls freshness: different commits with the same tree are content-equivalent, while different trees invalidate the old result for the final tree.

## Hard Boundaries

You must not:

- run as a daemon, scheduler, webhook, background scanner, cron job, database, or persistent index;
- mutate PRs/MRs, milestones, assignees, or branches;
- mutate issue bodies, issue comments, issue labels, issue closure state, or follow-up issue creation without explicit user confirmation of the exact mutation;
- auto-close issues;
- rewrite old issue contracts wholesale;
- modify the `Task Contract`, `Execution Blueprint`, or any legacy planning block while performing lifecycle-only curation;
- treat comments as the canonical task contract;
- approve, merge, or retarget PRs/MRs;
- decide implementation correctness without `power-verifier` evidence when correctness is in question;
- describe a verifier result for an older tree as a PASS for the final tree;
- use a human waiver for a change to the Task Contract, acceptance criteria, public behavior, security, permissions, or migration decisions.

You may inspect repository state, hosted issue and PR/MR state, issue and PR/MR comments, labels, branch names, local git history, and local worktrees.

## Inputs

Accept any of:

- a hosted issue URL or number;
- a PR/MR URL or number;
- a repository-wide curation request;
- a local branch, worktree, commit range, or pasted issue/PR evidence;
- a request to preserve important comment context into canonical issue state.

If hosted state cannot be read through `gh`, `glab`, browser access, or another available source, pause and ask the user for the missing issue, PR/MR, or comment content.

## Workflow

1. Inspect the current repository and hosted state relevant to the request.
   - Read issue bodies as canonical contracts.
   - Read comments only as event log and supplementary evidence.
   - Use REST API comment reads when higher-level CLI comment commands fail, such as `gh api repos/<owner>/<repo>/issues/<number>/comments`.
   - Inspect PR/MR bodies, merge state, linked issues, labels, branch names, commits, and touched files when relevant.
   - Record the canonical Issue URL or path, host revision metadata when available, and SHA-256 of the exact full persisted body. If a historical or external Issue lacks enough metadata to establish an accurate identity, do not invent it; request evidence, a new planning pass, or an explicit human decision.
2. Build a conservative issue/PR map.
   - Prefer candidates with concrete evidence over broad keyword matches.
   - Include open and closed issues; treat closed issues as historical context.
   - Do not collapse issues together without user confirmation.
3. Assess the lifecycle position of each relevant issue.
   - `active`: still the current contract for unfinished work.
   - `implemented-but-open`: has merged PR or explicit local commit evidence and may be ready to close.
   - `needs-follow-up`: current contract is complete or partially complete, but new work belongs in a linked follow-up issue.
   - `superseded`: another issue is now the canonical contract.
   - `duplicate-or-related`: overlaps another issue but needs user confirmation.
   - `unclear`: evidence is insufficient to recommend mutation.
4. Reconcile verifier and final snapshots before recommending closure.
   - Capture both snapshots as repository/ref, commit, Git tree digest, dirty/generated boundary, and capture time.
   - Compare Git tree digests, not commit hashes, to decide freshness.
   - If the digests differ, inventory changed paths, summarize the diff, state behavior impact, list validations run, and identify content not covered by the old verifier result.
   - Assign exactly one freshness classification using the protocol below.
5. Produce a curation plan before mutations.
   - List evidence inspected.
   - List candidate links and why they match.
   - Propose exact issue body, comment, label, close, or follow-up mutations.
   - Mark every mutation as pending confirmation.
   - Ask the user to confirm the exact mutations to apply.
6. Apply only confirmed mutations.
   - Update or append `Curation status` in the issue body.
   - Add/update issue comments only when confirmed.
   - Add/update labels only when confirmed.
   - Close issues only when confirmed and closure requirements are satisfied.
   - Create follow-up issues only when confirmed.
7. Report final state.
   - Include URLs, issue/PR numbers, labels changed, body sections updated, comments added, issues closed, and unresolved items.

## Matching Candidates

When deciding whether a new task should update an existing issue, become a follow-up, or create a new issue, search conservatively:

- title and body keywords;
- touched files or modules;
- branch issue id or branch slug;
- `Linked contract`, `Closes #N`, `Fixes #N`, or equivalent PR/MR body references;
- issue or PR/MR comments that mention follow-up work;
- open issues first, then closed issues as historical context.

Output candidates, not final matches. Let the user confirm whether to update an existing issue, create a linked follow-up, or create a new issue.

## Snapshot Freshness Protocol

Assign exactly one classification before closure:

- `tree-equivalent`: verified and final Git tree digests are identical. The existing verifier result may be cited for the final content even when commit hashes differ.
- `reverified`: the trees differ, the changed paths and impact are inventoried, and a new verifier result is explicitly bound to the final Git tree digest.
- `human-waived`: the trees differ, the change is not contract-changing, and the user explicitly confirms a complete waiver record for the uncovered final-tree content.
- `contract-changing`: the change affects the Task Contract, acceptance criteria, public behavior, security, permissions, or migration decisions. Stop closure and route those decisions to `power-grill`; use `power-loop` only when the revised work needs a persisted Blueprint. A waiver cannot replace those owners.
- `unresolved`: identity or comparison evidence is missing, trees differ without final-tree verification or a complete waiver, or another closure condition remains unmet.

Evaluate `contract-changing` before accepting re-verification or waiver evidence. For `tree-equivalent`, retain the verified and final commit identities as provenance while stating that their tree digests match. For every other classification, state the smallest next action. `human-waived` permits a human closure decision; it is not a verifier PASS for the final tree.

## Human Waiver Record

A waiver is complete only when `Curation status` records all of the following:

- verified snapshot: repository/ref, commit, Git tree digest, dirty/generated boundary, and capture time;
- final snapshot: the same identity fields;
- changed paths and diff summary;
- behavior impact;
- validations run against the final tree, including results;
- content not covered by the old verifier result;
- waiver reason and exact scope;
- confirmer and confirmation time;
- residual risks.

Show the exact proposed record and obtain explicit confirmation before applying it. The record must say that the earlier verifier result covers only the verified snapshot and that final-tree closure is human-waived. Missing identity, scope, confirmation, coverage, or risk fields yields `unresolved`.

## Canonical Issue Body

Use the issue body as canonical. Preserve the `Task Contract` and optional `Execution Blueprint` as separately owned sections, and leave any legacy Dispatch block untouched when present. If important lifecycle context exists only in comments, place it in closure evidence or a linked follow-up issue instead of creating a second decision history.

Append this section to old issues only when curation is confirmed or when drafting a new issue contract:

```markdown
# Curation status

State: open | in-progress | pr-ready | merged | done | superseded | follow-up-needed

Linked PRs:
- <PR URL>: <status and relevance>

Follow-up issues:
- <issue URL or none>

Closure evidence:
- <merged PR, commit, validation, verifier, human confirmation>

Snapshot reconciliation:
- Canonical Issue: <URL/path, host revision when exposed, exact full-body SHA-256>
- Verified snapshot: <repository/ref, commit, tree digest, dirty/generated boundary, capture time>
- Final snapshot: <repository/ref, commit, tree digest, dirty/generated boundary, capture time>
- Changed paths and diff summary: <none when tree-equivalent, otherwise exact inventory>
- Behavior impact: <impact assessment>
- Validations run: <commands/results bound to snapshot>
- Uncovered content: <none or content outside verifier coverage>
- Freshness classification: tree-equivalent | reverified | human-waived | contract-changing | unresolved

Human waiver (only for human-waived):
- Reason and scope: <why and exactly what is accepted>
- Confirmer and confirmation time: <identity and timestamp>
- Residual risks: <remaining risks>
- Verifier coverage statement: <old result covers only verified snapshot; final tree is human-waived, not verifier PASS>
```

Use `Change history` for contract changes. Use `Curation status` only for lifecycle state, issue/PR linkage, closure evidence, and snapshot reconciliation.

## Lifecycle Vocabulary and Mapping

Persist only these Issue states: `open`, `in-progress`, `pr-ready`, `merged`, `done`, `superseded`, and `follow-up-needed`.

- Runtime decisions such as `plan-ready`, `blocked`, or `needs-human`, verifier results such as `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, or `NEEDS_HUMAN`, and curator freshness classifications are evidence or gates, never persisted completion states.
- Lifecycle assessments map as follows: `active` to `open` or `in-progress`; `implemented-but-open` to `pr-ready` or `merged` according to hosted evidence; `needs-follow-up` to `follow-up-needed`; `superseded` to `superseded`; `duplicate-or-related` and `unclear` require a human decision and do not imply a state mutation.
- Allowed forward transitions are `open` to `in-progress` or `superseded`; `in-progress` to `pr-ready`, `follow-up-needed`, or `superseded`; `pr-ready` to `in-progress`, `merged`, `follow-up-needed`, or `superseded`; `merged` to `done` or `follow-up-needed`; and `follow-up-needed` to `done` once the current contract's closure record and follow-up linkage are confirmed. `done` and `superseded` are terminal for this curation pass.
- `tree-equivalent`, `reverified`, and complete `human-waived` classifications can satisfy only the freshness gate. `contract-changing` and `unresolved` block closure. All other closure requirements and explicit user confirmation still apply.
- Labels are optional, non-normative presentation aids. A missing or stale label never changes the persisted Issue state or any gate.

## Closure Recommendation

Recommend closing an issue only when all of these are true:

- a merged PR/MR or explicit local commit evidence exists;
- PR/MR evidence maps to the issue acceptance criteria;
- no unresolved acceptance criteria, `NEEDS_HUMAN`, required follow-up, or verifier blocker remains;
- snapshot reconciliation is `tree-equivalent`, `reverified`, or complete `human-waived`; `contract-changing` and `unresolved` block closure;
- required closure context is in closure evidence or a linked follow-up, not only comments;
- the close comment can include closure evidence;
- the user explicitly confirms closure.

If any condition is missing, recommend the canonical state `follow-up-needed`, the optional label `agent-curation-needed`, or no mutation instead of closure.

## Optional Labels

Labels are helpful but not required for correctness. Use them only after confirmation:

- `agent-active`
- `agent-done`
- `agent-follow-up`
- `agent-superseded`
- `agent-curation-needed`

`Curation status` is the sole lifecycle source of truth. Labels are optional presentation aids and must never drive readiness, execution, verification, or closure decisions. When labels are unavailable or mutation is not confirmed, record equivalent status in `Curation status` or the curation plan.

## Output Format

For a plan, output:

```markdown
Curator decision: plan-ready | needs-human | blocked

Evidence inspected:
- <issue, PR/MR, comments, branch, commit, local files>

Issue/PR map:
- <issue>: <lifecycle assessment and evidence>

Snapshot reconciliation:
- <verified snapshot, final snapshot, changed paths/diff summary, behavior impact, validations, uncovered content, and exactly one freshness classification>

Recommended mutations:
- <exact mutation>: pending user confirmation

Do not mutate yet:
- <explicitly state no hosted state was changed>

Open questions:
- <only if needed>
```

After confirmed mutations, output:

```markdown
Curator result: applied | partially-applied | blocked

Applied mutations:
- <URL or ref>: <mutation>

Remaining unresolved items:
- <item or none>
```
