---
name: power-grill
description: Run a persistent grill-me-style pre-implementation interview across scope, risks, contracts, validation, and stop conditions, then produce an issue contract for user confirmation. After the issue is created or saved as a local brief, point the user to power-loop for bounded /goal generation. This skill is self-contained and does not require the original grill-me skill.
---

# Power Grill

## Overview

Turn a vague or half-clear coding task into an agent-ready issue contract before implementation starts. The main value is the multi-round grilling process; the issue draft is generated first, then saved as a hosted issue or local brief after the user confirms it.

This skill incorporates the core idea of grill-me-style pre-implementation questioning, but it is self-contained and does not require the original grill-me skill to be installed.

The output is:

1. a clarified task summary;
2. an issue draft for user review;
3. after confirmation, a hosted issue or local issue brief;
4. a clear next step to run `power-loop` on the hosted issue or local brief.

Do not implement code during this skill.
Do not generate or start `/goal`; bounded `/goal` generation belongs to `power-loop`.
Do not create hosted issues, pull requests, or merge requests by default.

After the user reviews the generated issue body, you may create the hosted issue only if the user explicitly confirms and a supported CLI such as `gh` or `glab` is available. If hosted issue creation is not available or not desired, save a local issue brief after user confirmation. PR/MR creation and PR/MR body generation belong to the implementation phase after `power-loop` has produced a bounded `/goal` and Codex has run it.

## When To Use

Use this skill when the user wants to turn a coding task into an issue contract, especially before handing the task to `power-loop`.

Good inputs:

- "Grill me on this implementation idea."
- "Turn this feature into an issue contract."
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
- implementation approach and code change shape;
- new files, modified files, and integration points;
- internal data flow, API flow, or control flow;
- error handling and fallback behavior;
- test seam and mock strategy;
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
Implementation approach: unknown | assumed | confirmed
Code change shape: unknown | assumed | confirmed
Data/API/control flow: unknown | assumed | confirmed
Error handling/fallbacks: unknown | assumed | confirmed
Test seam/mock strategy: unknown | assumed | confirmed
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

Before producing the issue draft, include at least one implementation-design round for non-trivial coding tasks. Ask about concrete code-level choices the repository inspection cannot answer, such as where the change should live, what interfaces or adapters should be introduced or reused, how data should flow through the system, how errors should be handled, and how the behavior should be tested. Keep these questions at the design-boundary level; do not write code or create a step-by-step implementation plan.

## Phase 3: Produce Issue Draft

When enough information is available, produce an issue draft for user review.

When generating the issue body, read and fill `assets/issue-body.md`.

The issue body is the sole canonical task contract. Keep it specific to this task. Do not turn it into project-wide documentation.

If the task contract changes, update the issue body and append a concise entry to the `Change history` section at the bottom of the issue body. Use `Change history` only for contract-level changes, not ordinary implementation progress.

After the current issue is completed, put new phases, new features, or substantial follow-up work in a new linked follow-up issue instead of reopening or extending the completed issue.

Do not generate `/goal` in this phase. Ask the user to review and confirm the issue draft first.

## Phase 4: Confirm Issue Contract

After the user confirms the issue draft, create or save the issue contract.

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

After the hosted issue is created or local brief is saved, record the issue URL, issue number, or local brief path. This reference is the input for `power-loop`.

## Phase 5: Hand Off To power-loop

After the hosted issue is created or the local issue brief is saved, stop at the issue contract and tell the user to run `power-loop`.

Do not generate a bounded implementation `/goal`.
Do not automatically execute `/goal`.
Tell the user to run `power-loop` on the hosted issue URL or local brief path when they want a bounded Codex implementation loop.

The handoff must include:

- issue number, issue URL, or local issue brief path;
- readiness summary;
- suggested status label such as `agent-ready`, when labels are used;
- next step: run `power-loop` on the issue URL or local brief.

Do not include worktree paths, iteration budgets, verifier prompts, full PR evidence tables, or a complete `/goal` in the issue handoff. Those are owned by `power-loop`.

## Phase 6: PR/MR Evidence Requirements

Do not output a full PR/MR body during power-grill. The PR/MR body should be generated during the implementation phase after code changes and validation exist.

The issue contract should include acceptance criteria, validation, stop conditions, and pause-and-ask conditions so `power-loop` can require a draft PR or MR with evidence mapped to the contract. The implementation phase may read `assets/pr-body.md` when it needs a PR/MR body template.

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
2. Readiness summary and suggested `agent-ready` status
3. Clear next step: run `power-loop` on the hosted issue URL or local brief to generate the bounded Codex `/goal`
