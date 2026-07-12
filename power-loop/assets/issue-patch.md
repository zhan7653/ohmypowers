# Issue Patch

Target: `<hosted issue URL/number or local brief path>`

Generated from baseline: `<source branch>@<full commit SHA>`

Patch state: `awaiting-confirmation`

Task Contract preservation check: `<unchanged at generation time>`

Curation status preservation check: `<unchanged at generation time>`

Capability classification: `<strict-selection-supported | inherited-model-only | indeterminate>`

Capability evidence: `<inspected host contract evidence>`

Confirmed execution mode: `<strict-model-routing | inherited-model-routing>`

Mode-template consistency check: `<the replacement Dispatch block was generated from the template matching the confirmed mode>`

This patch changes only the two marked execution-planning blocks below. The `Planning status: confirmed` values describe the state that will exist after the user confirms and the patch is applied.

## Replacement block: Execution Blueprint

```markdown
<!-- power-loop:execution-blueprint:start -->
# Execution Blueprint

Planning status: `confirmed`

<all remaining filled Execution Blueprint fields and sections>
<!-- power-loop:execution-blueprint:end -->
```

## Replacement block: Agent Dispatch Plan

```markdown
<!-- power-loop:agent-dispatch-plan:start -->
# Agent Dispatch Plan

Planning status: `confirmed`

<all remaining filled Agent Dispatch Plan fields and sections>
<!-- power-loop:agent-dispatch-plan:end -->
```

## Application rule

- If both markers exist, replace exactly the content from each start marker through its matching end marker.
- If the markers do not exist, insert both complete marked blocks immediately before `# Curation status`; append them at the end only when no curation section exists.
- Do not edit, reformat, reorder, or normalize any Task Contract or Curation status content.
- Re-read the target after applying the patch and compare both replacement blocks exactly.
- Verify that the persisted Blueprint and Dispatch block record the same confirmed mode and capability evidence used to generate this patch.
- A revised patch requires new explicit confirmation.

Confirmation request:

```text
Please confirm whether I should apply this exact Issue Patch to <target>. I will not generate the final Goal Prompt until the patch is applied and verified.
```
