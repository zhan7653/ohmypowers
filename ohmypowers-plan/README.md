# ohmypowers-plan

A Claude Code plugin for implementation planning: read a spec, propose architecture, structured self-review, and deliver a plan document.

## Scope

Included skills:
- `using-ohmypowers-plan` — entry point, routes explicit planning requests
- `plan` — the core 5-phase workflow from spec to plan.md

Excluded on purpose:
- Requirement thinking / brainstorming (use `ohmypowers-think`)
- Code implementation
- Code review

## Workflow

When a request explicitly asks for an implementation plan:

1. Phase 1: Read Spec + Context — find spec, read code, map existing patterns
2. Phase 2: Architecture Proposal — dream state, temporal interrogation, task decomposition
3. Phase 3: Self-Review #1 (Engineering) — architecture, errors, security, data flow, tests, performance
4. Phase 4: Self-Review #2 (Spec Alignment) — requirements coverage, acceptance criteria, scope, failure modes
5. Phase 5: Write Plan + Deliver — `docs/plans/*.md`

## Input

Expects a spec document at `docs/specs/*.md` (produced by `ohmypowers-think`). Can also work from user-provided requirements directly.

## Deliverable

A plan document at `docs/plans/YYYY-MM-DD-<feature-name>-plan.md` containing:
- File structure map
- Bite-sized tasks with exact file paths and code
- Failure modes registry
- Decision audit trail
- Review notes

## Companion Plugin

Use `ohmypowers-think` to create the spec that feeds into this plugin.
