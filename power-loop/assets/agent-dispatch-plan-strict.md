<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Delivery lane: `<LIGHT | STANDARD | HIGH>`

Normative boundary: `The Task Contract is the sole normative contract. This Dispatch Plan is confirmed operational guidance and cannot add requirements.`

Blueprint baseline: `<source branch>@<full commit SHA>`

Generated at: `<ISO-8601 timestamp with timezone>`

Execution mode: `strict-model-routing`

Capability classification: `strict-selection-supported`

Capability evidence: `<documented, usable model or custom-agent/profile selector exposed by the current host contract>`

User confirmation: `<explicit strict-model-routing confirmation evidence>`

## Independent capability matrix

Do not infer one row from another. For every row, record `supported` or `unavailable — not independently selectable`, the visible evidence, and the guarantee permitted by that evidence.

| Capability dimension | Status | Evidence inspected | Permitted guarantee |
|---|---|---|---|
| Generic subagent delegation | `<supported | unavailable>` | `<visible host-contract evidence>` | `<delegation behavior, or None>` |
| Per-subagent model selection | `<supported | unavailable — not independently selectable>` | `<selector/configuration-effect evidence or unavailable evidence>` | `<exact selected model, or no model-selection guarantee>` |
| Custom-agent/profile selection | `<supported | unavailable — not independently selectable>` | `<selector/configuration-effect evidence or unavailable evidence>` | `<exact selected profile, or no profile-selection guarantee>` |
| Per-subagent reasoning selection | `<supported | unavailable — not independently selectable>` | `<selector/configuration-effect evidence or unavailable evidence>` | `<exact reasoning effort, or no reasoning guarantee>` |
| Sandbox or isolation enforcement | `<supported | unavailable — not independently selectable>` | `<separately observable host-enforcement evidence or unavailable evidence>` | `<exact enforced boundary, or instruction-level boundary only>` |

Strict-field rule: populate each task and evidence field only when its capability row supports the claim. Otherwise write `unavailable — not independently selectable`; do not infer reasoning or sandbox behavior from model or profile availability. If the Task Contract requires an unavailable exact value or enforcement mechanism, return `NEEDS_HUMAN`.

## Assignment policy

Initial assignment rationale: `<implementation stays on the main agent; explain only the selected final reviewer route or routes, using Terra High, Sol Medium, or Sol High labels only when the capability matrix evidences the corresponding profile and reasoning effect>`

Required custom-agent availability: `<verified when profile selection is supported | unavailable — not independently selectable | missing required profiles>`

Strict reviewer routing; resolve each label through the capability matrix:

- `power_terra_reviewer`: simple structured review configuration; label it Terra High only when the profile and High reasoning effect are supported.
- `power_sol_reviewer`: default ordinary-review configuration; label it Sol Medium only when the profile and Medium reasoning effect are supported.
- `power_sol_high_reviewer`: complex or high-risk review configuration; label it Sol High only when the profile and High reasoning effect are supported.

## Task graph

Repeat this section only for selected final review-capability tasks. Implementation, tests, integration, validation, documentation, evidence packaging, and repair remain main-agent work.

### `<TASK-ID>`: `<short task name>`

- Objective: `<one independently useful objective>`
- Role: `selected final review capability`
- Custom agent: `<exact installed agent name when profile selection is supported | unavailable — not independently selectable>`
- Initial model: `<exact selected model when separately supported | unavailable — not independently selectable>`
- Reasoning effort: `<Medium | High | Max when separately supported | unavailable — not independently selectable>`
- Sandbox or permission mode: `<host-enforced mode when separately observable | instruction-level boundary only; host enforcement unavailable>`
- Context policy: `<minimal explicit task packet with fork_turns: none when exposed; state and justify any broader inherited context>`
- Allowed write paths: `<exact paths/modules, or None for read-only tasks>`
- Interface responsibility: `<owned interface, or None>`
- Dependencies: `<TASK-IDs or None>`
- Expected deliverable: `<diff, tests, evidence, or report>`
- Validation responsibility: `<validation IDs, checks, or review responsibility>`
- Parallelization conditions: `<when this may run concurrently and what must remain stable>`
- Allowed direct escalation targets: `None`
- Escalation ceiling: `No escalation or replacement for read-only review tasks`

## Dependency waves and parallelism

| Wave | Tasks | Parallel or sequential | Entry condition | Exit condition |
|---|---|---|---|---|
| `WAVE-1` | `<TASK-IDs>` | `<parallel | sequential>` | `<condition>` | `<stable deliverable/interface>` |

The task graph contains only final review tasks. Launch every selected reviewer in one parallel wave when their scopes are decoupled: no reviewer depends on another, their capabilities do not duplicate each other, and all inspect the same frozen tree and evidence package.

## Agent capacity and coordination budget

- Host concurrent slots: `<observed count or unavailable>`
- Reliable thread retire/close operation: `<supported with evidence | unavailable>`
- Root slot: `1`
- Minimum reviewer capabilities: `contract-conformance reviewer plus code reviewer`
- Additional reviewer capabilities: `<independent test, security, compatibility, migration, data, permission, concurrency, or domain scopes justified by the final diff>`
- Selected reviewer count: `<minimum 2; increase for decoupled capabilities up to observed concurrent capacity>`
- Total distinct subagent-thread ceiling: `<selected reviewer count; never assume completed threads release capacity>`
- Per-agent substantive follow-up limit: `1 consolidated clarification/completion request; no status polling`
- Reviewer grace period before first wait: `at least 180 seconds when interaction policy permits`
- `wait_agent` warning threshold: `launched reviewer count + 1`
- `wait_agent` hard stop per review wave: `launched reviewer count + 3`
- Consecutive no-information timeout stop: `3`
- Polling rule: `no 1-, 10-, 20-, 30-, or 60-second loops; use 180 seconds or the longest permitted interaction timeout`
- Context rule: `minimal explicit packet; fork_turns: none when exposed; no full-session history by default`

## Ownership conflict rules

- Use one task-level branch or worktree for the loop.
- Do not start write-capable subagents.
- Final reviewers are instruction-level no-write tasks over one frozen tree.
- Parallelize reviewers only when their capability scopes are non-duplicative and neither reviewer consumes another's result.
- If reviewer scopes cannot be decoupled, combine them into one review packet or serialize the work in the main agent instead of creating a reviewer chain.

## Review routing protocol

- Select reviewer routes once from the final diff and risk packet before launching the wave.
- Do not replace, escalate, or retry a reviewer after launch merely because it timed out or returned `BLOCKED`.
- If a required reviewer capability is unavailable, return `NEEDS_HUMAN`.

## Main orchestrator responsibilities

- Own all exploration, implementation, tests, integration, validation, documentation, evidence packaging, repair, snapshot capture, reviewer selection, metered waiting, and result consolidation.
- Pause when a required final reviewer capability is unavailable.

Main-agent implementation scope: `all implementation and repair paths for every delivery lane`

## Verification and review plan

- Development failure matrix: `<complete HIGH-risk matrix before implementation, or not applicable>`
- Validation layers: `<V0 focused; V1 integration; V2 final deterministic; V3 external after V2 and before final review>`
- Concentrated adversarial review: `<main-agent self-review returning one batched finding set, or not applicable>`
- Concentrated repair budget: `<0 or 1; same-risk systemic recurrence stops for replanning>`
- Candidate snapshot ceiling: `3`
- Final certification wave budget: `<planned 1; maximum 2 only for one unexpected blocker repair/recertification cycle>`
- V3 rule: `run once after V2 passes on the frozen tree and immediately before the final reviewer wave; final verifier inspects rather than replays it by default`
- Verification contract: `<the pinned Task Contract byte range is the sole normative contract; the complete Issue body supplies identity/lifecycle context, while this plan, the thin Goal, comments, discussions, PR body, and runner summaries are supplementary execution evidence and add no obligations>`
- Confirmed mode evidence: `<strict-model-routing plus selector evidence and confirmation>`
- Stable snapshot: `<repository/ref, commit, Git tree digest, dirty/generated boundary, capture time, and validation evidence; tree digest controls freshness>`
- Contract-prescribed reviews: `<exact reviewers, agents, models, providers, and procedures, or None>`
- Selection basis when no review topology is prescribed: `<contract obligations; final diff; affected interfaces/data; validation; and security, compatibility, migration, data, permission, concurrency, and domain risks>`
- Minimum sufficient capabilities: `<contract-conformance plus code review; add every independently justified risk capability>`
- Reviewer tier selection: `<simple structured route only for explicitly simple checks; ordinary Sol route by default; higher-complexity Sol route for high-risk or semantically complex review, with rationale; use Terra High, Sol Medium, or Sol High labels only when their profile and reasoning effects are evidenced>`
- Independent contract-conformance reviewer: `<identity/source and implementation-independence evidence; required for PASS or PASS_WITH_NOTES>`
- Independent code reviewer: `<identity/source and implementation-independence evidence; required for PASS or PASS_WITH_NOTES>`
- Additional review capabilities: `<test, security, compatibility, migration, data, permission, concurrency, or domain reviewers justified by the final diff, or None>`
- Reviewer records: `<for each: identity/source, independently supported configuration fields, selection rationale, independence, capability, scope, boundary provenance, evidence inspected, result, and snapshot identity; unsupported fields are explicitly unavailable>`
- Validation replay: `<exact command, safety class, isolated temporary-artifact boundary when applicable, result, evidence, and snapshot identity>`
- Evidence freshness: `<repair/new snapshot invalidates affected validation and review evidence; required reruns>`
- Contract-conformance packet: `<pinned Task Contract bytes and digest, complete Issue identity/lifecycle context, supplementary planning artifacts and thin Goal, clause/AC evidence, stable snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals>`
- Other review packets: `<tailored to each selected capability and scope>`
- Execution: `<after main-agent V0/V1, adversarial self-review, and any repair, freeze one candidate; run V2, then V3 once, then launch all decoupled selected final reviewers concurrently over that same snapshot and evidence package; contract-prescribed reviews do not substitute for one another>`

## Dispatch Summary requirements

At completion or stop, report:

- confirmed execution mode and capability evidence;
- planned and actual final-review task counts;
- every reviewer task's supported routing fields, with unsupported fields recorded as `unavailable — not independently selectable`;
- concurrent review-wave membership and decoupling rationale;
- ownership conflicts and their resolution;
- incomplete tasks and pause reasons;
- pinned canonical Issue identity and final Git tree digest.
- wait_agent calls, timeout count, useful waits, maximum consecutive timeouts, cumulative wait duration, and circuit-breaker events;
- each agent's substantive follow-up count;
- useful_wait_ratio, wait-related tokens, wait_token_ratio, and total coordination-token ratio when reliable telemetry is available; otherwise explicitly unavailable.
<!-- power-loop:agent-dispatch-plan:end -->
