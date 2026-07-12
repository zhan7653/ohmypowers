<!-- power-loop:final-review-plan:start -->
# Final Review Plan

Generated at: `<ISO-8601 timestamp with timezone>`

Contract source: `<hosted issue URL/number or local brief path>`

Task Contract digest: `sha256:<exact normative Task Contract bytes>`

Frozen Git tree digest: `<tree digest>`

Normative boundary: `The Task Contract is the sole normative contract. This runtime review plan is supplementary evidence and cannot add requirements.`

## Runtime capability evidence

- Spawn contract inspected: `<visible schema or equivalent evidence>`
- Routing provenance: `<selected configuration | inherited from parent>`
- Selectable reviewer fields: `<model/profile/reasoning/sandbox fields independently evidenced, or None>`
- Unavailable exact Task Contract requirements: `<None or exact blocker requiring NEEDS_HUMAN>`
- Host-enforced read-only isolation: `<evidence or unavailable; instruction-level no-write is not enforcement>`

Use selectable reviewer profiles only when the runtime exposes the corresponding selector. Otherwise launch generic fresh-context reviewers and record inherited configuration provenance. Do not ask for a separate routing-mode confirmation unless satisfying an exact Task Contract requirement needs a human decision.

## Reviewer wave

Always include independent contract-conformance and code-review capabilities. Add test, security, compatibility, migration, data, permission, concurrency, or domain reviewers when the final diff exposes a distinct risk. Each scope must be non-duplicative and must not depend on another reviewer's findings.

| Reviewer ID | Capability | Scope | Routing/configuration provenance | Context and no-write boundary | Expected batched report |
|---|---|---|---|---|---|
| `<REVIEW-ID>` | `<contract-conformance | code-review | risk capability>` | `<exact independent scope>` | `<selected supported fields or inherited>` | `<fork_turns: none when exposed; no writes>` | `<findings ordered by severity, or PASS>` |

Launch the complete wave concurrently over the same frozen tree and V2/V3 evidence package. If required decoupled capabilities exceed observed concurrent capacity, return `NEEDS_HUMAN` rather than dropping or serially chaining a required capability.

## Waiting policy

- Finish useful main-agent evidence consolidation before the first wait.
- Allow a reviewer grace period of at least 180 seconds when interaction policy permits.
- Use 180-second waits, or the longest interval permitted by the interaction policy.
- Do not poll at 1, 10, 20, 30, or 60 seconds.
- Continue through the first two consecutive no-information timeouts while reviewers remain active.
- After the third consecutive no-information timeout, inspect status once; interrupt and replan only when no concrete progress is observable.
- Allow at most one consolidated clarification/completion follow-up per reviewer; never send status-only messages.

Record only:

- launched reviewer count;
- `wait_agent` call count;
- maximum consecutive no-information timeouts;
- cumulative wait duration.

## Result

| Reviewer ID | Result | Findings or notes | Verified Git tree digest |
|---|---|---|---|
| `<REVIEW-ID>` | `<PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN>` | `<summary>` | `<tree digest>` |

Repairs invalidate the frozen-tree review evidence. After a repair, rerun affected V2/V3 checks, freeze the new tree, and create a fresh Final Review Plan. One blocker repair/recertification cycle is allowed; a second blocking final wave stops for replanning.
<!-- power-loop:final-review-plan:end -->
