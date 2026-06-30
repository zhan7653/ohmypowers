# Loop Readiness Checklist

Use this checklist before generating a bounded `/goal`.

## Required Contract Fields

- Objective: clear, bounded, and implementation-oriented.
- Background or current problem: explains why the change exists.
- Scope: concrete in-scope work.
- Non-goals: explicit exclusions.
- Affected files or modules: known or discoverable implementation surface.
- Constraints: security, privacy, compatibility, migration, rollback, documentation, or "None known".
- Validation plan: concrete commands or manual checks.
- Acceptance criteria: observable criteria that can be mapped to evidence.
- Stop condition: observable completion condition.
- Pause-and-ask conditions: explicit conditions that require user input.

## Results

### LOOP_READY

Use when all required fields are present, validation is runnable or checkable, and risk is not `HIGH`.

Required output:

- Readiness result: `LOOP_READY`
- Missing fields: `None`
- Risk level
- Execution decision
- Bounded `/goal`

### NEEDS_GRILL

Use when the task is vague, acceptance criteria are absent, validation is missing or too weak, scope/non-goals are unclear, or pause conditions are not stated.

Required output:

- Readiness result: `NEEDS_GRILL`
- Missing or weak fields
- Recommended next action: send back to `power-grill`
- Do not generate an implementation `/goal`

### NEEDS_HUMAN

Use when repository facts contradict the contract, risk is `HIGH`, required credentials or permissions are unclear, or a business/security/product decision is unresolved.

Required output:

- Readiness result: `NEEDS_HUMAN`
- Blocking decision or contradiction
- Execution decision: `HUMAN_ONLY`
- Human decision checklist
- Do not generate an implementation `/goal`

## Weak Validation Signals

Treat these as not loop-ready unless the contract explains why they are sufficient:

- "Make sure it works"
- "Run tests" without naming test targets in a repo with many options
- Acceptance criteria with no observable result
- Manual review with no review target
- No stated stop condition

