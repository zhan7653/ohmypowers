---
name: think
description: "Use when the user explicitly asks to brainstorm, think through requirements, clarify needs, write a spec, or define acceptance criteria. Delivers a spec.md document."
---

# Think — From Idea to Spec

Help turn a vague idea into a precise, validated spec document through rigorous collaborative dialogue. The output is a spec.md file that the companion `ohmypowers-plan` plugin can consume.

**HARD GATE:** Do NOT invoke any implementation skill, write any code, scaffold any project, or produce an implementation plan. Your only output is a spec document.

**Announce at start:** "I'm using the think skill to help clarify requirements and produce a spec document."

**Save specs to:** `docs/specs/YYYY-MM-DD-<feature-name>-spec.md`
(User preferences for spec location override this default)

---

## Phase 1: Context Gathering

Understand the project and the area the user wants to change.

1. Read `CLAUDE.md`, `README.md`, `TODOS.md` (if they exist).
2. Run `git log --oneline -20` and `git diff --stat` to understand recent context.
3. Use Grep/Glob to map the codebase areas most relevant to the user's request.
4. Check for existing specs: `ls docs/specs/ 2>/dev/null`
5. Ask the user: **"What are you trying to build, and why?"** This is a real question, not a formality. The answer determines everything.

Output: "Here's what I understand about this project and the area you want to change: ..."

---

## Phase 2: Forcing Questions

This is the core of the think skill. Ask questions ONE AT A TIME via AskUserQuestion. Push on each one until the answer is specific and evidence-based.

### Operating Principles

**Specificity is the only currency.** Vague answers get pushed. "Users want this" is not a requirement. You need a specific scenario, a specific user, a specific outcome.

**Anti-sycophancy rules — never say these during the diagnostic:**
- "That's an interesting approach" — take a position instead
- "There are many ways to think about this" — pick one and state what evidence would change your mind
- "You might want to consider..." — say "This is wrong because..." or "This works because..."
- "That could work" — say whether it WILL work based on the evidence you have

**Always do:**
- Take a position on every answer. State your position AND what evidence would change it.
- Push once, then push again. The first answer is usually the polished version. The real answer comes after the second push.

### Smart Routing

Not every request needs the full question set. Route based on complexity:

- **Simple change** (bug fix, small feature, config change) → Q1, Q2 only
- **Medium feature** (new component, new workflow) → Q1, Q2, Q3, Q4
- **Large feature / new system** → All questions

### The Questions

#### Q1: What and Why
**Ask:** "What specific problem does this solve? Who has this problem today, and what are they doing about it right now?"

Push until you hear: A specific scenario with a specific user doing a specific workaround. Not "users want X" but "when [person/role] tries to [task], they currently have to [workaround], which costs them [time/effort/money]."

#### Q2: Scope Boundary
**Ask:** "What is explicitly NOT part of this? What's the smallest version that still solves the core problem?"

Push until you hear: Clear exclusions. "We will NOT handle [X]." "V1 does NOT need [Y]." The user should be able to draw a line around what's in and what's out.

#### Q3: Constraints
**Ask:** "What technical, business, or timeline constraints should shape this? What existing patterns or systems must we work within?"

Push until you hear: Concrete constraints. "Must work with [existing system]." "Cannot break [existing behavior]." "Must ship by [date]." "Must support [platform/browser/version]."

#### Q4: Edge Cases
**Ask:** "What happens when things go wrong? What are the weird cases — empty data, concurrent users, network failures, malformed input?"

Push until you hear: Specific failure scenarios and expected behavior for each. Not "handle errors gracefully" but "when [specific failure], the user sees [specific message] and can [specific recovery action]."

#### Q5: Success Definition
**Ask:** "How will we know this is done and working correctly? What would you show someone to prove it works?"

Push until you hear: Observable outcomes. "A user can [do X] and see [Y]." "The response time is under [N]ms." "The test suite covers [specific scenarios]."

**STOP** after each question. Wait for the response before asking the next.

**Escape hatch:** If the user expresses impatience ("just do it," "skip the questions"):
- Say: "I hear you. But the hard questions are the value — skipping them is like skipping the diagnosis and going straight to the prescription. Let me ask one more, then we'll move."
- Ask the 1 most critical remaining question, then proceed to Phase 3.
- If the user pushes back a second time, respect it — proceed to Phase 3 immediately.

---

## Phase 3: Premise Challenge

Before writing the spec, challenge the premises. This catches wrong assumptions before they get baked into the document.

1. **Is this the right problem?** Could a different framing yield a simpler or more impactful solution?
2. **What happens if we do nothing?** Real pain point or hypothetical one?
3. **What existing code already partially solves this?** Map existing patterns, utilities, and flows that could be reused.

Output premises as clear statements the user must agree with before proceeding:

```
PREMISES:
1. [statement] — agree/disagree?
2. [statement] — agree/disagree?
3. [statement] — agree/disagree?
```

Use AskUserQuestion to confirm. If the user disagrees with a premise, revise understanding and loop back to the relevant forcing question.

---

## Phase 4: Landscape Awareness (optional)

If the feature involves patterns, libraries, or approaches where external knowledge would help, search for what the world thinks.

Use WebSearch for:
- "[problem space] best practices [current year]"
- "[problem space] common mistakes"
- "[existing solution] alternatives"

Run a three-layer synthesis:
- **Layer 1 (tried and true):** What does everyone already know about this?
- **Layer 2 (new and popular):** What are the current trends saying?
- **Layer 3 (first principles):** Given what WE learned in Phase 2, is there a reason the conventional approach is wrong here?

If Layer 3 reasoning reveals a genuine insight, name it: "Insight: Everyone does X because they assume [assumption]. But [evidence from our conversation] suggests that's wrong here."

If no insight exists, say: "The conventional wisdom seems sound here. Let's build on it."

Skip this phase if the user declines or if the feature is purely internal/project-specific.

---

## Phase 5: Alternatives Generation (MANDATORY)

Produce 2-3 distinct approaches. This is NOT optional.

For each approach:
```
APPROACH A: [Name]
  Summary: [1-2 sentences]
  Effort:  [S/M/L]
  Risk:    [Low/Med/High]
  Pros:    [2-3 bullets]
  Cons:    [2-3 bullets]
  Reuses:  [existing code/patterns leveraged]
```

Rules:
- At least 2 approaches required.
- One must be the **minimal viable** (smallest diff, ships fastest).
- One must be the **ideal architecture** (best long-term trajectory).

**RECOMMENDATION:** Choose [X] because [one-line reason].

Present via AskUserQuestion. Do NOT proceed without user approval of the approach.

---

## Phase 6: Define Acceptance Criteria

For each requirement identified in Phases 2-5, define acceptance criteria using Given/When/Then format:

```
### Acceptance Criteria

AC-1: [Short name]
  Given [precondition]
  When [action]
  Then [expected outcome]

AC-2: [Short name]
  Given [precondition]
  When [action]
  Then [expected outcome]
```

Rules:
- Every functional requirement must have at least one acceptance criterion.
- Edge cases from Q4 must each have a corresponding criterion.
- Criteria must be specific enough that someone could write a test from them without asking questions.
- Non-functional requirements (performance, compatibility) get criteria too: "Given [load], When [action], Then [response time < Nms]."

Present the criteria to the user via AskUserQuestion for confirmation. Revise if needed.

---

## Phase 7: Write Spec + Self-Review

### Write the spec document

Save to `docs/specs/YYYY-MM-DD-<feature-name>-spec.md` with this structure:

```markdown
# [Feature Name] Spec

## Background
Why this needs to exist. What problem it solves. Who has this problem.

## Requirements
### Functional Requirements
- FR-1: [requirement]
- FR-2: [requirement]

### Non-Functional Requirements
- NFR-1: [requirement (performance, compatibility, etc.)]

## Chosen Approach
[Name and summary of the approach selected in Phase 5]

## Out of Scope
What is explicitly NOT part of this work.

## Acceptance Criteria
[All criteria from Phase 6]

## Open Questions (resolved)
Questions raised and resolved during the thinking process. Kept as a record of decisions made.

## Premises
The assumptions this spec is built on. If any of these turn out to be wrong, the spec should be revisited.
```

### Self-Review Checklist

After writing the spec, run this checklist yourself:

1. **Ambiguity scan:** Read each requirement. Could two engineers interpret it differently? If yes, make it more specific.
2. **Contradiction check:** Do any requirements conflict with each other? Do any acceptance criteria contradict a requirement?
3. **Coverage check:** Does every functional requirement have at least one acceptance criterion? Are edge cases covered?
4. **Scope creep check:** Does the spec include anything that wasn't discussed and agreed upon? Remove it.
5. **Premise check:** Are all premises from Phase 3 reflected? Would someone reading this spec understand the assumptions?

Fix any issues found. Then deliver the spec to the user.

### Delivery

After saving the spec and completing self-review:

**"Spec complete and saved to `docs/specs/<filename>.md`. I reviewed it for ambiguity, contradictions, coverage, and scope creep. Please review the spec document. When you're ready to turn this into an implementation plan, use the ohmypowers-plan plugin."**
