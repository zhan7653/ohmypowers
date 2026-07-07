---
name: power-curator
description: Manually curate Loop Engineering issue, PR, comment, label, branch, and local git state. Use when Codex needs to reconcile accumulated issues, merged PRs that did not close issues, follow-up work, comment-only context, duplicate or superseded contracts, or post-merge/post-change issue lifecycle state.
---

# Power Curator

## Overview

Curate Loop Engineering issue and PR lifecycle state after task contracts, implementation loops, reviews, or merges. The skill produces a curation plan first, asks for explicit confirmation before every GitHub or GitLab mutation, and treats the issue body as canonical.

`power-curator` is not an implementation verifier. Use `power-verifier` to decide whether an implementation satisfies a contract; use `power-curator` to organize, link, update, close, or split issue lifecycle records after the evidence exists.

## Hard Boundaries

You must not:

- run as a daemon, scheduler, webhook, background scanner, cron job, database, or persistent index;
- mutate PRs/MRs, milestones, assignees, or branches;
- mutate issue bodies, issue comments, issue labels, issue closure state, or follow-up issue creation without explicit user confirmation of the exact mutation;
- auto-close issues;
- rewrite old issue contracts wholesale;
- treat comments as the canonical task contract;
- approve, merge, or retarget PRs/MRs;
- decide implementation correctness without `power-verifier` evidence when correctness is in question.

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
2. Build a conservative issue/PR map.
   - Prefer candidates with concrete evidence over broad keyword matches.
   - Include open and closed issues; treat closed issues as historical context.
   - Do not collapse issues together without user confirmation.
3. Classify each relevant issue.
   - `active`: still the current contract for unfinished work.
   - `implemented-but-open`: has merged PR or explicit local commit evidence and may be ready to close.
   - `needs-follow-up`: current contract is complete or partially complete, but new work belongs in a linked follow-up issue.
   - `superseded`: another issue is now the canonical contract.
   - `duplicate-or-related`: overlaps another issue but needs user confirmation.
   - `unclear`: evidence is insufficient to recommend mutation.
4. Produce a curation plan before mutations.
   - List evidence inspected.
   - List candidate links and why they match.
   - Propose exact issue body, comment, label, close, or follow-up mutations.
   - Mark every mutation as pending confirmation.
   - Ask the user to confirm the exact mutations to apply.
5. Apply only confirmed mutations.
   - Update or append `Curation status` in the issue body.
   - Add/update issue comments only when confirmed.
   - Add/update labels only when confirmed.
   - Close issues only when confirmed and closure requirements are satisfied.
   - Create follow-up issues only when confirmed.
6. Report final state.
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

## Canonical Issue Body

Use the issue body as canonical. If important context exists only in comments, propose promoting the short current truth into `Curation status` or creating a linked follow-up issue.

Append this section to old issues only when curation is confirmed or when drafting a new issue contract:

```markdown
# Curation status

State: open | in-progress | pr-ready | merged | done | superseded | follow-up-needed

Linked PRs:
- <PR URL>: <status and relevance>

Latest canonical context:
<short current truth>

Decisions since contract:
- <decision>

Follow-up issues:
- <issue URL or none>

Closure evidence:
- <merged PR, commit, validation, verifier, human confirmation>
```

Use `Change history` for contract changes. Use `Curation status` for lifecycle truth, issue linkage, closure evidence, and comment-derived context that must not remain comment-only.

## Closure Recommendation

Recommend closing an issue only when all of these are true:

- a merged PR/MR or explicit local commit evidence exists;
- PR/MR evidence maps to the issue acceptance criteria;
- no unresolved acceptance criteria, `NEEDS_HUMAN`, required follow-up, or verifier blocker remains;
- important context is in `Curation status`, not only comments;
- the close comment can include closure evidence;
- the user explicitly confirms closure.

If any condition is missing, recommend `follow-up-needed`, `agent-curation-needed`, or no mutation instead of closure.

## Optional Labels

Labels are helpful but not required for correctness. Use them only after confirmation:

- `agent-active`
- `agent-done`
- `agent-follow-up`
- `agent-superseded`
- `agent-curation-needed`

When labels are unavailable or mutation is not confirmed, record equivalent status in `Curation status` or the curation plan.

## Output Format

For a plan, output:

```markdown
Curator decision: plan-ready | needs-human | blocked

Evidence inspected:
- <issue, PR/MR, comments, branch, commit, local files>

Issue/PR map:
- <issue>: <classification and evidence>

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
