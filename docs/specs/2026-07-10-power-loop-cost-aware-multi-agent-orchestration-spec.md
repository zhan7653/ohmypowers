# Power Loop Runtime Final Review Spec

## Problem

Planning reviewer routing before implementation created unnecessary capability checks, user confirmations, duplicated templates, artifact digests, and stale plans. Final reviewer selection depends on the final diff and frozen validation evidence, so it belongs after implementation rather than on the implementation critical path.

## Principles

- The Task Contract is the sole normative contract.
- The Execution Blueprint is the only confirmed pre-implementation planning artifact.
- Exploration, implementation, tests, integration, validation, documentation, evidence packaging, and repair remain in the main agent.
- Subagents are used only for final independent review of a frozen Git tree.
- Reviewer capability is inspected at runtime after V2/V3, not before readiness or implementation.
- Reviewer routing is evidence, not a user-selected execution mode.

## Planning Protocol

```text
Task Contract
-> readiness and risk gates
-> repository inspection
-> Execution Blueprint
-> compact Blueprint reference patch
-> user confirmation and exact application
-> thin Goal
```

The Issue stores one compact Blueprint reference and digest. It does not store a reviewer plan, capability classification, routing decision, or reviewer count.

The Goal pins:

- canonical Issue identity;
- Task Contract digest;
- Blueprint reference and digest;
- repository baseline and drift stops.

It does not require reviewer capability or routing confirmation before implementation.

## Runtime Validation Protocol

1. Main-agent implementation with V0 focused checks.
2. Integrated candidate with V1 integration checks.
3. For HIGH work, one main-agent failure-matrix self-review returning batched findings.
4. At most one concentrated repair.
5. Freeze a candidate and record its Git tree digest.
6. Run V2 final deterministic checks.
7. Run V3 external checks once when applicable.
8. Inspect reviewer-spawn capability and create a Final Review Plan.
9. Launch decoupled reviewers concurrently.
10. Run the verifier and prepare compact PR evidence.

Normal execution records at most three candidate snapshots. One blocker repair/recertification cycle is allowed; a second blocking final review stops for replanning.

## Runtime Reviewer Routing

Runtime inspection records one routing provenance:

- `selected supported fields`: model/profile/reasoning/sandbox fields are used only when independently exposed;
- `inherited from parent`: generic reviewers inherit configuration and no selected-field claim is made.

No separate user confirmation is required. Return `NEEDS_HUMAN` only when an exact Task Contract reviewer/model/profile/provider/reasoning/sandbox/isolation requirement cannot be satisfied.

Installed reviewer profiles do not prove runtime selectability.

## Reviewer Wave

Every final wave includes:

- independent contract-conformance review;
- independent code review.

Add test, security, compatibility, migration, data, permission, concurrency, or domain reviewers when the final diff exposes a distinct risk.

Reviewers are decoupled only when:

- scopes do not duplicate each other;
- no reviewer consumes another reviewer's findings;
- all inspect the same frozen tree and V2/V3 evidence package;
- each returns one batched report.

Launch the complete selected wave concurrently. If required decoupled capabilities exceed available slots, return `NEEDS_HUMAN` rather than dropping or serially chaining a required capability.

## Waiting

- Finish useful evidence consolidation before waiting.
- Allow at least 180 seconds of reviewer grace when interaction policy permits.
- Use 180-second waits or the longest permitted interval.
- Continue through two consecutive no-information timeouts while reviewers remain active.
- After the third consecutive no-information timeout, inspect status once and interrupt/replan only when no progress is observable.
- Allow one consolidated clarification/completion follow-up per reviewer; no status-only polling.

Record only:

- reviewer count;
- wait call count;
- maximum consecutive no-information timeouts;
- cumulative wait duration.

## Evidence

The Final Review Plan records:

- Task Contract and frozen-tree identity;
- runtime capability evidence and routing provenance;
- reviewer capabilities and non-duplicative scopes;
- compact waiting evidence;
- reviewer results and verified tree.

PR evidence references the Blueprint, Final Review Plan, reviewer results, and verifier result. It does not duplicate a Dispatch Summary or token-attribution telemetry.

## Acceptance Criteria

1. Readiness and Blueprint generation require no reviewer capability preflight or routing confirmation.
2. The Issue contains no Agent Dispatch Plan reference.
3. The Goal pins only Task Contract, Issue, Blueprint, and repository identity before implementation.
4. Exactly one Final Review Plan template exists.
5. Reviewer routing is selected at runtime after the final tree and V2/V3 evidence exist.
6. Independent contract-conformance and code-review results are required for PASS/PASS_WITH_NOTES.
7. Additional reviewers are driven by independent final-diff risks and available capacity, not delivery lane.
8. Waiting uses patient intervals and three consecutive no-information timeouts rather than short polling.
9. Coordination evidence contains only four metrics.
10. The installer retains the three read-only reviewer profiles and removes retired implementation profiles.
11. Repository tests and documentation describe the same protocol.

## Non-goals

- Changing the Codex multi-agent host.
- Automatically merging or closing PRs.
- Treating reviewer configuration as a Task Contract requirement when the contract does not prescribe it.
- Replaying valid V3 evidence solely to manufacture reviewer independence.
