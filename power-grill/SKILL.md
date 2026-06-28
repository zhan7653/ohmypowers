---
name: power-grill
description: Run a persistent grill-me-style pre-implementation interview across scope, risks, contracts, validation, and stop conditions, then produce an issue draft for user confirmation. After the issue is created or saved as a local brief, generate a ready-to-run Codex /goal. This skill is self-contained and does not require the original grill-me skill.
---

# Power Grill

## Overview

Turn a vague or half-clear coding task into an execution-ready task contract before implementation starts. The main value is the multi-round grilling process; the issue draft is generated first, then the `/goal` is generated only after the user confirms the issue and it exists as a hosted issue or local brief.

This skill incorporates the core idea of grill-me-style pre-implementation questioning, but it is self-contained and does not require the original grill-me skill to be installed.

The output is:

1. a clarified task summary;
2. an issue draft for user review;
3. after confirmation, a hosted issue or local issue brief;
4. after the issue exists, a ready-to-run Codex `/goal`.

Do not implement code during this skill.
Do not generate or start `/goal` before the user confirms the issue draft and the contract exists as a hosted issue or local brief.
Do not create hosted issues, pull requests, or merge requests by default.

After the user reviews the generated issue body, you may create the hosted issue only if the user explicitly confirms and a supported CLI such as `gh` or `glab` is available. If hosted issue creation is not available or not desired, save a local issue brief after user confirmation. PR/MR creation and PR/MR body generation belong to the implementation phase after `/goal` has run.

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
- dependencies and blockers;
- API or data contract changes;
- auth and permission boundaries;
- security, privacy, compatibility, migration, or rollback concerns when relevant;
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
Dependencies/blockers: unknown | none | assumed | confirmed
API/data contract: unknown | none | assumed | confirmed
Auth/permissions: unknown | none | assumed | confirmed
Security/privacy/compatibility/migration/rollback: unknown | none | assumed | confirmed
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

Do not produce the issue draft until one of these is true:

- all coverage matrix items are confirmed, repository-derived, or explicitly not applicable;
- the user explicitly says to stop grilling and proceed;
- after at least two rounds of questions, only low-risk assumptions remain and you have shown them in the readiness check.

If the user asks to skip questions, ask the single most important remaining boundary question, then proceed only after stating the assumptions you will carry into the issue contract.

## Phase 3: Produce Issue Draft

When enough information is available, produce an issue draft for user review.

When generating the issue body, read and fill `assets/issue-body.md`.

The issue body is the sole canonical task contract. Keep it specific to this task. Do not turn it into project-wide documentation.

If the task contract changes, update the issue body and append a concise entry to the `Change history` section at the bottom of the issue body. Use `Change history` only for contract-level changes, not ordinary implementation progress.

After the current issue is completed, put new phases, new features, or substantial follow-up work in a new linked follow-up issue instead of reopening or extending the completed issue.

Do not generate `/goal` in this phase. Ask the user to review and confirm the issue draft first.

## Phase 4: Confirm Issue Contract

After the user confirms the issue draft, create or save the issue contract before generating `/goal`.

Options:

- If the user explicitly confirms hosted issue creation and a supported CLI is available, create the hosted issue.
- If hosted issue creation is unavailable or the user prefers local-only flow, save the confirmed issue body to a local brief such as `.codex/power-grill/issue-brief.md`.

Prefer existing repository conventions if they conflict with the local brief path.

Before creating any hosted issue, inspect repository guidance such as `AGENTS.md`, issue templates, and remotes to determine whether the project uses GitHub or GitLab. Follow project-specific host rules over generic defaults.

If project guidance specifies a canonical GitLab remote or says to use `glab -R <full repository URL>`, preserve that exact full URL form in generated commands. Do not replace it with shorthand such as `group/project`.

When the user confirms issue creation:

- For GitHub or `gh`, read `references/github-issue-creation.md`.
- For GitLab or `glab`, read `references/gitlab-issue-creation.md`.
- If host rules are unclear, stop and ask before running a creation command.

After the hosted issue is created or local brief is saved, record the issue URL, issue number, or local brief path. This reference is required before generating `/goal`.

## Phase 5: Produce Ready-To-Run /goal

After the hosted issue is created or the local issue brief is saved, produce a ready-to-run Codex `/goal`.

Do not automatically execute `/goal`.
Tell the user to review it and manually run it if they want Codex to start implementation.

The `/goal` must include:

- issue number, issue URL, or local issue brief path;
- instruction to treat the issue body as the sole task contract;
- checkpoints;
- validation commands or validation discovery instructions;
- acceptance criteria evidence requirement;
- progress log requirement;
- pause-and-ask conditions;
- draft PR/MR requirement;
- no-merge rule;
- no protected-branch push rule.

When generating the `/goal`, read and fill `assets/codex-goal.txt`.

## Phase 6: PR/MR Evidence Requirements

Do not output a full PR/MR body during power-grill. The PR/MR body should be generated during the implementation phase after code changes and validation exist.

When generating `/goal`, include the requirement that the implementation phase creates a draft PR or MR with evidence mapped to the issue acceptance criteria and stop condition. The implementation phase may read `assets/pr-body.md` when it needs a PR/MR body template.

Never merge PRs or MRs.
Never push directly to `main`, `master`, `release`, or protected branches.
Prefer draft PRs or draft MRs for agent-generated implementation work.

## Final Response Format

At the end of the power-grill phase, output:

1. Clarified summary
2. Issue draft
3. Ask the user to confirm the draft and choose hosted issue creation or local brief

After the user confirms and the hosted issue or local brief exists, output:

1. Issue reference
2. Ready-to-run `/goal`
3. Clear instruction that the user should review and manually run `/goal` if they want Codex to start implementation
