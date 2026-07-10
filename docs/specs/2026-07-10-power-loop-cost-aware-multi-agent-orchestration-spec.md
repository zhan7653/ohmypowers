# Power Loop Cost-Aware Multi-Agent Orchestration Spec

## Background

`ohmypowers` currently separates task clarification, loop preparation, implementation, and verification across `power-grill`, `power-loop`, Codex `/goal`, and `power-verifier`.

The current `power-grill` issue contract includes both requirement-level decisions and implementation-design details such as exact files, internal interfaces, control flow, test seams, and validation commands. This makes the grilling phase heavier than necessary and asks the user to confirm implementation details before `power-loop` has performed its focused repository inspection.

The current `power-loop` is already described as an orchestrator, but it primarily produces a bounded Goal Prompt. It does not yet produce a structured implementation blueprint, a model-aware subagent dispatch plan, or a reviewable Issue Patch containing those derived execution details.

The desired workflow makes `power-grill` responsible for a lighter but complete requirements contract and makes `power-loop` responsible for deriving the concrete implementation and dispatch design. The resulting execution should use each GPT-5.6 model according to the work it is best suited for:

- Luna for simple, deterministic implementation work.
- Terra for normal or complex implementation work.
- Sol Medium only as the implementation escalation ceiling.
- Independent contract-conformance review, with additional code, security, compatibility, migration, test, data, permission, concurrency, or domain review selected by capability and risk.

The primary cost objective is correct initial model assignment, fewer unnecessary model escalations, less high-capability-model implementation work, and less conflict-driven rework. Reducing the number of agents is not a goal. Meaningful parallelism is desirable when tasks have independent deliverables and non-overlapping write ownership.

## Requirements

### Functional Requirements

- FR-1: `power-grill` must produce a requirements-focused task contract rather than a detailed execution plan.
- FR-2: The `power-grill` contract must retain the problem, goal, user-observable behavior, scope, non-goals, dependencies, external API or data contracts, constraints, risks, validation expectations, acceptance criteria, stop condition, and pause-and-ask conditions.
- FR-3: `power-grill` must not require exact internal code interfaces, complete file ownership, concrete subagent assignments, or an exact implementation sequence before creating a requirements-ready contract.
- FR-4: Public API behavior, externally visible schemas, compatibility behavior, migration decisions, security decisions, permission decisions, and business rules must remain requirement-level contract decisions owned by `power-grill` or a human decision.
- FR-5: Internal function signatures, module responsibilities, private interfaces, exact affected files, control flow, error-handling shape, test seams, execution order, and concrete validation commands may be derived by `power-loop` after repository inspection.
- FR-6: A requirements-ready contract must not be rejected solely because exact internal implementation details or exact validation commands have not yet been supplied, when `power-loop` can discover them safely from the repository.
- FR-7: If repository inspection shows that execution requires an unresolved public contract, product decision, security decision, migration decision, or other material scope choice, `power-loop` must return `NEEDS_GRILL` or `NEEDS_HUMAN` instead of deciding silently.
- FR-8: Whenever a contract passes the `power-loop` readiness and risk gates, `power-loop` must generate a structured Execution Blueprint and Agent Dispatch Plan. This behavior must not depend on detecting Ultra mode.
- FR-9: `power-loop` must not inspect, infer, or gate behavior on the current reasoning mode. The user remains responsible for selecting Ultra or another supported mode when manually running the final Goal Prompt.
- FR-10: Ultra may be documented as the recommended runtime for proactive orchestration, but it must not be a feature flag or prerequisite for generating the orchestration artifacts.
- FR-11: The Execution Blueprint must use a fixed Markdown structure.
- FR-12: The Execution Blueprint must include planning status, contract source, source branch and commit, generation time, relevant repository assumptions, affected files and modules, internal interfaces, data or control flow, error handling, task dependencies, integration order, file ownership, work isolation, test seams, concrete validation commands, and staleness conditions.
- FR-13: The Agent Dispatch Plan must use a fixed Markdown structure.
- FR-14: Every dispatched task must include a Task ID, objective, role, initial model, reasoning effort, sandbox or permission mode, allowed write paths, dependencies, expected deliverable, validation responsibility, parallelization conditions, and escalation ceiling.
- FR-15: The default model-routing policy must be:
  - `gpt-5.6-luna` with Medium reasoning for mechanical, deterministic, low-risk work.
  - `gpt-5.6-terra` with Medium reasoning for normal implementation, tests, and fixes.
  - `gpt-5.6-terra` with High reasoning for work known in advance to require complex reasoning or cross-module implementation.
  - `gpt-5.6-sol` with Medium reasoning only as the maximum implementation escalation target.
  - Read-only review capabilities must be selected by contract and implementation risk; no reviewer model, provider, identity, specialization, or count is universal. The bundled Sol High profiles are available capabilities when selected or explicitly required by the contract.
- FR-16: `power-loop` must optimize initial task classification and model assignment rather than relying on a multi-step escalation ladder.
- FR-17: A task may receive at most one model escalation during execution.
- FR-18: Model escalation is allowed only when evidence shows that the original model assignment underestimated capability or reasoning requirements.
- FR-19: Permission failures, environment failures, dependency failures, unavailable validation, interface conflicts, or other non-capability failures must not trigger a model escalation.
- FR-20: When escalation is justified, the main orchestrator must reclassify the task and select the appropriate target directly, without stepping through every intermediate model tier.
- FR-21: Implementation escalation must never exceed Sol Medium. Failure at Sol Medium must pause the task and report the blocker.
- FR-22: A replacement worker must receive the prior worker's useful findings, failure evidence, relevant artifacts, and current state so that escalation does not repeat completed exploration.
- FR-23: The root or main agent executing the Goal Prompt must act as the orchestrator: it owns task decomposition, interface decisions, dependency coordination, conflict resolution, escalation decisions, and result consolidation.
- FR-24: The main orchestrator must not normally edit implementation files. Implementation changes must be delegated to the assigned workers. If delegation or a required agent configuration is unavailable, execution must pause unless the confirmed plan explicitly authorizes a narrow exception.
- FR-25: The number of agents must not be treated as a cost-reduction metric.
- FR-26: `power-loop` must preserve meaningful parallelism when tasks have independent deliverables and safe ownership boundaries.
- FR-27: Every dispatched agent must have an independent objective and deliverable. The plan must avoid fragmentation that creates coordination work without useful parallel progress.
- FR-28: One task-level branch or worktree must be used for the implementation loop. The default plan must not create one worktree per subagent.
- FR-29: Read-only exploration agents may run in parallel.
- FR-30: Write-capable agents may run in parallel only when their allowed write paths and interface responsibilities do not overlap.
- FR-31: Tasks with overlapping files, unstable shared interfaces, or unresolved dependencies must be serialized until the conflict is removed.
- FR-32: The Agent Dispatch Plan must assign explicit file or module ownership before write-capable workers start.
- FR-33: `power-loop` must generate the Execution Blueprint and Agent Dispatch Plan before generating an Issue Patch.
- FR-34: The Issue Patch must update only fixed execution-planning sections and their metadata. It must not modify the confirmed requirements contract sections.
- FR-35: `power-loop` must display the complete Issue Patch and request explicit user confirmation before changing a hosted issue or local brief.
- FR-36: If the user requests a patch revision, `power-loop` must regenerate and redisplay the patch. A previous confirmation must not apply to the revised patch.
- FR-37: If the user rejects the patch, does not confirm it, or the update fails, `power-loop` must not generate the final Goal Prompt.
- FR-38: After the user confirms the patch, `power-loop` must update the hosted issue or local brief and verify that the update succeeded.
- FR-39: `power-loop` may generate the final Goal Prompt only after the confirmed Issue Patch has been applied successfully.
- FR-40: A pasted-only contract must be persisted as a hosted issue or local brief before the structured execution sections can be confirmed and the final Goal Prompt can be generated.
- FR-41: The requirements contract remains canonical for what and why. The Execution Blueprint and Agent Dispatch Plan are derived execution artifacts for how and who.
- FR-42: If an execution artifact conflicts with the requirements contract, the requirements contract wins and Goal generation must pause.
- FR-43: The issue or brief must clearly distinguish the requirements contract from the generated Execution Blueprint and Agent Dispatch Plan.
- FR-44: The Execution Blueprint must record a source branch and commit so the final Goal Prompt can detect material repository drift.
- FR-45: The final Goal Prompt must reference the confirmed issue or brief and its execution-planning sections instead of embedding a second complete copy that can drift independently.
- FR-46: The final Goal Prompt may repeat only the operational rules required to start, coordinate, wait for, steer, escalate, validate, review, and summarize the confirmed plan.
- FR-47: The final Goal Prompt must require a baseline consistency check before implementation starts. Material drift must stop execution and require a new `power-loop` pass or a confirmed plan revision.
- FR-48: `power-loop` must output the final Goal Prompt for the user to run manually. It must not automatically invoke or execute `/goal`.
- FR-49: Missing or undiscoverable custom-agent configurations must not silently fall back to the parent model when that would violate the confirmed routing plan.
- FR-50: If a required Luna, Terra, or Sol agent configuration is unavailable, execution must pause and report the missing configuration or request explicit approval for an alternative.
- FR-51: Review must be read-only, independent from implementation, and run against stable evidence. The verifier must require at least one implementation-independent contract-conformance review before `PASS` or `PASS_WITH_NOTES`.
- FR-52: When the contract does not prescribe review topology, `power-loop` must select the minimum sufficient capabilities from contractual obligations, the final diff, affected interfaces/data, validation, and material risks. Contract-prescribed reviewers, agents, models, providers, and procedures must be honored exactly.
- FR-53: The final Goal Prompt must require a Dispatch Summary at completion or stop.
- FR-54: The Dispatch Summary must record planned and actual task counts, each task's initial and final model, escalation status and reason, parallel or sequential execution, ownership conflicts, incomplete tasks, pause reasons, and Initial Assignment Accuracy.
- FR-55: Initial Assignment Accuracy must be calculated as the number of tasks completed without model escalation divided by the total number of completed or attempted implementation tasks for which an initial assignment was made.

### Non-Functional Requirements

- NFR-1: The first version must extend `power-loop`; it must not introduce a new orchestration skill.
- NFR-2: Execution Blueprint and Agent Dispatch Plan output must be structurally consistent enough for a user or verifier to compare two runs without interpreting free-form prose.
- NFR-3: The workflow must minimize duplicate canonical content between the issue and the final Goal Prompt.
- NFR-4: Hosted issue and local brief mutation must remain reviewable and explicitly authorized.
- NFR-5: The workflow must prefer correct initial routing, useful parallelism, and low-conflict ownership over minimizing agent count.
- NFR-6: The first version must not claim exact monetary savings or exact credit savings without an authoritative usage source.
- NFR-7: The existing high-risk boundary remains unchanged: unresolved high-risk work must remain `HUMAN_ONLY` and must not receive an implementation Goal Prompt.
- NFR-8: Custom-agent model and sandbox declarations must be explicit enough to prevent accidental inheritance from an expensive parent session where the confirmed plan requires a cheaper worker.
- NFR-9: The generated plan must remain understandable as Markdown in a hosted issue or local brief without requiring an external database or orchestration service.

## Chosen Approach

Use a structured orchestration protocol inside the existing `power-loop` skill.

`power-grill` will produce a requirements-focused contract. Its issue template will retain all externally meaningful behavior, contract, scope, risk, validation-expectation, acceptance, and stop decisions, while leaving concrete internal execution design to `power-loop`.

`power-loop` will inspect the repository and produce two fixed-shape artifacts:

1. **Execution Blueprint**: the concrete repository-aware implementation design, including internal interfaces, ownership, dependencies, integration order, validation commands, and the source revision on which the design is based.
2. **Agent Dispatch Plan**: the concrete task graph and model-routing design, including each subagent's role, model, reasoning effort, permissions, write boundaries, dependencies, deliverables, parallelization rules, and escalation ceiling.

The issue or local brief will use this conceptual structure:

```text
Task Contract
  Owned by power-grill and the user; defines what and why.

Execution Blueprint
  Proposed by power-loop; defines how.

Agent Dispatch Plan
  Proposed by power-loop; defines who, model, ownership, and dependencies.

Curation Status
  Retains existing lifecycle context.
```

The Task Contract has precedence over all derived execution sections.

After generating the structured artifacts, `power-loop` will display an Issue Patch. It will update only the execution sections after explicit user confirmation. If the update succeeds, `power-loop` will generate a final ready-to-run Goal Prompt that references the confirmed issue or brief. The user will start the Goal manually.

The Goal Prompt will instruct the main agent to operate as an orchestrator and delegate implementation to the confirmed worker profiles. It will not depend on `power-loop` detecting Ultra. Ultra remains a recommended user-selected runtime for proactive delegation, while non-Ultra modes can follow the same explicit dispatch instructions when they support subagents.

### Execution Blueprint Schema

The fixed Markdown structure must contain at least:

- Planning status: `proposed`, `confirmed`, or `stale`.
- Contract source.
- Source branch and commit.
- Generated timestamp.
- Repository facts and assumptions.
- Affected files and modules.
- Internal interfaces and ownership boundaries.
- Data and control flow.
- Error handling.
- Task dependencies and integration order.
- Work isolation and shared-worktree policy.
- Test seams and validation commands.
- Staleness and replan conditions.

### Agent Dispatch Plan Schema

The fixed Markdown structure must contain a routing-policy summary and one row or section per task with at least:

- Task ID.
- Objective.
- Role.
- Initial model.
- Reasoning effort.
- Permission or sandbox mode.
- Allowed write paths.
- Dependencies.
- Expected deliverable.
- Validation responsibility.
- Parallelization conditions.
- Escalation ceiling.

### Model Routing Policy

| Work class | Initial model | Reasoning | Notes |
|---|---|---|---|
| Mechanical, deterministic, low risk | `gpt-5.6-luna` | Medium | Documentation, fixed transformations, narrow repeatable changes |
| Normal implementation, tests, fixes | `gpt-5.6-terra` | Medium | Default worker |
| Known complex or cross-module implementation | `gpt-5.6-terra` | High | Assign initially when the blueprint already shows higher complexity |
| Implementation escalation ceiling | `gpt-5.6-sol` | Medium | Fallback only; not the normal initial worker |
| Contract conformance | Selected capability | Contract-defined or risk-based | Read-only, implementation-independent |
| Additional review | Selected capability | Justified by final diff and risks | Read-only, scoped to capability |

Each task may escalate at most once. The orchestrator must diagnose whether the failure is a capability mismatch before escalating. Non-capability failures must be handled without model escalation.

### Parallelism And Ownership Policy

The plan must pursue meaningful parallelism rather than a low agent count. Read-only work may run concurrently. Write-capable workers may run concurrently only with non-overlapping ownership and stable interfaces. The default is one task-level branch or worktree shared by the coordinated workers, with explicit file or module ownership recorded in the Dispatch Plan.

### Issue Patch And Goal Protocol

The required order is:

```text
Read and validate the Task Contract
-> inspect the repository
-> generate the Execution Blueprint
-> generate the Agent Dispatch Plan
-> generate and display the Issue Patch
-> wait for explicit user confirmation
-> apply and verify the Issue Patch
-> generate the final Goal Prompt
-> return the Goal Prompt for manual execution
```

No final Goal Prompt may be generated before the confirmed patch is applied successfully.

## Out Of Scope

- Automatically executing the final `/goal`.
- Automatically updating an issue or local brief without explicit user confirmation.
- Detecting whether the current session uses Ultra.
- Making Ultra a prerequisite or feature flag.
- Minimizing agent count as a cost target.
- Creating one branch or worktree per subagent by default.
- Exact dollar, token, credit, or subscription-cost accounting.
- A new `power-dispatch` or `power-ultra` skill.
- An external scheduler, orchestration database, daemon, or hosted coordination service.
- Allowing implementation workers to escalate beyond Sol Medium.
- Changing the runtime model policy of `power-think`, `power-grill`, `power-curator`, `power-work-report`, or `power-critic` as part of this feature.
- Allowing `power-loop` to decide unresolved public API, schema, product, business, security, permission, or migration contracts.
- Reintroducing or imposing a universal fixed review topology, or an equivalent fixed reviewer requirement, over contract-prescribed or capability-based independent review.

## Acceptance Criteria

### AC-1: Power Grill Produces A Lighter Requirements Contract

Given a user uses `power-grill` to define a task
When the issue contract is generated
Then it contains the problem, goal, user behavior, external API or data contract, scope, non-goals, constraints, risks, acceptance criteria, validation expectations, stop condition, and pause conditions, without requiring internal interfaces, exact file ownership, or an Agent Dispatch Plan.

### AC-2: Implementation Detail Moves To Power Loop

Given the requirements contract is clear
When `power-loop` inspects the repository
Then it may supply exact files, internal interfaces, control flow, error handling, test seams, and validation commands without sending the task back solely because those internal details were absent.

### AC-3: External Contracts Remain Requirement Decisions

Given `power-loop` discovers that implementation requires a change to user behavior, a public API, a schema, compatibility, security, permissions, migration behavior, or a business rule
When that decision is not confirmed in the contract
Then it returns `NEEDS_GRILL` or `NEEDS_HUMAN` instead of deciding the change.

### AC-4: Structured Orchestration Artifacts Are Always Generated

Given a task contract passes the readiness and risk gates
When `power-loop` runs
Then it generates an Execution Blueprint, Agent Dispatch Plan, Issue Patch, and, after confirmed issue update, a final Goal Prompt regardless of the current reasoning mode.

`power-loop` does not detect or infer Ultra mode. The user chooses the runtime mode.

### AC-5: Execution Blueprint Has A Fixed Structure

Given the contract passes readiness
When `power-loop` generates the Execution Blueprint
Then the blueprint contains the baseline branch and commit, affected files and modules, internal interfaces, dependencies, data or control flow, error handling, ownership, integration order, test seams, validation commands, assumptions, and staleness conditions.

### AC-6: Agent Dispatch Plan Has A Fixed Structure

Given the Execution Blueprint exists
When `power-loop` generates the Agent Dispatch Plan
Then every task includes a Task ID, objective, role, initial model, reasoning effort, permission mode, allowed write paths, dependencies, deliverable, validation responsibility, escalation ceiling, and parallelization conditions.

### AC-7: Generation Order Is Enforced

Given the Blueprint and Dispatch Plan have been generated
When `power-loop` continues
Then it displays the Issue Patch, waits for confirmation, applies the confirmed patch, verifies the update, and only then generates the final Goal Prompt.

### AC-8: Issue Mutation Requires Explicit Confirmation

Given `power-loop` has displayed an Issue Patch
When the user has not explicitly confirmed that exact patch
Then no hosted issue or local brief is modified.

When the user requests a revision
Then the revised patch is displayed and requires a new confirmation.

### AC-9: Issue Mutation Is Restricted To Execution Sections

Given the user confirms the Issue Patch
When `power-loop` updates the issue or brief
Then it changes only the Execution Blueprint, Agent Dispatch Plan, and their execution metadata, leaving the requirements contract unchanged.

### AC-10: Requirements Contract Has Precedence

Given a generated execution artifact conflicts with the requirements contract
When `power-loop` detects the conflict
Then the requirements contract wins and Goal generation stops until the conflict is resolved.

### AC-11: The Contract Must Be Persisted

Given the input is a hosted issue or local brief
When the user confirms the patch
Then `power-loop` updates that persisted contract.

Given the input is only a pasted contract
When the structured plan needs to be confirmed
Then `power-loop` asks the user to create a hosted issue or save a local brief before it generates the final Goal Prompt.

### AC-12: Initial Model Routing Follows The Confirmed Policy

Given `power-loop` classifies implementation tasks
When it assigns initial models
Then it uses Luna Medium for simple deterministic work, Terra Medium for normal implementation, Terra High for work known to be complex, Sol Medium only as the implementation escalation ceiling, and contract-prescribed or risk-justified read-only review capabilities.

### AC-13: Model Escalation Is Limited

Given a worker fails because the initial assignment underestimated capability or reasoning complexity
When the main orchestrator approves escalation
Then the task escalates at most once and never beyond Sol Medium, and the replacement worker receives the prior worker's useful findings, failure evidence, relevant artifacts, and current state.

Given the failure comes from permissions, environment, dependencies, validation infrastructure, or interface conflicts
When the orchestrator diagnoses the failure
Then it does not escalate the model.

Given Sol Medium has attempted the task
When it still cannot complete the assigned work
Then the task stops and reports the blocker.

### AC-14: Model Substitution Is Not Silent

Given a required Luna, Terra, or Sol agent configuration is unavailable
When the Goal is prepared or executed
Then the workflow does not silently inherit the parent Sol Ultra configuration and instead pauses with the missing configuration or asks for an explicitly approved substitute.

### AC-15: The Main Agent Is An Orchestrator

Given the final Goal Prompt is running
When implementation begins
Then the main agent owns interfaces, dispatch, dependency coordination, conflict handling, escalation decisions, and consolidation, while implementation-file changes are delegated to the assigned workers. If delegation is unavailable, execution pauses unless the confirmed plan explicitly authorizes a narrow exception.

### AC-16: Parallelism Respects Ownership

Given tasks are independent and their write ownership does not overlap
When the Goal executes the Dispatch Plan
Then those tasks may run in parallel up to the platform concurrency limit.

Given tasks share files, depend on an unstable interface, or have unresolved dependencies
When the orchestrator determines their execution order
Then they run sequentially or wait until the shared boundary is stable.

The implementation uses one task-level branch or worktree rather than one worktree per worker.

### AC-17: Agent Count Is Not A Cost Metric

Given the task can be split into independently useful units
When `power-loop` creates the Dispatch Plan
Then it does not combine those units merely to reduce agent count.

Every agent still has an independent objective and deliverable so that fragmentation without useful parallel value is avoided.

### AC-18: The Goal References The Confirmed Issue

Given the Issue Patch was applied successfully
When `power-loop` generates the final Goal Prompt
Then the Goal references the confirmed issue or brief and its Execution Blueprint and Agent Dispatch Plan rather than embedding a second full copy.

The Goal performs a baseline consistency check and stops when material repository drift makes the confirmed plan stale.

### AC-19: Goal Execution Is Manual

Given the final Goal Prompt has been generated
When `power-loop` completes
Then it returns the ready-to-run prompt and does not invoke `/goal` automatically.

### AC-20: Review Is Independent And Capability-Appropriate

Given implementation and validation are complete
When the verifier gate runs
Then at least one implementation-independent reviewer checks contract conformance in a read-only context, and any additional review capabilities are selected from the contract and material implementation risks. No fixed reviewer count, model, provider, or named profile is imposed unless contractually required.

### AC-21: Dispatch Results Are Reported

Given the Goal completes or stops
When it produces the Dispatch Summary
Then the summary records planned and actual task counts, initial and final model per task, escalation and reason, parallel or sequential execution, ownership conflicts, incomplete tasks, pause reasons, and Initial Assignment Accuracy, calculated as tasks completed without model escalation divided by implementation tasks that received an initial assignment and were attempted.

## Open Questions Resolved

- Should `power-grill` keep producing detailed implementation notes? -> No. It should produce a lighter requirements-focused contract while preserving all externally meaningful decisions and acceptance boundaries.
- Who owns concrete internal implementation design? -> `power-loop`, after repository inspection.
- Should `power-loop` produce more than a bounded Goal Prompt? -> Yes. It must also produce a structured Execution Blueprint, Agent Dispatch Plan, and Issue Patch.
- Should the additional artifacts be generated only in Ultra mode? -> No. They are always generated after readiness passes. The user chooses the runtime mode.
- Should `power-loop` automatically update the issue? -> No. It displays the exact patch and waits for explicit confirmation.
- When is the final Goal Prompt generated? -> Only after the confirmed Issue Patch is applied successfully.
- Should `power-loop` automatically execute the Goal? -> No. The user starts it manually.
- Where does the stable dispatch plan live? -> In the issue or local brief. The final Goal Prompt references it and contains only operational execution instructions.
- Is reducing agent count a cost objective? -> No. Meaningful parallelism is desirable; avoid only fragmentation without independent value.
- What is the implementation model ceiling? -> Sol Medium, after at most one justified escalation.
- What reviews perform verification? -> Contract-prescribed reviews when specified; otherwise the minimum sufficient independent capability plan derived from the contract, final diff, validation, and material risks.
- How are worktrees handled? -> One task-level branch or worktree, with explicit shared-worktree ownership; no default worktree per subagent.
- How is issue mutation scoped? -> `power-loop` may update only the confirmed execution-planning sections and metadata.

## Premises

- A requirements contract can be complete and agent-ready without fixing every internal implementation detail before focused repository inspection.
- `power-loop` is the correct owner for repository-aware implementation design because it already owns loop readiness, risk classification, work isolation, validation-loop design, verifier gating, and Goal Prompt generation.
- Stable dispatch decisions belong in the persisted issue or brief so the user can review them and the Goal can reference one confirmed source.
- The final Goal Prompt is an operational launcher, not a second canonical plan.
- Correct initial routing and clear ownership save more cost than an arbitrary reduction in agent count.
- Useful parallelism is beneficial when ownership and interfaces prevent conflict-driven rework.
- Model escalation should be exceptional, evidence-based, bounded to one transition, and capped at Sol Medium for implementation.
- High-capability independent review remains necessary even when lower-cost workers perform most implementation work.
- Exact monetary savings cannot be guaranteed without authoritative usage and pricing telemetry.
