---
name: power-verifier
description: Verify a completed implementation read-only against its pinned canonical Issue revision.
---

# Power Verifier

## Purpose

Verify whether an implementation, its execution, validation, and evidence conform to the verification contract without changing source, Git, or hosted state. The verifier is portable: it can assess an arbitrary code project and does not require a particular repository layout, Git host, profile, model, provider, test framework, or review count.

The sole normative verification contract is the complete canonical hosted Issue body, or an equivalent persisted local contract body, at the exact revision pinned for execution. Identify it with its source, host revision metadata when available, and SHA-256 digest of the exact full persisted UTF-8 body with no whitespace or newline normalization. The full-body digest is always the authoritative content identity; host revision metadata is recorded provenance.

Read that pinned body in full. Treat the final Goal Prompt, execution session, comments, discussions, implementation summaries, PR/MR descriptions, runner summaries, and reviewer conclusions as supplementary evidence only. They may show what ran or identify drift, but they cannot add, override, or conflict with contract obligations. Do not judge, rewrite, improve, complete, or add requirements to a consistent Issue contract.

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

- the complete canonical Issue body, source, pinned revision metadata, and exact full-body SHA-256 digest;
- the final Goal Prompt used for execution as supplementary evidence, including its Issue identity reference when available;
- the confirmed execution mode: `strict-model-routing` or `inherited-model-routing`;
- the capability classification: `strict-selection-supported`, `inherited-model-only`, or `indeterminate`;
- the capability evidence inspected, uncertainty or unavailable evidence, recommended mode, and user confirmation;
- the final implementation snapshot and diff or equivalent implementation evidence;
- implementation, execution, validation, and review evidence available for that snapshot;
- the affected interfaces, data, validation requirements, and material risks.

Do not accept an implementation-runner claim, a summary, or a passing command as sole proof of compliance. Inspect primary evidence directly where possible. Missing evidence is not an invented requirement; it is a verification gap only when needed to determine a contractual clause.

## Verification Workflow

1. Read the complete canonical Issue body at the pinned identity. Verify its source and exact full-body digest, and compare host revision metadata when available, before extracting every applicable Issue clause into a clause record with: clause ID, source location, obligation, applicability, evidence, status, and notes. A source or authoritative full-body digest mismatch is stale contract evidence and returns `BLOCKED` with the smallest re-read or replan action. A host revision metadata difference with an identical full-body digest is recorded as provenance, not treated as content drift.
2. Read the final Goal Prompt and other execution artifacts as supplementary evidence. Verify that their Issue reference matches the pinned identity when present, but do not extract normative clauses from them. Report any apparent added obligation as non-normative execution drift; never turn it into a verifier requirement or an Issue-versus-Goal contract conflict.
3. Identify irreconcilable conflicts only within the canonical Issue. Cite the conflicting Issue clauses, choose neither requirement, and return `NEEDS_HUMAN`.
4. Capture the implementation snapshot before accepting validation or review evidence. Record repository/ref, commit or explicitly `unavailable`, Git tree digest, dirty/generated-artifact boundary, and capture time. The Git tree digest, not commit identity or a generic snapshot label, controls freshness.
5. Validate capability evidence and mode confirmation before accepting mode-specific execution evidence:
   - accept `strict-model-routing` only when usable model or custom-agent selection is directly evidenced; verify model, reasoning, profile, and sandbox capabilities independently rather than inferring one from another;
   - accept `inherited-model-routing` when evidence supports `inherited-model-only`; record inherited configuration as provenance, never as independently selected routing;
   - treat incomplete or contradictory evidence as `indeterminate`; do not infer a mode or accept mode-specific execution without the required human confirmation and usable capability evidence.
6. Map every applicable Issue clause to implementation, execution, validation, or review evidence. Record the Git tree digest referenced by each evidence item.
7. Inspect inherited-mode artifacts for unsupported per-subagent model or reasoning assignments, custom profiles, sandbox or host-isolation guarantees, model escalation, reviewer tiers based on unavailable model selection, assignment-accuracy claims, or model-cost savings. Treat each unsupported guarantee as nonconformance. Distinguish instruction-level ownership or no-write boundaries from separately observable host enforcement.
8. Honor any Issue-specified reviewer, agent, model, profile, provider, reasoning, sandbox, isolation, or review procedure exactly. Do not silently substitute an unavailable specified requirement. If the exact requirement is unavailable in the confirmed mode and satisfying it requires interpretation, authorization, mode change, or contract change, return `NEEDS_HUMAN`.
9. When the Issue does not specify review topology, derive the minimum sufficient review capabilities from its clauses, final diff, affected interfaces and data, validation requirements, and security, compatibility, migration, permission, concurrency, test, and domain risks. Select only capabilities justified by that assessment; no count, identity, model, provider, or specialization is universal.
10. Require at least one contract-conformance reviewer who did not participate in implementation before returning `PASS` or `PASS_WITH_NOTES`. A review plan may add code, test, security, compatibility, migration, data, or domain capabilities when the evidence justifies them. Record every reviewer’s identity or source, confirmed execution mode, inherited configuration provenance (or `not applicable` in strict mode), implementation independence, capability, scope, instruction boundary, observable host-isolation evidence if any, evidence inspected, result, and verified Git tree digest. Record model or reasoning only when the host directly exposes it; never infer either value.
11. Replay each Issue-required validation against the captured tree when safe. For each replay, record the exact command, safety class, execution boundary, observable host-isolation evidence if any, Git tree digest, result, and relevant evidence. Do not replay unsafe commands; disclose why. A writable validation may run only in a disclosed isolated environment.
12. When a repair changes the Git tree digest, create a new snapshot record. Mark affected validation and review evidence from the prior tree stale, then replay or repeat the affected checks. Different commits with the same Git tree digest are tree-equivalent and may reuse otherwise fresh evidence.
13. Aggregate only tree-fresh, Issue-clause-mapped evidence using the precedence below. Include risks, unresolved evidence, and the smallest next action.

Historical or external records that lack an accurate Issue identity or Git tree digest remain readable, but do not fabricate either identity or grant a new strong freshness guarantee. Return `BLOCKED` when the missing primary evidence can be supplied or the work can be replanned; return `NEEDS_HUMAN` only when proceeding requires a human interpretation, authorization, or contract decision.

Use [assets/implementation-verifier-checklist.md](assets/implementation-verifier-checklist.md) and [assets/verifier-result-template.md](assets/verifier-result-template.md) to record the workflow.

## Result Aggregation

Apply these rules in order:

1. Return `NEEDS_HUMAN` for an irreconcilable conflict within the canonical Issue, or when compliance requires human interpretation, authorization, or a contract change.
2. Otherwise return `BLOCKED` for Issue identity mismatch, implementation nonconformance, failed required validation, missing or tree-stale required evidence, missing historical identity needed for a strong guarantee, or a missing required review that can be supplied within the existing contract. State the smallest re-read, replan, repair, replay, or evidence action.
3. Otherwise return `PASS_WITH_NOTES` when all applicable clauses conform with fresh required evidence and remaining notes do not establish contract nonconformance.
4. Otherwise return `PASS` when all applicable clauses conform with fresh required evidence and no nonblocking notes remain.

A reviewer preference that does not demonstrate contract nonconformance is a nonblocking note, not a new requirement. Neither `PASS` nor `PASS_WITH_NOTES` is permitted without the required independent contract-conformance review.

## Output

Use the result template. Always include the canonical Issue source, revision, exact full-body digest, supplementary evidence, Issue-internal conflict status, confirmed execution mode and capability evidence, implementation snapshot and tree freshness, clause-by-clause evidence, dynamic review plan, reviewer provenance and independence, validation replay, risks and unresolved evidence, final result, and the smallest next action for `BLOCKED` or `NEEDS_HUMAN`.
