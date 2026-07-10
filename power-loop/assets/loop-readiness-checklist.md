# Loop Readiness Checklist

Use this checklist before repository-aware execution planning.

## Required Task Contract Fields

- Problem or background: explains why the change exists and the current problem or workaround.
- Goal: clear, bounded, and observable.
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

Derive these fields in the Execution Blueprint and Agent Dispatch Plan. If deriving one of them requires an unresolved public behavior, API, schema, compatibility, business, security, permission, or migration decision, return `NEEDS_GRILL` or `NEEDS_HUMAN` instead.

## Results

### LOOP_READY

Use when requirement-level decisions are complete, validation expectations are meaningful, acceptance criteria are observable, and risk is not `HIGH`.

Required output before patch confirmation:

- Readiness result: `LOOP_READY`
- Missing fields: `None`
- Risk level
- Execution decision
- Execution Blueprint: `proposed`
- Agent Dispatch Plan: `proposed`
- Complete Issue Patch
- Goal Prompt: withheld pending confirmed patch application

### NEEDS_GRILL

Use when the problem, goal, user behavior, scope, non-goals, external contract, validation expectations, acceptance criteria, stop condition, or pause conditions are missing or vague.

Required output:

- Readiness result: `NEEDS_GRILL`
- Missing or weak requirement-level fields
- Recommended next action: send back to `power-grill`
- Do not generate execution artifacts or a Goal Prompt

### NEEDS_HUMAN

Use when repository facts contradict the Task Contract, risk is `HIGH`, required credentials or permissions are unclear, or a public/product/business/security/migration decision is unresolved.

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
