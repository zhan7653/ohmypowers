---
name: power-think
description: Use when the user asks to brainstorm, clarify requirements, think through a feature, define acceptance criteria, or write a spec before implementation. Produces a reviewed spec document and does not implement code or write an implementation plan.
---

# Power Think

## Overview

Turn a vague idea into a precise, reviewed spec through structured dialogue. The output is a Markdown spec, normally saved to `docs/specs/YYYY-MM-DD-<feature-name>-spec.md` unless the user requests another location.

Hard gate: do not implement code, scaffold projects, or write an implementation plan while using this skill. The deliverable is a spec document only.

At the start, say: "I am using the power-think skill to clarify requirements and write a spec."

## When To Use

Use this skill when the user asks to:

- Brainstorm or think through a feature idea.
- Clarify requirements, scope, constraints, or edge cases.
- Define acceptance criteria.
- Write or refine a spec before implementation.

Do not use this skill for ordinary coding tasks, bug fixes with clear requirements, code review, or implementation planning unless the user explicitly asks for requirement thinking or a spec first.

## Workflow

### 1. Gather Context

Understand the project and the area the user wants to change.

1. Read project guidance files when present: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `TODOS.md`.
2. Inspect recent work with `git log --oneline -20` and `git diff --stat` when available.
3. Search the codebase for files, modules, commands, or workflows related to the user's idea.
4. Check for existing specs in `docs/specs/`.
5. Ask: "What are you trying to build, and why?"

After context gathering, summarize the project area and the likely change surface in a few sentences.

### 2. Ask Forcing Questions

Ask questions one at a time. Push for concrete answers. Vague answers should be narrowed before moving on.

Use normal chat questions. If the host tool offers a structured choice UI, use it only for short choices after explaining the options in normal text.

Route by complexity:

- Simple change: ask Q1 and Q2.
- Medium feature: ask Q1 through Q4.
- Large feature or new system: ask all questions.

Q1: What and why
Ask: "What specific problem does this solve? Who has this problem today, and what are they doing about it right now?"
Push until there is a specific user, scenario, workaround, and cost.

Q2: Scope boundary
Ask: "What is explicitly not part of this? What is the smallest version that still solves the core problem?"
Push until the exclusions are clear.

Q3: Constraints
Ask: "What technical, business, or timeline constraints should shape this? What existing patterns or systems must we work within?"
Push until each constraint is concrete and testable.

Q4: Edge cases
Ask: "What happens when things go wrong? What are the empty, concurrent, network, malformed input, permission, or migration cases?"
Push until each important failure has expected behavior.

Q5: Success definition
Ask: "How will we know this is done and working correctly? What would you show someone to prove it works?"
Push until success is observable and testable.

If the user asks to skip questions, ask the single most important remaining question, then proceed. If they push back again, proceed with stated assumptions.

### 3. Challenge Premises

Before writing the spec, test the foundations:

1. Is this the right problem?
2. What happens if nothing is built?
3. What existing code, workflow, or documentation already partially solves this?

Present the premises as statements and ask the user to confirm or correct them:

```text
PREMISES:
1. [statement] - agree/disagree?
2. [statement] - agree/disagree?
3. [statement] - agree/disagree?
```

If a premise is rejected, revise the understanding and revisit the relevant question.

### 4. Check The Landscape When Useful

Use external research only when current outside knowledge would materially change the spec, such as platform behavior, library tradeoffs, standards, policy, or common product patterns. Prefer official or primary sources when available. Skip this step for purely internal or project-specific changes.

Synthesize research in three layers:

- Tried and true: what is already conventional.
- Current practice: what has changed recently.
- First principles: whether the user's actual constraints justify following or rejecting the conventional approach.

### 5. Generate Alternatives

Provide 2-3 distinct approaches. At least one must be the minimal viable approach and one must be the stronger long-term architecture.

Use this format:

```text
APPROACH A: [Name]
Summary: [1-2 sentences]
Effort: S/M/L
Risk: Low/Medium/High
Pros:
- [point]
- [point]
Cons:
- [point]
- [point]
Reuses: [existing code or pattern]
```

State a recommendation and ask the user to choose or revise. Do not write the final spec until the approach is approved or the user explicitly delegates the decision.

### 6. Define Acceptance Criteria

Translate each requirement and important edge case into Given/When/Then criteria:

```markdown
### Acceptance Criteria

AC-1: [Short name]
Given [precondition]
When [action]
Then [expected outcome]
```

Rules:

- Every functional requirement needs at least one criterion.
- Each important edge case needs a criterion.
- Non-functional requirements need measurable criteria.
- Criteria must be specific enough for an engineer to write tests without asking follow-up questions.

Present the criteria and ask the user to confirm or request revisions.

### 7. Write And Review The Spec

Save the spec to `docs/specs/YYYY-MM-DD-<feature-name>-spec.md` unless the user requested a different path.

Use this structure:

```markdown
# [Feature Name] Spec

## Background
[Why this exists, who has the problem, and what they do today.]

## Requirements
### Functional Requirements
- FR-1: [requirement]

### Non-Functional Requirements
- NFR-1: [requirement]

## Chosen Approach
[Approved approach and rationale.]

## Out Of Scope
- [explicit exclusion]

## Acceptance Criteria
[Given/When/Then criteria.]

## Open Questions Resolved
- [question] -> [decision]

## Premises
- [premise]
```

Before delivery, self-review the spec:

1. Ambiguity: could two engineers interpret a requirement differently?
2. Contradiction: do requirements or criteria conflict?
3. Coverage: does every requirement have acceptance criteria?
4. Scope: did anything appear that the user did not agree to?
5. Premises: are the assumptions visible and testable?

Fix issues found during review.

Finish with: "Spec complete and saved to `docs/specs/<filename>.md`. I reviewed it for ambiguity, contradictions, coverage, scope, and premises."
