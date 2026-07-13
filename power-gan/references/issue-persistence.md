# Issue Persistence

Read this reference only when `$power-gan` has decided that a task needs a hosted Issue or an existing Decision Record must change.

## Shared Flow

1. Read project guidance, Issue templates, and `git remote -v`. Identify the exact host and repository. If remotes or host rules conflict, ask before writing.
2. Build the Issue body from confirmed material decisions only. Use a temporary file outside the repository, such as `/tmp/power-gan-decision-record.md`; do not create a project decision Markdown file or copy the grill transcript.
3. Create or update hosted state only after the user has explicitly requested or confirmed that mutation. Confirmation of one material decision is not automatically permission for unrelated labels, assignees, milestones, or projects.
4. Re-read the resulting Issue and verify the title, body, `Decision revision`, state, and URL. Report any mismatch instead of claiming persistence succeeded.
5. Return the Issue URL. Keep optional labels non-normative.

Use this compact body shape:

```markdown
# Decision Record

Decision status: proposed | confirmed | delivering | delivered | superseded
Decision revision: 1

## Outcome
<observable result>

## Scope / non-goals
- In: <boundary>
- Out: <boundary>

## Material decisions
- Decision: <confirmed material decision>
  Why: <short rationale>
  Alternative not chosen: <include only when it explains a non-obvious boundary or avoids repeated debate; otherwise omit this line>

## Accepted cost / risk
- <accepted tradeoff or none>

## Stop / reopen conditions
- <condition>
```

Do not invent alternatives to complete the template or preserve a full option history.

Use this compact comment shape for a Decision Note:

```markdown
## Decision Note

Change: <material change, authorization, split, pause, or completion event>
New evidence or objection: <short evidence, objection, or none>
Confirmed decision: <the user-confirmed result>
Rationale: <why>
Confirmed by: <source of confirmation>
```

Do not post a Decision Note for ordinary implementation detail or copy the conversation transcript.

## GitHub CLI

1. Check `gh auth status` when authentication is not already established.
2. Use an explicit repository when it is known:

```bash
gh issue create --repo <host/owner/repo> --title "<title>" --body-file /tmp/power-gan-decision-record.md
gh issue edit <number-or-url> --repo <host/owner/repo> --body-file /tmp/power-gan-decision-record.md
gh issue view <number-or-url> --repo <host/owner/repo> --json number,title,body,state,url
```

For a confirmed Decision Note:

```bash
gh issue comment <number-or-url> --repo <host/owner/repo> --body-file /tmp/power-gan-decision-note.md
```

## GitLab CLI

1. Check `glab auth status` when authentication is not already established.
2. Follow project guidance for `-R`. For self-hosted GitLab, use the full repository URL when required; do not silently replace it with `group/project`.
3. Current `glab` accepts the description as a string:

```bash
glab issue create -R <repository-or-full-url> -t "<title>" -d "$(cat /tmp/power-gan-decision-record.md)" -y
glab issue update <id> -R <repository-or-full-url> -d "$(cat /tmp/power-gan-decision-record.md)"
glab issue view <id-or-url> -R <repository-or-full-url>
```

For a confirmed Decision Note:

```bash
glab issue note <id> -R <repository-or-full-url> -m "$(cat /tmp/power-gan-decision-note.md)"
```

## Delivery Link

The delivery PR/MR must explicitly mention the Decision Issue. Use closing syntax only when merging that PR/MR should complete the Issue; otherwise use a plain Issue URL or non-closing relationship. Re-read the PR/MR link before closing the Issue.
