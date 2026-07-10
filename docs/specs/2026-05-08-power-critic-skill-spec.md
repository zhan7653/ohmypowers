# Power Critic Skill Spec

## Background
`ohmypowers` currently ships `power-think`, a standalone skill for turning vague ideas into reviewed specs. During that workflow, users may also need a separate "找茬" pass over the conversation, requirement, spec, or plan itself. This differs from code review: the target is not code correctness, but weak assumptions, unclear requirements, overbuilt plans, missing edge cases, bad scope choices, and model replies that moved too quickly.

The primary user is someone working in a CLI agent session who wants a fresh, independent reviewer to challenge the current thinking before they proceed. Today they do this manually by asking the same agent to critique its own work, which is biased by the current context and often too agreeable.

## Requirements

### Functional Requirements
- FR-1: Add a new standalone `power-critic` skill for general-purpose critique of user requirements, CLI interaction, specs, and plans.
- FR-2: When no target is specified, the main agent must construct a Critique Packet from the currently visible CLI interaction and use that packet as the default review target.
- FR-3: The Critique Packet must distinguish verbatim excerpts from parent-agent summaries. Parent-agent summaries may orient the critic, but they must not be treated as sole evidence for a finding.
- FR-4: The Critique Packet must include target type, user goal, target material, current proposed plan/spec/requirement, explicit decisions already made, constraints, open questions, context bounds, relevant verbatim excerpts, omitted or unavailable context, clearly marked parent-agent summary, what not to review, and optional focus.
- FR-5: The skill must allow the user to specify a target material, such as a spec, plan, or Markdown file. When a file is specified, that file becomes the primary target material in the Critique Packet.
- FR-6: In Codex, explicit invocation of `$power-critic` counts as an explicit request to spawn one fresh read-only critic subagent when subagents are available.
- FR-7: The main agent must not perform the critique itself unless subagents are unavailable or the host does not support them. In degraded mode, it must disclose that it is performing self-review.
- FR-8: When Codex custom agents are available, the skill should use a `power_critic` custom agent with read-only sandboxing and high reasoning effort. The custom agent must be installed in a Codex custom-agent search path, such as `~/.codex/agents/power-critic.toml` for a personal agent or `.codex/agents/power-critic.toml` for a project agent; a TOML file bundled under the skill directory is only a source template.
- FR-9: The skill must produce a batch report rather than interrupting the user one issue at a time.
- FR-10: The skill must be read-only: it must not modify the reviewed file, spec, plan, code, README, or other project files.
- FR-11: The report must use a fixed finding format with severity, category, problem, evidence, why it matters, suggested follow-up question, recommended handling, and confidence.
- FR-12: The skill must support an optional focus, such as requirements, spec, plan, UX, scope, or model reply quality.
- FR-13: The skill must distinguish itself from code review and redirect code-diff correctness review to the appropriate code review workflow.
- FR-14: The skill must be explicit-only in its initial version. Its host metadata should disable implicit invocation when supported.
- FR-15: `power-think` may mention that `power-critic` can be called for an independent critique, but must not embed the full `power-critic` workflow.

### Non-Functional Requirements
- NFR-1: The reviewer tone should be direct and rigorous: challenge assumptions, identify unclear claims, and call out overdesign without becoming a hostile red-team mode by default.
- NFR-2: The first version should remain small and standalone, matching the repository's current skill-directory shape.
- NFR-3: The skill should not require gstack, external services, or a multi-review pipeline.
- NFR-4: If subagents are unavailable, the skill must clearly disclose the degraded mode before producing a self-review report.
- NFR-5: Findings should be specific enough that the user can decide whether to revise the requirement, spec, or plan without another clarification pass.
- NFR-6: Findings should be prioritized for action, so the report must make blocker-level concerns visibly different from nice-to-have critique.

## Chosen Approach
Create a new single-purpose `power-critic` skill. It is a general "找茬 reviewer" that defaults to constructing a Critique Packet from the visible CLI interaction or specified material, then sending only that packet plus reviewer instructions to a fresh-context subagent. The subagent returns a read-only batch critique using the required finding format.

This approach keeps the feature independent from `power-think`, avoids importing gstack's larger reviewer pipeline, and gives users a directly invokable tool for challenging requirements, specs, plans, and model responses. Optional focus is supported, but strategy, engineering, design, and DevEx reviewers are not separate skills in the first version.

### Critique Packet
Before dispatching a subagent, the main agent must prepare a Critique Packet with these sections:

- Target: `conversation`, `file`, `spec`, `plan`, `model reply`, or another explicit target type.
- User goal: the user's stated goal or the nearest explicit goal visible in the conversation.
- Target material: the actual text or file contents being reviewed.
- Current proposal: the current requirement, spec, plan, or model answer being challenged.
- Decisions already made: explicit choices the user has confirmed.
- Constraints: technical, product, time, repo, host, or process constraints.
- Open questions: unresolved questions already known before critique starts.
- Context bounds: what conversation window, files, or excerpts are included, plus whether earlier context is unavailable.
- Relevant verbatim excerpts: exact snippets from user-provided material, files, or visible conversation.
- Omitted or unavailable context: important material that may exist but was not visible or not included.
- Parent-agent summary: any necessary summary from the main agent, clearly marked as summary.
- What not to review: explicit exclusions, especially code diff correctness and implementation bug review.
- Optional focus: a narrower critique lens requested by the user.

The critic must base findings on visible user-provided material, file contents, or verbatim excerpts. Parent-agent summaries can guide orientation but are not sufficient evidence by themselves. For default conversation review, the packet must disclose the visible context bounds and any important omitted or unavailable context.

### Codex Runtime Requirements
For Codex hosts, invoking `$power-critic` is explicit permission to use one critic subagent. The main agent must spawn a single fresh read-only critic subagent when available, wait for the result, and return only the consolidated batch report to the user.

When Codex custom agents are available, the implementation should provide an agent equivalent to:

```toml
name = "power_critic"
description = "Read-only critic for requirements, specs, plans, CLI interactions, and model replies. Not a code diff reviewer."
model_reasoning_effort = "high"
sandbox_mode = "read-only"
developer_instructions = """
You are an independent critic. Review only the provided Critique Packet or target material.
Do not edit files. Do not propose patches. Do not review code diff correctness.
Return a batch report using the required finding format.
"""
```

This custom agent is a runtime hardening measure, not a substitute for the skill's read-only instructions. Installing the skill directory alone makes `$power-critic` available, but does not prove the named `power_critic` custom agent is active unless the TOML is installed into a Codex custom-agent search path and discovered by the host.

### Host Invocation Policy
The first version should be explicit-only. When the host supports invocation policy metadata, the skill metadata should include the equivalent of:

```yaml
policy:
  allow_implicit_invocation: false
```

This prevents the critic from running when the user is asking the agent to continue normal work.

### Report Format
Each finding must use this structure:

```markdown
### Finding N: <short title>
- Severity: Blocker | Should fix | Nice to have
- Category: Requirements | Spec | Plan | Scope | UX | Model reply quality | Risk
- Problem: <specific issue>
- Evidence: <verbatim excerpt, file reference, or user-provided material>
- Why it matters: <impact if left unresolved>
- Suggested follow-up question: <question the user or agent should answer>
- Recommended handling: <revise, defer, ask user, reduce scope, add constraint, etc.>
- Confidence: High | Medium | Low
```

If fewer than 3 findings are justified, the report must not invent critique. It must instead include:

```markdown
## Insufficient Material Assessment
- Why fewer than 3 findings are justified:
- Missing information needed:
- Best next questions:
- Should critique be rerun after more material is available: Yes | No
```

## Out Of Scope
- Code diff review, bug correctness review, security review of implementation code, or merge gating.
- Automatically editing the reviewed file or applying suggested changes.
- A multi-stage orchestrator like gstack `/autoplan`.
- Separate CEO, engineering, design, DevEx, or Codex reviewer skills.
- Running external models or CLIs as a requirement for the first version.
- Adding the full critique workflow inside `power-think`.

## Acceptance Criteria

### AC-1: Default CLI Interaction Review
Given the user invokes `$power-critic` without specifying a file or focus
When the skill runs
Then the main agent first creates a Critique Packet from the visible conversation and passes only that packet plus reviewer instructions to the critic.

### AC-2: Specified Material Review
Given the user invokes `$power-critic` with a target spec, plan, or Markdown file
When the skill runs
Then the main agent includes that material as the primary target in the Critique Packet and does not modify the file.

### AC-3: Fresh Subagent By Default
Given the current host supports subagents
When the skill runs
Then explicit invocation of `$power-critic` is treated as authorization to dispatch one fresh-context read-only critic subagent with only the Critique Packet and reviewer instructions.

### AC-4: Read-Only Output
Given the reviewer finds issues
When the report is produced
Then the skill outputs suggestions and questions only, with no edits to source files, specs, plans, README, or code.

### AC-5: Minimum Useful Critique
Given the input is a vague requirement or overdesigned plan
When `$power-critic` reviews it
Then the report contains at least 3 concrete, actionable, evidence-backed findings or an Insufficient Material Assessment explaining why 3 findings are not justified.

### AC-6: Fixed Finding Format
Given the reviewer reports a finding
When the final report is displayed
Then each finding includes severity, category, problem, evidence, why it matters, suggested follow-up question, recommended handling, and confidence.

### AC-7: Code Review Boundary
Given the primary object is a code diff, branch, PR, commit, or implementation bug
When the skill detects that the request is primarily a code review
Then it does not continue as `power-critic`; it briefly says this is a code review task and redirects to `/review` or the repository's code review workflow.

### AC-8: Optional Focus
Given the user provides a focus such as requirements, spec, plan, UX, scope, or model reply quality
When the skill runs
Then the critique prioritizes that focus while still surfacing obvious cross-cutting risks.

### AC-9: Power Think Cross-Reference
Given a user is using `power-think` to clarify a feature or write a spec
When the workflow reaches a point where independent critique would be useful
Then `power-think` may briefly mention `$power-critic` as an optional external critique skill without embedding its full instructions.

### AC-10: Parent Summary Is Not Evidence
Given the Critique Packet contains both verbatim excerpts and parent-agent summary
When the critic reports a finding
Then the finding evidence cites user-provided material, file contents, or verbatim excerpts rather than relying only on the parent-agent summary.

### AC-11: Explicit-Only Invocation
Given the host supports skill invocation policy metadata
When `power-critic` is installed
Then its metadata disables implicit invocation so the skill runs only when explicitly requested.

### AC-12: Codex Custom Agent Hardening
Given Codex custom agents are available
When `$power-critic` dispatches the critic
Then it uses a read-only `power_critic` custom agent or an equivalent read-only subagent configuration.

### AC-13: Default Packet Completeness
Given `$power-critic` reviews the visible conversation by default
When the main agent builds the Critique Packet
Then the packet states its context bounds, includes relevant user requests and decisions as verbatim excerpts where possible, and discloses important omitted or unavailable context.

## Open Questions Resolved
- Should this live inside `power-think`? -> No. It should be a new standalone skill; `power-think` only mentions it lightly.
- What should it review by default? -> A Critique Packet built from the currently visible CLI interaction.
- Can the user specify a target? -> Yes, a spec, plan, or Markdown file can be the primary target.
- Should it use a subagent? -> Yes. In Codex, invoking `$power-critic` is explicit permission to spawn one read-only critic subagent when available.
- What tone should it use? -> Direct and rigorous, equivalent to option B from the discussion.
- Should it produce interactive questions or a batch report? -> Batch report first.
- Should it edit the reviewed file? -> No, read-only recommendations only.
- What proves it works? -> On vague requirements or overdesigned plans, it produces at least 3 high-quality, evidence-backed findings unless the material is insufficient.
- Should it run implicitly? -> No. First version should be explicit-only to avoid unwanted critique when the user only wants forward progress.
- Should parent-agent summaries count as evidence? -> No. Findings should cite user material, file contents, or verbatim excerpts.
- Where should the Codex custom agent live? -> The skill can bundle `agents/power-critic.toml` as a template, but Codex runtime hardening requires installing that TOML into a Codex custom-agent search path such as `~/.codex/agents/power-critic.toml` or `.codex/agents/power-critic.toml`.

## Premises
- The right problem is reducing agreement bias in CLI agent work before implementation begins.
- A separate skill is preferable to expanding `power-think`, because critique should be independently invokable and should not bloat the spec-writing workflow.
- Fresh-context subagent review is valuable only if the critic receives a well-formed Critique Packet rather than an unstructured or biased parent-agent summary.
- The first version should optimize for a useful, consistent critique report rather than a larger multi-review pipeline.
