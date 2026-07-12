# Implementation Verifier Checklist

Use this checklist for a read-only contract-conformance pass.

## Canonical Issue And Clauses

- Read the complete canonical Issue or persisted local contract at the pinned identity for container identity and lifecycle context.
- Locate the exact Task Contract byte range and verify its SHA-256; extract normative clauses only from that range.
- Treat the Blueprint, runtime Final Review Plan, and any legacy Dispatch artifact as supplementary operational evidence, not clause sources.
- Record its source, host revision metadata when available, and SHA-256 of the exact full persisted UTF-8 body without normalization; the full-body digest is the authoritative container identity, and the observed identity must match the pin.
- Keep planning artifacts, sessions, comments, discussions, summaries, PR/MR text, and runner output supplementary. They cannot add or override obligations.
- Extract every applicable Task Contract clause into a record containing clause ID, source location, obligation, applicability, evidence, status, and notes. Do not extract planning-artifact clauses.
- Treat a consistent contract as authoritative; do not criticize, rewrite, complete, or add requirements.
- Identify Task Contract clauses that cannot be satisfied together. Cite both records and select `NEEDS_HUMAN` without choosing either clause.
- Treat a source or authoritative full-body digest mismatch as stale evidence and `BLOCKED`, not as a second-contract conflict. Record a host revision metadata difference with an identical digest as provenance rather than content drift.
- For historical records, mark missing revision, digest, or tree identity unavailable; never reconstruct or fabricate it.

## Snapshot And Evidence

- Record runtime reviewer routing as selected supported fields or inherited parent configuration.
- Verify each selected model/profile/reasoning/sandbox field independently.
- When fields are not selectable, require inherited provenance and reject invented reviewer configuration, sandbox/isolation, tier, or model-cost claims.
- Do not require or treat a pre-implementation routing confirmation as runtime capability evidence.
- Capture the implementation snapshot before accepting validation or review evidence: repository/ref, commit or explicitly `unavailable`, Git tree digest, dirty/generated-artifact boundary, and capture time.
- Map each applicable Task Contract clause to implementation, execution, validation, or review evidence and record its Git tree digest.
- Check freshness by Git tree digest. Different commits with the same tree are reusable; different trees invalidate affected evidence.
- After a tree-changing repair, record a new snapshot; mark affected prior validation and review evidence stale and rerun affected checks.
- Record unresolved or unavailable evidence without guessing.

## Review Plan And Provenance

- Identify contract-specified reviewers, agents, models, profiles, providers, reasoning, sandbox, isolation, or procedures and verify each exactly.
- If an exact runtime reviewer requirement is unavailable, do not substitute inherited behavior or a weaker instruction boundary; select `NEEDS_HUMAN` when interpretation, authorization, or contract change is required.
- If topology is not prescribed, derive the minimum sufficient capabilities from obligations, final diff, interfaces, data, validation, and security, compatibility, migration, permission, concurrency, test, and domain risks.
- Require independent contract-conformance and code-review capabilities; normally assign them to distinct decoupled reviewers over the same frozen tree.
- Add risk-specific reviewers only when justified; do not require a fixed identity, model, provider, or specialization for those dynamic capabilities.
- For every reviewer, record identity/source, routing/configuration provenance, implementation independence, capability, scope, instruction boundary, observable host-isolation evidence if any, evidence inspected, result, and verified Git tree digest.
- Record model or reasoning only when the host directly exposes it. Never infer either value from the parent, a profile name, documentation, or task difficulty.
- Treat an allowed-path or no-write instruction as an instruction boundary, not host-enforced isolation, unless enforcement is separately observable.
- Treat reviewer preferences without demonstrated contract nonconformance as notes, not blockers.

## Validation Replay

- Separate V0 focused and V1 integration development feedback from frozen-tree evidence.
- Require V2 full deterministic evidence and final reviewers to identify the same frozen Git tree digest.
- Accept V3 network/authentication/hosted/discovery evidence only after V2 passed on the frozen tree and when final reviewers inspect that unchanged evidence package.
- Inspect existing V3 primary evidence and ordering; do not replay a valid external check by default unless the Task Contract explicitly requires independent replay.
- If a frozen tree changes, mark affected V2/final-review/V3 evidence stale; do not pretend earlier V0/V1 development checks were final snapshot evidence.
- Identify every contract-required validation and replay it against the stable snapshot when safe.
- For each replay, record exact command, safety class, execution boundary, observable host-isolation evidence if any, snapshot, result, and relevant evidence.
- Allow writable or generated artifacts only in a disclosed isolated environment that leaves canonical source and hosted state unchanged.
- Do not run unsafe validation. Disclose the reason and determine whether the remaining evidence creates a `BLOCKED` gap or requires `NEEDS_HUMAN` authorization.

## Result Selection

Apply deterministic precedence:

1. `NEEDS_HUMAN`: irreconcilable conflict within the canonical Issue or a required human interpretation, authorization, or contract change.
2. `BLOCKED`: Issue identity mismatch, fixable implementation nonconformance, failed validation, missing or tree-stale required evidence, missing historical identity needed for a strong guarantee, or a required review that can be supplied within the existing contract.
3. `PASS_WITH_NOTES`: all clauses conform with fresh required evidence; only nonblocking notes remain.
4. `PASS`: all clauses conform with fresh required evidence and no notes remain.

For `BLOCKED` or `NEEDS_HUMAN`, state the smallest next action. Do not infer completion from intent, summaries, or unrelated passing commands.
