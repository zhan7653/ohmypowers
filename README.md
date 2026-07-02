# ohmypowers

Codex ecosystem skills for Loop Engineering.

`ohmypowers` is a collection of Codex skills and supporting tools that turn agentic coding work into explicit loops: clarify the task, contract the work, execute within boundaries, verify the evidence, and keep reviewable artifacts.

The repository is Codex-first. Skills are plain `SKILL.md` directories designed to be installed into Codex, with optional Codex custom-agent templates for read-only verifier and critic passes.

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
- Independent evidence audit with fresh-context verifier support when available.
- Conditional code-review integration through Codex `/review` or an equivalent read-only code-review subagent when the diff includes code, behavior, tests, dependencies, or config.
- Loop decision justification.
- One verifier result: `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, or `NEEDS_HUMAN`.

It is read-only and does not edit files, create branches, mutate issues, approve work, merge, or close PRs/MRs.

`power-work-report` generates a manual Codex daily work report:

- Reads local Codex session JSONL for a target day.
- Generates a draft Markdown/HTML/JSON report through `tools/power-work-report`.
- Proposes todo and idea memory updates.
- Requires explicit confirmation before finalizing reports or merging `memory.json`.
- V1 is Codex-only and does not include scheduler, systemd, cron, web UI, database, vector store, or generic agent-log support.

`power-critic` provides a read-only "找茬" pass over requirements, CLI interaction, specs, plans, or model replies. It builds a Critique Packet, uses a fresh critic subagent when available, and returns a prioritized batch report. It is not for code diff correctness review.

For implementation diff correctness, use `power-verifier`, Codex `/review`, or the repository's code review workflow.

Use them by phase:

- `power-think`: vague idea -> reviewed spec.
- `power-grill`: coding task -> issue draft -> confirmed issue/local brief.
- `power-loop`: agent-ready issue/local brief -> bounded implementation `/goal`.
- `power-verifier`: issue contract + diff + validation + PR evidence -> verifier result.
- `power-work-report`: Codex session history -> draft daily report -> confirmed memory update.
- Recommended Loop Engineering flow: `power-grill -> power-loop -> Codex /goal -> power-verifier -> PR evidence -> human review`.
- `power-critic`: spec, plan, issue, or model reply -> critique findings.

## Install

Copy or symlink the skill directories into Codex skills:

```bash
mkdir -p ~/.codex/skills
cp -R power-think ~/.codex/skills/power-think
cp -R power-grill ~/.codex/skills/power-grill
cp -R power-loop ~/.codex/skills/power-loop
cp -R power-verifier ~/.codex/skills/power-verifier
cp -R power-work-report ~/.codex/skills/power-work-report
cp -R power-critic ~/.codex/skills/power-critic
```

If `CODEX_HOME` is set, use `$CODEX_HOME/skills` instead of `~/.codex/skills`.

For Codex read-only custom-agent hardening, also install the bundled verifier and critic agents into Codex's custom-agent path:

```bash
mkdir -p ~/.codex/agents
cp power-verifier/agents/power-verifier.toml ~/.codex/agents/power-verifier.toml
cp power-critic/agents/power-critic.toml ~/.codex/agents/power-critic.toml
```

The skill installation makes `$power-verifier` and `$power-critic` available.

The verifier custom-agent installation makes the named `power_verifier` read-only agent discoverable by Codex. The critic custom-agent installation does the same for `power_critic`. These agents are recommended, not required.

When a fresh-context implementation verifier is unavailable, `power-verifier` output should disclose degraded self-review mode.

Restart Codex after installing or updating skills or custom agents.

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

Ask for a manual Codex work report draft:

```text
Use $power-work-report to generate a daily work report draft for today.
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
    power-verifier.toml
  assets/
    implementation-verifier-checklist.md
    verifier-result-template.md
power-work-report/
  SKILL.md
  agents/
    openai.yaml
tools/power-work-report/
  package.json
  bin/
  lib/
  test/
power-critic/
  SKILL.md
  agents/
    openai.yaml
    power-critic.toml
```

## License

MIT
