---
name: power-verifier
description: Verify a completed implementation read-only against its canonical persisted Issue and final frozen tree.
---

# Power Verifier

## Purpose And Boundary

Verify implementation conformance without changing source, Git, Issue, PR/MR, labels, comments, or merge state.

The sole normative contract is the Task Contract byte range in the canonical persisted Issue/local contract used for execution. The complete body supplies container identity and lifecycle context. Blueprint, Final Review Record, sessions, PR/MR text, runner output, and reviewer conclusions are supplementary evidence and cannot add requirements.

Return exactly one result: `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, or `NEEDS_HUMAN`.

## Required Evidence

Collect or report unavailable:

- canonical Issue source, host revision provenance, exact execution-time full-body SHA-256, Task Contract boundary and digest;
- optional confirmed Blueprint reference and digest;
- final repository/ref, commit when available, Git tree digest, dirty/generated boundary, and capture time;
- implementation diff and clause/AC evidence;
- V2/V3 evidence for the final tree;
- Final Review Record and its routing provenance, required capabilities, results, and frozen tree.

Do not accept a summary or passing command as sole proof. Inspect primary evidence where possible.

## Verification Workflow

1. Re-read the complete Issue used for execution. Verify its source, body identity, Task Contract boundary/digest, and optional Blueprint reference. A material identity or digest mismatch is stale evidence and returns `BLOCKED`; differing host revision metadata with identical bytes is provenance only.
2. Extract every applicable obligation only from the Task Contract. Report an irreconcilable conflict between Task Contract clauses as `NEEDS_HUMAN` without choosing either clause.
3. Capture the final implementation snapshot. Git tree digest controls freshness; different commits with the same tree are equivalent.
4. Map every applicable clause to implementation, validation, or review evidence for that tree. Do not invent requirements or historical identity.
5. Inspect the Final Review Record. Require independent contract-conformance and code-review capabilities on the frozen tree, plus exact contract-prescribed reviewer/configuration requirements. Accept selected configuration fields only with direct evidence; otherwise require inherited provenance. Do not infer model, reasoning, profile, host isolation, reviewer tier, or cost claims.
6. Replay contract-required validation when safe. V0/V1 are development feedback; V2 and applicable V3 are final evidence. Do not replay valid V3 by default unless the contract requires independent replay or primary evidence is insufficient.
7. If a repair changed the tree, reject stale V2/V3/review evidence and require recertification.
8. Return a compact result containing identity/freshness, only nonconforming/missing/ambiguous clauses, review or validation exceptions, notes, and the smallest next action.

Writable validation may run only in a disclosed isolated environment that leaves canonical source and hosted state unchanged. Do not run unsafe validation.

## Result Selection

Apply in order:

1. `NEEDS_HUMAN`: contract conflict or required human interpretation, authorization, or contract change.
2. `BLOCKED`: identity mismatch, implementation nonconformance, failed required validation, missing/stale evidence, or a missing review that can be supplied under the existing contract.
3. `PASS_WITH_NOTES`: all clauses conform with fresh evidence and only nonblocking notes remain.
4. `PASS`: all clauses conform with fresh evidence and no notes remain.

Neither passing result is allowed without fresh independent contract-conformance and code-review evidence.

## Output

Use [assets/verifier-result-template.md](assets/verifier-result-template.md). Do not reproduce complete reviewer tables, `wait_agent` telemetry, or all passing clause rows; reference their source artifacts and report exceptions.
