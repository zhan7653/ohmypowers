# ohmypowers skills

Standalone Agent Skills for thinking through work before implementation.

This branch keeps the skills as plain `SKILL.md` directories that can be used by Codex and Claude Code.

## What It Does

`power-think` guides an agent through:

- Project context gathering.
- Requirement clarification.
- Scope boundary definition.
- Premise challenge.
- Optional landscape research.
- Alternative approaches.
- Given/When/Then acceptance criteria.
- A reviewed spec saved to `docs/specs/YYYY-MM-DD-<feature-name>-spec.md`.

It does not write implementation code or implementation plans.

`power-grill` turns a clarified or half-clear coding task into an execution contract before implementation starts:

- Repository inspection before asking the user.
- Focused grill-style questions with recommended defaults.
- An issue draft for user review.
- A hosted issue or local issue brief after user confirmation.
- Agent-ready handoff guidance for running `power-loop` on the issue contract.

It does not implement code, generate bounded `/goal`, automatically execute `/goal`, or create hosted issues, PRs, or MRs by default. After the user reviews the generated issue body, it can create a hosted issue if the user explicitly confirms and a supported CLI such as `gh` or `glab` is available. Bounded `/goal` generation belongs to `power-loop`.

`power-loop` converts an agent-ready task contract into a bounded Codex implementation loop:

- Loop readiness check over a hosted issue, local brief, or pasted task contract.
- Risk level and execution decision.
- Dedicated branch/worktree isolation rules.
- Checkpoints, validation loop, iteration budget, and stop conditions.
- Read-only verifier gate, with `power-verifier` as the recommended execution tool.
- PR/MR evidence requirements and loop decision rules.

Loop Engineering here means wrapping a coding task so it is executable, verifiable, stoppable, reviewable, and handoff-ready within explicit boundaries. `power-loop` does not clarify vague requirements deeply or implement code directly. If a contract is incomplete, it sends the task back to `power-grill`; if risk is high, it requires human handling instead of generating an implementation `/goal`.

For an end-to-end walkthrough, see [power-loop/assets/loop-engineering-tutorial.md](power-loop/assets/loop-engineering-tutorial.md). It uses a small linear regression gradient descent optimizer task to demonstrate issue contracts, bounded `/goal` generation, validation loops, verifier evidence, and PR review.

`power-verifier` checks implementation evidence after a bounded loop has run:

- Issue contract, implementation diff, validation output, and PR/MR evidence.
- Acceptance-criteria coverage.
- Scope and non-goal preservation.
- Loop decision justification.
- One verifier result: `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, or `NEEDS_HUMAN`.

It is read-only and does not edit files, create branches, mutate issues, approve work, merge, or close PRs/MRs.

`power-critic` provides a read-only "找茬" pass over requirements, CLI interaction, specs, plans, or model replies. It builds a Critique Packet, uses a fresh critic subagent when available, and returns a prioritized batch report. It is not for code diff correctness review; use `power-verifier`, `/review`, or the repository's code review workflow for that.

Use them by phase:

- `power-think`: vague idea -> reviewed spec.
- `power-grill`: coding task -> issue draft -> confirmed issue/local brief.
- `power-loop`: agent-ready issue/local brief -> bounded implementation `/goal`.
- `power-verifier`: issue contract + diff + validation + PR evidence -> verifier result.
- Recommended Loop Engineering flow: `power-grill -> power-loop -> Codex /goal -> power-verifier -> PR evidence -> human review`.
- `power-critic`: spec, plan, issue, or model reply -> critique findings.

## Install

### Codex

Copy or symlink the skill directories into Codex skills:

```bash
mkdir -p ~/.codex/skills
cp -R power-think ~/.codex/skills/power-think
cp -R power-grill ~/.codex/skills/power-grill
cp -R power-loop ~/.codex/skills/power-loop
cp -R power-verifier ~/.codex/skills/power-verifier
cp -R power-critic ~/.codex/skills/power-critic
```

If `CODEX_HOME` is set, use `$CODEX_HOME/skills` instead of `~/.codex/skills`.

For Codex read-only custom-agent hardening, also install the bundled critic agent into Codex's custom-agent path:

```bash
mkdir -p ~/.codex/agents
cp power-critic/agents/power-critic.toml ~/.codex/agents/power-critic.toml
```

The skill installation makes `$power-critic` available. The custom-agent installation is what makes the named `power_critic` read-only agent discoverable by Codex.

Restart Codex after installing or updating skills or custom agents.

### Claude Code

Claude Code skills are directories with a `SKILL.md` entrypoint. Install as personal skills:

```bash
mkdir -p ~/.claude/skills
cp -R power-think ~/.claude/skills/power-think
cp -R power-grill ~/.claude/skills/power-grill
cp -R power-loop ~/.claude/skills/power-loop
cp -R power-verifier ~/.claude/skills/power-verifier
cp -R power-critic ~/.claude/skills/power-critic
```

For project-local Claude Code skills, place them at:

```text
.claude/skills/power-think/SKILL.md
.claude/skills/power-grill/SKILL.md
.claude/skills/power-loop/SKILL.md
.claude/skills/power-verifier/SKILL.md
.claude/skills/power-critic/SKILL.md
```

## Usage

Ask for requirement thinking or a spec:

```text
Use power-think to help me clarify this feature and write a spec.
```

Ask for a task contract before implementation:

```text
Use $power-grill to grill this feature and draft an issue contract.
```

Ask for a bounded implementation loop from an existing task contract:

```text
Use $power-loop on this issue to generate a bounded Codex /goal.
```

Ask for independent critique:

```text
Use $power-critic to challenge this spec.
```

Ask for implementation verification:

```text
Use $power-verifier to check this issue contract, diff, validation output, and PR evidence.
```

Claude Code can also invoke skills directly:

```text
/power-think
/power-grill
/power-loop
/power-verifier
/power-critic
```

## Repository Layout

```text
power-think/
  SKILL.md
  agents/
    openai.yaml
power-grill/
  SKILL.md
  agents/
    openai.yaml
  assets/
    issue-body.md
    pr-body.md
  references/
    github-issue-creation.md
    gitlab-issue-creation.md
power-loop/
  SKILL.md
  agents/
    openai.yaml
  assets/
    codex-loop-goal.txt
    loop-readiness-checklist.md
    verifier-gate.md
    pr-evidence-template.md
    status-transitions.md
    sample-contracts.md
    loop-engineering-tutorial.md
power-verifier/
  SKILL.md
  agents/
    openai.yaml
  assets/
    implementation-verifier-checklist.md
    verifier-result-template.md
power-critic/
  SKILL.md
  agents/
    openai.yaml
    power-critic.toml
```

## License

MIT
