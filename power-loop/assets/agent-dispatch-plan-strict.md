<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

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

Initial assignment rationale: `<why each task uses the lower implementation, higher implementation, simple review, ordinary review, or complex review route; use Luna Max, Sol Medium, Terra High, or Sol High labels only when the capability matrix evidences the corresponding profile and reasoning effect>`

Required custom-agent availability: `<verified when profile selection is supported | unavailable — not independently selectable | missing required profiles>`

Strict reviewer routing; resolve each label through the capability matrix:

- `power_terra_reviewer`: simple structured review configuration; label it Terra High only when the profile and High reasoning effect are supported.
- `power_sol_reviewer`: default ordinary-review configuration; label it Sol Medium only when the profile and Medium reasoning effect are supported.
- `power_sol_high_reviewer`: complex or high-risk review configuration; label it Sol High only when the profile and High reasoning effect are supported.

## Task graph

Repeat this section for every implementation, integration, validation, and selected review-capability task.

### `<TASK-ID>`: `<short task name>`

- Objective: `<one independently useful objective>`
- Role: `<implementation | tests | integration | validation | selected review capability>`
- Custom agent: `<exact installed agent name when profile selection is supported | unavailable — not independently selectable>`
- Initial model: `<exact selected model when separately supported | unavailable — not independently selectable>`
- Reasoning effort: `<Medium | High | Max when separately supported | unavailable — not independently selectable>`
- Sandbox or permission mode: `<host-enforced mode when separately observable | instruction-level boundary only; host enforcement unavailable>`
- Allowed write paths: `<exact paths/modules, or None for read-only tasks>`
- Interface responsibility: `<owned interface, or None>`
- Dependencies: `<TASK-IDs or None>`
- Expected deliverable: `<diff, tests, evidence, or report>`
- Validation responsibility: `<validation IDs, checks, or review responsibility>`
- Parallelization conditions: `<when this may run concurrently and what must remain stable>`
- Allowed direct escalation targets: `<power_sol_worker when profile selection is supported | directly selected Sol model when only model selection is supported | None>`
- Escalation ceiling: `<supported target fields only; mark unsupported profile/reasoning fields unavailable | No escalation for read-only review tasks>`

## Dependency waves and parallelism

| Wave | Tasks | Parallel or sequential | Entry condition | Exit condition |
|---|---|---|---|---|
| `WAVE-1` | `<TASK-IDs>` | `<parallel | sequential>` | `<condition>` | `<stable deliverable/interface>` |

Agent count is not a cost metric. Keep independently useful work split when safe parallelism improves throughput. Do not split work that lacks an independent deliverable or creates overlapping write ownership.

## Ownership conflict rules

- Use one task-level branch or worktree for the loop.
- Start write-capable workers only after assigning non-overlapping paths and interface responsibilities.
- Serialize overlapping paths, unstable interfaces, and unresolved dependencies.
- Let read-only exploration, code review, and evidence verification run in parallel when they inspect stable inputs.
- Stop and replan when ownership becomes ambiguous; do not let workers race on the same files.

## Escalation protocol

- Permit at most one direct route replacement per implementation task. Record it as model escalation only when model selection or the applied model effect is separately evidenced.
- Replace only for evidence-backed capability or reasoning under-classification; describe a reasoning change only when reasoning selection or its applied effect is separately evidenced.
- Do not escalate for permission, environment, dependency, validation-infrastructure, or interface-conflict failures.
- Reclassify only from the Luna route directly to the Sol route; there is no implementation model ladder.
- Use `power_luna_worker` to `power_sol_worker` only when profile selection is supported. With model-only selection, use the corresponding direct model transition and mark the custom-agent field unavailable.
- Claim Max or Medium reasoning only when the reasoning dimension is separately supported.
- Assign the Sol route initially when repository inspection already shows work above the Luna boundary.
- Cap implementation at the supported Sol route fields; do not claim unsupported profile, reasoning, or sandbox configuration.
- Stop and report the blocker if the capability-matrix-resolved Sol implementation route cannot complete the task.
- Give the replacement worker prior findings, failure evidence, relevant artifacts, and current state.

## Main orchestrator responsibilities

- Own interfaces, dependency coordination, conflict resolution, dispatch, waiting, steering, escalation decisions, and result consolidation.
- Do not normally edit implementation files.
- Pause when delegation or a required custom agent is unavailable unless this confirmed plan explicitly documents a narrow exception.

Narrow main-agent implementation exception: `<None, or exact paths and reason explicitly approved by the user>`

## Verification and review plan

- Verification contract: `<the pinned complete canonical Issue/local body is the sole normative contract; the thin Goal, comments, discussions, PR body, and runner summaries are supplementary execution evidence and add no obligations>`
- Confirmed mode evidence: `<strict-model-routing plus selector evidence and confirmation>`
- Stable snapshot: `<repository/ref, commit, Git tree digest, dirty/generated boundary, capture time, and validation evidence; tree digest controls freshness>`
- Contract-prescribed reviews: `<exact reviewers, agents, models, providers, and procedures, or None>`
- Selection basis when no review topology is prescribed: `<contract obligations; final diff; affected interfaces/data; validation; and security, compatibility, migration, data, permission, concurrency, and domain risks>`
- Minimum sufficient capabilities: `<one or more independent read-only capabilities, including contract-conformance review>`
- Reviewer tier selection: `<simple structured route only for explicitly simple checks; ordinary Sol route by default; higher-complexity Sol route for high-risk or semantically complex review, with rationale; use Terra High, Sol Medium, or Sol High labels only when their profile and reasoning effects are evidenced>`
- Independent contract-conformance reviewer: `<identity/source and implementation-independence evidence; required for PASS or PASS_WITH_NOTES>`
- Additional review capabilities: `<code, test, security, compatibility, migration, data, or domain review only when justified, or None>`
- Reviewer records: `<for each: identity/source, independently supported configuration fields, selection rationale, independence, capability, scope, boundary provenance, evidence inspected, result, and snapshot identity; unsupported fields are explicitly unavailable>`
- Validation replay: `<exact command, safety class, isolated temporary-artifact boundary when applicable, result, evidence, and snapshot identity>`
- Evidence freshness: `<repair/new snapshot invalidates affected validation and review evidence; required reruns>`
- Contract-conformance packet: `<pinned complete canonical Issue/local body and identity, supplementary thin Goal, clause/AC evidence, stable snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals>`
- Other review packets: `<tailored to each selected capability and scope>`
- Execution: `<run independent selected reviews in parallel over the same snapshot when possible; contract-prescribed reviews do not substitute for one another>`

## Dispatch Summary requirements

At completion or stop, report:

- confirmed execution mode and capability evidence;
- planned and actual task counts;
- every task's initial and final supported routing fields, with unsupported fields recorded as `unavailable — not independently selectable`;
- route-replacement status and evidence-backed reason; call it model escalation only when model evidence supports that claim;
- parallel or sequential execution and wave;
- ownership conflicts and their resolution;
- incomplete tasks and pause reasons;
- Initial Assignment Accuracy.
- pinned canonical Issue identity and final Git tree digest.

Calculate Initial Assignment Accuracy as:

```text
implementation tasks completed without direct route replacement
-------------------------------------------------------------
completed or attempted implementation tasks that received an initial assignment
```
<!-- power-loop:agent-dispatch-plan:end -->
