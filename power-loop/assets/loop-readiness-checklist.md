# Loop Readiness Checklist

Use this checklist before repository-aware execution planning.

## Capability And Mode Gate

Complete the subagent capability preflight and obtain explicit user confirmation of `strict-model-routing` or `inherited-model-routing` before applying this checklist. Capability evidence is not a Task Contract field and its absence must not return `NEEDS_GRILL`.

- Use `strict-selection-supported`, `inherited-model-only`, or `indeterminate` as the classification.
- Do not generate a mode-specific Agent Dispatch Plan, compact reference patch, or Goal Prompt before confirmation.
- Return `NEEDS_HUMAN` when strict mode is requested without usable selector evidence, or when the confirmed mode cannot satisfy an exact model, profile, provider, reasoning, sandbox, or isolation requirement.

## Required Task Contract Fields

- Problem or background: explains why the change exists and the current problem or workaround.
- Goal: clear, bounded, and observable.
- Delivery lane and split decision: records `LIGHT`, `STANDARD`, or `HIGH`, whether separable work was split, and any explicitly accepted bundling.
- User-observable behavior: states what users, operators, or integrations should experience.
- Scope: concrete in-scope outcomes.
- Non-goals: explicit exclusions.
- Dependencies or blockers: known dependencies, credentials, external teams, environments, or `None known`.
- External API or data contracts: public APIs, visible schemas, config, compatibility, migration, permissions, security, and business-rule decisions, or `None expected`.
- Constraints: security, privacy, compatibility, migration, rollback, documentation, or `None known`.
- Risks and assumptions: material known risks and assumptions.
- Validation expectations: observable evidence, test categories, quality gates, or manual checks that must prove the result.
- Acceptance criteria: observable criteria that can be mapped to evidence.
- Stop condition: observable completion condition.
- Pause-and-ask conditions: explicit conditions that require user input.

## Repository-Derived Fields

Do not return `NEEDS_GRILL` solely because these details are absent when repository inspection can discover them safely:

- exact affected files or modules;
- internal function signatures or private interfaces;
- module ownership and allowed write paths;
- internal data or control flow;
- error-handling shape;
- test seams and mocks;
- concrete validation commands;
- task sequencing and integration order;
- branch/worktree choice;
- subagent roles or model assignments.

Derive these fields in the separate, non-normative Execution Blueprint and Agent Dispatch Plan artifacts. If deriving one of them requires an unresolved public behavior, API, schema, compatibility, business, security, permission, migration, transaction, concurrency, audit, rollback, or recovery decision, return `NEEDS_GRILL` or `NEEDS_HUMAN` instead.

## Complexity And Split Gate

Return `NEEDS_GRILL` before repository-aware planning when:

- an independently useful `LIGHT` or `STANDARD` outcome is bundled with a separable `HIGH`-risk boundary;
- two or more independent risk domains can be delivered and reviewed separately;
- the user could receive meaningful value before a persistent, permission-sensitive, migratory, concurrent, destructive, or irreversible capability;
- the Task Contract uses broad safety language without deciding the requirement-level transaction, concurrency, audit, rollback, or recovery guarantee;
- the recorded delivery lane and split decision do not match the actual requirement boundaries.

Do not split merely to increase task count. Recommend the smallest independently valuable contracts, their dependency order, and a safer reduced alternative when available.

Broad terms such as “safe”, “atomic”, or “recoverable” are not sufficient decisions when they would materially change transaction, concurrency, audit, rollback, or recovery scope.

## Results

### LOOP_READY

Use when requirement-level decisions are complete, validation expectations are meaningful, acceptance criteria are observable, and the delivery lane and split decision are confirmed. A `HIGH` lane is ready only when its safety guarantees, permissions, and stop conditions are explicit.

Required output before patch confirmation:

- Readiness result: `LOOP_READY`
- Missing fields: `None`
- Delivery lane and split decision
- Residual risk level
- Execution decision
- Execution Blueprint artifact: `proposed`, with path and digest
- Agent Dispatch Plan artifact: `proposed`, with path and digest
- Decision summary and compact planning-reference patch
- Goal Prompt: withheld pending confirmed patch application

### NEEDS_GRILL

Use when the problem, goal, delivery lane, split decision, user behavior, scope, non-goals, external contract, validation expectations, acceptance criteria, stop condition, pause conditions, or required safety guarantee is missing or vague.

Required output:

- Readiness result: `NEEDS_GRILL`
- Missing or weak requirement-level fields
- Recommended next action: send back to `power-grill`
- Do not generate execution artifacts or a Goal Prompt

### NEEDS_HUMAN

Use when repository facts contradict the Task Contract, required credentials or permissions are unclear, an irreversible action lacks authorization, or a public/product/business/security/migration decision is unresolved. A fully specified `HIGH` delivery lane is not automatically `HUMAN_ONLY`.

Required output:

- Readiness result: `NEEDS_HUMAN`
- Blocking decision or contradiction
- Execution decision: `HUMAN_ONLY`
- Human decision checklist
- Do not generate execution artifacts or a Goal Prompt

## Weak Validation Signals

Treat these as not loop-ready unless the contract explains why they are sufficient:

- `Make sure it works.`
- `Run tests.` with no required behavior or evidence target.
- Acceptance criteria with no observable result.
- Manual review with no review target.
- No stated stop condition.

Do not require the Task Contract to know the exact repository command when it clearly states what evidence must be produced and repository inspection can identify the command.
