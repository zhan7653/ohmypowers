# Power Loop Dual-Track Multi-Agent Orchestration Spec

## Background

`ohmypowers` separates task clarification, repository-aware planning, implementation, and verification across `power-grill`, `power-loop`, a manually started Codex Goal, and `power-verifier`.

`power-loop` originally described one universally selectable custom-agent routing design. That assumption is not portable. A host can install reviewer profile declarations while exposing a `spawn_agent` contract that cannot select a model, reasoning effort, custom profile, or sandbox. Installed configuration files alone are therefore not evidence that strict routing is executable.

The orchestration protocol retains strict reviewer routing where the current host demonstrably supports it and provides an inherited-model review workflow where generic subagents inherit the parent configuration. Implementation delegation is disabled because its coordination and waiting cost is not reliably offset by wall-clock savings; fresh-context final review remains the bounded use of subagents.

## Normative Terminology

Capability preflight produces exactly one classification:

- `strict-selection-supported`: the exposed host contract demonstrably provides a supported model or custom-agent selector needed by the strict plan.
- `inherited-model-only`: generic subagent delegation is available, but the exposed host contract provides no supported per-subagent model, reasoning, or custom-agent selector.
- `indeterminate`: capability evidence is incomplete, contradictory, or insufficient to select a mode safely.

The user may confirm exactly one execution mode:

- `strict-model-routing`
- `inherited-model-routing`

Classification is an evidence conclusion. Execution mode is a user-confirmed planning choice. The two values must not be conflated.

## Requirements

### Requirements Contract And Repository Planning

- `power-grill` owns the requirement-level contract: problem, goal, delivery lane and split decision, user-observable behavior, scope, non-goals, dependencies, external contracts, constraints, explicitly required safety guarantees, stronger guarantees out of scope, risks, validation expectations, acceptance criteria, stop condition, and pause conditions.
- `power-loop` may derive private interfaces, exact affected files, control flow, error handling, test seams, validation commands, ownership, dependencies, and integration order after repository inspection.
- Unresolved user behavior, public API, schema, compatibility, security, permission, migration, provider, or business decisions return `NEEDS_GRILL` or `NEEDS_HUMAN` rather than being decided silently.
- The Task Contract byte range is the sole normative contract. The complete persisted Issue body is the authoritative container identity and lifecycle context. Confirmed Execution Blueprint and Agent Dispatch Plan artifacts are non-normative operational guidance. The Goal, comments, session, PR/MR text, and runner summaries are supplementary evidence and cannot add obligations.
- Canonical Issue identity uses SHA-256 of the exact full persisted UTF-8 body without normalization as unconditionally authoritative content identity; host revision metadata is provenance. Task Contract identity covers exact bytes from document start to the byte before `<!-- power-loop:execution-blueprint:start -->`.

### Delivery Lanes And Split Gate

- `LIGHT` covers one bounded, reversible behavior with no persistent global state, permission, migration, concurrency, destructive, or material compatibility boundary.
- `STANDARD` covers multi-module or compatibility-sensitive work whose risks remain local and reversible.
- `HIGH` covers persistent global or project configuration, authentication or authorization, sensitive data, migration, concurrency, destructive or irreversible behavior, or another security-critical boundary.
- An independently valuable `LIGHT` or `STANDARD` outcome bundled with a separable `HIGH`-risk mutation boundary must produce a split recommendation before planning.
- Broad terms such as “safe”, “atomic”, or “recoverable” must not silently select transaction, concurrency, audit, rollback, or recovery guarantees. Material guarantees belong in the Task Contract; stronger guarantees not selected are recorded as out of scope.
- A fully specified `HIGH` lane may receive a strictly gated Goal. `HUMAN_ONLY` is reserved for unresolved decisions, unavailable authority, or unauthorized irreversible action rather than high-risk classification alone.

### Capability Preflight

- Preflight and explicit execution-mode confirmation must occur before readiness/risk gating or mode-specific planning.
- Preflight must prefer inspection of the currently exposed `spawn_agent` schema or an equivalent supported host contract.
- When schema inspection is conclusive, preflight must not launch a subagent solely to probe model or profile selection.
- CLI version, installed TOML files, undocumented arguments, a failed speculative tool call, or the parent model name alone must not establish strict selection support.
- Model selection, profile selection, reasoning selection, and sandbox selection are separate capabilities. Evidence for one must not imply another.
- The preflight report must record the classification, evidence inspected, unavailable evidence or uncertainty, recommended mode, whether a probe was spawned, and the user's confirmation status.
- `strict-selection-supported` recommends `strict-model-routing` when a supported model selector or custom-agent/profile selector is demonstrably usable. This classification does not imply that reasoning, profile, model, or sandbox selection is also available; each capability and guarantee requires its own evidence.
- `inherited-model-only` recommends `inherited-model-routing` and records that subagent configuration is inherited rather than independently selected.
- `indeterminate` must ask the user for evidence or a decision and must not silently select a mode.
- The user must explicitly confirm an execution mode before `power-loop` generates a mode-specific Agent Dispatch Plan or final Goal Prompt.
- Capability must be rechecked before Goal execution. Material drift, contradictory evidence, or newly exposed model/profile selection requires renewed confirmation and replanning.

### Shared Execution Blueprint

The separately persisted, non-normative Execution Blueprint is shared by both modes and uses a fixed Markdown structure containing at least:

- Planning status: `proposed`, `confirmed`, or `stale`.
- Contract source, source branch and commit, and generation time.
- Capability classification, inspected evidence, uncertainty, recommended mode, confirmed mode, and confirmation evidence.
- Repository facts and assumptions.
- Affected files and modules.
- Internal interfaces and ownership boundaries.
- Data and control flow.
- Error handling.
- Task dependencies and integration order.
- Work isolation and shared-worktree policy.
- Test seams and concrete validation commands.
- Staleness and replan conditions.

The Blueprint must not call an instruction-level no-write boundary a sandbox. Host-enforced isolation may be recorded only when independently exposed and verified.

### Separate Agent Dispatch Plan Templates

`power-loop` must maintain two separate templates rather than a single conditional schema dominated by unavailable fields.

The selected Agent Dispatch Plan is persisted separately and is non-normative. The Issue body stores only its compact source and exact digest.

Both templates include:

- Confirmed execution mode and capability evidence.
- Task ID, objective, and role.
- Allowed write paths or explicit no-write instruction boundary.
- Dependencies and expected deliverable.
- Validation responsibility.
- Parallelization conditions and integration order.
- Failure behavior and pause conditions.

#### Strict Model Routing

The `strict-model-routing` template preserves selectable custom profiles for final review when the selectors needed for those guarantees are demonstrably available. A supported model selector or custom-profile selector is sufficient for the strict recommendation, but does not establish any other selector. The template may include a reviewer profile, model, reasoning effort, or host-verified sandbox only when the corresponding capability is evidenced.

The default strict routing policy is:

| Work class | Initial model | Reasoning | Notes |
|---|---|---|---|
| Explicitly simple review | `gpt-5.6-terra` | High | Selected sparingly when supported |
| Ordinary review | `gpt-5.6-sol` | Medium | Default strict reviewer tier |
| Most complex or high-risk review | `gpt-5.6-sol` | High | Requires contract or material-risk justification |

Implementation and repair remain main-agent work; selectable profiles are reviewer-only.

Every strict field remains conditional on evidence for the corresponding selector. If a required strict configuration is unavailable, the workflow pauses; it does not silently switch to inherited behavior or use undocumented arguments.

#### Inherited Model Routing

The `inherited-model-routing` template is complete without per-subagent configuration selection. Generic subagents inherit the parent configuration, and inherited values must not be represented as independently selected assignments.

The inherited template must not require, populate, calculate, or guarantee:

- Initial or target per-subagent model.
- Per-subagent reasoning effort.
- Custom-agent profile or provider selection.
- Profile-specific or host-enforced sandbox behavior without separate host evidence.
- Reviewer model tiers.
- Model-cost optimization or savings.

Inherited mode assigns explicit final-review roles, objectives, scopes, evidence packets, parallelization constraints, and failure behavior. Generic delegation is not used for implementation.

Independent review in inherited mode uses fresh context, such as `fork_turns: none` when exposed, and must not have participated in implementation. Review tasks may carry an instruction-level no-write boundary. This supports behavioral independence, but it is not a claim of host-enforced read-only isolation.

### Validation And Review Lifecycle

- V0 contains focused syntax, unit, and task-owned checks used during implementation.
- V1 contains relevant module and compatibility regression for the integrated candidate.
- V2 contains full deterministic repository, installer, packaging, and isolated integration checks for a frozen certification candidate.
- V3 contains network, authentication, hosted-service, real-runtime discovery, or other environment-sensitive checks and runs once after V2 passes on the frozen tree, immediately before the final reviewer wave. Final reviewers inspect that unchanged evidence package; the verifier does not replay valid V3 evidence by default.
- HIGH work creates its applicable failure matrix before implementation and receives at most one concentrated adversarial development-review wave that returns one batched finding set.
- At most one concentrated repair round follows that adversarial review. A new systemic defect in the same risk domain stops for replanning.
- Normal execution plans one final certification wave and records no more than three candidate snapshots. One unexpected blocking final certification may receive one repair/recertification cycle; a second blocking wave stops.
- V0/V1 and adversarial findings are development feedback, not final snapshot evidence. V2, final reviewers, and V3 must identify the same final Git tree digest.

If the Task Contract requires an exact model, custom profile, provider, reasoning level, sandbox, or isolation mechanism that the inherited host cannot provide, planning pauses and requests a human decision. The constraint must not be discarded or approximated silently.

### Orchestration, Ownership, And Parallelism

- The main agent owns exploration, implementation, tests, integration, validation, repair, consolidation, final-review dispatch, and metered waiting.
- Every delegated review has an independent, non-duplicative capability and one batched deliverable.
- The implementation loop uses one task-level branch or worktree rather than one worktree per subagent.
- Write-capable, exploratory, validation, documentation, evidence, and repair tasks are not delegated.
- Bounded generic delegation is preserved only for stable-snapshot fresh-context final review.
- Every final wave includes contract-conformance and code-review capabilities. Add separate test, security, compatibility, migration, data, permission, concurrency, or domain reviewers when the final diff justifies them.
- Reviewer count is limited by independently useful scopes and observed concurrent capacity, not by delivery lane. Completed threads are not assumed to release capacity.
- Review subagents default to minimal explicit task packets with `fork_turns: none` when exposed and receive at most one consolidated clarification/completion follow-up.
- `wait_agent` is metered but patient: launch the complete decoupled reviewer wave concurrently, allow at least 180 seconds before the first wait when interaction policy permits, use 180-second waits, and interrupt/replan only after three consecutive no-information timeouts without observable progress. The per-wave hard stop is the launched reviewer count plus three.
- Dispatch evidence reports wait calls, timeouts, useful waits, cumulative duration, follow-ups, circuit breakers, and wait/coordination token ratios when reliable telemetry is available.

### Compact Planning Reference Patch And Goal Protocol

The required order is:

```text
Read and validate the Task Contract
-> inspect the exposed spawn capability
-> report classification, evidence, uncertainty, and recommended mode
-> wait for explicit execution-mode confirmation
-> run readiness, delivery-lane, split, and residual-risk gating
-> inspect the repository and generate the separate shared Execution Blueprint artifact
-> generate exactly one separate mode-specific Agent Dispatch Plan artifact
-> generate and display a short decision summary plus compact reference patch
-> wait for explicit decision-summary and patch confirmation
-> verify the artifacts and apply the compact reference patch
-> generate the mode-specific final Goal Prompt
-> return the Goal Prompt for manual execution
```

No mode-specific Dispatch Plan or Goal Prompt may be generated before execution-mode confirmation. No final Goal Prompt may be generated before the exact confirmed planning artifacts and compact reference patch are persisted and verified.

The compact planning-reference patch may update only the marked Execution Blueprint and Agent Dispatch Plan reference blocks. It records artifact sources, exact digests, delivery lane, timestamps, and non-normative notices rather than embedding the complete artifacts. A revised patch requires fresh confirmation. Pasted-only contracts must be persisted as a hosted issue or local brief before the planning references can be confirmed.

The Goal is a thin launcher that pins the canonical Issue identity and normative Task Contract digest, names the compact planning references and exact artifact digests, performs identity/planning/baseline/capability preflight, stops on drift, and instructs manual start. It must not turn planning choices into requirements or introduce obligations absent from the Task Contract. The user starts it manually; `power-loop` does not execute it.

### Snapshot Freshness, Waiver, And Lifecycle Handoff

Verifier and curator evidence records repository/ref, commit, Git tree digest, dirty/generated boundary, and capture time. Git tree digest controls freshness: different commits with the same tree are `tree-equivalent` and may reuse evidence; a different tree invalidates the old PASS and review evidence for the final tree.

Curator assigns exactly one freshness classification: `tree-equivalent`, `reverified`, `human-waived`, `contract-changing`, or `unresolved`. A changed tree reaches closure only after verifier evidence bound to that final tree or an explicit complete human waiver. The waiver persists verified snapshot, final snapshot, changed paths, diff summary, behavior impact, validations run, uncovered content, reason, scope, confirmer, confirmation time, residual risks, and a coverage statement that the old PASS covers only the verified snapshot and the final tree is human-waived, not verifier PASS.

Task Contract, acceptance-criteria, public-behavior, security, permission, or migration changes are `contract-changing`: requirements return to `power-grill` and the confirmed plan returns to `power-loop`. Curator owns lifecycle, linkage, waiver, and closure evidence, but cannot edit the Task Contract, Execution Blueprint, or Agent Dispatch Plan.

Persisted Issue lifecycle state is exactly one of `open`, `in-progress`, `pr-ready`, `merged`, `done`, `superseded`, or `follow-up-needed`. Runtime/verifier outcomes such as `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, and `NEEDS_HUMAN`, and curator classifications, are not persisted states. Labels are optional, non-normative presentation aids and never gates.

### Mode-Accurate Evidence And Verification

Execution Blueprint, Dispatch Plan, Goal, PR/MR evidence, verifier input, verifier result, and Dispatch Summary must record:

- Confirmed execution mode.
- Capability classification and evidence.
- Configuration provenance, including unavailable or inherited fields.
- Planned and actual task counts.
- Dependency waves and parallel or sequential execution.
- Ownership conflicts.
- Incomplete tasks and pause reasons.
- Stable implementation snapshot and validation evidence.
- Independent review provenance and fresh-context evidence.
- Validation lifecycle: V0 focused, V1 integration, concentrated adversarial review/repair, frozen candidate, V2 final deterministic, final reviewer wave, and V3 external evidence.
- Candidate snapshot count, adversarial repair count, final certification waves, and evidence that V3 ran after V2 on the frozen tree and was inspected by final reviewers without default replay.

Strict evidence may additionally record exposed final-reviewer models, reasoning efforts, profiles, verified isolation, and reviewer tiers.

Inherited evidence must omit those strict-only metrics and guarantees. When the host happens to expose the inherited parent model, the evidence may record it as inherited runtime provenance, not as selected subagent routing. Missing model, reasoning, profile, or sandbox evidence must remain visibly unavailable rather than being inferred.

Independent contract-conformance and code-review results are both required before `PASS` or `PASS_WITH_NOTES`. Additional capabilities are selected from material implementation risks; reviewer identity, specialization, profile, and model tier remain dynamic.

## Non-Functional Requirements

- The behavior extends `power-loop`; it does not introduce a separate orchestration skill or external scheduler.
- Capability inspection is low cost and avoids paid or speculative probe work when schema evidence is conclusive.
- Both execution templates remain fixed-shape and separately reviewable.
- Canonical content is not duplicated unnecessarily between the issue and Goal Prompt.
- Hosted issue and local brief mutation remains explicit and reviewable.
- No mode claims exact monetary, token, credit, or subscription savings without authoritative usage evidence.
- Unresolved high-risk work remains `HUMAN_ONLY` and receives no implementation Goal Prompt.
- Historical generated plans require no compatibility, migration, or reopening.
- Historical or external issues missing exact contract or snapshot identity remain readable, but receive no fabricated freshness guarantee; require evidence, replanning, or an explicit human decision.

## Out Of Scope

- Fixing or patching the Codex multi-agent host.
- Depending on undocumented hidden `spawn_agent` arguments.
- Using failed tool calls or paid subagent work as the default capability probe.
- Building a separate `codex exec --model` orchestration system.
- Removing the remaining strict reviewer profiles or strict routing template.
- Automatically executing the final Goal Prompt.
- Automatically mutating an issue or local brief without explicit confirmation.
- Changing unrelated skills' model policies.
- Treating agent count as a cost metric.
- Creating one branch or worktree per subagent by default.

## Acceptance Criteria

### AC-1: Strict Capability Recommends Strict Routing

Given the current spawn interface exposes a supported model or custom-agent selector
When capability preflight runs
Then it returns `strict-selection-supported`, recommends `strict-model-routing`, and shows the evidence used.

### AC-2: Reduced Schema Recommends Inherited Routing Without A Probe

Given the spawn interface exposes no supported model, reasoning, or custom-agent selector
When capability preflight runs
Then it returns `inherited-model-only`, recommends `inherited-model-routing`, and does not attempt a model-specific probe spawn when the schema is conclusive.

### AC-3: Indeterminate Capability Does Not Guess

Given capability evidence is incomplete or contradictory
When capability preflight runs
Then it returns `indeterminate`, reports the uncertainty, and asks the user instead of silently choosing a mode.

### AC-4: Confirmation Gates Mode-Specific Planning

Given any preflight result
When the user has not confirmed the execution mode
Then `power-loop` does not generate a mode-specific Agent Dispatch Plan or final Goal Prompt.

### AC-5: Strict Routing Is Preserved When Supported

Given the user confirms `strict-model-routing`
When planning proceeds with independently sufficient evidence for every required selector
Then the separate strict template preserves the existing Terra and Sol reviewer profile guarantees without inferring reasoning, profile, model, or sandbox support from a different selector.

### AC-6: Inherited Routing Uses A Separate Template

Given the user confirms `inherited-model-routing`
When planning proceeds
Then `power-loop` uses the separate inherited template rather than populating the strict template conditionally.

### AC-7: Inherited Plans Contain No Unsupported Configuration Claims

Given inherited mode
When the Dispatch Plan and Goal are reviewed
Then they do not specify unsupported reviewer models, reasoning efforts, custom profiles, sandbox guarantees, reviewer tiers, or model-cost savings.

### AC-8: Inherited Mode Retains Useful Delegation

Given inherited mode
When work is decomposed
Then generic subagents may receive only explicit final-review roles, non-duplicative scopes, evidence packets, batched deliverables, and parallelization constraints.

### AC-9: Review Evidence Distinguishes Fresh Context From Isolation

Given inherited mode requires independent review
When review is planned and evidenced
Then fresh-context independence may be required, but host-enforced read-only isolation is claimed only when separately observable; an instruction-level no-write boundary is not represented as a sandbox.

### AC-10: Unavailable Exact Requirements Pause

Given a Task Contract requires an exact model, profile, provider, reasoning level, sandbox, or isolation mechanism unavailable in inherited mode
When planning runs
Then it pauses and requests a human decision instead of weakening the contract.

### AC-11: Execution Evidence Is Mode-Accurate

Given either mode
When execution evidence is produced
Then it records the confirmed mode and capability evidence without presenting inherited behavior as selected model routing or inventing unavailable configuration and isolation provenance.

### AC-12: Repository Artifacts Remain Consistent

Given the completed change
When repository validation runs
Then dual-track tests and all relevant existing tests pass, and documentation, specification, templates, installer expectations, and verifier evidence describe the same two modes and capability vocabulary.

## Open Questions Resolved

- Should strict routing be removed because the current host cannot select profiles? -> No. Preserve it for hosts with demonstrated selector support.
- Should all multi-agent execution pause when model selection is unavailable? -> No. Use inherited-model delegation only for bounded final review; keep implementation on the main agent.
- How is capability detected? -> Inspect the visible supported spawn contract first; avoid a probe spawn when schema evidence is conclusive.
- Does an installed TOML prove strict routing is available? -> No. Selectability requires current host evidence.
- When is an execution mode selected? -> Only after the preflight report and explicit user confirmation.
- Can inherited mode record the parent model? -> Only as observable inherited provenance, never as an independently selected subagent configuration.
- Does a no-write instruction prove read-only isolation? -> No. Host-enforced isolation requires separate observable evidence.
- What happens to exact model, provider, profile, reasoning, sandbox, or isolation requirements in inherited mode? -> Planning pauses for a human decision.
- Is reducing agent count a goal? -> Yes for implementation: its subagent ceiling is zero. Final reviewers are minimized to one, or two concurrently for decoupled high-risk capabilities, with strict wait circuit breakers.
- When is the final Goal Prompt generated? -> Only after mode confirmation and successful persistence of the separately confirmed planning artifacts and compact reference patch.

## Premises

- Feature detection must rely on observed host capabilities rather than CLI version or installed declarations.
- A supported model selector does not imply a supported sandbox selector, and vice versa.
- Strict routing and inherited routing are separately maintained product behaviors, not preferred and degraded forms of one template.
- Useful delegation is defined by roles, ownership, dependencies, deliverables, validation, and review independence, not solely by model selection.
- Fresh-context review strengthens independence but does not create host-enforced filesystem isolation.
- The final Goal Prompt is a thin operational launcher, not a second normative contract, and adds no obligations.
- Stable mode and capability evidence belongs in persisted planning and execution artifacts so users and verifiers can audit what was actually supported.
- A verifier result covers only its bound Git tree; a human waiver never relabels the final tree as verifier PASS.
