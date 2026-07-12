# Loop Readiness Checklist

Use this checklist before repository-aware implementation planning. Reviewer capability is intentionally not a readiness gate because it is inspected after the final tree is frozen.

## Required Task Contract Fields

- Problem/background and bounded goal.
- Delivery lane and explicit split/bundling decision.
- User-observable behavior, scope, and non-goals.
- Dependencies, blockers, external API/data contracts, constraints, risks, and assumptions.
- Required safety guarantees and stronger guarantees out of scope.
- Validation expectations and observable acceptance criteria.
- Stop condition and pause-and-ask conditions.

## Repository-Derived Fields

Do not return `NEEDS_GRILL` solely because repository inspection can safely derive:

- affected files/modules and private interfaces;
- internal flow and error handling;
- test seams and concrete validation commands;
- implementation order and branch/worktree choice.

If deriving one exposes a public behavior, compatibility, business, security, permission, migration, transaction, concurrency, audit, rollback, or recovery decision, return `NEEDS_GRILL` or `NEEDS_HUMAN`.

## Complexity And Split Gate

Return `NEEDS_GRILL` when:

- independently useful `LIGHT` or `STANDARD` work is bundled with a separable `HIGH`-risk boundary;
- independent risk domains can be delivered separately;
- broad terms such as “safe”, “atomic”, or “recoverable” leave transaction, concurrency, audit, rollback, or recovery guarantees undecided;
- the recorded delivery lane and split decision do not match actual boundaries.

Do not split merely to increase task count.

## Results

### LOOP_READY

Required output:

- readiness result, delivery lane/split decision, residual risk, and execution decision;
- proposed Execution Blueprint path and digest;
- decision summary and compact Blueprint-reference patch;
- direct execution withheld pending confirmed patch application.

### NEEDS_GRILL

Return missing requirement-level fields and the smallest next action. Do not generate execution artifacts.

### NEEDS_HUMAN

Return the blocking contradiction, permission, authorization, or material decision and the smallest next action. Do not generate execution artifacts.
