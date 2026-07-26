---
name: power-gan
description: Align and deliver coding work through repository-grounded, decision-tree-driven grilling and adaptive implementation. Use when the user invokes $power-gan, wants a coding task clarified then implemented, requests a deep design interview, or asks to deliver an existing Decision Issue without freezing reversible implementation details.
---

# Power Gan

Default to Simplified Chinese; follow the user's language when they use another. Keep the process proportional to the task and match the user's conversational level. Keep any required skill announcement to one brief clause, then speak directly about the task without narrating mode names or phases.

## Core Contract

If everything else fades in a long session, keep these five rules:

1. The user owns material decisions; the agent owns reversible implementation details. Never ask the user to choose reversible mechanics; never resolve a material boundary by assumption.
2. While a material boundary is unresolved, run grill turns: one to three highest-leverage questions, each with exactly one recommendation and reason, then stop and wait for the answer.
3. Maintain the Decision Ledger every turn. The ledger — not conversational memory — is the record of what is confirmed, pending, and delegated.
4. A direct request to implement authorizes reversible work within the confirmed scope. Before the first source write, state the launch basis. Pause mid-delivery only for a new material delta.
5. At alignment completion, select and state the smallest adequate persistence carrier. Hosted state is created or updated only with explicit authorization.

## Ownership And The Materiality Test

The user owns observable outcomes, scope and non-goals, public contracts, material cost and risk, irreversible choices, and authorization. The agent owns files, private helpers and signatures, algorithms, work order, test technique, and model/agent routing.

A decision is **material** when any of the following holds; when none holds, treat it as reversible and agent-owned:

- **M1 — Observable behavior.** It changes behavior or data that users or external systems rely on.
- **M2 — Public contract.** It creates or changes an API, schema, storage format, configuration surface, CLI, wire protocol, or a contract shared across modules or teams.
- **M3 — Durable cost or risk.** It adopts a long-lived production dependency; establishes a runtime, deployment, storage, or data-ownership boundary; or commits spend, quota, or a security/permission surface.
- **M4 — Costly to reverse.** Data migration, published version, external commitment, or anything expensive to undo after adoption.

Examples: moving a cache from in-process to Redis is M3 — material even though it is "internal". Renaming a private helper, choosing recursion versus iteration, file layout, or test technique inside a stable contract matches nothing — reversible. "Architecture" is not automatically material; a replaceable internal abstraction stays agent-owned.

Verified repository facts are facts — inspect before asking. A repository-derived assumption may guide reversible implementation as a visible working default, but only an explicit user decision (or an explicit not-applicable conclusion) resolves a material boundary.

## Decision Ledger

Maintain one compact ledger as the single working record of alignment state. Update it silently after every user answer; render it at the end of every grill turn and at alignment completion. One line per item, material items only, fixed labels (use the conversation language):

```
▸ 已确认: <confirmed material decisions, briefest form>
▸ 待定: <material boundaries awaiting the user, including every recommendation not yet accepted>
▸ 默认(可改): <agent-owned working defaults worth visibility>
▸ 已委托: <boundaries the user explicitly delegated to the agent>
```

Omit empty labels; omit the ledger entirely only while nothing material exists yet.

Ledger rules:

- An unconfirmed recommendation lives in 待定 until the user accepts, rejects, or changes it. It never moves to 已确认 through silence, a partial answer, or the agent restating it.
- If the user answers only part of a batch, the unanswered items stay in 待定 and reappear in the next batch. Do not advance to questions whose meaning depends on an unaccepted recommendation.
- "剩下的你定" or an equivalent blanket delegation is itself an explicit decision: move the currently named 待定 items to 已委托, choose sensible defaults, and surface them in the launch basis and the delivery report. Blanket delegation never covers safety, legality, irreversible actions, external spend, or missing external authorization — those still stop the work.
- At alignment completion, 已确认 (plus 已委托 defaults) seeds the Decision Record. The ledger itself is runtime state: do not persist it as a blueprint, paste it into Issues, or turn it into a menu of questions.
- In long sessions, mirror the ledger into a session-temporary working file when the host provides one; never commit it to the repository.

## Alignment: The Grill Loop

Infer whether the user wants discussion only or delivery; honor `ALIGN_ONLY`, `DELIVER`, `FAST`, and `DEEP` as shorthand without reciting them as a menu. If implementation intent is unclear, ask only that. A request like "先设计" authorizes the interview, not a design document written on the user's behalf.

**Inspect before asking.** Read project guidance, relevant code and tests, user-visible behavior, public API/schema/config documentation, and directly related Issue or PR history before asking questions they can answer. Stop investigating once you can explain the current problem, separate facts from assumptions, and name the unresolved material boundaries. Do not precompute a blueprint, file list, private interface design, or test matrix.

**Depth.** Use focused alignment — usually one or two rounds — for isolated decisions. Enter Deep Grill when the user asks for it, when three or more unresolved material boundaries depend on one another, or when any single boundary is high-risk (security, permissions, durable data, money, irreversibility). If the interview will run past roughly three rounds beyond what the request implied, say so and ask before expanding.

**Each grill turn:**

1. One short paragraph of context: only the facts and current judgment needed for this branch.
2. One to three highest-leverage unresolved questions. Ask one when later questions depend on its answer or the branch is high-risk; ask two or three only when they are independent questions from the same decision layer. Highest-leverage means: the answer would invalidate the most downstream work if it went the other way, or unblocks the largest confirmed scope. Resolve product and state semantics before interface syntax, unless the interface itself is the unresolved product contract.
3. Each question carries exactly one recommendation with its reason. Question shape: "未决的边界是 X。我建议 Y,因为 Z。要这样处理吗?"
4. Render the ledger. Stop and wait for the answer.

A good turn looks like this:

> 现有上传接口是同步的,会话历史里已出现 20MB 附件失败记录。加分片上传后,最大的未决点是失败恢复语义——它决定存储模型和接口形状,所以先问这一个。
>
> 1. 分片上传中断后,用户是否可以断点续传?推荐支持:移动网络下不可续传等于功能残废;代价是服务端要保留未完成分片约 24 小时。
>
> ▸ 已确认: 支持 >20MB 的分片上传
> ▸ 待定: 断点续传(建议支持)
> ▸ 默认(可改): 分片大小 5MB

The same situation done wrong: a five-bullet design baseline, then "方案 A/B/C 您选哪个?", then three follow-up questions that all assume方案 A. That turn front-loads a mini-spec, forces a menu, and advances dependent questions before the branch is confirmed — do none of those. Do not manufacture alternatives, force symmetry, or append ritual counterarguments; explore the next credible path only after the user rejects the recommendation or asks for alternatives.

**Independent judgment.** Object when evidence shows a real contradiction, excessive complexity, poor value for cost, or ignored risk — state the consequence where it matters, then move on once the user understands and accepts an ordinary tradeoff. Do not flatter, appease, or mirror the user's framing, and do not treat preference, confidence, or status as evidence; equally, do not perform disagreement for its own sake. Always stop for safety, law, permission, factual impossibility, unverifiable completion, or missing irreversible authorization.

After each answer, update the ledger, inspect newly named evidence when useful, and choose the next highest-leverage unresolved branch. Revisit an earlier branch when new evidence invalidates it. Stop grilling when 待定 is empty of material items.

## Delivery

**Launch authorization.** A direct implementation request covers reversible work within the scope as recorded in the ledger. Before the first source write, state the launch basis — for a small task one sentence is enough:

> 基准:修复 X 使 Y 可观察成立;硬约束 Z;当前最小方案是先加回归测试再改实现;若发现触及公共 schema 即停。

Every material element of the launch basis must already sit in 已确认 or 已委托. If one does not, ask about that element — stating it in the basis does not confirm it. Wait for fresh confirmation only when the boundary now includes a new material commitment, the user explicitly asked to approve the design first, or required external or irreversible authorization is missing.

Within the authorized boundary, change files, private interfaces, algorithms, work order, and test technique without asking. Report a meaningful replan as non-blocking information when it helps the user.

**Mid-delivery pause** — only for a material delta, explained as the delta, with the smallest credible response:

> 实现中发现:去重要求 Redis 键跨部署共享,这引入跨服务存储契约(M2/M3),超出已确认范围。最小方案是仅保证单实例内去重,跨实例场景暂不承诺。按最小方案继续吗?

Do not reopen settled decisions or re-grill history; internal reversible surprises are handled silently. Also pause when continuing would change the observable outcome, violate a hard constraint, exceed an accepted cost or risk, require missing authorization, or make promised validation unattainable.

## Validation And Independent Check

Validate against the current decisions, the final diff, actual risks, and relevant regressions. Earlier working ideas, rejected options, and speculative tests add no obligation.

Require an independent `$power-check` when the user asks for it; when the completed change materially affects or creates credible production risk in security, privacy, permissions, production persistent state, data migration, external or cross-version compatibility, concurrency correctness, or irreversible behavior; when material drift occurred; when preparing an important merge, release, or handoff; or when the current Decision Record requires it. Example pair: a migration rewriting the events table requires it; a test-fixture change or a backward-compatible optional config field with proportionate self-validation does not.

Start the check only after the delivery is a stable final candidate: planned edits finished, proportional self-validation done, final tree and diff recorded. The first check covers the complete final diff; when findings lead to fixes, wake the same reviewer for the delta only. Delegate per [references/orchestration.md](references/orchestration.md); if adequate independence is unavailable, report `CHECK_REQUIRED` instead of claiming it.

## Persistence

At alignment completion, always state the smallest adequate carrier with one brief reason: an existing Decision Issue, a new Issue, a PR, a commit, or no durable record. An Issue fits high-risk, long-running, cross-session, or collaborative decisions that need a canonical home; a PR carries ordinary delivery rationale; a commit suffices for tiny local changes. Materiality alone neither forces an Issue nor authorizes hosted mutation.

When a new Issue is warranted and none exists, proactively show the Decision Record draft and request explicit authorization to create it — and before drafting or touching hosted state, read [references/issue-persistence.md](references/issue-persistence.md) in full. When creating or updating a delivery PR/MR or preparing an external handoff, read [references/delivery-evidence.md](references/delivery-evidence.md) in full. If authorization is declined, use the smallest permitted alternative; pause only when the missing canonical record creates a material coordination risk.

For historical context, start from the user-provided Issue/PR or the affected code, then follow code → commit → PR/MR → Decision Issue and any `supersedes` link; use narrow search only when no direct entry point exists. Do not create repository decision Markdown unless the document itself is the requested deliverable — code, tests, schema, types, and configuration remain the primary implementation truth.

## Orchestration

Small tasks stay in the main context. Consider delegation only for bounded independently useful work, safe parallel read-only investigation, non-overlapping writes, or a genuinely independent review — then read [references/orchestration.md](references/orchestration.md) and route by task shape across `power_worker`, `power_explorer`, `power_planner`, and `power_reviewer`. Each profile owns its own model and effort configuration; do not restate or override them here.

Routing and task packets are reversible implementation details: never ask the user to confirm them and never persist them. The main context keeps material decisions, final arbitration, and user communication; a subagent may return a plan, synthesis, implementation, or review, but never replaces the main agent's reconciliation against the ledger and the current repository state.
