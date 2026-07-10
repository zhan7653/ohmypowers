# Implementation Verifier Checklist

Use this checklist for a read-only contract-conformance pass.

## Contract And Clauses

- Read the complete canonical Issue or persisted local contract and the final Goal Prompt.
- Keep comments, discussions, summaries, and PR/MR text supplementary unless incorporated into a canonical source.
- Extract every applicable clause into a record containing clause ID, source, source location, obligation, applicability, evidence, status, and notes.
- Treat a consistent contract as authoritative; do not criticize, rewrite, complete, or add requirements.
- Identify clauses that cannot be satisfied together. Cite both records and select `NEEDS_HUMAN` without choosing either clause.

## Snapshot And Evidence

- Capture the implementation snapshot before accepting validation or review evidence: repository/ref, commit when available, diff or tree digest, dirty/generated-artifact boundary, and capture time.
- Map each applicable clause to implementation, execution, validation, or review evidence and record its referenced snapshot.
- Check that evidence is fresh for the captured snapshot.
- After a repair, record a new snapshot; mark affected prior validation and review evidence stale and rerun affected checks.
- Record unresolved or unavailable evidence without guessing.

## Review Plan And Provenance

- Identify contract-specified reviewers, agents, models, providers, or procedures and verify each exactly.
- If topology is not prescribed, derive the minimum sufficient capabilities from obligations, final diff, interfaces, data, validation, and security, compatibility, migration, permission, concurrency, test, and domain risks.
- Do not require a fixed reviewer count, identity, model, provider, or specialization.
- Require at least one reviewer independent from implementation who checked contract conformance before `PASS` or `PASS_WITH_NOTES`.
- For every reviewer, record identity/source, implementation independence, capability, scope, read-only boundary, evidence inspected, result, and snapshot.
- Treat reviewer preferences without demonstrated contract nonconformance as notes, not blockers.

## Validation Replay

- Identify every contract-required validation and replay it against the stable snapshot when safe.
- For each replay, record exact command, safety class, execution/isolation boundary, snapshot, result, and relevant evidence.
- Allow writable or generated artifacts only in a disclosed isolated environment that leaves canonical source and hosted state unchanged.
- Do not run unsafe validation. Disclose the reason and determine whether the remaining evidence creates a `BLOCKED` gap or requires `NEEDS_HUMAN` authorization.

## Result Selection

Apply deterministic precedence:

1. `NEEDS_HUMAN`: irreconcilable contract conflict or a required human interpretation, authorization, or contract change.
2. `BLOCKED`: fixable implementation nonconformance, failed validation, missing or stale required evidence, or a required review that can be supplied within the existing contract.
3. `PASS_WITH_NOTES`: all clauses conform with fresh required evidence; only nonblocking notes remain.
4. `PASS`: all clauses conform with fresh required evidence and no notes remain.

For `BLOCKED` or `NEEDS_HUMAN`, state the smallest next action. Do not infer completion from intent, summaries, or unrelated passing commands.
