---
name: power-grill
description: Run a persistent grill-me-style pre-implementation interview across scope, risks, contracts, validation, and stop conditions, then turn the clarified coding task into a durable issue contract, ready-to-run Codex /goal, and PR/MR evidence template. This skill is self-contained and does not require the original grill-me skill.
---

# Power Grill

## Overview

Turn a vague or half-clear coding task into an execution-ready task contract before implementation starts. The main value is the multi-round grilling process; the issue body, `/goal`, and PR/MR template are generated only after the task has been stress-tested from multiple angles.

This skill incorporates the core idea of grill-me-style pre-implementation questioning, but it is self-contained and does not require the original grill-me skill to be installed.

The output is:

1. a clarified task summary;
2. an issue body or local issue brief;
3. a ready-to-run Codex `/goal`;
4. a PR/MR evidence template.

Do not implement code during this skill.
Do not automatically start `/goal`.
Do not create hosted issues, pull requests, or merge requests by default.

After the user reviews the generated issue body, you may create the hosted issue only if the user explicitly confirms and a supported CLI such as `gh` or `glab` is available. PR/MR creation normally belongs to the implementation phase after `/goal` has run.

## When To Use

Use this skill when the user wants to turn a coding task into a bounded implementation contract, especially before handing the task to Codex through `/goal`.

Good inputs:

- "Grill me on this implementation idea."
- "Turn this feature into an issue and goal."
- "Help me prepare a Codex task contract."
- "Before implementation, make sure the scope and validation are clear."

Do not use this skill for early product exploration where the expected output is a long-lived spec. Use `power-think` for that.

Do not use this skill for independent critique of an existing spec, plan, conversation, or model reply. Use `power-critic` for that.

## Phase 1: Inspect Before Asking

Before asking the user, inspect the repository when possible.

Look for:

- `README.md`
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `CONTRIBUTING.md`
- `package.json`, `pyproject.toml`, `go.mod`, `pom.xml`
- `docs/`, `docs/adr/`
- `CONTEXT.md`, `CONTEXT-MAP.md`
- existing issue or PR templates
- GitHub, GitLab, `gh`, or `glab` host rules, especially repository URL rules in `AGENTS.md`
- test, lint, typecheck, and build commands
- modules, files, or workflows named by the user

If a question can be answered by reading code or docs, answer it yourself and state the assumption:

```text
I found <evidence>, so I will assume <assumption>. Correct me if that is wrong.
```

After inspection, briefly summarize:

- the likely change area;
- relevant files or modules;
- validation commands found or missing;
- assumptions that still need user confirmation.

## Phase 2: Grill The User

Interview the user until the task is clear enough to become a bounded implementation goal.

Ask 1 to 3 questions at a time, but do not stop after one batch unless the task is genuinely trivial and all readiness criteria below are satisfied. This skill should feel like a persistent design interview, not a short intake form.

Run multiple rounds. After each user answer:

1. update the working understanding;
2. identify what is still ambiguous;
3. inspect the repository again if the answer names files, modules, commands, APIs, or constraints you can verify;
4. ask the next 1 to 3 highest-leverage questions.

Each question must include:

1. why it matters;
2. your recommended default answer;
3. a request for the user to confirm or correct it.

Cover these areas before moving to Phase 3:

- objective;
- current problem and current workaround;
- user-facing behavior;
- scope;
- non-goals;
- affected modules;
- owner or decision driver;
- dependencies and blockers;
- API or data contract changes;
- auth and permission boundaries;
- security and privacy impact;
- compatibility requirements;
- migration or rollback needs;
- rollout plan;
- observability and debug signals;
- documentation impact;
- tests and validation commands;
- acceptance criteria;
- risky assumptions;
- stop condition;
- pause-and-ask conditions.

Do not treat a topic as covered just because it was mentioned. It is covered only when it has a concrete decision, a repository-derived assumption, or an explicit "not applicable" decision.

Use this coverage matrix internally during the interview:

```text
Objective: unknown | assumed | confirmed
Current problem/workaround: unknown | assumed | confirmed
User-facing behavior: unknown | assumed | confirmed
Scope: unknown | assumed | confirmed
Non-goals: unknown | assumed | confirmed
Affected modules: unknown | assumed | confirmed
Owner/driver: unknown | assumed | confirmed
Dependencies/blockers: unknown | none | assumed | confirmed
API/data contract: unknown | none | assumed | confirmed
Auth/permissions: unknown | none | assumed | confirmed
Security/privacy: unknown | none | assumed | confirmed
Compatibility/migration/rollback: unknown | none | assumed | confirmed
Rollout/rollback: unknown | none | assumed | confirmed
Observability: unknown | none | assumed | confirmed
Documentation: unknown | none | assumed | confirmed
Validation: unknown | assumed | confirmed
Acceptance criteria: unknown | assumed | confirmed
Risks/assumptions: unknown | assumed | confirmed
Stop condition: unknown | assumed | confirmed
Pause-and-ask conditions: unknown | assumed | confirmed
```

Use this question format:

```markdown
I need to confirm 3 boundaries:

1. <question>
   - Why it matters: <reason>
   - Recommended default: <default>
   - Please confirm or correct: <specific ask>
```

Before moving to Phase 3, show a short readiness check:

```markdown
Readiness check:
- Confirmed:
  - <item>
- Still assumed:
  - <item and default>
- Explicitly out of scope:
  - <item>
```

Then ask whether to continue grilling or generate the issue contract. Recommend continuing if any high-risk area is still assumed.

Do not produce the issue body, `/goal`, or PR/MR template until one of these is true:

- all coverage matrix items are confirmed, repository-derived, or explicitly not applicable;
- the user explicitly says to stop grilling and proceed;
- after at least two rounds of questions, only low-risk assumptions remain and you have shown them in the readiness check.

If the user asks to skip questions, ask the single most important remaining boundary question, then proceed only after stating the assumptions you will carry into the issue contract.

## Phase 3: Produce Issue Context

When enough information is available, produce an issue body or local issue brief.

When generating the issue body, read and fill `assets/issue-body.md`.

The issue is the task contract. Keep it specific to this task. Do not turn it into project-wide documentation.

Optionally save local context files when useful:

- `.codex/power-grill/issue-brief.md`
- `.codex/power-grill/goal.md`
- `.codex/power-grill/pr-body.md`

Prefer existing repository conventions if they conflict with these paths.

## Phase 4: Optional Hosted Issue Creation

Do not create a hosted issue by default.

After producing the issue body, ask the user to review it. If the user explicitly confirms issue creation and a supported CLI is available, create the issue.

Before creating any hosted issue, inspect repository guidance such as `AGENTS.md`, issue templates, and remotes to determine whether the project uses GitHub or GitLab. Follow project-specific host rules over generic defaults.

If project guidance specifies a canonical GitLab remote or says to use `glab -R <full repository URL>`, preserve that exact full URL form in generated commands. Do not replace it with shorthand such as `group/project`.

When the user confirms issue creation:

- For GitHub or `gh`, read `references/github-issue-creation.md`.
- For GitLab or `glab`, read `references/gitlab-issue-creation.md`.
- If host rules are unclear, stop and ask before running a creation command.

## Phase 5: Produce Ready-To-Run /goal

After the issue body is finalized, produce a ready-to-run Codex `/goal`.

Do not automatically execute `/goal`.
Tell the user to review it and manually run it if they want Codex to start implementation.

The `/goal` must include:

- issue number, issue URL, or local issue brief path;
- objective;
- scope;
- non-goals;
- checkpoints;
- validation commands or validation discovery instructions;
- acceptance criteria evidence requirement;
- progress log requirement;
- pause-and-ask conditions;
- draft PR/MR requirement;
- no-merge rule;
- no protected-branch push rule.

When generating the `/goal`, read and fill `assets/codex-goal.txt`.

## Phase 6: PR/MR Evidence Contract

When generating the PR/MR evidence template, read and fill `assets/pr-body.md`.

Never merge PRs or MRs.
Never push directly to `main`, `master`, `release`, or protected branches.
Prefer draft PRs or draft MRs for agent-generated implementation work.

## Final Response Format

At the end of the power-grill phase, output:

1. Clarified summary
2. Issue body
3. Optional hosted issue creation note or command
4. Ready-to-run `/goal`
5. PR/MR evidence template
6. Clear instruction that the user should review and manually run `/goal` if they want Codex to start implementation
