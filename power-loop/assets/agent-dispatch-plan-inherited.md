<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

Blueprint baseline: `<source branch>@<full commit SHA>`

Generated at: `<ISO-8601 timestamp with timezone>`

Execution mode: `inherited-model-routing`

Capability classification: `inherited-model-only`

Capability evidence: `<visible spawn contract exposes generic delegation but no supported model, reasoning, or custom-agent/profile selector>`

User confirmation: `<explicit inherited-model-routing confirmation evidence>`

Configuration provenance: `Subagents inherit the parent configuration; this is provenance, not independently selected routing.`

## Task graph

Repeat this section for every implementation, integration, validation, and selected review-capability task.

### `<TASK-ID>`: `<short task name>`

- Objective: `<one independently useful objective>`
- Role: `<implementation | tests | integration | validation | selected review capability>`
- Spawn mechanism: `<generic current-host subagent>`
- Context policy: `<inherited planning context, fork_turns: none for fresh-context review when exposed, or another supported policy>`
- Instruction boundary: `<allowed writes, or no writes for review; state that this is instruction-level unless host enforcement is separately observable>`
- Allowed write paths: `<exact paths/modules, or None>`
- Interface responsibility: `<owned interface, or None>`
- Dependencies: `<TASK-IDs or None>`
- Expected deliverable: `<diff, tests, evidence, or report>`
- Validation responsibility: `<validation IDs, checks, or review responsibility>`
- Parallelization conditions: `<when this may run concurrently and what must remain stable>`
- Failure behavior: `<retry only for a diagnosed transient or task-packet defect; otherwise stop or return NEEDS_HUMAN>`
- Implementation independence: `<for review: evidence that the subagent did not implement the inspected work; otherwise not applicable>`

## Dependency waves and parallelism

| Wave | Tasks | Parallel or sequential | Entry condition | Exit condition |
|---|---|---|---|---|
| `WAVE-1` | `<TASK-IDs>` | `<parallel | sequential>` | `<condition>` | `<stable deliverable/interface>` |

Keep independently useful work split when safe parallelism improves throughput. Do not split work that lacks an independent deliverable or creates overlapping write ownership.

## Ownership conflict rules

- Use one task-level branch or worktree for the loop.
- Start write-capable subagents only after assigning non-overlapping paths and interface responsibilities.
- Serialize overlapping paths, unstable interfaces, and unresolved dependencies.
- Let exploration and evidence verification run in parallel when they inspect stable inputs and obey their task instructions.
- Stop and replan when ownership becomes ambiguous; do not let subagents race on the same files.

## Failure and redispatch protocol

- A replacement or retry remains in the confirmed inherited execution mode.
- Retry only after diagnosing a concrete transient or task-packet problem.
- Do not retry permission, environment, dependency, validation-infrastructure, or ownership failures as capability failures.
- Stop when the inherited capability cannot complete a task within the confirmed contract.
- Return `NEEDS_HUMAN` when completion requires an exact unavailable model, profile, provider, reasoning level, sandbox, or isolation guarantee.
- Preserve prior findings and artifacts during an allowed retry.

## Main orchestrator responsibilities

- Own capability recheck, mode enforcement, interfaces, dependencies, task packets, waiting, steering, conflict resolution, validation coordination, snapshot capture, review coordination, and result consolidation.
- Do not normally edit implementation files.
- Use only fields exposed by the current host contract.
- Do not reinterpret inherited configuration as selected routing.
- Stop on material capability drift, mode conflict, ambiguous ownership, or an unavailable exact requirement.

Narrow main-agent implementation exception: `<None, or exact paths and reason explicitly approved by the user>`

## Verification and review plan

- Verification contract: `<complete canonical Issue/local body and final Goal Prompt; comments, discussions, and runner summaries are supplementary unless incorporated into the contract>`
- Confirmed mode evidence: `<inherited-model-routing plus capability evidence and confirmation>`
- Stable snapshot: `<repository/ref, commit, diff or tree digest, dirty/generated boundary, capture time, and validation evidence>`
- Contract-prescribed reviews: `<exact required identities or procedures, or None; unavailable exact requirements require NEEDS_HUMAN>`
- Selection basis: `<contract obligations; final diff; affected interfaces/data; validation; and material risks>`
- Minimum sufficient capabilities: `<one or more independent capabilities, including contract-conformance review>`
- Independent contract-conformance reviewer: `<distinct non-implementing subagent identity/source; required for PASS or PASS_WITH_NOTES>`
- Additional review capabilities: `<code, test, security, compatibility, migration, data, or domain review only when justified, or None>`
- Configuration provenance: `<inherited from the parent; not independently selected>`
- Review isolation provenance: `<instruction-level no-write boundary; observable host enforcement if separately exposed, otherwise None>`
- Reviewer records: `<for each: identity/source, confirmed mode, configuration provenance, implementation independence, capability, scope, instruction boundary, observable host-isolation evidence if any, evidence inspected, result, and snapshot identity>`
- Validation replay: `<exact command, safety class, isolated temporary-artifact boundary when applicable, result, evidence, and snapshot identity>`
- Evidence freshness: `<repair/new snapshot invalidates affected validation and review evidence; required reruns>`
- Contract-conformance packet: `<complete canonical Issue/local body, final Goal Prompt, clause/AC evidence, stable snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals>`
- Other review packets: `<tailored to each selected capability and scope>`
- Execution: `<run independent fresh-context reviews in parallel over the same snapshot when possible; use fork_turns: none when exposed>`

## Dispatch Summary requirements

At completion or stop, report:

- confirmed execution mode and capability evidence;
- planned and actual task counts;
- each task's role, spawned task identity, context policy, dependency wave, parallel or sequential execution, and status;
- inherited configuration provenance without presenting it as selected routing;
- retries or redispatches and their evidence-backed reasons;
- ownership conflicts and their resolution;
- incomplete tasks and pause reasons;
- validation and reviewer snapshot identities.
<!-- power-loop:agent-dispatch-plan:end -->
