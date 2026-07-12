---
name: power-grill
description: Turn a vague or half-clear coding task, or an existing reviewed spec, into a requirements-focused issue contract through targeted pre-implementation questioning. Cover behavior, scope, external contracts, risks, validation expectations, and stop conditions; persist the confirmed contract for later repository-aware planning by power-loop.
---

# Power Grill

## 输出语言

默认使用简体中文输出澄清摘要、提问、Issue 草稿、确认请求和持久化 Issue/本地合同。代码标识符、路径、命令、API、digest、状态枚举及必须精确匹配的原文保持不变。仅当用户明确要求其他语言时切换。

## Overview

Produce a requirements-ready issue contract before implementation starts. The Task Contract is the sole normative contract. The complete persisted Issue body still supplies source identity and lifecycle context, but later planning references and execution artifacts are non-normative. Own what must change, why it matters, externally observable behavior, externally meaningful contracts, boundaries, risks, validation expectations, and completion conditions.

Leave exact files, private interfaces, internal flow, test seams, concrete commands, implementation order, ownership, and subagent routing to execution-time repository inspection or `power-loop` when a persisted Blueprint is justified.

The output is a clarified summary, a related-issue recommendation, an issue draft, and—after explicit confirmation—a hosted issue or persisted local brief. Do not implement code, start execution, create PRs/MRs, or create/update hosted issues by default.

## Inputs

Accept:

- a vague or half-clear coding task;
- a request for an issue contract;
- a reviewed `power-think` spec or equivalent confirmed spec;
- an existing issue that needs requirement-level revision.

Use `power-think` instead when the user still wants product exploration or a long-lived spec. Use `power-critic` for independent critique.

## Workflow

### 1. Inspect Requirement Facts

Before asking questions, inspect only enough repository and hosted context to avoid asking the user for discoverable requirement facts.

Read relevant project guidance, existing specs, user-facing behavior, external API/schema/config documentation, compatibility or security constraints, issue templates, and directly related issues or comments. Do not precompute exact affected files, internal interfaces, implementation flow, test commands, branch/worktree choices, or task ownership.

When repository evidence answers a requirement question, state the evidence and assumption and ask the user to correct it only if necessary.

Summarize:

- current user or operator problem;
- externally visible behavior and contract facts;
- material constraints or risks;
- unresolved requirement assumptions;
- obvious related issue candidates and the current update/follow-up/new recommendation.

### 2. Use The Reviewed-Spec Fast Path When Available

When the input is a reviewed spec, map its confirmed content into the compact Task Contract before asking anything:

- background/problem, objective, and user behavior -> Problem and observable outcome;
- functional requirements and exclusions -> Scope and non-goals;
- dependencies, public API, schema, config, compatibility, permission, security, migration, and business decisions -> External constraints and dependencies;
- risks and premises -> Risks and assumptions;
- acceptance criteria and validation -> Acceptance and validation.

Ask only for fields that remain absent, contradictory, or too vague, especially external decisions, acceptance evidence, pause conditions, or issue lifecycle choice. Do not repeat multi-round grilling when the mapped contract is already complete. Show the readiness check, then offer the issue draft.

### 3. Grill Only The Missing Requirement Boundaries

For non-spec input, interview in focused rounds of one to three questions. After each answer, update the working understanding, inspect newly named requirement evidence when useful, and ask only the highest-leverage unresolved questions.

Each question must explain why it matters, provide a recommended default, and ask the user to confirm or correct it.

Cover or explicitly mark not applicable:

- current problem and observable outcome;
- scope, non-goals, dependencies, and blockers;
- external API, schema, config, compatibility, auth, permission, security, privacy, migration, rollback, and business decisions when relevant;
- constraints, risks, observable acceptance/validation evidence, and pause-and-ask conditions.

Do not ask the user to choose internal function signatures, private module boundaries, exact paths, internal control flow, error-handling shape, test seams, commands, implementation order, ownership, or Agent assignments unless they are externally meaningful requirements.

Treat a topic as covered only when it has a confirmed decision, a stated repository-derived assumption, or an explicit not-applicable decision.

Before drafting, show:

```markdown
Readiness 检查：
- 已确认：
  - <item>
- 仍为假设：
  - <item and default>
- 明确不在范围内：
  - <item>
```

Generate the draft when all requirement fields are resolved, the user explicitly asks to proceed with visible assumptions, or only low-risk assumptions remain after the readiness check. Keep grilling when a missing choice changes public behavior, compatibility, schema, security, permissions, migration, or a business rule.

Before offering one combined Issue, run a complexity and risk split gate. Classify the proposed delivery lane as:

- `LIGHT`: one bounded behavior or documentation change with no persistent global state, permission, migration, concurrency, destructive, or compatibility boundary;
- `STANDARD`: a multi-module or compatibility-sensitive feature whose risks remain local and reversible;
- `HIGH`: work involving persistent global or project configuration, authentication or authorization, sensitive data, migration, concurrency, destructive or irreversible behavior, or another security-critical boundary.

Recommend separate Issues when any of these are true:

- an independently useful `LIGHT` or `STANDARD` feature is bundled with a `HIGH`-risk mutation boundary;
- the request contains two or more independent risk domains that can be delivered and reviewed separately;
- generation, application, audit, revision, and deletion form separable lifecycle capabilities rather than one inseparable user outcome;
- the combined contract would require different implementation or review capabilities for independently valuable parts;
- the user can receive meaningful value before the high-risk boundary is implemented.

For a split recommendation, show the proposed Issue boundaries, dependencies, user value of each part, and recommended order. Ask the user to choose split delivery, one explicitly high-risk combined contract, or a safer reduced behavior such as generating an exact diff for manual application. Do not silently select the strongest transaction, concurrency, audit, recovery, or rollback guarantee from a broad word such as “safe”. Those guarantees require an explicit requirement-level decision when they materially change scope or cost.

Record the confirmed delivery lane and any accepted bundling decision in the Task Contract. If the user accepts a combined high-risk contract, state which safety guarantees are required and which stronger guarantees remain out of scope.

### 4. Produce The Issue Draft

Read and fill [assets/issue-body.md](assets/issue-body.md). Treat its `Task Contract` section as the sole canonical source for what and why.

Leave the marked Execution Blueprint reference section at `Planning status: not-generated`. `LIGHT` work may execute directly from the Issue. `power-loop` may later replace only that compact reference block for `STANDARD`, `HIGH`, explicit plan-review, or handoff needs. The runtime Final Review Record is created after implementation and is not stored in the Issue.

Search conservatively for directly related existing issues when hosted or local issue state is available. Recommend:

- update an open issue when the work belongs in its current canonical contract;
- create a linked follow-up when the prior issue is complete or should not expand;
- create a new issue when no candidate is a defensible canonical home.

Treat comments as supplementary evidence. Put durable requirement changes in the Task Contract and its `Change history`; put lifecycle truth in `Curation status`. The compact Execution Blueprint block records only its optional artifact reference, digests, and planning status. The Blueprint and runtime Final Review Record are non-normative; only the Task Contract defines conformance.

The Task Contract identity is SHA-256 over the exact persisted UTF-8 bytes from the document start to the byte immediately before `<!-- power-loop:execution-blueprint:start -->`, with no whitespace or newline normalization. Preserve the marked planning boundaries so `power-loop` can verify this digest before and after patching.

Ask the user to confirm the complete issue draft and related-issue recommendation. Do not start implementation.

### 5. Persist Only After Confirmation

After explicit confirmation, create, update, or save the contract:

- update the confirmed target issue body only when the user confirmed the exact target and body changes;
- create a linked follow-up or new hosted issue only when explicitly confirmed;
- otherwise save a local brief such as `.codex/power-grill/issue-brief.md`, respecting repository conventions.

Before hosted mutation, inspect project host guidance and remotes. For GitHub read [references/github-issue-creation.md](references/github-issue-creation.md); for GitLab read [references/gitlab-issue-creation.md](references/gitlab-issue-creation.md). Preserve any project-required full GitLab repository URL. Stop if the canonical host or target is unclear.

Record the resulting issue URL/number or local brief path. For a hosted Issue, also record host revision metadata when the host exposes it. A pasted-only contract is not sufficient for direct execution because the execution model and verifier need a stable persisted contract identity.

### 6. Hand Off For Execution

Stop after persistence. Return:

1. the issue URL/number or local brief path;
2. the readiness summary;
3. the next step: execute `LIGHT` directly, or run `power-loop` when a persisted Blueprint is justified.

Do not include internal interfaces, exact implementation paths, worktree choices, Agent/model assignments, iteration budgets, verifier prompts, or a PR/MR body.

## Output

Before persistence, output the clarified summary, complete issue draft, related-issue recommendation, and confirmation request.

After persistence, output the canonical reference, readiness summary, and confirmed delivery lane/split decision. State that `LIGHT` work can execute directly; recommend `power-loop` only when a persisted Blueprint is required.
