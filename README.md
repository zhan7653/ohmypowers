# power-think

A standalone Agent Skill for turning vague feature ideas into reviewed spec documents before implementation.

This branch extracts only the original `ohmypowers-power-think` workflow and removes the plugin packaging and implementation-planning skill. The result is a plain `SKILL.md` directory that can be used by Codex and Claude Code.

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

## Install

### Codex

Copy or symlink the skill directory into Codex skills:

```bash
mkdir -p ~/.codex/skills
cp -R power-think ~/.codex/skills/power-think
```

If `CODEX_HOME` is set, use `$CODEX_HOME/skills` instead of `~/.codex/skills`.

### Claude Code

Claude Code skills are directories with a `SKILL.md` entrypoint. Install as a personal skill:

```bash
mkdir -p ~/.claude/skills
cp -R power-think ~/.claude/skills/power-think
```

For a project-local Claude Code skill, place it at:

```text
.claude/skills/power-think/SKILL.md
```

## Usage

Ask for requirement thinking or a spec, for example:

```text
Use power-think to help me clarify this feature and write a spec.
```

Claude Code can also invoke it directly as:

```text
/power-think
```

## Repository Layout

```text
power-think/
  SKILL.md
  agents/
    openai.yaml
```

## License

MIT
