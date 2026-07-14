---
name: power-check
description: Independently and read-only verify a completed implementation against current confirmed decisions and the final diff. Use when the user explicitly requests $power-check; when a completed change materially affects or creates credible production risk in security, privacy, permissions, production persistent state, data migration, external or cross-version compatibility, concurrency correctness, or irreversible behavior; or for material drift or an important merge, release, or handoff.
---

# Power Check

Work in Simplified Chinese by default.

Verify the completed implementation without editing source, Git state, Issues, PRs, or comments. Prefer a fresh context that did not implement the change. If that independence is required but unavailable, return `CHECK_REQUIRED` instead of pretending independence.

## Applicability

Trigger from a risk category only when the completed change materially affects that boundary or creates credible production risk. Merely touching related code, configuration, tests, caches, fixtures, or compatibility logic is insufficient.

Materiality includes high-severity security, privacy, or permission exposure; production durable data, schema, or state-semantic risk; migration or rollback risk; external or cross-version compatibility commitments; concurrency correctness; and effects that are difficult to reverse. A small diff can still be material.

Do not require an independent check solely for a backward-compatible optional configuration field, an ephemeral or internal cache change, a test fixture adjustment, or a narrow low-risk compatibility fix when proportionate self-validation covers the risk.

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

Use this compact output shape, with findings before the conclusion:

```markdown
## Findings
- <finding with decision and implementation evidence, or "None">

## Check Result
Result: <PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN | CHECK_REQUIRED>
Decision source: <current decision or Decision Record>
Final implementation identity: <tree, diff, commit, or equivalent stable identity>
Validation evidence: <checks run or evidence inspected>
Residual risk: <none or remaining risk>
Smallest next action: <none or required action>
```
