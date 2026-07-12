---
name: power-verifier
description: Verify a completed implementation read-only against its canonical persisted Issue and Task Contract.
---

# Power Verifier

## Purpose

Verify whether an implementation, its execution, validation, and evidence conform to the verification contract without changing source, Git, or hosted state. The verifier is portable: it can assess an arbitrary code project and does not require a particular repository layout, Git host, profile, model, provider, test framework, or review count.

The sole normative verification contract is the Task Contract byte range inside the canonical hosted Issue body, or an equivalent persisted local contract, used for execution. Identify the persisted container with its source, host revision metadata when available, and SHA-256 digest of the exact full UTF-8 body with no whitespace or newline normalization. Identify the normative contract separately with the exact Task Contract SHA-256. The full-body digest is the authoritative container identity; the Task Contract digest controls normative clauses.

Read the execution Issue body in full for identity and lifecycle context, but extract normative clauses only from the Task Contract. Treat embedded or separate planning artifacts, execution sessions, comments, discussions, implementation summaries, PR/MR descriptions, runner summaries, and reviewer conclusions as supplementary evidence only. They may show what ran or identify drift, but they cannot add, override, or conflict with Task Contract obligations. Do not judge, rewrite, improve, complete, or add requirements to a consistent Task Contract.

Return exactly one result:

- `PASS`
- `PASS_WITH_NOTES`
- `BLOCKED`
- `NEEDS_HUMAN`

## Boundaries

Stay read-only with respect to source content, Git state, Issue or PR/MR state, labels, comments, and merge state. Do not write patches, create branches or worktrees, approve, merge, close, or retarget records.

You may inspect primary evidence and replay validation only when it is safe. Validation may create temporary or generated artifacts solely inside a disclosed isolated environment that does not mutate the canonical source snapshot or hosted state.

Do not use this workflow to evaluate contract quality or to clarify a vague contract. If compliance requires an interpretation, authorization, or contract change, preserve the ambiguity and return `NEEDS_HUMAN`.

## Required Evidence

Collect or report unavailable:

- the complete canonical Issue body, source, pinned revision metadata, exact full-body SHA-256 digest, exact Task Contract byte boundary, and Task Contract SHA-256 digest;
- the confirmed Blueprint reference and exact Blueprint artifact used for execution as supplementary evidence;
- runtime reviewer routing provenance: selected supported fields or inherited parent configuration;
- reviewer capability evidence and any unavailable exact Task Contract requirement;
- the final implementation snapshot and diff or equivalent implementation evidence;
- implementation, execution, validation, and review evidence available for that snapshot;
- the validation lifecycle: V0 focused, V1 integration, concentrated adversarial findings/repair, frozen candidate, V2 final deterministic, final reviewer wave, and V3 external evidence when applicable;
- the affected interfaces, data, validation requirements, and material risks.

Do not accept an implementation-runner claim, a summary, or a passing command as sole proof of compliance. Inspect primary evidence directly where possible. Missing evidence is not an invented requirement; it is a verification gap only when needed to determine a contractual clause.

## Verification Workflow

1. Read the complete canonical Issue body used for execution. Verify its source and exact full-body digest, compare host revision metadata when available, locate the exact Task Contract byte boundary, and verify its digest before extracting every applicable Task Contract clause into a clause record with: clause ID, source location, obligation, applicability, evidence, status, and notes. Require the confirmed Blueprint reference to pin the same Task Contract digest. A source, full-body, Task Contract boundary, Task Contract digest, or Blueprint-reference mismatch is stale evidence and returns `BLOCKED` with the smallest re-read or replan action. A host revision metadata difference with identical body and Task Contract digests is recorded as provenance, not treated as content drift.
2. Read referenced planning artifacts and other execution artifacts as supplementary evidence. Verify their Issue and Task Contract references when present, but do not extract normative clauses from them. Report any apparent added obligation as non-normative planning or execution drift; never turn it into a verifier requirement or an Issue-versus-plan conflict.
3. Identify irreconcilable conflicts only within the Task Contract. Cite the conflicting Task Contract clauses, choose neither requirement, and return `NEEDS_HUMAN`.
4. Capture the implementation snapshot before accepting validation or review evidence. Record repository/ref, commit or explicitly `unavailable`, Git tree digest, dirty/generated-artifact boundary, and capture time. The Git tree digest, not commit identity or a generic snapshot label, controls freshness.
5. Validate runtime reviewer-routing evidence. Accept selected model/profile/reasoning/sandbox fields only when each field is directly evidenced. Otherwise require inherited configuration provenance and no independently selected claims. Pre-implementation routing confirmation is neither required nor proof of runtime capability.
6. Map every applicable Task Contract clause to implementation, execution, validation, or review evidence. Record the Git tree digest referenced by each evidence item.
7. Inspect inherited-routing evidence for unsupported reviewer model or reasoning assignments, custom profiles, sandbox or host-isolation guarantees, reviewer tiers based on unavailable selection, or model-cost savings. Treat each unsupported guarantee as nonconformance. Distinguish instruction-level no-write boundaries from separately observable host enforcement.
8. Honor any Task-Contract-specified reviewer, agent, model, profile, provider, reasoning, sandbox, isolation, or review procedure exactly. Planning-artifact preferences are operational evidence, not contract requirements. If the exact runtime capability is unavailable and satisfying it requires interpretation, authorization, or a contract change, return `NEEDS_HUMAN`.
9. When the Task Contract does not specify review topology, require independent contract-conformance and code-review capabilities, then derive any additional test, security, compatibility, migration, data, permission, concurrency, or domain capabilities from the clauses, final diff, affected interfaces and data, and validation requirements. Reviewer identity, model, provider, and risk-specific specialization remain dynamic.
10. Distinguish development feedback from final evidence. V0 focused checks, V1 integration checks, and concentrated adversarial findings may explain implementation history but do not establish final-tree conformance. Capture the frozen certification candidate before accepting V2 or final reviewer evidence.
11. Require both an independent contract-conformance result and an independent code-review result before returning `PASS` or `PASS_WITH_NOTES`. Add risk-specific capabilities when justified. Final reviewers must refer to the same frozen Git tree digest. Record every reviewer’s identity/source, routing/configuration provenance, independence, capability, scope, instruction boundary, observable host isolation if any, evidence inspected, result, and verified tree. Record model or reasoning only when directly exposed.
12. Replay each Task-Contract-required validation against the captured tree when safe. Planning-only validation choices may support confidence but are not verifier requirements. Treat full deterministic checks as V2 final evidence. Accept network, authentication, hosted-service, real-runtime discovery, or other V3 external evidence only when it ran after V2 passed on the same frozen tree and the final reviewers inspect that unchanged evidence package. Inspect V3 primary evidence and ordering; do not replay an already valid external check by default. Replay V3 only when the Task Contract explicitly requires independent replay or the existing evidence is insufficient, and disclose the extra run. For each replay, record the tier, exact command, safety class, execution boundary, observable host-isolation evidence if any, Git tree digest, result, and relevant evidence. Do not replay unsafe commands; disclose why. A writable validation may run only in a disclosed isolated environment.
13. When a repair changes the Git tree digest after a candidate was frozen, create a new snapshot record. Mark affected V2, final-review, and V3 evidence from the prior tree stale, then replay or repeat the affected checks. V0/V1 development evidence was never final and needs no artificial “final snapshot invalidation” ceremony. Different commits with the same Git tree digest are tree-equivalent and may reuse otherwise fresh evidence.
14. Aggregate only tree-fresh, Task-Contract-clause-mapped evidence using the precedence below. Include risks, unresolved evidence, and the smallest next action.

Historical or external records that lack an accurate Issue identity or Git tree digest remain readable, but do not fabricate either identity or grant a new strong freshness guarantee. Return `BLOCKED` when the missing primary evidence can be supplied or the work can be replanned; return `NEEDS_HUMAN` only when proceeding requires a human interpretation, authorization, or contract decision.

Use [assets/implementation-verifier-checklist.md](assets/implementation-verifier-checklist.md) and [assets/verifier-result-template.md](assets/verifier-result-template.md) to record the workflow.

## Result Aggregation

Apply these rules in order:

1. Return `NEEDS_HUMAN` for an irreconcilable conflict within the canonical Issue, or when compliance requires human interpretation, authorization, or a contract change.
2. Otherwise return `BLOCKED` for Issue identity mismatch, implementation nonconformance, failed required validation, missing or tree-stale required evidence, missing historical identity needed for a strong guarantee, or a missing required review that can be supplied within the existing contract. State the smallest re-read, replan, repair, replay, or evidence action.
3. Otherwise return `PASS_WITH_NOTES` when all applicable clauses conform with fresh required evidence and remaining notes do not establish contract nonconformance.
4. Otherwise return `PASS` when all applicable clauses conform with fresh required evidence and no nonblocking notes remain.

A reviewer preference that does not demonstrate contract nonconformance is a nonblocking note, not a new requirement. Neither `PASS` nor `PASS_WITH_NOTES` is permitted without fresh independent contract-conformance and code-review evidence.

## Output

Use the result template. Always include canonical Issue and Task Contract identity, supplementary Blueprint/execution evidence, conflict status, runtime reviewer-routing evidence, implementation snapshot and tree freshness, clause evidence, Final Review Plan, reviewer provenance, validation replay, risks, final result, and the smallest next action for `BLOCKED` or `NEEDS_HUMAN`.
