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
- A GitHub issue body or local issue brief.
- A ready-to-run Codex `/goal`.
- A PR evidence template for the eventual draft PR.

It does not implement code, automatically execute `/goal`, or create GitHub issues/PRs by default. After the user reviews the generated issue body, it can create a GitHub issue if the user explicitly confirms and `gh` is available.

`power-critic` provides a read-only "找茬" pass over requirements, CLI interaction, specs, plans, or model replies. It builds a Critique Packet, uses a fresh critic subagent when available, and returns a prioritized batch report. It is not for code diff correctness review; use `/review` or the repository's code review workflow for that.

Use them by phase:

- `power-think`: vague idea -> reviewed spec.
- `power-grill`: coding task -> issue contract + ready-to-run `/goal`.
- `power-critic`: spec, plan, issue, or model reply -> critique findings.

## Install

### Codex

Copy or symlink the skill directories into Codex skills:

```bash
mkdir -p ~/.codex/skills
cp -R power-think ~/.codex/skills/power-think
cp -R power-grill ~/.codex/skills/power-grill
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
cp -R power-critic ~/.claude/skills/power-critic
```

For project-local Claude Code skills, place them at:

```text
.claude/skills/power-think/SKILL.md
.claude/skills/power-grill/SKILL.md
.claude/skills/power-critic/SKILL.md
```

## Usage

Ask for requirement thinking or a spec:

```text
Use power-think to help me clarify this feature and write a spec.
```

Ask for a task contract before implementation:

```text
Use $power-grill to turn this feature into a GitHub issue body, /goal, and PR evidence template.
```

Ask for independent critique:

```text
Use $power-critic to challenge this spec.
```

Claude Code can also invoke skills directly:

```text
/power-think
/power-grill
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
power-critic/
  SKILL.md
  agents/
    openai.yaml
    power-critic.toml
```

## License

MIT
