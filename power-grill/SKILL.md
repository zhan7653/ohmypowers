---
name: power-grill
description: Grill the user before implementation, turn a clarified coding task into a durable issue contract, then produce a ready-to-run Codex /goal and PR evidence template. This skill is self-contained and does not require the original grill-me skill.
---

# Power Grill

## Overview

Turn a vague or half-clear coding task into an execution-ready task contract before implementation starts.

This skill incorporates the core idea of grill-me-style pre-implementation questioning, but it is self-contained and does not require the original grill-me skill to be installed.

The output is:

1. a clarified task summary;
2. a GitHub issue body or local issue brief;
3. a ready-to-run Codex `/goal`;
4. a PR evidence template.

Do not implement code during this skill.
Do not automatically start `/goal`.
Do not create GitHub issues or PRs by default.

After the user reviews the generated issue body, you may create the GitHub issue only if the user explicitly confirms and `gh` is available. PR creation normally belongs to the implementation phase after `/goal` has run.

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

Ask 1 to 3 questions at a time. Each question must include:

1. why it matters;
2. your recommended default answer;
3. a request for the user to confirm or correct it.

Focus on:

- objective;
- current problem;
- user-facing behavior;
- scope;
- non-goals;
- affected modules;
- API or data contract changes;
- auth and permission boundaries;
- compatibility requirements;
- migration or rollback needs;
- tests and validation commands;
- risky assumptions;
- stop condition;
- pause-and-ask conditions.

Use this question format:

```markdown
I need to confirm 3 boundaries:

1. <question>
   - Why it matters: <reason>
   - Recommended default: <default>
   - Please confirm or correct: <specific ask>
```

If the user asks to skip questions, ask the single most important remaining boundary question, then proceed with explicit assumptions.

## Phase 3: Produce Issue Context

When enough information is available, produce a GitHub issue body or local issue brief.

Use this structure:

```markdown
# Problem

<What problem exists today.>

# Goal

<What this task must accomplish.>

# Scope

- <in-scope item>

# Non-goals

- <out-of-scope item>

# Current context

<Relevant repository, system, or workflow context discovered during inspection.>

# Relevant files and modules

- `<path>`: <why it is relevant>

# Proposed approach

<Smallest defensible approach.>

# API / data contract changes

<Endpoints, schemas, config, env vars, migrations, or "None expected".>

# Risks and assumptions

- <risk or assumption>

# Validation plan

- Run: `<command>`

# Stop condition

<Observable condition that means the task is complete.>

# Pause-and-ask conditions

- <condition that requires user input before continuing>

# Implementation checklist

- [ ] <checkpoint>
```

The issue is the task contract. Keep it specific to this task. Do not turn it into project-wide documentation.

Optionally save local context files when useful:

- `.codex/power-grill/issue-brief.md`
- `.codex/power-grill/goal.md`
- `.codex/power-grill/pr-body.md`

Prefer existing repository conventions if they conflict with these paths.

## Phase 4: Optional GitHub Issue Creation

Do not create a GitHub issue by default.

After producing the issue body, ask the user to review it. If the user explicitly confirms issue creation and `gh` is available, create the issue.

Recommended flow:

1. Check `gh auth status`.
2. Write the reviewed issue body to a local file such as `.codex/power-grill/issue-brief.md`.
3. Create the issue with `gh issue create --title "<title>" --body-file <path>`.
4. If optional labels are missing, retry without labels or ask the user.
5. Return the issue number and URL.
6. Update the ready-to-run `/goal` so it references the real issue.

Do not create a PR during the pre-goal grilling phase unless the user explicitly asks and there is already an implementation branch to publish.

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
- progress log requirement;
- pause-and-ask conditions;
- draft PR requirement;
- no-merge rule;
- no protected-branch push rule.

Use this template:

```text
/goal Implement <issue-ref>. Read the issue or local issue brief first and treat it as the task contract.

Objective:
<one-sentence objective>

Scope:
- <scope item>

Non-goals:
- <non-goal>

Work in checkpoints:
1. Inspect the current implementation and relevant docs.
2. Make the smallest safe implementation changes.
3. Add or update tests.
4. Run validation commands.
5. Update documentation if needed.
6. Create a draft PR linked to <issue-ref>.

Validation:
- Run: <command>
If these commands do not exist, discover the closest existing validation commands in the repo and document what was run.

Progress:
Keep a short progress log in the PR body or a local note.

Pause and ask if:
- required credentials or secrets are missing;
- the task requires changing auth or permission boundaries;
- implementation requires expanding scope beyond the issue;
- tests fail for reasons not clearly related to this task;
- existing code contradicts the issue contract;
- database migrations or destructive data changes are needed.

PR requirement:
When complete, create a draft PR linked to <issue-ref>. The PR body must include summary, rationale, tests run, evidence, risks, assumptions, out-of-scope items, and reviewer checklist.

Do not merge the PR.
Do not push directly to main, master, release, or protected branches.
```

## Phase 6: PR Evidence Contract

Produce this PR body template for the eventual implementation PR:

```markdown
# Summary

<What changed.>

# Linked issue

Closes <issue-ref>

# What changed

- <change>

# Why this approach

<Rationale and important tradeoffs.>

# Tests run

- `<command>`

# Evidence

- <test output, screenshot, log, or behavior proof>

# Risks / assumptions

- <risk or assumption>

# Out of scope

- <explicit non-goal>

# Reviewer checklist

- [ ] Check core behavior
- [ ] Check auth and permission boundaries
- [ ] Check error handling
- [ ] Check test coverage
- [ ] Check docs or usage notes
```

Never merge PRs.
Never push directly to `main`, `master`, `release`, or protected branches.
Prefer draft PRs for agent-generated implementation work.

## Final Response Format

At the end of the power-grill phase, output:

1. Clarified summary
2. Issue body
3. Optional GitHub issue creation note or command
4. Ready-to-run `/goal`
5. PR evidence template
6. Clear instruction that the user should review and manually run `/goal` if they want Codex to start implementation
