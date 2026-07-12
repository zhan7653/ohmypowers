# Compact Blueprint Reference Patch

Target: `<hosted issue URL/number or local brief path>`

Reviewed Issue identity: `<source, host revision when available, exact complete-body SHA-256>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Blueprint: `<persisted path>@sha256:<exact UTF-8 bytes>`

Repository baseline: `<source branch>@<full commit SHA>`

## Exact replacement block

```markdown
<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `confirmed`

Artifact: `<persisted path or durable source>`

Artifact digest: `sha256:<exact UTF-8 bytes>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Generated at: `<ISO-8601 timestamp with timezone>`

Execution entry: `This persisted Issue is the execution entry. Verify the Task Contract and Blueprint digests before implementation.`
<!-- power-loop:execution-blueprint:end -->
```

Apply only this marked block after confirmation. Preserve the Task Contract and `Curation status` exact bytes, then re-read the Issue and verify both digests.

Confirmation request:

```text
Please confirm this Blueprint and exact reference patch for <target>. After application, the Issue will be ready for direct execution.
```
