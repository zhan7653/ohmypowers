# Task Contract

## Problem

<What problem exists today.>

## Goal

<What this task must accomplish.>

## Delivery lane and split decision

- Delivery lane: `<LIGHT | STANDARD | HIGH>`
- Split assessment: `<not needed | recommended and accepted | recommended but explicitly declined>`
- Delivery boundaries: `<one bounded outcome, or the separate Issue boundaries and dependency order>`
- Required safety guarantees: `<requirement-level guarantees explicitly confirmed for this contract>`
- Stronger guarantees out of scope: `<transaction, concurrency, audit, recovery, rollback, or other guarantees not required>`

## User-observable behavior

<What users, operators, or integrations will observe when the task is complete.>

## Scope

- <in-scope item>

## Non-goals

- <out-of-scope item>

## Dependencies / blockers

- <dependency, external team, credential, environment, upstream decision, or "None known">

## Current context

<Relevant repository, system, or workflow context discovered during inspection.>

## External API / data contracts

<Public APIs, externally visible schemas, config, compatibility, migration, permission, security, or business-rule decisions. Use "None expected" when not applicable.>

## Constraints

<Auth, permissions, security, privacy, compatibility, migration, rollback, documentation, or "None known".>

## Risks and assumptions

- <risk or assumption>

## Validation expectations

- <Observable evidence, test category, manual check, or quality gate required. Exact repository commands may be supplied later by power-loop.>

## Acceptance criteria

- [ ] AC-1: Given <precondition>, when <action>, then <observable result>.

## Stop condition

<Observable condition that means the task is complete.>

## Pause-and-ask conditions

- <condition that requires user input before continuing>

## Change history

- YYYY-MM-DD: Initial task contract created.

<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `not-generated`

Artifact: `None`

Artifact digest: `None`

Delivery lane: `<copied from the confirmed Task Contract>`

This compact block may later reference a separately persisted, non-normative repository-aware plan after explicit user confirmation. The plan may evolve without changing the Task Contract unless it exposes a new requirement-level decision.
<!-- power-loop:execution-blueprint:end -->

<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `not-generated`

Artifact: `None`

Artifact digest: `None`

This compact block may later reference a separately persisted, non-normative task and capability plan after explicit user confirmation. Dispatch choices do not add requirements to the Task Contract.
<!-- power-loop:agent-dispatch-plan:end -->

# Curation status

State: open

Linked PRs:
- None yet.

Latest canonical context:
The Task Contract is the sole normative contract. The complete persisted body supplies source identity and lifecycle context. Planning references, planning artifacts, comments, Goal/session/PR evidence, and runner summaries are supplementary and cannot add obligations. Execution planning is not generated yet.

Decisions since contract:
- None.

Follow-up issues:
- None.

Closure evidence:
- None yet.
