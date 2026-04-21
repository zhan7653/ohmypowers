# ohmypowers-think

A Claude Code plugin for requirement thinking: brainstorm, clarify ambiguities, define acceptance criteria, and deliver a spec document.

## Scope

Included skills:
- `using-ohmypowers-think` — entry point, routes explicit thinking/spec requests
- `think` — the core 7-phase workflow from idea to spec.md

Excluded on purpose:
- Implementation planning (use `ohmypowers-plan`)
- Code implementation
- Code review

## Workflow

When a request explicitly asks for brainstorming, requirement thinking, or a spec:

1. Phase 1: Context Gathering — read project state
2. Phase 2: Forcing Questions — one at a time, push for specificity
3. Phase 3: Premise Challenge — surface and validate assumptions
4. Phase 4: Landscape Awareness — optional external research
5. Phase 5: Alternatives Generation — 2-3 approaches with tradeoffs
6. Phase 6: Define Acceptance Criteria — Given/When/Then format
7. Phase 7: Write Spec + Self-Review — deliver `docs/specs/*.md`

## Deliverable

A spec document at `docs/specs/YYYY-MM-DD-<feature-name>-spec.md` containing:
- Background and requirements
- Chosen approach
- Out of scope
- Acceptance criteria (Given/When/Then)
- Resolved questions and premises

## Companion Plugin

Use `ohmypowers-plan` to turn the spec into an implementation plan.
