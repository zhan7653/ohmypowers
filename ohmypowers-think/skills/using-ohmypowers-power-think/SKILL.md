---
name: using-ohmypowers-power-think
description: Use to decide whether ohmypowers-power-think should start its requirement-thinking workflow for explicit brainstorming, requirement clarification, or spec-writing requests
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
This plugin is not a universal preflight for every conversation.

You MUST invoke the ohmypowers-power-think skill only when the user explicitly asks to brainstorm, think through requirements, clarify needs, write a spec, define acceptance criteria, or requests `/power-think`.

Once one of those explicit signals is present, you MUST use the plugin workflow rather than skipping straight to implementation or planning.
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

**Invoke ohmypowers-power-think skills only for explicit requirement-thinking requests.** If the user explicitly asks to brainstorm, think through requirements, clarify needs, write a spec, or define acceptance criteria, invoke the relevant skill before doing the work. Otherwise, do not route ordinary coding or Q&A requests through this plugin.

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "The user wants code changes" | That alone is not enough. This plugin only applies to explicit thinking/spec asks. |
| "I need more context first" | If the user explicitly asked to think/brainstorm, invoke the skill first. |
| "This doesn't need a formal skill" | If the user explicitly asked for brainstorming or a spec, use the skill. |
| "The skill is overkill" | Once the user explicitly asks for requirement thinking, follow the workflow. |

## Skill

This plugin has one core skill:

- **power-think** — for explicit brainstorming, requirement clarification, acceptance criteria definition, and spec document delivery

"/power-think" or "help me think through this" or "write a spec" → invoke power-think.

## Deliverable

The think skill delivers a `spec.md` file at `docs/specs/YYYY-MM-DD-<feature-name>-spec.md`.

This spec is the input for the companion plugin `ohmypowers-power-plan`, which turns specs into implementation plans.
