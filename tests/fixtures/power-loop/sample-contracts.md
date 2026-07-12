# Sample Contracts

Use these examples to dry-run `power-loop` behavior.

## Sample 1: LOOP_READY Without Internal Implementation Details

### Task Contract

Problem: Users cannot find the installation command for a newly released skill in the repository README.

Goal: Document how to install the new skill and make the repository layout mention it.

User-observable behavior:

- A README reader can copy one installation command for the new skill.
- The repository layout lists the new skill beside the existing skills.

Scope:

- Update installation documentation.
- Update repository-layout documentation.

Non-goals:

- Do not change skill behavior.
- Do not add scripts or dependencies.

Dependencies or blockers:

- None known.

External API or data contracts:

- None expected.

Constraints:

- Documentation-only change.
- Preserve the existing README style.

Risks and assumptions:

- Assume the new skill directory already exists in the repository.

Validation expectations:

- Show that the install section contains a correct copy command.
- Show that the repository layout contains the skill directory and `SKILL.md`.

Acceptance criteria:

- AC-1: Given README installation instructions, when reviewed, then the new skill appears beside existing skill copy commands.
- AC-2: Given README repository layout, when reviewed, then the new skill directory appears with `SKILL.md`.

Stop condition: Both README locations document the new skill and the required evidence is captured.

Pause-and-ask conditions:

- The new skill name or installation location conflicts with repository conventions.

### Expected power-loop result before confirmation

- Capability classification: `inherited-model-only` when the visible spawn schema contains only `task_name`, `message`, and `fork_turns`
- Evidence: the visible schema is conclusive, so no probe subagent is spawned
- Recommended execution mode: `inherited-model-routing`
- User confirmation: required before readiness gating or mode-specific planning
- Mode-specific Agent Dispatch Plan: not generated
- Goal Prompt: not generated

### Expected power-loop result after execution-mode confirmation

- Readiness result: `LOOP_READY`
- Delivery lane: `LIGHT`; split decision: not needed
- Residual risk level: `LOW`
- Execution decision: `ALLOW_GOAL`
- Exact files and validation commands: discovered from the repository and added to the separate Execution Blueprint artifact
- Execution Blueprint artifact: `proposed`, with source and digest
- Agent Dispatch Plan artifact: `proposed` from `agent-dispatch-plan-inherited.md`, with source and digest; it records review roles, scopes, evidence packets, deliverables, parallelism, and fresh-context independent review without a reviewer model, reasoning, profile, sandbox, tier, or model-cost claim
- Decision summary and compact reference patch: displayed in full
- Goal Prompt: withheld until the artifacts and exact compact patch are confirmed, persisted, and verified

### Expected result after confirmation

- Issue/local brief compact planning references: updated and verified
- Canonical Issue identity: source plus host revision when available plus SHA-256 of the exact complete persisted body; the body digest is authoritative
- Task Contract identity: SHA-256 of exact UTF-8 bytes from document start to the byte before the Blueprint start marker
- Final Goal Prompt: a thin launcher containing only the pinned Issue/Task Contract identities, planning-artifact references and digests, preflight/drift stop, and manual-start instruction; it adds no requirement
- Identity drift: stops before implementation and requires the Issue-owned re-read/replan path
- Goal execution: left to the user

## Sample 2: Exact Model Requirement Pauses In Inherited Mode

### Task Contract

Problem: A compatibility certification must be performed by a named provider model.

Goal: Run the certification with `review-model-2` from `provider-x`.

Constraints:

- The exact model and provider are mandatory and cannot be substituted.

Validation expectations:

- Record direct evidence that the named model and provider performed the certification.

Acceptance criteria:

- AC-1: Given the certification run, when its provenance is reviewed, then it identifies `review-model-2` from `provider-x`.

Stop condition: The exact certification provenance is recorded.

Pause-and-ask conditions:

- The host cannot select the exact required model or provider.

### Expected power-loop result

- Capability classification: `inherited-model-only`
- Confirmed execution mode: `inherited-model-routing`
- Result: `NEEDS_HUMAN`
- Blocking reason: the confirmed mode cannot satisfy or prove the exact model/provider requirement
- Mode-specific Agent Dispatch Plan: not generated
- Goal Prompt: not generated

## Sample 3: NEEDS_GRILL

### Task Contract

Goal: Improve the agent loop.

Scope:

- Make it better.

Validation expectations:

- Make sure it works.

### Expected power-loop result

- Readiness result: `NEEDS_GRILL`
- Missing or weak fields:
  - problem/current behavior
  - user-observable behavior
  - concrete scope
  - non-goals
  - dependencies or blockers
  - external API/data contract decision
  - constraints
  - risks and assumptions
  - meaningful validation expectations
  - observable acceptance criteria
  - stop condition
  - pause-and-ask conditions
- Execution artifacts: not generated
- Goal Prompt: not generated

## Sample 4: NEEDS_HUMAN

### Task Contract

Problem: The current production authentication flow is hard to maintain.

Goal: Replace production authentication and migrate user permission records.

User-observable behavior:

- Existing users continue to log in with preserved permissions after migration.

Scope:

- Change login behavior.
- Migrate permission data.
- Update production configuration.

Non-goals:

- None stated.

Dependencies or blockers:

- Production credentials and migration window are not confirmed.

External API or data contracts:

- Authentication compatibility and rollback behavior are undecided.

Constraints:

- Must not break existing users.

Risks and assumptions:

- Permission migration is irreversible without an approved rollback plan.

Validation expectations:

- Prove existing-user login and permission preservation.

Acceptance criteria:

- AC-1: Given an existing user, when they log in after migration, then permissions are preserved.

Stop condition: Production auth works after migration.

Pause-and-ask conditions:

- None stated.

### Expected power-loop result

- Readiness result: `NEEDS_HUMAN`
- Risk level: `HIGH`
- Execution decision: `HUMAN_ONLY`
- Blocking reasons:
  - authentication and permission boundary change
  - database migration
  - production configuration
  - unresolved compatibility and rollback contract
  - missing approval and pause conditions
- Execution artifacts: not generated
- Goal Prompt: not generated
