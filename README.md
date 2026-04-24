# ohmypowers

Claude Code plugins for structured thinking and implementation planning.

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

Requirement thinking: brainstorm, clarify ambiguities, challenge premises, define acceptance criteria, and deliver a spec document.

**Trigger:** `/power-think` or explicitly ask to brainstorm / create a spec

**Deliverable:** `docs/specs/YYYY-MM-DD-<feature-name>-spec.md`

### ohmypowers-power-plan

Implementation planning: read a spec, propose architecture, perform structured self-reviews, and deliver a plan document.

**Trigger:** `/power-plan` or explicitly ask to create an implementation plan

**Deliverable:** `docs/plans/YYYY-MM-DD-<feature-name>-plan.md`

## Workflow

```
Think → Spec → Plan → Implement
```

1. Use `ohmypowers-power-think` to explore requirements and produce a spec
2. Use `ohmypowers-power-plan` to turn the spec into a concrete implementation plan
3. Implement following the plan

## License

MIT
