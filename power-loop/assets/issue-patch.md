# Compact Planning Reference Patch

Target: `<hosted issue URL/number or local brief path>`

Generated from baseline: `<source branch>@<full commit SHA>`

Patch state: `awaiting-confirmation`

Task Contract preservation check: `<unchanged at generation time>`

Task Contract digest: `sha256:<exact UTF-8 bytes from document start to the byte before the Blueprint start marker>`

Canonical Issue identity before application: `<source plus host revision when available plus exact full-body SHA-256; body digest authoritative>`

Curation status preservation check: `<unchanged at generation time>`

Capability classification: `<strict-selection-supported | inherited-model-only | indeterminate>`

Capability evidence: `<inspected host contract evidence>`

Confirmed execution mode: `<strict-model-routing | inherited-model-routing>`

Mode-template consistency check: `<the replacement Dispatch block was generated from the template matching the confirmed mode>`

This patch changes only the two compact planning-reference blocks below. The complete planning artifacts are persisted separately. The `Planning status: confirmed` values describe the state that will exist after the user confirms the decision summary and this patch is applied.

## Decision summary

- Delivery lane: `<LIGHT | STANDARD | HIGH>`
- Split decision: `<confirmed boundary or explicit accepted bundling>`
- User-visible scope: `<short summary from the unchanged Task Contract>`
- Required safety guarantees: `<confirmed requirement-level guarantees>`
- Stronger guarantees out of scope: `<explicit exclusions>`
- Human authorization boundary: `<none or exact required authorization>`

## Replacement block: Execution Blueprint reference

```markdown
<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `confirmed`

Artifact: `<persisted local path or durable source>`

Artifact digest: `sha256:<exact UTF-8 bytes>`

Delivery lane: `<LIGHT | STANDARD | HIGH>`

Generated at: `<ISO-8601 timestamp with timezone>`

This artifact is confirmed operational guidance, not a normative contract source. Requirement-level changes must update the Task Contract.
<!-- power-loop:execution-blueprint:end -->
```

## Replacement block: Agent Dispatch Plan reference

```markdown
<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `confirmed`

Artifact: `<persisted local path or durable source>`

Artifact digest: `sha256:<exact UTF-8 bytes>`

Generated at: `<ISO-8601 timestamp with timezone>`

This artifact is confirmed operational guidance, not a normative contract source. Dispatch choices cannot add requirements.
<!-- power-loop:agent-dispatch-plan:end -->
```

## Application rule

- Persist and verify the two complete planning artifacts before applying this patch.
- If both markers exist, replace exactly the content from each start marker through its matching end marker.
- If the markers do not exist, insert both complete marked blocks immediately before `# Curation status`; append them at the end only when no curation section exists.
- Do not edit, reformat, reorder, or normalize any Task Contract or Curation status content.
- Immediately before applying, re-read exact bytes and require both the authoritative complete-body digest and Task Contract digest to match this displayed patch. Host revision metadata alone is insufficient.
- Re-read both planning artifacts and require their exact displayed digests to match.
- Re-read the target after applying the patch and compare both replacement blocks exactly.
- Prove the Task Contract digest is unchanged, then compute the new authoritative SHA-256 over the exact complete persisted body for the thin Goal. Do not write that digest into the body it hashes.
- Verify that the compact references point to the exact confirmed Blueprint and Dispatch artifacts and that those artifacts record the same confirmed mode and capability evidence used to generate this patch.
- A revised patch requires new explicit confirmation.

Confirmation request:

```text
Please confirm the decision summary and whether I should apply this exact compact planning-reference patch to <target>. I will not generate the final Goal Prompt until the artifacts and patch are persisted and verified.
```
