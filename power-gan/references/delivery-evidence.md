# Delivery Evidence

Read this reference only when creating or updating a delivery PR/MR or preparing an external handoff. Do not require it for a tiny commit-only task.

Record observed delivery facts, not the implementation plan. If a material deviation is not yet confirmed, stop and return to `$power-gan` alignment instead of documenting it as accepted.

Use this compact shape:

```markdown
## Delivery Evidence

Decision source: <Issue URL and Decision revision, direct user decision, or none>

Delivered outcome: <observable result now implemented>

Material deviations: None | <confirmed deviation and confirmation source>

Validation:
- <command or check>: <result and what it proves>

Independent check: Not required — <reason> | <power-check result and final implementation identity>

Remaining risks or follow-up: None | <risk or linked follow-up>
```

Link a material Decision Issue explicitly. Use closing syntax only when merge should complete that Issue.

Do not add Working Strategy, rejected implementation options, speculative tests, fixed file lists, agent assignments, model routing, reviewer topology, or unsupported guarantees. The final diff remains the source of truth for changed files.
