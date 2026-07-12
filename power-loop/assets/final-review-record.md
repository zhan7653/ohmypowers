<!-- power-loop:final-review-record:start -->
# Final Review Record

Generated at: `<ISO-8601 timestamp with timezone>`

- Contract source and Task Contract digest: `<source>@sha256:<digest>`
- Frozen Git tree digest: `<tree digest>`
- V2/V3 evidence: `<source or summary>`
- Routing provenance: `<selected supported fields | inherited from parent>`
- Spawn capability evidence: `<visible schema or equivalent>`
- Unavailable exact Task Contract requirements: `<None or exact NEEDS_HUMAN blocker>`

Boundary: `Supplementary evidence; cannot add Task Contract requirements.`

## Reviewer wave and results

Always include independent contract-conformance and code-review capabilities. Add distinct risk scopes only when justified. Combine compatible risk scopes and launch with maximum available concurrency; if the two baseline reviews cannot fit simultaneously, run the remaining fresh-context review next.

| Reviewer | Capability and non-overlapping scope | Configuration provenance | Result and findings |
|---|---|---|---|
| `<ID>` | `<contract-conformance | code-review | risk scope>` | `<selected supported fields or inherited; no-write boundary>` | `<PASS, notes, or blockers>` |

All reviewers inspect the frozen tree above. Use `fork_turns: none` when exposed, keep implementation-independent scopes, and record a different tree only as stale evidence.

## Waiting policy and metrics

- Finish useful evidence consolidation before waiting.
- Allow at least 180 seconds of grace and use 180-second waits, or the longest permitted interval.
- Continue through two consecutive no-information timeouts; after the third, inspect status once and interrupt only when no concrete progress is observable.
- Allow one consolidated clarification/completion follow-up per reviewer; no status-only polling.

Metrics:

- Reviewers launched: `<count>`
- `wait_agent` calls: `<count>`
- Maximum consecutive no-information timeouts: `<count>`
- Cumulative wait duration: `<duration>`

## Outcome

- Result: `<PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN>`
- Blocking findings or notes: `<items or None>`
- Smallest next action: `<action or None>`

A tree-changing repair invalidates this record. One repair and recertification cycle is allowed; a second blocking final wave stops for replanning.
<!-- power-loop:final-review-record:end -->
