# Verifier Result

Result: `PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN`

## Canonical Issue Identity And Conflict Status

- Canonical Issue or local contract source: `<URL or persisted path>`
- Pinned host revision: `<revision metadata or unavailable>`
- Pinned exact full-body SHA-256: `<sha256:... or unavailable>`
- Pinned exact Task Contract SHA-256: `<sha256:... or unavailable>`
- Task Contract byte boundary: `<exact marker/range or unavailable>`
- Observed host revision: `<revision metadata or unavailable>`
- Observed exact full-body SHA-256: `<sha256:... or unavailable>`
- Observed exact Task Contract SHA-256: `<sha256:... or unavailable>`
- Identity status: `<matched | matched body with differing host revision metadata | mismatched source/body | insufficient historical identity>`
- Supplementary evidence considered: `<Goal Prompt, session, PR/MR, runner summary, comments, or none>`
- Supplementary Issue references: `<matching references, drift, missing references, or none>`
- Task-Contract-internal conflict status: `<none | conflict requiring NEEDS_HUMAN>`
- Conflicting Task Contract clause IDs and rationale: `<none or cited clause records>`
- Supplementary planning artifacts and digests: `<Blueprint/Dispatch sources, identity status, drift, or none>`

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
- Git tree digest: `<identity or unavailable>`
- Dirty/generated-artifact boundary: `<none or disclosed boundary>`
- Captured at: `<time>`
- Freshness assessment: `<tree-fresh | tree-equivalent despite different commit | stale tree evidence | cannot determine>`

## Clause Evidence

| Clause ID | Source | Source location | Obligation | Applicable | Evidence and snapshot | Status | Notes |
|---|---|---|---|---|---|---|---|
|  |  |  |  | Yes/No |  | Conforms/Nonconforming/Missing/Stale/Needs human |  |

## Dynamic Review Plan And Provenance

- Contract-specified review requirements: `<none or exact requirements and status>`
- Capability and risk assessment: `<obligations, diff, interfaces/data, validation, and material risks>`
- Minimum sufficient planned capabilities: `<capabilities and justification>`

| Reviewer identity/source | Confirmed mode | Inherited configuration provenance | Model / reasoning if exposed | Independent from implementation | Capability | Scope | Instruction boundary | Observable host-isolation evidence | Evidence inspected | Result | Verified Git tree digest |
|---|---|---|---|---|---|---|---|---|---|---|---|
|  |  | Inherited from parent/Not applicable/Unavailable | Not exposed | Yes/No |  |  |  | None observed |  |  |  |

## Validation Replay

| Required validation | Exact command | Safety class | Execution boundary | Observable host-isolation evidence | Git tree digest | Result | Relevant evidence |
|---|---|---|---|---|---|---|---|
|  |  | Safe read-only/Isolated writable/Unsafe-not-run |  | None observed |  | Passed/Failed/Not run |  |

## Risks And Unresolved Evidence

- `<risk, assumption, stale or unavailable evidence, or none>`

## Reviewer Notes

- `<nonblocking note, or none>`

## Smallest Next Action

`<None for PASS/PASS_WITH_NOTES, or the smallest action needed to unblock BLOCKED/NEEDS_HUMAN.>`
