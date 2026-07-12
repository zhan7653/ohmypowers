---
name: power-loop
description: Convert a requirements-ready hosted issue, local brief, or pasted Task Contract into separate repository-aware planning artifacts, a compact confirmable reference patch, and, only after verification, a bounded ready-to-run Codex /goal. Use after power-grill or another clarification step has produced a clear contract and delivery-lane decision.
---

# Power Loop

## Overview

Turn a requirements-ready Task Contract into a confirmed implementation loop for Codex `/goal`.

Use this order without skipping or reordering stages:

```text
Task Contract
-> subagent capability preflight
-> explicit execution-mode confirmation
-> readiness, delivery-lane, and split gates
-> repository inspection
-> separate Execution Blueprint artifact
-> separate Agent Dispatch Plan artifact
-> compact exact Issue reference patch
-> explicit user confirmation
-> apply and verify the patch
-> final Goal Prompt
-> user manually starts /goal
```

Do not detect Ultra mode. Generate the same planning artifacts whenever the contract passes the gates. Ultra is a user-selected runtime, not a feature flag.

## Sources And Boundaries

Use this precedence:

1. Task Contract byte range in the persisted Issue/local body: sole normative contract source.
2. Complete persisted Issue/local body: authoritative source identity and lifecycle context, but not an additional clause source outside the Task Contract.
3. Execution Blueprint artifact: confirmed, non-normative repository-aware implementation approach.
4. Agent Dispatch Plan artifact: confirmed, non-normative mode-specific task and capability approach.

The final Goal is only a pinned launcher. It may identify and require reading the Task Contract plus the referenced planning artifacts, perform preflight and drift checks, stop on mismatch, and tell the user to start it manually. It must not turn a planning choice into a contract clause or add scope, compatibility, permission, security, migration, or other requirement-level obligations.

Stop when a derived artifact conflicts with the Task Contract. Return `NEEDS_GRILL` for an unresolved requirement boundary and `NEEDS_HUMAN` for a material public, product, business, security, permission, compatibility, schema, or migration decision.

Do not:

- deeply clarify vague requirements;
- implement code or create implementation branches/worktrees during planning;
- mutate requirements or `Curation status`;
- update a hosted issue or local brief before exact patch confirmation;
- generate the Goal Prompt before the patch is applied and verified;
- generate a mode-specific Agent Dispatch Plan before the user confirms the execution mode;
- invoke `/goal` automatically;
- silently replace a missing custom agent with the parent model;
- create, approve, merge, or close PRs/MRs.

After explicit patch confirmation, update only the compact marked Execution Blueprint and Agent Dispatch Plan reference blocks.

## Inputs

Prefer a hosted issue, then a persisted local brief, then a pasted Task Contract. A pasted-only contract may receive readiness, Blueprint, and Dispatch drafts, but it must be persisted before a target-specific compact reference patch or final Goal Prompt can be produced.

Treat only the `Task Contract` byte range as normative. The rest of the complete persisted Issue/local body supplies source identity, lifecycle state, and compact planning references. Comments, planning artifacts, the final Goal, session summaries, PR/MR bodies, and runner output are supplementary evidence only and cannot override or expand the Task Contract. For legacy issues, treat requirement sections before Execution Blueprint, Agent Dispatch Plan, or `Curation status` as the Task Contract and treat embedded planning sections as non-normative execution evidence. Do not invent strong revision guarantees for a source whose exact persisted bytes cannot be obtained; require persistence, replanning, additional evidence, or a human decision. Do not reuse a planning artifact unless its compact reference is explicitly `Planning status: confirmed`, its digest matches, and it still matches the contract and repository baseline.

Use these exact identities without normalization:

- Task Contract digest: SHA-256 of the exact UTF-8 bytes from document start to the byte immediately before `<!-- power-loop:execution-blueprint:start -->`.
- Canonical Issue identity: source URL/path, host revision metadata when exposed, and SHA-256 of the exact complete persisted body. The complete-body digest is authoritative when host metadata and body content disagree.

Capture the Task Contract digest before generating a patch, recheck it immediately before application, and prove it is unchanged afterward. The complete-body digest remains the authoritative identity of the persisted container, but it does not make non-Task-Contract text normative. Compute it only after the confirmed compact reference patch has been applied and verified; do not write that digest into the body it hashes.

## Workflow

### 1. Preflight Subagent Capability And Confirm The Mode

Inspect the currently exposed `spawn_agent` schema or equivalent host contract before readiness gating or repository-aware mode-specific planning. Prefer direct schema inspection. Do not spawn a probe subagent, make an intentionally failing call, or infer capability from installed custom-agent files or the CLI version when the visible contract is conclusive.

Classify the observed capability using exactly one value:

- `strict-selection-supported`: the host exposes a documented, usable per-subagent model or custom-agent/profile selector required for strict routing. Report the exact selector evidence. Treat model, reasoning, profile, and sandbox selection as independent capabilities; do not infer one from another.
- `inherited-model-only`: generic delegation is exposed, but the visible contract exposes no supported model, reasoning, or custom-agent/profile selector. Recommend `inherited-model-routing` and report that no probe was spawned.
- `indeterminate`: evidence is incomplete, unavailable, or contradictory, including conflict between user-reported behavior and the visible schema. Report the uncertainty and ask the user; do not silently choose a mode.

For every classification, report:

- classification;
- evidence inspected;
- selectors or evidence unavailable;
- whether a probe was spawned (`No` whenever schema inspection was conclusive);
- recommended execution mode;
- uncertainty or contradictory evidence;
- explicit user confirmation.

Recommend `strict-model-routing` only for `strict-selection-supported`. Recommend `inherited-model-routing` for `inherited-model-only`. An `indeterminate` result requires a human choice backed by additional usable evidence. User confirmation is mandatory after the recommendation. Until the user confirms, do not generate a mode-specific Agent Dispatch Plan, compact reference patch, or final Goal Prompt. If the user requests strict mode without usable strict-selection evidence, return `NEEDS_HUMAN`.

If the Task Contract requires an exact model, profile, provider, reasoning level, sandbox, or isolation guarantee that the confirmed mode cannot satisfy, return `NEEDS_HUMAN`; do not weaken or substitute the requirement.

### 2. Gate Readiness And Risk

Read [assets/loop-readiness-checklist.md](assets/loop-readiness-checklist.md).

Return one readiness result:

- `LOOP_READY`: requirement decisions are sufficient for repository-aware planning.
- `NEEDS_GRILL`: externally observable behavior, scope, acceptance criteria, validation expectations, stop condition, or pause condition is missing or vague.
- `NEEDS_HUMAN`: repository facts, permissions, high-risk work, or a material human decision blocks planning.

Read the confirmed `Delivery lane and split decision`. If it is absent in a legacy contract, derive a proposed lane and ask for confirmation before planning. Use exactly one delivery lane:

- `LIGHT`: one bounded, reversible behavior with no persistent global state, permission, migration, concurrency, destructive, or material compatibility boundary;
- `STANDARD`: a multi-module or compatibility-sensitive feature whose risks remain local and reversible;
- `HIGH`: persistent global or project configuration, authentication or authorization, sensitive data, migration, concurrency, destructive or irreversible behavior, or another security-critical boundary.

Return `NEEDS_GRILL` when an independently valuable `LIGHT` or `STANDARD` outcome is bundled with a separable `HIGH`-risk boundary and the Task Contract does not record an explicit split or bundling decision. Also return `NEEDS_GRILL` when words such as “safe”, “atomic”, or “recoverable” would require choosing transaction, concurrency, audit, rollback, or recovery guarantees that the Task Contract did not decide. Do not hide those choices in the Blueprint.

Classify residual risk as `LOW`, `MEDIUM`, or `HIGH` and select:

- `ALLOW_GOAL`: `LOW` and `LOOP_READY`.
- `GOAL_WITH_STRICT_GATE`: `MEDIUM` and `LOOP_READY`.
- `HUMAN_ONLY`: an unresolved high-risk requirement decision, unavailable required authority, or irreversible action that the user has not explicitly authorized.

A confirmed `HIGH` delivery lane may still receive `GOAL_WITH_STRICT_GATE` when its requirement-level safety guarantees, permissions, and stop conditions are complete. High-risk classification alone is not a reason to combine separable work or to invent stronger guarantees.

For any blocked result, return only the decision, blockers, and smallest next action. Do not generate execution artifacts.

### 3. Inspect The Repository

Inspect only enough context to derive the implementation. Record the contract source and canonical identity evidence available at inspection time, Task Contract digest, source branch and full commit, timestamp, relevant facts and assumptions, worktree state, exact affected paths, internal interfaces, flow, error handling, dependencies, validation commands, runtime budget, delivery/PR policy, review policy, pause/stop conditions, and material-drift conditions.

If inspection exposes a requirement decision, stop instead of hiding it in the plan.

### 4. Generate The Execution Blueprint

Read and fill [assets/execution-blueprint.md](assets/execution-blueprint.md) in its existing field order. Set the standalone draft to `Planning status: proposed`. Persist it separately, normally under `.codex/power-loop/<issue-or-task>-execution-blueprint.md`, rather than embedding the full artifact in the Issue body.

The Blueprint is operational guidance, not a source of new acceptance criteria. When repository inspection exposes a new public behavior, permission, compatibility, migration, transaction, concurrency, audit, rollback, or recovery guarantee, stop and return it to the Task Contract instead of deciding it inside the plan.

Plan one dedicated task-level implementation branch, optionally with one repository-local worktree. Base it on repository guidance such as `develop`; do not plan normal writes directly on the shared integration branch and do not create one worktree per subagent.

### 5. Generate The Agent Dispatch Plan

After the Blueprint exists, use exactly one separately maintained template selected by the confirmed mode:

- `strict-model-routing`: read and fill [assets/agent-dispatch-plan-strict.md](assets/agent-dispatch-plan-strict.md).
- `inherited-model-routing`: read and fill [assets/agent-dispatch-plan-inherited.md](assets/agent-dispatch-plan-inherited.md).

[assets/agent-dispatch-plan.md](assets/agent-dispatch-plan.md) is only a routing notice and must not be filled as a plan. Persist the selected plan separately, normally under `.codex/power-loop/<issue-or-task>-agent-dispatch.md`. The Issue body contains only its compact reference and digest. Record the confirmed execution mode and capability evidence in the selected plan.

For `strict-model-routing`, preserve the following routing policy. A usable model selector or custom-agent/profile selector is sufficient to select this mode, but it does not prove any other capability dimension. Record separate evidence for model selection, custom-agent/profile selection, reasoning selection or configured effect, and sandbox or isolation enforcement. Populate each strict task field only when its own dimension is supported; otherwise mark it `unavailable — not independently selectable` and make no guarantee. An instruction-level allowed-path or no-write boundary may replace an unavailable sandbox claim, but must not be described as host enforcement.

Use these installed profiles as selectable capabilities only when the host exposes a usable profile selector and every claimed profile-configured effect is separately evidenced. With a model-only selector, preserve the routing tier through the selected model while marking profile, reasoning, and sandbox fields unavailable unless independently supported. A contract may require a different exact reviewer, agent, model, provider, or procedure; do not substitute it silently.

- `power_terra_reviewer`: explicitly simple, low-risk, highly structured review route; call the resolved configuration Terra High only when the profile and High reasoning effect are both evidenced.
- `power_sol_reviewer`: default ordinary-review route; call the resolved configuration Sol Medium only when the profile and Medium reasoning effect are both evidenced.
- `power_sol_high_reviewer`: high-risk or semantically complex review route; call the resolved configuration Sol High only when the profile and High reasoning effect are both evidenced.

The main agent owns exploration, implementation, tests, integration, validation, documentation, evidence packaging, and repair. The Agent Dispatch Plan contains only final independent review tasks over a frozen candidate.

Inspect both the concurrent slot count and whether the host exposes a reliable retire/close operation. Do not assume a completed thread releases capacity. On a four-slot host without thread retirement, budget the entire Goal as follows:

- root/main agent: one slot;
- final review reserve: at least two slots for the contract-conformance and code-review capabilities;
- additional final reviewers: one per independently justified security, test, compatibility, migration, data, permission, concurrency, or domain capability, up to the observed concurrent capacity;
- total distinct subagent threads: the selected decoupled reviewer count; never assume completed threads release capacity.

Do not create separate agents for implementation, integration, documentation, validation, evidence packaging, repair, exploration, or status monitoring.

Default every review subagent to a minimal explicit task packet and `fork_turns: none` when exposed. Include only its review capability, the pinned Task Contract, frozen tree identity, complete evidence package, expected batched report, and stop conditions. Do not copy the full main-session history or unrelated tool output. Allow one consolidated substantive follow-up only to clarify or complete a returned report; never use follow-ups for status polling or incremental finding-by-finding steering.

### Coordination And `wait_agent` Budget

Treat model-driven waiting as a metered orchestration operation, not a free sleep. Every `wait_agent` result may trigger another model turn over the accumulated context.

- Start all decoupled reviewers in one parallel wave over the same frozen tree and evidence package. Reviewers are decoupled only when none depends on another's findings and their assigned capabilities do not duplicate each other.
- Do not call `wait_agent` immediately after spawning the wave. Finish all useful main-agent evidence consolidation first and allow a reviewer grace period of at least 180 seconds when the interaction policy permits.
- Use mailbox-driven completion. After any return, drain and consolidate every result already available before waiting for another unfinished reviewer.
- Do not use 1-, 10-, 20-, 30-, or 60-second polling loops. Use a 180-second timeout, or the longest timeout permitted by the current interaction/update policy when 180 seconds is unavailable.
- A no-information timeout does not terminate reviewers. Continue waiting while they remain active; three consecutive no-information timeouts trigger one status inspection followed by interruption and replanning if no concrete progress is observable.
- Per review wave, the `wait_agent` warning threshold is the launched reviewer count plus one and the hard stop is the launched reviewer count plus three. A permitted repair/recertification cycle receives a fresh wave budget.
- Do not send “status?” messages merely to provoke activity. Agents must return one complete handoff proactively when their bounded task finishes.

The runtime or final Dispatch Summary must record `wait_agent` calls, timeouts, useful waits, consecutive-timeout maximum, cumulative wait duration, per-agent follow-up count, and coordination circuit-breaker events. When token telemetry can be attributed reliably, also record wait-related input/total tokens, `useful_wait_ratio`, and `wait_token_ratio`. Never fabricate unavailable token attribution.

Targets:

- `useful_wait_ratio = useful waits / all waits >= 0.60`;
- `wait_token_ratio = wait-related tokens / main-session tokens <= 0.10`;
- all agent-coordination tokens <= 0.20 of main-session tokens when attribution is available.

### Validation And Review Lifecycle

Separate development feedback from final snapshot evidence:

- `V0 Focused`: syntax, unit, and task-owned tests used freely during implementation.
- `V1 Integration`: relevant module and compatibility regression after the integrated candidate exists.
- `V2 Final deterministic`: full deterministic repository, installer, packaging, or isolated integration checks on a frozen certification candidate.
- `V3 External`: network, authentication, hosted service, real runtime discovery, or other environment-sensitive smoke checks. Run once on the frozen tree after `V2` passes and immediately before the final reviewer wave.

For `HIGH` work, create a failure matrix before implementation. Cover the Task Contract's applicable evidence fabrication, scope, authorization, tampering, drift, concurrency, partial failure, rollback, recovery, permission, privacy, and destructive-action boundaries. The matrix is a development input, not final certification evidence.

Use this order:

1. implement with `V0` checks;
2. form one integrated candidate and run `V1`;
3. the main agent runs at most one concentrated adversarial self-review over the complete applicable failure matrix and records one batched finding set;
4. perform at most one concentrated repair round, rerun `V0`/`V1`, and stop for replanning if the same risk domain still exposes a new systemic defect;
5. freeze a certification candidate and capture its Git tree digest;
6. run `V2` on that tree;
7. if `V2` passes, run `V3` once on the unchanged tree;
8. run selected final independent reviewers concurrently in one wave over the same tree and complete V2/V3 evidence package. Their scopes must be decoupled, and the contract-conformance reviewer inspects existing V3 primary evidence without replaying it by default.

Do not call an intermediate commit or tree a final snapshot merely because ordinary tests pass. Do not run `V3`, installed-runtime discovery, or hosted authentication checks before the concentrated adversarial review, repair boundary, freeze, and V2 gate. Final reviewers certify; they do not steer implementation one finding at a time.

Normal execution has one integrated candidate, one concentrated repair candidate when needed, and one final certified tree. Set a hard ceiling of three recorded candidate snapshots. Plan one final reviewer wave. If final certification unexpectedly finds a blocker, allow one unfreeze/repair/recertification cycle; a second blocking certification wave stops for replanning instead of creating another rolling snapshot.

Plan final certification only after the final implementation diff, affected interfaces/data, validation requirements, and material risks are known. The earlier concentrated adversarial review is development feedback and cannot satisfy the independent final certification requirement. Preserve the final review-plan record with the stable snapshot:

- If the contract names reviewers, agents, models, providers, or procedures, assign and verify those requirements exactly. Record an unavailable prescribed capability as a blocker or `NEEDS_HUMAN` decision; do not substitute it silently.
- Otherwise, always select at least two independent, read-only capabilities: one contract-conformance reviewer and one code reviewer. Add separate test, security, compatibility, migration, data, permission, concurrency, or domain reviewers whenever the final diff exposes those risks. Each reviewer must have a non-duplicative scope and no dependency on another reviewer's findings.
- Require both contract-conformance and code-review results before a `PASS` or `PASS_WITH_NOTES` result.
- Select the default Sol reviewer route for ordinary review. Use the Terra reviewer route only when the review is demonstrably small, low risk, highly structured, and does not require deep cross-source reasoning or security, permission, migration, compatibility, concurrency, or complex lifecycle analysis. Use the higher-complexity Sol reviewer route for those high-risk areas, large cross-module diffs, conflicting evidence, or other semantically complex verification. Use Medium or High effort labels only when that reasoning effect is separately evidenced. Populate `power_sol_reviewer`, `power_terra_reviewer`, or `power_sol_high_reviewer` only when profile selection is supported; otherwise use a supported model selector and mark the custom-agent field unavailable.
- For every selected reviewer, record identity/source, supported configuration evidence, model-selection rationale, implementation independence, capability, scope, boundary provenance, evidence inspected, result, and snapshot identity. Record model, reasoning effort, and host-enforced isolation only when each is separately evidenced. Tailor packets to that scope; give the contract-conformance reviewer the exact Task Contract bytes and digest, complete Issue identity/lifecycle context, supplementary planning artifacts and Goal, clause evidence, snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals.
- A reviewer that cannot produce a reliable conclusion within its assigned tier must return `BLOCKED` with reclassification evidence. The orchestrator may select a higher appropriate reviewer directly; do not silently walk every tier.

Run selected final reviews in one parallel wave over the same stable snapshot and complete V2/V3 evidence package. Do not serialize reviewers whose scopes are decoupled. Reviewer count is determined by minimum capability coverage and observed concurrent capacity, not the delivery lane. If the required decoupled reviewers exceed available slots, return `NEEDS_HUMAN` instead of partially executing or silently dropping a capability. Do not replay V3 merely to create reviewer independence.

For `inherited-model-routing`, review subagents inherit the parent configuration. Do not specify or report an independently selected model, reasoning effort, custom profile, profile-specific sandbox, reviewer tier, or model-cost guarantee. Plan only the bounded final review roles, scopes, evidence packets, parallelism, and failure behavior. Do not use inherited-mode subagents for implementation or retry a timed-out reviewer.

Inherited-mode independent review may require a distinct non-implementing subagent and `fork_turns: none` when exposed. A no-write or read-only instruction is an instruction-level boundary unless the host separately exposes verifiable enforcement; never call it a host-enforced sandbox or isolation guarantee without that evidence.

### 6. Generate, Confirm, And Apply The Compact Reference Patch

Read [assets/issue-patch.md](assets/issue-patch.md).

For pasted-only input, display the proposed artifacts and ask the user to persist the unchanged Task Contract. Re-read the persisted source before generating a target-specific patch.

For a persisted target:

1. Persist the complete proposed Blueprint and Dispatch artifacts separately and compute their exact SHA-256 digests.
2. Build compact replacement blocks whose planning status is `confirmed` after application and which contain only artifact source, digest, delivery lane, generated time, and a non-normative notice.
3. Display one exact compact patch that changes only the marked Blueprint and Dispatch reference blocks.
4. Display a short decision summary covering delivery lane, split decision, user-visible scope, required safety guarantees, stronger guarantees explicitly out of scope, and any human authorization boundary. Do not require the user to infer these choices from the full planning artifacts.
5. State that Task Contract and `Curation status` remain byte-for-byte unchanged.
6. Ask the user to confirm the decision summary and exact reference patch, and withhold the Goal Prompt.

Treat confirmation as patch-specific. Any revision requires a complete regenerated patch and new confirmation.

After confirmation, re-read the target and require the same source, host revision when exposed, complete-body digest, and Task Contract digest observed when the patch was displayed. Re-read both planning artifacts and require their displayed digests to match. If any identity changed, stop and regenerate the affected artifact or patch. Apply only the two compact blocks, re-read again, compare them exactly, and prove the Task Contract digest is unchanged. Then compute the new canonical Issue identity from the exact complete persisted body. On any failure, return `PATCH_NOT_APPLIED` or `PATCH_VERIFICATION_FAILED` and withhold the Goal Prompt.

### 7. Generate The Final Goal Prompt

Read [assets/codex-loop-goal.txt](assets/codex-loop-goal.txt) only after successful patch verification.

Reinspect the exposed spawn contract at Goal preflight without a probe when its schema is conclusive. Require the runtime classification to remain compatible with the confirmed execution mode. Material capability drift, contradictory evidence, or newly available selection in an inherited-mode plan requires renewed user confirmation and a new or revised `power-loop` plan.

In strict mode, check required selector and custom-agent availability when the host exposes it. If a required profile is known missing, stop for installation or explicit approval of a named alternative. In inherited mode, confirm generic delegation remains available and do not add unsupported selector arguments.

Fill the Goal Prompt with only the pinned canonical Issue identity, Task Contract digest, compact planning references and artifact digests, repository and capability preflight, drift-stop behavior, and manual-start instruction. Require an exact complete-body digest and Task Contract digest match before implementation; host revision metadata is additional evidence, while the body digest identifies the persisted container. On Task Contract, planning-reference, artifact-digest, baseline, capability, or identity drift, stop for re-read or replanning. Do not copy obligations from the plans into the Goal. A plan change requires renewed planning confirmation, but it is not a contract revision unless it changes a Task Contract decision.

Use [assets/pr-evidence-template.md](assets/pr-evidence-template.md) for the implementation evidence package. Never merge.

## Output

Before execution-mode confirmation, output only the capability result, evidence, recommendation, uncertainty, and confirmation request. After mode confirmation but before patch confirmation, output the contract source, confirmed delivery lane and split decision, confirmed mode, capability evidence, readiness/risk decision, planning artifact paths and digests, the short decision summary, compact confirmed-state reference patch, confirmation request, and `Goal Prompt: withheld until this exact patch is applied and verified.`

After application, output the verification result, persisted source plus host revision when available plus authoritative complete-body SHA-256, Task Contract SHA-256, ready-to-run thin Goal Prompt, and an explicit instruction for the user to start it manually.

For a blocked contract, output only the decision, blockers, and smallest useful next action.
