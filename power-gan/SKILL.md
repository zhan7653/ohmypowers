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
3. Persist the Decision Ledger from the first material item and reconcile it after every user answer. The ledger — not conversational memory or a compaction summary — is the record of what is confirmed, pending, delegated, rejected, and superseded.
4. A direct request to implement establishes delivery intent, not launch authorization. Before the first source write, render the complete Decision Snapshot and wait for the user's explicit confirmation of it as a whole.
5. At alignment completion, turn that same decision file into the launch Snapshot and select the smallest adequate final carrier. Keep the file until that carrier is verified; create or update hosted state only with explicit authorization.

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

At the first material item, create one session-unique Markdown file outside the repository from [assets/decision-snapshot.md](assets/decision-snapshot.md). Use the operating system's temporary directory under `power-gan/<CODEX_THREAD_ID>/decision-snapshot.md`; if `CODEX_THREAD_ID` is unavailable, create a collision-safe session-unique directory and report its exact path. If a source-writing task has no material item, create the file before launch authorization.

This one file is the authoritative Decision Ledger during alignment and the launch Snapshot later; do not maintain a separate Decision Journal. Give every material item a stable ID, keep IDs sequential, and write one complete contract statement:

```text
- D001 [pending]: <one complete material contract>
- D002 [confirmed]: <one complete material contract>
- D003 [delegated]: <one complete material contract>
- D004 [rejected]: <rejected material recommendation>
- D005 [superseded]: <old contract; superseded by D006>
```

Never reuse an ID, silently delete an entry, or edit an accepted contract into a different meaning. When a confirmed decision changes, retain it as `superseded` and add the replacement under the next ID. A decision may avoid repeating a long canonical artifact only by naming an immutable, already verified path or hosted record plus its content hash or commit; a mutable path or version label alone is not coverage.

After every user answer, first re-read the file, update all answered IDs and any newly discovered material item, advance `Next decision ID`, and run [scripts/validate-decision-state.mjs](scripts/validate-decision-state.mjs) with `--phase alignment`. Do this before investigating, asking the next question, or implementing. After compaction, resume, or a cross-turn continuation, re-read the decision file before any task action. If the file cannot be located or validated, stop instead of rebuilding it from memory.

Render a compact view derived from the file at the end of every grill turn and at alignment completion. Use the conversation language and these fixed labels:

```
▸ 已确认: <confirmed material decisions, briefest form>
▸ 待定: <material boundaries awaiting the user, including every recommendation not yet accepted>
▸ 默认(可改): <agent-owned working defaults worth visibility>
▸ 已委托: <boundaries the user explicitly delegated to the agent>
```

Omit empty labels; omit the rendered ledger only while no material item exists. Working defaults may appear in the file and rendered ledger, but they are agent-owned and need no decision ID.

Ledger rules:

- An unconfirmed recommendation lives in 待定 as a `pending` ID until the user accepts, rejects, or changes it. It never moves to `confirmed` through silence, a partial answer, or the agent restating it.
- If the user answers only part of a batch, the unanswered items stay in 待定 and reappear in the next batch. Do not advance to questions whose meaning depends on an unaccepted recommendation.
- "剩下的你定" or an equivalent blanket delegation is itself explicit: mark the currently named pending IDs as `delegated`, record the chosen contract, and surface it in the launch basis and delivery report. Blanket delegation never covers safety, legality, irreversible actions, external spend, or missing external authorization — those still stop the work.
- Rejected or superseded entries are history, not current obligations. The active launch set is every `confirmed` or `delegated` ID; every `pending` ID blocks launch.
- The session file is temporary workflow state, not a repository blueprint or project decision database. At handoff, transfer the active material decisions into the selected carrier, verify them, then delete the file.

## Alignment: The Grill Loop

Infer whether the user wants discussion only or delivery; honor `ALIGN_ONLY`, `DELIVER`, `FAST`, and `DEEP` as shorthand without reciting them as a menu. If implementation intent is unclear, ask only that. A request like "先设计" authorizes the interview, not a design document written on the user's behalf.

**Inspect before asking.** Read project guidance, relevant code and tests, user-visible behavior, public API/schema/config documentation, and directly related Issue or PR history before asking questions they can answer. Stop investigating once you can explain the current problem, separate facts from assumptions, and name the unresolved material boundaries. Do not precompute a blueprint, file list, private interface design, or test matrix.

**Depth.** Use focused alignment — usually one or two rounds — for isolated decisions. Enter Deep Grill when the user asks for it, when three or more unresolved material boundaries depend on one another, or when any single boundary is high-risk (security, permissions, durable data, money, irreversibility). If the interview will run past roughly three rounds beyond what the request implied, say so and ask before expanding.

**Each grill turn:**

1. One short paragraph of context: only the facts and current judgment needed for this branch.
2. One to three highest-leverage unresolved questions. Ask one when later questions depend on its answer or the branch is high-risk; ask two or three only when they are independent questions from the same decision layer. Highest-leverage means: the answer would invalidate the most downstream work if it went the other way, or unblocks the largest confirmed scope. Resolve product and state semantics before interface syntax, unless the interface itself is the unresolved product contract.
3. Each question carries exactly one recommendation with its reason. Question shape: "未决的边界是 X。我建议 Y,因为 Z。要这样处理吗?"
4. Render the ledger from the validated decision file. Stop and wait for the answer.

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

After each answer, reconcile and validate the decision file before inspecting newly named evidence or choosing the next branch. Revisit an earlier branch when new evidence invalidates it, retaining the superseded history. Stop grilling when no active ID is pending.

## Delivery

**Launch authorization.** A direct implementation request establishes delivery intent only; it never authorizes the first source write. After alignment completes and the final carrier is selected, fill Outcome, Scope / non-goals, Launch basis, Stop / reopen conditions, and Final carrier in the existing decision file. The same file becomes the launch Snapshot; do not copy its decisions into a second artifact. Run `node <skill-dir>/scripts/validate-decision-state.mjs <path> --phase launch`, report its exact path, render its complete contents, and ask the user to confirm that complete launch baseline as a whole. The launch basis may be one sentence for a small task:

> 基准:修复 X 使 Y 可观察成立;硬约束 Z;当前最小方案是先加回归测试再改实现;若发现触及公共 schema 即停。

Every material element of the launch basis must already have an active `confirmed` or `delegated` ID and therefore sit in 已确认 or 已委托. If one does not, add it as pending and ask — stating it in the basis does not confirm it. Do not write source until a reply made after the complete rendering explicitly confirms the whole Snapshot. Silence, partial answers, confirmation of individual decisions, blanket delegation, and any earlier implementation request do not pass this gate. Record that reply as `Overall launch confirmation: confirmed — <evidence>`, then run the validator with `--phase authorized` before the first source write.

Keep the Snapshot current. Any pre-launch change to a material decision or final carrier invalidates the earlier confirmation: update the same file, validate it, render its complete contents again, and obtain fresh whole-baseline confirmation. If the Snapshot cannot be read or validated, or confirmation is absent, pause before writing source.

Within the authorized boundary, change files, private interfaces, algorithms, work order, and test technique without asking. Report a meaningful replan as non-blocking information when it helps the user.

**Mid-delivery pause** — only for a material delta, explained as the delta, with the smallest credible response:

> 实现中发现:去重要求 Redis 键跨部署共享,这引入跨服务存储契约(M2/M3),超出已确认范围。最小方案是仅保证单实例内去重,跨实例场景暂不承诺。按最小方案继续吗?

Before asking about a material delta, add it under the next pending ID. After the answer, update and validate that ID before continuing. Do not reopen settled decisions or re-grill history; internal reversible surprises are handled silently. Also pause when continuing would change the observable outcome, violate a hard constraint, exceed an accepted cost or risk, require missing authorization, or make promised validation unattainable.

**Worklog tee.** When reporting the delivery outcome, also run `wl done --source "session:<session-id>" -- "<one-line outcome>"` to tee it into the local worklog. This is best-effort: if the command fails or `wl` is absent, proceed silently — it never blocks or changes the delivery report.

## Validation And Independent Check

Validate against the current decisions, the final diff, actual risks, and relevant regressions. Earlier working ideas, rejected options, and speculative tests add no obligation.

Whether an independent `$power-check` is required is defined once, in power-check's Applicability section — apply that contract instead of a restated list. In shorthand: user request, a material effect (not a mere touch) on a protected risk category, material drift, an important merge/release/handoff, or a Decision Record that demands it. Example pair: a migration rewriting the events table requires it; a test-fixture change or a backward-compatible optional config field with proportionate self-validation does not.

Run required checks through power-check's Caller Protocol: build the Check Packet, record the implementation identity, delegate to `power_reviewer`, verify the identity after it returns, and re-check fixes as a delta. If adequate independence is unavailable, report `CHECK_REQUIRED` instead of claiming it.

## Persistence

At alignment completion, always state the smallest adequate carrier with one brief reason: an existing Decision Issue, a new Issue, a PR, a commit, or — for discussion-only work — no durable record. An Issue fits high-risk, long-running, cross-session, or collaborative decisions that need a canonical home; a PR carries ordinary delivery rationale; a commit suffices for tiny local changes. A source-writing delivery must select Issue, PR, or commit; materiality alone neither forces an Issue nor authorizes hosted mutation.

The single temporary decision file is the universal alignment record and pre-launch confirmation surface regardless of whether the final carrier is an Issue, PR, or commit; it does not replace or alter the repository's Issue template.

When a new Issue is warranted and none exists, proactively show the Decision Record draft and request explicit authorization to create it — and before drafting or touching hosted state, read [references/issue-persistence.md](references/issue-persistence.md) in full. When creating or updating a delivery PR/MR or preparing an external handoff, read [references/delivery-evidence.md](references/delivery-evidence.md) in full. If authorization is declined, use the smallest permitted alternative; pause only when the missing canonical record creates a material coordination risk.

Before declaring a source-writing delivery complete, reconcile the final implementation against every active decision ID, transfer the durable decisions into the selected carrier, verify the transfer, set `Handoff status: complete — <carrier identity>`, and run the validator with `--phase handoff`; only then delete the exact file. Whenever delivery stops before verified handoff, retain the Snapshot and report its path and pending handoff.

For historical context, start from the user-provided Issue/PR or the affected code, then follow code → commit → PR/MR → Decision Issue and any `supersedes` link; use narrow search only when no direct entry point exists. Do not create repository decision Markdown unless the document itself is the requested deliverable — code, tests, schema, types, and configuration remain the primary implementation truth.

## Orchestration

Small tasks stay in the main context. Before starting a second independent fact domain, if at least two stable, non-dependent domains each require more than one direct read, read [references/orchestration.md](references/orchestration.md) and dispatch the ready qualifying lanes in the same wave. Keep one or two total reads, sequential dependencies, changing inputs, the immediate critical path, and synthesis in the main context. Use the same reference for other independently useful delegation and profile routing, including `power_scout`.

Behaviorally read-only delegation may support alignment before Snapshot confirmation, but no source-writing task packet may be dispatched until the complete Snapshot is confirmed, recorded, and validated. Routing and task packets are reversible implementation details: the user confirms the Snapshot, never the routing or packet. The main context keeps material decisions, final arbitration, and user communication; a subagent never replaces reconciliation against the persisted decision file and current repository state.
