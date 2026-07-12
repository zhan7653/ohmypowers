---
name: power-critic
description: Use only when the user explicitly invokes $power-critic or explicitly asks to use the power-critic skill for requirements, CLI interaction, specs, plans, or model replies. Challenges unclear assumptions, overbuilt scope, weak plans, missing acceptance criteria, and model answers that moved too quickly. Not for code diff correctness review; redirect those tasks to /review or the repo's code review workflow.
---

# Power Critic

## 输出语言

默认使用简体中文输出批量批评报告和降级说明。代码标识符、路径、命令、状态枚举、引用证据及必须精确匹配的原文保持不变。仅当用户明确要求其他语言时切换。

## Overview

Produce a read-only batch critique of requirements, conversations, specs, plans, or model replies. The goal is to reduce agreement bias by using a fresh critic context when the host supports subagents.

This is not code review. If the primary object is a code diff, branch, PR, commit, implementation bug, security issue in code, or merge decision, stop and redirect to `power-verifier`, `/review`, or the repository's code review workflow.

This skill is explicit-only. If host invocation policy is unavailable or unverified, still treat `$power-critic` or an explicit request to use the power-critic skill as required authorization.

## Workflow

### 1. Identify Target And Focus

Use the user's explicit target when provided, such as a spec file, plan, pasted requirement, or model reply. If no target is specified, review the currently visible CLI interaction by preparing a Critique Packet.

Optional focus values include requirements, spec, plan, UX, scope, model reply quality, and risk. Prioritize the requested focus while still surfacing obvious cross-cutting issues.

### 2. Build A Critique Packet

Before dispatching any critic, the main agent must create a read-only Critique Packet. Pass only this packet plus the critic instructions to the critic.

Use this structure:

```markdown
# Critique Packet

## Target
conversation | file | spec | plan | model reply | other

## User Goal
<the user's stated goal or nearest explicit goal>

## Target Material
<actual text or file contents being reviewed>

## Current Proposal
<current requirement, spec, plan, or model answer being challenged>

## Decisions Already Made
<explicit choices the user has confirmed>

## Constraints
<technical, product, time, repo, host, or process constraints>

## Open Questions
<known unresolved questions before critique starts>

## Context Bounds
<what conversation window, files, or excerpts are included; state if earlier context is unavailable>

## Relevant Verbatim Excerpts
<exact snippets from user-provided material, files, or visible conversation>

## Omitted Or Unavailable Context
<important context that may exist but was not visible or not included>

## Parent-Agent Summary
<clearly marked summary; do not treat this as evidence by itself>

## What Not To Review
<explicit exclusions, especially code diff correctness and implementation bug review>

## Optional Focus
<requested focus, if any>
```

Findings must cite user-provided material, file contents, or relevant verbatim excerpts as evidence. A parent-agent summary can orient the critic, but it cannot be the sole evidence for a finding.

For default conversation review, include the visible user requests and decisions that shaped the current proposal. If the visible transcript is partial, say so in `Context Bounds` and list likely gaps in `Omitted Or Unavailable Context`.

### 3. Dispatch The Critic

In Codex, explicit invocation of `$power-critic` counts as an explicit request to spawn one fresh read-only critic subagent when subagents are available. The main agent must not perform the critique itself unless subagents are unavailable or the host does not support them.

When Codex custom agents are available, use the installed `power_critic` custom agent or an equivalent read-only subagent configuration. For Codex, the bundled [agents/power-critic.toml](agents/power-critic.toml) is a source template; it must be installed into Codex's custom-agent search path, such as `~/.codex/agents/power-critic.toml` for a personal agent or `.codex/agents/power-critic.toml` for a project agent.

For other hosts, use the equivalent fresh-context subagent mechanism when available.

Wait for the critic result, then return only the consolidated batch report to the user. If a fresh subagent is available but read-only sandboxing is not verified, still use the fresh subagent and disclose that runtime read-only hardening is unverified.

If subagents are unavailable, disclose degraded mode before the report:

```markdown
Degraded mode: subagents are unavailable, so this is a self-review from the current context.
```

### 4. Critic Instructions

The critic must:

- Review only the provided Critique Packet or target material.
- Stay read-only: do not edit files, write patches, or modify specs, plans, README, or code.
- Challenge ambiguity, hidden assumptions, weak acceptance criteria, overbuilt scope, missing constraints, bad sequencing, and model replies that moved too quickly.
- Avoid code diff correctness, implementation bug, security code review, and merge-gating judgments.
- Produce a batch report, not one issue at a time.
- Report only justified findings. Do not invent critique to reach a count.
- For vague requirements or overdesigned plans, produce at least 3 evidence-backed findings when the material supports them.

## Report Format

Each finding must use this format:

```markdown
### 发现 N：<简短标题>
- 严重程度：Blocker | Should fix | Nice to have
- 类别：Requirements | Spec | Plan | Scope | UX | Model reply quality | Risk
- 问题：<具体问题>
- 证据：<原文摘录、文件引用或用户提供的材料>
- 影响：<不处理的后果>
- 建议追问：<用户或 Agent 需要回答的问题>
- 建议处理方式：<修改、推迟、询问用户、缩小范围、增加约束等>
- 置信度：High | Medium | Low
```

If fewer than 3 findings are justified, do not stretch. Include:

```markdown
## 材料不足评估
- 为什么不足以支持 3 条发现：
- 缺少的信息：
- 最值得继续询问的问题：
- 补充材料后是否应重新评审：Yes | No
```

Keep the tone direct and rigorous, not hostile.
