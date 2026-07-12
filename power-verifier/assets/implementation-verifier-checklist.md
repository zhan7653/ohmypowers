# Implementation Verifier Checklist

Use this checklist for a read-only contract-conformance pass.

## Contract And Clauses

- Read the complete canonical Issue or persisted local contract and the final Goal Prompt.
- Keep comments, discussions, summaries, and PR/MR text supplementary unless incorporated into a canonical source.
- Extract every applicable clause into a record containing clause ID, source, source location, obligation, applicability, evidence, status, and notes.
- Treat a consistent contract as authoritative; do not criticize, rewrite, complete, or add requirements.
- Identify clauses that cannot be satisfied together. Cite both records and select `NEEDS_HUMAN` without choosing either clause.

## Snapshot And Evidence

- Record the confirmed execution mode as exactly `strict-model-routing` or `inherited-model-routing`.
- Record capability classification as exactly `strict-selection-supported`, `inherited-model-only`, or `indeterminate`, plus evidence inspected, recommended mode, uncertainty or unavailable evidence, and user confirmation.
- Verify that the confirmed mode matches capability evidence. Do not infer a mode from installed profiles, inherited values, or incomplete or contradictory evidence.
- For strict mode, verify each claimed selector independently; model/profile selection does not prove reasoning, sandbox, or isolation selection.
- For inherited mode, record configuration as inherited provenance, not independently selected routing. Reject unsupported per-subagent model or reasoning assignments, custom profiles, sandbox or host-isolation guarantees, model escalation, reviewer tiers based on unavailable selection, assignment-accuracy claims, and model-cost savings.
- Capture the implementation snapshot before accepting validation or review evidence: repository/ref, commit when available, diff or tree digest, dirty/generated-artifact boundary, and capture time.
- Map each applicable clause to implementation, execution, validation, or review evidence and record its referenced snapshot.
- Check that evidence is fresh for the captured snapshot.
- After a repair, record a new snapshot; mark affected prior validation and review evidence stale and rerun affected checks.
- Record unresolved or unavailable evidence without guessing.

## Review Plan And Provenance

- Identify contract-specified reviewers, agents, models, profiles, providers, reasoning, sandbox, isolation, or procedures and verify each exactly.
- If an exact requirement is unavailable in the confirmed mode, do not substitute inherited behavior or a weaker instruction boundary; select `NEEDS_HUMAN` when interpretation, authorization, mode change, or contract change is required.
- If topology is not prescribed, derive the minimum sufficient capabilities from obligations, final diff, interfaces, data, validation, and security, compatibility, migration, permission, concurrency, test, and domain risks.
- Do not require a fixed reviewer count, identity, model, provider, or specialization.
- Require at least one reviewer independent from implementation who checked contract conformance before `PASS` or `PASS_WITH_NOTES`.
- For every reviewer, record identity/source, confirmed execution mode, inherited configuration provenance (or `not applicable` in strict mode), implementation independence, capability, scope, instruction boundary, observable host-isolation evidence if any, evidence inspected, result, and snapshot identity.
- Record model or reasoning only when the host directly exposes it. Never infer either value from the parent, a profile name, documentation, or task difficulty.
- Treat an allowed-path or no-write instruction as an instruction boundary, not host-enforced isolation, unless enforcement is separately observable.
- Treat reviewer preferences without demonstrated contract nonconformance as notes, not blockers.

## Validation Replay

- Identify every contract-required validation and replay it against the stable snapshot when safe.
- For each replay, record exact command, safety class, execution boundary, observable host-isolation evidence if any, snapshot, result, and relevant evidence.
- Allow writable or generated artifacts only in a disclosed isolated environment that leaves canonical source and hosted state unchanged.
- Do not run unsafe validation. Disclose the reason and determine whether the remaining evidence creates a `BLOCKED` gap or requires `NEEDS_HUMAN` authorization.

## Result Selection

Apply deterministic precedence:

1. `NEEDS_HUMAN`: irreconcilable contract conflict or a required human interpretation, authorization, or contract change.
2. `BLOCKED`: fixable implementation nonconformance, failed validation, missing or stale required evidence, or a required review that can be supplied within the existing contract.
3. `PASS_WITH_NOTES`: all clauses conform with fresh required evidence; only nonblocking notes remain.
4. `PASS`: all clauses conform with fresh required evidence and no notes remain.

For `BLOCKED` or `NEEDS_HUMAN`, state the smallest next action. Do not infer completion from intent, summaries, or unrelated passing commands.
