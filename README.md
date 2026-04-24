# ohmypowers

<a id="english"></a>

[中文](#中文)

## Overview

Claude Code plugins for structured thinking and implementation planning.

`ohmypowers` is a set of workflow-oriented Claude Code plugins that turn vague ideas into documents that can be discussed, reviewed, and executed. The goal is not to make Claude write more code immediately, but to clarify the problem, scope, completion criteria, and implementation direction before coding starts.

## Use Cases

- You have a feature idea, but the requirements are still vague and need to become a spec.
- You are preparing a complex change and want to clarify scope, constraints, and acceptance criteria first.
- You already have a spec and want to generate an actionable implementation plan.
- You want Claude Code to ask structured questions before coding instead of jumping straight into file edits.

## Install

```bash
# Add the marketplace
/plugin marketplace add zhan7653/xutianding-marketplace

# Install plugins
/plugin install ohmypowers-power-think@xutianding
/plugin install ohmypowers-power-plan@xutianding
```

## Plugins

### ohmypowers-power-think

Requirement thinking workflow: brainstorm, clarify ambiguities, challenge premises, define acceptance criteria, and deliver a spec document.

`ohmypowers-power-think` helps clarify requirements. It uses a sequence of forcing questions to make the following points explicit:

- Whose problem this feature solves, and what the problem is.
- What is explicitly out of scope for the current version.
- Which technical, business, or timeline constraints matter.
- How edge cases and failure cases should behave.
- How to prove the work is complete and functioning correctly.

**Trigger:** `/power-think` or explicitly ask to brainstorm / create a spec

**Deliverable:** `docs/specs/YYYY-MM-DD-<feature-name>-spec.md`

### ohmypowers-power-plan

Implementation planning workflow: read a spec, propose architecture, perform structured self-reviews, and deliver a plan document.

`ohmypowers-power-plan` turns requirements into an implementation plan. It reads an existing spec, inspects the current codebase, and produces a more execution-oriented plan covering architecture choices, file-level changes, task breakdowns, risks, and self-review checks.

**Trigger:** `/power-plan` or explicitly ask to create an implementation plan

**Deliverable:** `docs/plans/YYYY-MM-DD-<feature-name>-plan.md`

## Workflow

```text
Think → Spec → Plan → Implement
```

Recommended workflow:

1. Use `ohmypowers-power-think` to discuss requirements and produce a spec.
2. Use `ohmypowers-power-plan` to generate an implementation plan from the spec.
3. Ask Claude Code to implement the change by following the plan.

This workflow is best suited for medium or large changes. For very small fixes or clearly defined one-line edits, you can ask Claude Code to make the change directly without using the full workflow.

## Why this exists

Claude Code is strong at executing clear tasks, but vague requests like “help me build a feature” can lead it to enter implementation too early. `ohmypowers` separates requirement clarification and implementation planning into two explicit steps, so Claude Code asks key questions, challenges assumptions, and writes reviewable documents before coding.

Benefits:

- Less rework: confirm the goal and boundaries before writing code.
- Fewer misunderstandings: record implicit assumptions in the spec and plan.
- Easier review: requirement and planning documents are saved in the repository.
- Better collaboration: teammates can review the documents before reviewing code.

## License

MIT

---

<a id="中文"></a>

[English](#english)

## 概览

用于结构化需求思考和实施计划的 Claude Code 插件。

`ohmypowers` 是一组面向 Claude Code 的流程型插件，用来把模糊想法转化为可以讨论、评审和执行的文档。它的目标不是让 Claude 立刻写更多代码，而是在编码开始前先明确问题、范围、完成标准和实施方向。

## 适用场景

- 你有一个功能想法，但需求还比较模糊，需要先整理成 spec。
- 你准备进行一个复杂改动，希望先明确范围、约束和验收标准。
- 你已经有 spec，希望生成一份可执行的 implementation plan。
- 你希望 Claude Code 在编码前先进行结构化追问，而不是直接开始修改文件。

## 安装

```bash
# 添加插件市场
/plugin marketplace add zhan7653/xutianding-marketplace

# 安装插件
/plugin install ohmypowers-power-think@xutianding
/plugin install ohmypowers-power-plan@xutianding
```

## 插件

### ohmypowers-power-think

需求思考工作流：头脑风暴、澄清歧义、挑战前提、定义验收标准，并产出 spec 文档。

`ohmypowers-power-think` 用来帮助你澄清需求。它会通过一组强制性问题，把下面这些内容明确下来：

- 这个功能解决谁的问题，以及具体是什么问题。
- 当前版本中哪些内容明确不在范围内。
- 哪些技术、业务或时间约束需要考虑。
- 边界情况和失败情况应该如何表现。
- 如何证明这项工作已经完成并且正常运行。

**触发方式：** `/power-think`，或明确要求进行头脑风暴 / 创建 spec

**产出文件：** `docs/specs/YYYY-MM-DD-<feature-name>-spec.md`

### ohmypowers-power-plan

实施计划工作流：读取 spec、提出架构方案、执行结构化自检，并产出 plan 文档。

`ohmypowers-power-plan` 用来把需求转化为实施计划。它会读取已有 spec，检查当前代码库，并产出更偏工程执行的计划，覆盖架构选择、文件级改动、任务拆分、风险点和自检项。

**触发方式：** `/power-plan`，或明确要求创建 implementation plan

**产出文件：** `docs/plans/YYYY-MM-DD-<feature-name>-plan.md`

## 工作流

```text
Think → Spec → Plan → Implement
```

推荐流程：

1. 使用 `ohmypowers-power-think` 讨论需求并产出 spec。
2. 使用 `ohmypowers-power-plan` 基于 spec 生成 implementation plan。
3. 让 Claude Code 按照 plan 执行具体实现。

这个流程更适合中型或大型改动。对于非常小的修复，或者定义非常明确的一行改动，可以直接让 Claude Code 修改，不需要使用完整流程。

## 为什么需要它

Claude Code 很擅长执行明确任务，但面对“帮我做一个功能”这类模糊请求时，容易过早进入实现阶段。`ohmypowers` 把需求澄清和实施计划拆成两个显式步骤，让 Claude Code 在编码前先提出关键问题、挑战假设，并写出可以评审的文档。

好处：

- 减少返工：写代码前先确认目标和边界。
- 降低误解：把隐含假设记录到 spec 和 plan 中。
- 方便评审：需求文档和计划文档都会保存到仓库里。
- 更适合协作：团队成员可以先评审文档，再评审代码。

## 许可证

MIT
