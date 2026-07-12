# Compact Planning Reference Patch

Target: `<hosted issue URL/number or local brief path>`

Generated from baseline: `<source branch>@<full commit SHA>`

Patch state: `awaiting-confirmation`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Canonical Issue identity before application: `<source, host revision when available, and exact complete-body SHA-256>`

Task Contract and Curation status preservation check: `<unchanged>`

## Decision summary

- Delivery lane: `<LIGHT | STANDARD | HIGH>`
- Split decision: `<confirmed boundary or accepted bundling>`
- User-visible scope: `<short unchanged Task Contract summary>`
- Required safety guarantees: `<confirmed guarantees>`
- Stronger guarantees out of scope: `<explicit exclusions>`
- Human authorization boundary: `<none or exact authorization>`

## Replacement block: Execution Blueprint reference

```markdown
<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `confirmed`

Artifact: `<persisted path or durable source>`

Artifact digest: `sha256:<exact UTF-8 bytes>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Delivery lane: `<LIGHT | STANDARD | HIGH>`

Generated at: `<ISO-8601 timestamp with timezone>`

Execution entry: `This confirmed persisted Issue. Before implementation, recompute the Task Contract digest, verify the referenced artifact digest, and stop on material drift.`

This artifact is confirmed operational guidance, not a normative contract source. Requirement-level changes must update the Task Contract.
<!-- power-loop:execution-blueprint:end -->
```

## Application rule

- Persist and verify the complete Blueprint before applying this patch.
- Replace exactly the marked Blueprint block, or insert it immediately before `# Curation status` when absent.
- Do not edit, reformat, reorder, or normalize Task Contract or Curation status content.
- Immediately before application, require the complete-body and Task Contract digests to match.
- Re-read the Blueprint and require its displayed digest to match.
- After application, verify the exact replacement block, its pinned Task Contract digest, and the unchanged Task Contract bytes, then capture the new complete-body digest and host revision provenance as execution evidence.
- A revised patch requires fresh explicit confirmation.

Confirmation request:

```text
Please confirm the decision summary and whether I should apply this exact compact Execution Blueprint reference patch to <target>. After the Blueprint and patch are persisted and verified, the confirmed Issue will be ready for direct execution.
```
