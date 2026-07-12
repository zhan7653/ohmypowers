<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `<proposed | confirmed | stale>`

Contract source: `<hosted issue URL/number or local brief path>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Delivery lane: `<LIGHT | STANDARD | HIGH>`

Normative boundary: `The Task Contract is the sole normative contract. This Dispatch Plan is confirmed operational guidance and cannot add requirements.`

Blueprint baseline: `<source branch>@<full commit SHA>`

Generated at: `<ISO-8601 timestamp with timezone>`

Execution mode: `inherited-model-routing`

Capability classification: `inherited-model-only`

Capability evidence: `<visible spawn contract exposes generic delegation but no supported model, reasoning, or custom-agent/profile selector>`

User confirmation: `<explicit inherited-model-routing confirmation evidence>`

Configuration provenance: `Subagents inherit the parent configuration; this is provenance, not independently selected routing.`

## Task graph

Repeat this section only for selected final review-capability tasks. Implementation, tests, integration, validation, documentation, evidence packaging, and repair remain main-agent work.

### `<TASK-ID>`: `<short task name>`

- Objective: `<one independently useful objective>`
- Role: `selected final review capability`
- Spawn mechanism: `<generic current-host subagent>`
- Context policy: `<minimal explicit task packet with fork_turns: none when exposed; state and justify any broader inherited context>`
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

Use no implementation subagents. Launch final reviewers in one parallel wave only when their scopes are decoupled: no reviewer depends on another, their capabilities do not duplicate each other, and all inspect the same frozen tree and evidence package. Use one reviewer for `LIGHT` or `STANDARD`; use at most two for `HIGH`.

## Agent capacity and coordination budget

- Host concurrent slots: `<observed count or unavailable>`
- Reliable thread retire/close operation: `<supported with evidence | unavailable>`
- Root slot: `1`
- Implementation subagent budget: `0`
- Reserved review slots: `<1 for LIGHT or STANDARD | 1-2 for HIGH when two decoupled review capabilities are justified>`
- Total distinct subagent-thread ceiling: `<value that preserves the review reserve; never assume completed threads release capacity>`
- Per-agent substantive follow-up limit: `0`
- `wait_agent` warning threshold: `<1 for LIGHT or STANDARD | 2 for HIGH>`
- `wait_agent` hard stop per review wave: `<1 for LIGHT or STANDARD | number of launched reviewers, maximum 2 for HIGH>`
- No-information timeout stop: `the first no-information timeout terminates the remaining reviewer wave`
- Polling rule: `no 1-, 10-, 20-, or 30-second loops; use at least 60 seconds or the longest permitted interaction timeout`
- Context rule: `minimal explicit packet; fork_turns: none when exposed; no full-session history by default`

## Ownership conflict rules

- Use one task-level branch or worktree for the loop.
- Do not start write-capable subagents.
- Final reviewers are instruction-level no-write tasks over one frozen tree.
- Parallelize reviewers only when their capability scopes are non-duplicative and neither reviewer consumes another's result.
- If reviewer scopes cannot be decoupled, combine them into one review packet or serialize the work in the main agent instead of creating a reviewer chain.

## Failure and redispatch protocol

- Do not replace or retry a reviewer after a no-information timeout.
- Do not retry permission, environment, dependency, validation-infrastructure, or ownership failures as capability failures.
- Stop when the inherited capability cannot complete a task within the confirmed contract.
- Return `NEEDS_HUMAN` when completion requires an exact unavailable model, profile, provider, reasoning level, sandbox, or isolation guarantee.
- Preserve prior findings and artifacts during an allowed retry.

## Main orchestrator responsibilities

- Own all exploration, implementation, tests, integration, validation, documentation, evidence packaging, repair, capability recheck, snapshot capture, review coordination, metered waiting, and result consolidation.
- Use only fields exposed by the current host contract.
- Do not reinterpret inherited configuration as selected routing.
- Stop on material capability drift, mode conflict, ambiguous ownership, or an unavailable exact requirement.

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
- Confirmed mode evidence: `<inherited-model-routing plus capability evidence and confirmation>`
- Stable snapshot: `<repository/ref, commit, Git tree digest, dirty/generated boundary, capture time, and validation evidence; tree digest controls freshness>`
- Contract-prescribed reviews: `<exact required identities or procedures, or None; unavailable exact requirements require NEEDS_HUMAN>`
- Selection basis: `<contract obligations; final diff; affected interfaces/data; validation; and material risks>`
- Minimum sufficient capabilities: `<one for LIGHT/STANDARD; one or two decoupled capabilities for HIGH, including contract-conformance review>`
- Independent contract-conformance reviewer: `<distinct non-implementing subagent identity/source; required for PASS or PASS_WITH_NOTES>`
- Additional review capabilities: `<code, test, security, compatibility, migration, data, or domain review only when justified, or None>`
- Configuration provenance: `<inherited from the parent; not independently selected>`
- Review isolation provenance: `<instruction-level no-write boundary; observable host enforcement if separately exposed, otherwise None>`
- Reviewer records: `<for each: identity/source, confirmed mode, configuration provenance, implementation independence, capability, scope, instruction boundary, observable host-isolation evidence if any, evidence inspected, result, and snapshot identity>`
- Validation replay: `<exact command, safety class, isolated temporary-artifact boundary when applicable, result, evidence, and snapshot identity>`
- Evidence freshness: `<repair/new snapshot invalidates affected validation and review evidence; required reruns>`
- Contract-conformance packet: `<pinned Task Contract bytes and digest, complete Issue identity/lifecycle context, supplementary planning artifacts and thin Goal, clause/AC evidence, stable snapshot, validation replay, changed-path/scope manifest, PR/MR evidence, risks, assumptions, and non-goals>`
- Other review packets: `<tailored to each selected capability and scope>`
- Execution: `<after main-agent V0/V1, adversarial self-review, and any repair, freeze one candidate; run V2, then V3 once, then launch all decoupled fresh-context final reviewers concurrently over that same snapshot and evidence package; use fork_turns: none when exposed>`

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
- pinned canonical Issue identity and final Git tree digest.
- wait_agent calls, timeout count, useful waits, maximum consecutive timeouts, cumulative wait duration, and circuit-breaker events;
- each agent's substantive follow-up count;
- useful_wait_ratio, wait-related tokens, wait_token_ratio, and total coordination-token ratio when reliable telemetry is available; otherwise explicitly unavailable.
<!-- power-loop:agent-dispatch-plan:end -->
