---
name: plan
description: "Use when the user explicitly asks to create an implementation plan from a spec or approved requirements. Delivers a plan.md document with structured self-review."
---

# Plan — From Spec to Implementation Plan

Turn an approved spec document into a concrete, reviewed implementation plan. The plan is written for an engineer who has zero context about the codebase.

**HARD GATE:** Do NOT write any implementation code. Your only output is a plan document.

**Announce at start:** "I'm using the plan skill to create an implementation plan from the spec."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>-plan.md`
(User preferences for plan location override this default)

---

## Phase 1: Read Spec + Context

### Step 1: Find and read the spec

1. Check `docs/specs/` for spec files: `ls -t docs/specs/*.md 2>/dev/null`
2. If multiple specs exist, ask the user which one to use.
3. If no spec exists, ask the user: "No spec found in docs/specs/. Would you like to provide requirements directly, or use ohmypowers-think to create a spec first?"
4. Read the spec thoroughly. Extract: requirements, acceptance criteria, chosen approach, constraints, out of scope.

### Step 2: Read project context

1. Read `CLAUDE.md`, `README.md` (if they exist) for project conventions.
2. Run `git log --oneline -20` to understand recent activity.
3. Use Grep/Glob to map the codebase areas referenced by the spec.
4. For each file/module the spec mentions or implies changes to, read the actual code. Understand existing patterns, interfaces, and dependencies.

### Step 3: Map existing code to spec requirements

For each requirement in the spec, identify:
- What existing code already partially solves this
- What interfaces/patterns must be followed
- What dependencies exist

Output: "Here's what I understand: [spec summary]. The codebase currently [relevant state]. I'll now propose an architecture."

---

## Phase 2: Architecture Proposal

### Dream State Mapping

Think about three states:
```
CURRENT STATE → THIS PLAN → 12-MONTH IDEAL
```

The plan should move the codebase toward the ideal state, not just solve the immediate problem. But don't over-engineer. The plan should be the smallest step that moves in the right direction.

### Temporal Interrogation

Think ahead to what the implementer will face:
- **Hour 1:** What does the implementer need to know before writing the first line? What files to read? What patterns to follow?
- **Hour 2-3:** What ambiguities will they hit? What decisions will they need to make that aren't in the spec?
- **Hour 4+:** What integration issues will surface? What will break that wasn't obvious?

Resolve these ambiguities NOW, in the plan. Don't leave them for the implementer to discover.

### File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for.

- Design units with clear boundaries and well-defined interfaces.
- Prefer smaller, focused files over large ones that do too much.
- In existing codebases, follow established patterns.

### Task Decomposition

Break the work into bite-sized tasks. Each task should:
- Produce a self-contained, testable change
- Take 2-15 minutes to implement
- Have clear inputs and outputs

Present the proposed architecture to the user via AskUserQuestion. Get approval before proceeding to write the full plan.

---

## Phase 3: Structured Self-Review #1 (Engineering)

After writing the plan draft, review it from an engineering perspective. This is a checklist you run yourself.

### Architecture Review
- [ ] Are component boundaries clear? Can each unit be understood independently?
- [ ] Are interfaces between components well-defined?
- [ ] Is coupling minimized? Could you change one component without breaking others?
- [ ] Does the architecture follow existing project patterns?

### Error Path Review
- [ ] For each new code path, what happens on failure?
- [ ] Are error messages specific enough to diagnose issues?
- [ ] Are there cascading failure risks?

### Security Review
- [ ] Does this introduce new attack surface (user input, external APIs)?
- [ ] Are auth boundaries respected?
- [ ] Is input validation present at system boundaries?

### Data Flow Review
- [ ] Is the data flow through the system clear?
- [ ] Are there race conditions or ordering dependencies?
- [ ] Is state management explicit?

### Test Coverage Review
- [ ] Does every requirement have a corresponding test task?
- [ ] Are edge cases from the spec covered by test tasks?
- [ ] Are integration points tested?

### Performance Review
- [ ] Are there N+1 query risks?
- [ ] Are there unnecessary network calls or file reads?
- [ ] Is caching considered where appropriate?

For each issue found, fix it in the plan. Log what you found and fixed.

---

## Phase 4: Structured Self-Review #2 (Spec Alignment)

Review the plan against the spec. This catches drift between what was agreed and what was planned.

### Requirements Coverage
- [ ] For each functional requirement in the spec, point to the task that implements it. List any gaps.
- [ ] For each non-functional requirement, point to how it's addressed. List any gaps.

### Acceptance Criteria Mapping
- [ ] For each acceptance criterion in the spec, point to the task that makes it verifiable. List any gaps.
- [ ] Are there acceptance criteria that can't be verified with the planned tasks?

### Scope Check
- [ ] Does the plan include anything NOT in the spec? If yes, remove it or flag it for user approval.
- [ ] Does the plan miss anything that IS in the spec? If yes, add it.

### Failure Modes Registry

For each significant code path in the plan:

```
| Code Path | Failure Mode | Handled? | Tested? | User Sees |
|-----------|-------------|----------|---------|-----------|
| [path]    | [failure]   | Yes/No   | Yes/No  | [message] |
```

### Decision Audit Trail

Every non-obvious decision in the plan gets a row:

```
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [what]   | [why]     | [what else]            |
```

For each issue found, fix it in the plan. Log what you found and fixed.

---

## Phase 5: Write Plan + Deliver

### Plan Document Structure

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Use this document as the source of truth for implementation.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/specs/<spec-filename>.md`
**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `path/to/new.ts` | [what it does] |
| Modify | `path/to/existing.ts` | [what changes] |
| Test   | `tests/path/to/test.ts` | [what it tests] |

## Tasks

### Task 1: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

- [ ] **Step 1: [action]**
  [code or instructions]

- [ ] **Step 2: [action]**
  [code or instructions]

- [ ] **Step 3: Verify**
  Run: `[exact command]`
  Expected: [exact output]

### Task 2: [Component Name]
...

## Failure Modes Registry
[from Phase 4]

## Decision Audit Trail
[from Phase 4]

## Review Notes
[issues found and fixed during self-review]
```

### Task Content Rules

Every step must contain the actual content an engineer needs. These are plan failures — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the content)
- Steps that describe what to do without showing how

### Delivery

After saving the plan and completing both self-reviews:

**"Plan complete and saved to `docs/plans/<filename>.md`. I reviewed it twice: once for engineering quality (architecture, errors, security, tests, performance) and once for spec alignment (requirements coverage, acceptance criteria mapping, scope). Please review the plan document before starting implementation."**
