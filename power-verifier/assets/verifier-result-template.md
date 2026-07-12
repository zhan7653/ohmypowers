# Verifier Result

Result: `PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN`

## Contract Sources And Conflict Status

- Canonical Issue or local contract: `<source and identity>`
- Final Goal Prompt: `<source and identity>`
- Supplementary evidence considered: `<comments, discussions, summaries, or none>`
- Conflict status: `<none | conflict requiring NEEDS_HUMAN>`
- Conflicting clause IDs and rationale: `<none or cited clause records>`

## Execution Mode And Capability Evidence

- Confirmed execution mode: `<strict-model-routing | inherited-model-routing | unavailable>`
- Capability classification: `<strict-selection-supported | inherited-model-only | indeterminate | unavailable>`
- Evidence inspected: `<tool schema, supported selector evidence, or unavailable>`
- Recommended mode: `<strict-model-routing | inherited-model-routing | unavailable>`
- User confirmation: `<source and identity, or unavailable>`
- Uncertainty or contradictory evidence: `<none or details>`
- Configuration provenance: `<independently selected with evidence | inherited from parent | unavailable>`
- Mode/evidence consistency: `<consistent | inconsistent | cannot determine>`
- Unsupported inherited-mode guarantees found: `<none or exact model/reasoning/profile/sandbox/isolation/escalation/reviewer-tier/assignment-accuracy/cost claims>`
- Unavailable exact requirements: `<none or exact model/profile/provider/reasoning/sandbox/isolation requirement requiring NEEDS_HUMAN>`

## Implementation Snapshot

- Repository/ref: `<identity>`
- Commit: `<commit or unavailable>`
- Diff or tree digest: `<identity>`
- Dirty/generated-artifact boundary: `<none or disclosed boundary>`
- Captured at: `<time>`
- Freshness assessment: `<fresh | stale evidence identified>`

## Clause Evidence

| Clause ID | Source | Source location | Obligation | Applicable | Evidence and snapshot | Status | Notes |
|---|---|---|---|---|---|---|---|
|  |  |  |  | Yes/No |  | Conforms/Nonconforming/Missing/Stale/Needs human |  |

## Dynamic Review Plan And Provenance

- Contract-specified review requirements: `<none or exact requirements and status>`
- Capability and risk assessment: `<obligations, diff, interfaces/data, validation, and material risks>`
- Minimum sufficient planned capabilities: `<capabilities and justification>`

| Reviewer identity/source | Confirmed mode | Inherited configuration provenance | Model / reasoning if exposed | Independent from implementation | Capability | Scope | Instruction boundary | Observable host-isolation evidence | Evidence inspected | Result | Snapshot identity |
|---|---|---|---|---|---|---|---|---|---|---|---|
|  |  | Inherited from parent/Not applicable/Unavailable | Not exposed | Yes/No |  |  |  | None observed |  |  |  |

## Validation Replay

| Required validation | Exact command | Safety class | Execution boundary | Observable host-isolation evidence | Snapshot | Result | Relevant evidence |
|---|---|---|---|---|---|---|---|
|  |  | Safe read-only/Isolated writable/Unsafe-not-run |  | None observed |  | Passed/Failed/Not run |  |

## Risks And Unresolved Evidence

- `<risk, assumption, stale or unavailable evidence, or none>`

## Reviewer Notes

- `<nonblocking note, or none>`

## Smallest Next Action

`<None for PASS/PASS_WITH_NOTES, or the smallest action needed to unblock BLOCKED/NEEDS_HUMAN.>`
