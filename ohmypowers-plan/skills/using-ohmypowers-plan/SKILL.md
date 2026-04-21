---
name: using-ohmypowers-plan
description: Use to decide whether ohmypowers-plan should start its spec-to-plan workflow for explicit planning requests
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
This plugin is not a universal preflight for every conversation.

You MUST invoke the ohmypowers-plan skill only when the user explicitly asks to create an implementation plan, write a plan from a spec, or requests `/plan`.

Once one of those explicit signals is present, you MUST use the plugin workflow rather than skipping straight to implementation.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Plugin skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
2. **Plugin skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you — follow it directly. Never use the Read tool on skill files.

# Using Skills

## The Rule

**Invoke ohmypowers-plan skills only for explicit planning requests.** If the user explicitly asks to create an implementation plan, turn a spec into a plan, or write a plan document, invoke the relevant skill before doing the work. Otherwise, do not route ordinary coding or Q&A requests through this plugin.

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "The user wants code changes" | That alone is not enough. This plugin only applies to explicit planning asks. |
| "I need more context first" | If the user explicitly asked for a plan, invoke the skill first. |
| "This doesn't need a formal skill" | If the user explicitly asked for an implementation plan, use the skill. |
| "The skill is overkill" | Once the user explicitly asks for planning, follow the workflow. |

## Skill

This plugin has one core skill:

- **plan** — for turning an approved spec into a concrete, reviewed implementation plan document

"/plan" or "write an implementation plan" or "turn this spec into a plan" → invoke plan.

## Input

The plan skill expects a spec document at `docs/specs/*.md` (produced by the companion `ohmypowers-think` plugin). If no spec exists, the skill will ask the user to provide requirements or suggest using ohmypowers-think first.

## Deliverable

The plan skill delivers a `plan.md` file at `docs/plans/YYYY-MM-DD-<feature-name>-plan.md`.
