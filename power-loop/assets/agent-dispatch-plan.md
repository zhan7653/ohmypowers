<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

Blueprint baseline: `<source branch>@<full commit SHA>`

Generated at: `<ISO-8601 timestamp with timezone>`

## Assignment policy

Initial assignment rationale: `<why every task starts with the lowest capable installed profile without relying on later escalation>`

Required custom-agent availability: `<verified, unverified until Goal preflight, or missing profiles>`

## Task graph

Repeat this section for every implementation, integration, validation, code-review, and evidence-verification task.

### `<TASK-ID>`: `<short task name>`

- Objective: `<one independently useful objective>`
- Role: `<implementation | tests | integration | validation | code review | evidence verification>`
- Custom agent: `<exact installed agent name>`
- Initial model: `<exact model slug>`
- Reasoning effort: `<Medium | High>`
- Sandbox or permission mode: `<workspace-write | read-only, plus approval constraints when relevant>`
- Allowed write paths: `<exact paths/modules, or None for read-only tasks>`
- Interface responsibility: `<owned interface, or None>`
- Dependencies: `<TASK-IDs or None>`
- Expected deliverable: `<diff, tests, evidence, or report>`
- Validation responsibility: `<validation IDs, checks, or review responsibility>`
- Parallelization conditions: `<when this may run concurrently and what must remain stable>`
- Allowed direct escalation targets: `<one or more named worker profiles chosen by diagnosis, or None>`
- Escalation ceiling: `<target model/effort or No escalation for read-only review tasks>`

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

- Permit at most one model escalation per implementation task.
- Escalate only for evidence-backed capability or reasoning under-classification.
- Do not escalate for permission, environment, dependency, validation-infrastructure, or interface-conflict failures.
- Reclassify directly to the appropriate target without traversing every tier.
- Choose the lowest sufficient allowed target: Terra Medium or High before Sol Medium when the evidence does not require Sol.
- Cap implementation at `power_sol_escalation` using `gpt-5.6-sol` Medium.
- Stop and report the blocker if Sol Medium cannot complete the task.
- Give the replacement worker prior findings, failure evidence, relevant artifacts, and current state.

## Main orchestrator responsibilities

- Own interfaces, dependency coordination, conflict resolution, dispatch, waiting, steering, escalation decisions, and result consolidation.
- Do not normally edit implementation files.
- Pause when delegation or a required custom agent is unavailable unless this confirmed plan explicitly documents a narrow exception.

Narrow main-agent implementation exception: `<None, or exact paths and reason explicitly approved by the user>`

## Verification and review plan

- Verification contract: `<complete canonical Issue/local body and final Goal Prompt; comments, discussions, and runner summaries are supplementary unless incorporated into the contract>`
- Stable snapshot: `<repository/ref, commit, diff or tree digest, dirty/generated boundary, capture time, and validation evidence>`
- Contract-prescribed reviews: `<exact reviewers, agents, models, providers, and procedures, or None>`
- Selection basis when no review topology is prescribed: `<contract obligations; final diff; affected interfaces/data; validation; and security, compatibility, migration, data, permission, concurrency, and domain risks>`
- Minimum sufficient capabilities: `<one or more independent read-only capabilities, including contract-conformance review>`
- Independent contract-conformance reviewer: `<identity/source and implementation-independence evidence; required for PASS or PASS_WITH_NOTES>`
- Additional review capabilities: `<code, test, security, compatibility, migration, data, or domain review only when justified, or None>`
- Reviewer records: `<for each: identity/source, independence, capability, scope, read-only boundary, evidence inspected, result, and snapshot identity>`
- Validation replay: `<exact command, safety class, isolated temporary-artifact boundary when applicable, result, evidence, and snapshot identity>`
- Evidence freshness: `<repair/new snapshot invalidates affected validation and review evidence; required reruns>`
- Contract-conformance packet: `<complete canonical Issue/local body, final Goal Prompt, clause/AC evidence, stable snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals>`
- Other review packets: `<tailored to each selected capability and scope>`
- Execution: `<run independent selected reviews in parallel over the same snapshot when possible; contract-prescribed reviews do not substitute for one another>`

## Dispatch Summary requirements

At completion or stop, report:

- planned and actual task counts;
- every task's initial and final model;
- escalation status and evidence-backed reason;
- parallel or sequential execution and wave;
- ownership conflicts and their resolution;
- incomplete tasks and pause reasons;
- Initial Assignment Accuracy.

Calculate Initial Assignment Accuracy as:

```text
implementation tasks completed without model escalation
-------------------------------------------------------
completed or attempted implementation tasks that received an initial assignment
```
<!-- power-loop:agent-dispatch-plan:end -->
