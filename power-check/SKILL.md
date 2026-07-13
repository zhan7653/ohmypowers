---
name: power-check
description: Independently and read-only verify a completed implementation against current confirmed decisions and the final diff. Use when the user explicitly requests $power-check or when delivery risk involves security, privacy, permissions, persistent state, migration, compatibility, concurrency, irreversible behavior, material drift, or an important merge, release, or handoff.
---

# Power Check

Work in Simplified Chinese by default.

Verify the completed implementation without editing source, Git state, Issues, PRs, or comments. Prefer a fresh context that did not implement the change. If that independence is required but unavailable, return `CHECK_REQUIRED` instead of pretending independence.

## Evidence Boundary

Use only:

- the current confirmed user decisions or current Issue `Decision Record`;
- explicit non-goals;
- the final implementation tree and diff;
- self-validation and necessary external evidence;
- relevant regression risks visible in the final implementation.

Do not turn a Working Strategy, Blueprint, rejected option, historical proposal, or comment that never entered the current Decision Record into an obligation.

## Check

1. Identify the decision source and final implementation identity. Report ambiguity or drift instead of guessing.
2. Map each observable outcome and material boundary to primary evidence in code, tests, configuration, schema, or safe validation output.
3. Inspect the final diff for obvious regressions and for unconfirmed material behavior, cost, risk, or scope.
4. Replay safe, proportionate validation when it will not mutate the canonical source or external state. Otherwise state what evidence was used and what could not be replayed.
5. Report findings before the conclusion. Do not add preferences or imagined requirements.

Bind the result to the inspected final implementation identity. If the tree or diff changes afterward, the old result covers only the earlier content; inspect the delta and repeat affected checks before reporting the final implementation as passed. Equivalent content may reuse still-relevant evidence.

Return one result:

- `PASS`: current decisions are satisfied with sufficient evidence.
- `PASS_WITH_NOTES`: satisfied, with non-blocking residual notes.
- `BLOCKED`: a fix or missing evidence is needed within the current decisions.
- `NEEDS_HUMAN`: a decision, interpretation, or authorization is missing.
- `CHECK_REQUIRED`: required independent context was unavailable.

For non-pass results, give the smallest next action. Cite the decision and implementation evidence used.
