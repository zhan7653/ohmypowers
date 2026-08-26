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
3. Persist one delivery-scoped Decision Ledger from the first material item and reconcile its complete working state after every user answer. The Ledger — not conversational memory or a compaction summary — is the active record of what is confirmed, pending, delegated, rejected, and superseded.
4. A direct request to implement establishes delivery intent, not launch authorization. Before the first source write, render the complete Decision Snapshot and wait for the user's explicit confirmation of it as a whole.
5. At alignment completion, derive the launch Snapshot from that same decision file. Non-mechanical source work requires a user-authorized, read-back-verified Decision Issue before launch; create or update hosted state only with explicit authorization. After verified handoff, retain only the lifecycle state justified by the delivery's risk.

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

At the first material item, establish one immutable identity for this delivery and create its Markdown Ledger outside the repository from [assets/decision-snapshot.md](assets/decision-snapshot.md). If a source-writing task has no material item, create the file before launch authorization.

Store new Ledgers at `${CODEX_HOME:-$HOME/.codex}/power-gan/records/<repository-key>/<delivery-id>/decision-snapshot.md`. Derive `repository-key` as a lowercase path-safe slug from the canonical repository identity and add a short SHA-256 suffix when normalization could collide. Generate `delivery-id` once as a collision-safe, lowercase path-safe identifier; it belongs to one delivery, not the outcome or thread. Record every participating `CODEX_THREAD_ID` as metadata and report the exact Ledger path when created and at handoff.

Before creating a Ledger, search that repository's records directory using a known delivery ID or exact verified Decision Issue URL. Reuse a full Ledger only when it uniquely matches the same still-active delivery and its `Handoff status` is not complete. Cross-thread continuation alone does not start a new delivery. A complete full Ledger or compact index is terminal: every later correction, reopening, addition, or follow-up creates a new delivery ID and full Ledger, even for the same outcome. Never reactivate, expand, or append decisions to terminal state.

New Ledgers use `Ledger version: 4`. This policy is prospective: version 2, version 3, and versionless legacy state keep their existing behavior and location. Never migrate, rewrite, compact, classify, or delete them merely because this version of the skill is running.

The version 4 file is the authoritative full working Ledger during alignment and delivery; the validator later derives the launch Snapshot and, when appropriate, the compact handoff index from it. Set `Predecessor` to `none` for a first delivery. For work after a verified handoff, create the new Ledger with the prior delivery ID, verified durable-source content SHA-256, and handoff carrier, for example `delivery:<id> — Issue #<n> <url> — body sha256:<digest> — handoff commit <sha>`; do not derive it from conversational memory. Do not maintain a separate Decision Journal or persisted Snapshot copy. Give every material item a stable ID, keep IDs sequential, and record the complete contract plus only detail captured from an explicit source:

```text
- D001 [pending]: <one complete material contract>
  Basis: <verified repository or Issue fact, or user-provided context>
  Recommendation: <recommendation and rationale actually presented to the user>
  Resolution evidence: pending
- D002 [confirmed]: <one complete material contract>
  Basis: <explicit source>
  Recommendation: <presented recommendation and rationale>
  Resolution evidence: <user reply, delegation, authorization, or verified result>
```

While the full Ledger is active, never reuse an ID, silently delete an entry, or edit an accepted contract into a different meaning. When a confirmed decision changes, retain it as `superseded` and add the replacement under the next ID. `Basis`, `Recommendation`, and `Resolution evidence` must describe only information captured at the relevant event; never infer missing facts, reconstruct them from memory, copy full transcripts, or paste raw logs. A decision may avoid repeating a long canonical artifact only by naming an immutable, already verified path or hosted record plus its content hash or commit; a mutable path or version label alone is not coverage.

After every user answer, first re-read the full working file, update all answered IDs and any newly discovered material item, advance `Next decision ID`, and run [scripts/validate-decision-state.mjs](scripts/validate-decision-state.mjs) with `--phase alignment`. Do this before investigating, asking the next question, or implementing. On resume or cross-turn continuation, locate and re-read the delivery's file before any task action. Validate an active full Ledger with `--phase alignment`; validate terminal state only with `--phase handoff`. If the latest matching file is terminal, use it only to verify predecessor evidence and create a new Ledger. If the file, carrier, or digest cannot be uniquely located or validated, stop instead of rebuilding it from memory.

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
- Rejected or superseded entries are active-delivery history, not current obligations. The active launch set is every `confirmed` or `delegated` ID; every `pending` ID blocks launch.
- Keep the complete version 4 Ledger through alignment, authorization, implementation, and carrier transfer. Do not compact it before verified handoff.
- Before handoff, set `Handoff retention` to `full — <reason>` when the user or Decision Record explicitly requires full history, or when the delivery materially affects security, privacy, permissions, production persistent state, data migration, cross-version compatibility, concurrency correctness, irreversible behavior, or material cost. Merely touching a related file does not qualify. Use `compact — <reason>` for an ordinary delivery; ask when the material effect is genuinely ambiguous.
- For `full`, validate handoff and keep the complete Ledger as terminal state. For `compact`, run the validator with `--phase handoff`, atomically replace the file with the exact marker-delimited Decision Ledger Index it emits, then run the same handoff validation on that index. The version 4 index keeps repository and delivery identity, predecessor, verified decision source, final carrier, final decision-content digest, and handoff evidence; it deliberately omits `Next decision ID` and all pending, rejected, superseded, recommendation, process-evidence, and Working-default state.
- A complete full Ledger and compact index are both terminal. For later work, verify the terminal carrier and digest, create a new delivery ID and full Ledger, reset decision IDs for that new delivery, and record the terminal delivery as `Predecessor`. Never reconstruct discarded history or reactivate the old path. Stop if predecessor identity, carrier, or digest cannot be verified.
- Ledger identity and Issue identity are independent. A directly related follow-up may update the same canonical Decision Issue under a new explicit authorization; capture its exact pre-write body SHA-256 and record that revision together with predecessor delivery and handoff carrier in the new Ledger and updated Decision Record. Use a new Issue when the work is unrelated or the old Issue is no longer an adequate current record. Reusing an Issue never permits reusing its terminal Ledger.

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

**Launch authorization.** A direct implementation request establishes delivery intent only; it never authorizes the first source write. After alignment completes and the final carrier is selected, fill Outcome, Scope / non-goals, Launch basis, Stop / reopen conditions, Final carrier, and Issue persistence in the existing decision file. Run `node <skill-dir>/scripts/validate-decision-state.mjs <path> --phase launch`; for version 4 it derives a normalized launch projection containing only those six fields and the statements of active `confirmed` and `delegated` IDs. Recommendation, resolution process evidence, rejected or superseded history, metadata, and Working defaults remain in the full working Ledger but outside the projection and its SHA-256. Do not persist a second Snapshot artifact. The validator prints the projection between fixed markers; forward its entire launch output verbatim in the confirmation request. Do not retype, reflow, shorten, translate, or replace it with the compact Ledger; ask the user to confirm that exact baseline as a whole immediately after the block. The launch basis may be one sentence for a small task:

> 基准:修复 X 使 Y 可观察成立;硬约束 Z;当前最小方案是先加回归测试再改实现;若发现触及公共 schema 即停。

Every material element of the launch basis must already have an active `confirmed` or `delegated` ID and therefore sit in 已确认 or 已委托. If one does not, add it as pending and ask — stating it in the basis does not confirm it. Do not write source until a reply made after the complete rendering explicitly confirms the whole Snapshot. Silence, partial answers, confirmation of individual decisions, blanket delegation, and any earlier implementation request do not pass this gate. Record that reply as `Overall launch confirmation: confirmed — sha256:<digest> — <evidence>` using the digest printed for the rendered file, then run the validator with `--phase authorized` before the first source write.

Keep the launch projection current. Any pre-launch change to an active decision statement or one of its six launch fields invalidates the earlier confirmation by making its recorded digest stale: update the same file, validate it, render the projection again, and obtain fresh whole-baseline confirmation. Changes confined to excluded history or Working defaults do not change authorization. If the Ledger cannot be read or validated, or its confirmation digest does not match the current projection, pause before writing source.

Within the authorized boundary, change files, private interfaces, algorithms, work order, and test technique without asking. Report a meaningful replan as non-blocking information when it helps the user.

**Mid-delivery pause** — only for a material delta, explained as the delta, with the smallest credible response:

> 实现中发现:去重要求 Redis 键跨部署共享,这引入跨服务存储契约(M2/M3),超出已确认范围。最小方案是仅保证单实例内去重,跨实例场景暂不承诺。按最小方案继续吗?

Before asking about a material delta, add it under the next pending ID. After the answer, update and validate that ID before continuing. Do not reopen settled decisions or re-grill history; internal reversible surprises are handled silently. Also pause when continuing would change the observable outcome, violate a hard constraint, exceed an accepted cost or risk, require missing authorization, or make promised validation unattainable.

**Worklog tee.** When reporting the delivery outcome, also run `wl done --source "session:<session-id>" -- "<one-line outcome>"` to tee it into the local worklog. This is best-effort: if the command fails or `wl` is absent, proceed silently — it never blocks or changes the delivery report.

## Validation And Independent Check

Before implementation, determine whether the repository's existing tools and available environment can produce proportionate evidence for the behavior and risks in scope. When that capability is uncertain or insufficient, read [references/test-capability.md](references/test-capability.md) in full. Reuse an adequate capability; otherwise identify the smallest justified dev/test dependency or external test environment, state in the launch basis what claim it enables and the dependency, lockfile, CI, permission, download, service, or cost effects it introduces, and wait for whole-baseline authorization. After authorization, install and smoke-test the approved capability with the repository's package manager before business implementation; ask the user to install or provision it only when permissions or host limitations prevent the agent from doing so, and stop rather than weaken the promised evidence.

Validate against the current decisions, the final diff, actual risks, and relevant regressions. Earlier working ideas, rejected options, and speculative tests add no obligation.

When implementation adds or changes tests, each test must exercise a boundary that can falsify the behavior it claims to verify. Do not create or retain tests that only read source code, prompts, rubrics, skills, configuration prose, or documentation and match expected wording, headings, or regular expressions; do not create assertions that merely restate implementation constants. Exact text assertions are valid only when the text is itself an observable output or a machine-consumed contract and the test exercises its producer or consumer. Match test doubles to the claim: mocks and fakes may prove only the semantics they faithfully model, not omitted behavior such as real concurrency, transaction or locking behavior, filesystem or platform behavior, or network integration. Use controlled interleavings or an appropriate real boundary for those claims. If proportionate evidence is not feasible, report the validation gap instead of adding a ceremonial test.

Whether an independent `$power-check` is required is defined once, in power-check's Applicability section — apply that contract instead of a restated list. In shorthand: user request, a material effect (not a mere touch) on a protected risk category, material drift, an important merge/release/handoff, or a Decision Record that demands it. Example pair: a migration rewriting the events table requires it; a test-fixture change or a backward-compatible optional config field with proportionate self-validation does not.

Run required checks through power-check's Caller Protocol: build the Check Packet, record the implementation identity, delegate to `power_reviewer`, verify the identity after it returns, and re-check fixes as a delta. If adequate independence is unavailable, report `CHECK_REQUIRED` instead of claiming it.

## Persistence

Before any non-mechanical source-writing launch, search the repository's hosted Issues read-only. Propose updating a uniquely relevant Decision Issue when one exists; otherwise propose a new one. When updating an Issue that carried a prior handoff, use the new Ledger and capture the predecessor delivery, exact pre-write body SHA-256, and prior handoff carrier before drafting the revision. Show the exact mutation, obtain the user's explicit hosted-write authorization, perform only that mutation, and read it back exactly under [references/issue-persistence.md](references/issue-persistence.md). Record `Issue persistence: verified — <Issue identity and URL> — authorization confirmed — read-back sha256:<body digest>` before launch. A local Ledger alone never satisfies this gate.

A purely mechanical edit — one with no observable behavior, public contract, durable cost/risk, or material decision — may instead record `Issue persistence: mechanical exemption requested — <concrete reason>` in the complete launch Snapshot. The user's whole-Snapshot confirmation also confirms that visible exemption. If classification is uncertain, use an Issue. Discussion-only work keeps its full working Ledger unless the user requests or coordination risk warrants a hosted record and verified handoff.

The full working Ledger is the universal alignment record and source of the pre-launch projection. After handoff, either its compact index or justified full history complements the hosted Decision Record; neither replaces or alters the repository's Issue template. Select Issue, PR, or commit as the implementation handoff carrier appropriate to repository workflow, but non-mechanical work still needs the separate verified Decision Issue gate before launch.

Before drafting or touching hosted state, read [references/issue-persistence.md](references/issue-persistence.md) in full. Proactively show the complete Decision Record creation or update draft and request explicit authorization. If authorization is declined for non-mechanical source work, remain in alignment; do not substitute a commit, PR, or local Ledger for the missing Issue gate. When creating or updating a delivery PR/MR or preparing an external handoff, read [references/delivery-evidence.md](references/delivery-evidence.md) in full.

Before declaring a source-writing delivery complete, reconcile the final implementation against every active decision ID, transfer the durable decisions and evidence into the selected carrier with any separately required hosted-write authorization, and verify the transfer. Set `Handoff status: complete — <carrier identity and read-back evidence>` and the justified `Handoff retention`, then run the validator with `--phase handoff`. Keep a full Ledger when required; otherwise replace it atomically with the emitted compact index and validate that index before reporting completion. Report the exact path, retention result, and carrier at handoff. If handoff is incomplete, retain the full Ledger with pending status and report the blocker.

For historical context, start from the user-provided Issue/PR or the affected code, then follow code → commit → PR/MR → Decision Issue and any `supersedes` link; use narrow search only when no direct entry point exists. Do not create repository decision Markdown unless the document itself is the requested deliverable — code, tests, schema, types, and configuration remain the primary implementation truth.

## Orchestration

Small tasks stay in the main context. Before starting a second independent fact domain, if at least two stable, non-dependent domains each require more than one direct read, read [references/orchestration.md](references/orchestration.md) and dispatch the ready qualifying lanes in the same wave. Keep one or two total reads, sequential dependencies, changing inputs, the immediate critical path, and synthesis in the main context. Use the same reference for other independently useful delegation and profile routing, including `power_scout`.

Behaviorally read-only delegation may support alignment before Snapshot confirmation, but no source-writing task packet may be dispatched until the complete Snapshot is confirmed, recorded, and validated. Routing and task packets are reversible implementation details: the user confirms the Snapshot, never the routing or packet. The main context keeps material decisions, final arbitration, and user communication; a subagent never replaces reconciliation against the persisted decision file and current repository state.
