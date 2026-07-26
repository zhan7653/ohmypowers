---
name: power-check
description: Independently and read-only verify a completed implementation against current confirmed decisions and the final diff. Use when the user explicitly requests $power-check; when a completed change materially affects or creates credible production risk in security, privacy, permissions, production persistent state, data migration, external or cross-version compatibility, concurrency correctness, or irreversible behavior; or for material drift or an important merge, release, or handoff.
---

# Power Check

Default to Simplified Chinese; follow the user's language when they use another.

Verify a completed implementation without editing source, Git state, Issues, PRs, comments, or any external state. This skill has two readers with different jobs: the **caller** (the main or implementation context, which decides applicability, prepares evidence, delegates, and verifies afterward) and the **reviewer** (a fresh, behaviorally read-only, non-implementation context — normally the managed `power_reviewer`). Follow the protocol for your role. The Check Packet is the only interface between the two; neither role redoes the other's work.

## Applicability

This section is the single source of truth for when an independent check is required; other skills, including `$power-gan`, point here instead of restating it.

Require an independent check when any of these holds:

- the user explicitly requests it;
- the completed change **materially affects** security, privacy, permissions, production persistent state, data migration, external or cross-version compatibility, concurrency correctness, or irreversible behavior;
- material scope or decision drift occurred during delivery;
- an important merge, release, or handoff is being prepared;
- the current Decision Record requires independent evidence.

"Materially affects" means the change alters the guarantees of that category or creates credible production risk in it. Merely touching related code, configuration, tests, caches, fixtures, or compatibility logic is insufficient — and a small diff can still be material: a five-line change to a permission check qualifies. Counterexamples that do not require the check when proportionate self-validation covers the risk: a backward-compatible optional configuration field, an ephemeral or internal cache change, a test fixture adjustment, a narrow low-risk compatibility fix.

Do not start an early or speculative check merely because a PR, merge, release, or handoff is planned. The check runs once, against a stable final candidate.

## Implementation Identity

Both roles use one recipe, so binding and verification compare the same thing:

- **Preferred:** commit the final candidate (a temporary or working branch is fine); identity = the commit SHA **only while** `git status --porcelain=v1 --untracked-files=all` is empty. Record both the SHA and the clean-state assertion immediately before delegation and recompute both after the response. The reviewer inspects the committed tree at that SHA; any staged, unstaged, untracked, or submodule state makes this identity invalid instead of being ignored.
- **If committing is not possible** under repository conventions: identity = `git rev-parse HEAD`, plus the SHA-256 of the exact `git diff --binary --full-index --no-textconv HEAD --` bytes, plus an untracked manifest. Enumerate every untracked non-ignored entry with NUL-safe output (`git status --porcelain=v1 -z --untracked-files=all` and, for the file list, `git ls-files -z --others --exclude-standard`); hash each relative path, entry type, and file bytes or symbolic-link target. Never hash a collapsed directory label such as `?? directory/` as though it were file content.
- **Non-Git hosts:** an equivalent stable content hash of the final tree.

Delta = the diff between a previously checked identity and the new identity. Both roles recompute the complete identity recipe, not only `HEAD`. An identity mismatch or an invalid clean-state assertion at any comparison point invalidates earlier results for the changed content.

## Check Packet

The caller assembles this packet. The reviewer works only from it plus read-only inspection of the repository at the stated identity.

```markdown
# Check Packet

Mode: full | delta
Decision source: <Issue URL + revision | "direct user decisions" + the confirmed list | verified local snapshot + source identity + SHA-256>
Explicit non-goals: <boundaries the check must not treat as omissions>
Final implementation identity: <per the recipe above>
Self-validation evidence: <commands or checks run, results, what each proves>
External evidence: <platform- or environment-specific evidence already produced elsewhere>

## Delta mode only
Previously checked identity: <identity of the last checked candidate>
Prior result and findings: <result, each finding, and its disposition>
```

The caller validates this packet and repairs ordinary omissions before delegation. If a reviewer still receives an incomplete packet, return `BLOCKED` naming the missing field and the caller action needed; use `NEEDS_HUMAN` only when the missing information is genuinely an unresolved decision, interpretation, or authorization that the caller cannot supply. Never guess or silently re-derive a missing packet field.

## Caller Protocol

1. Confirm applicability, then wait for a stable final candidate: planned implementation edits finished, proportional self-validation complete.
2. Record the implementation identity per the recipe, build the Check Packet, and validate that every required field is present before delegation.
3. Delegate to the managed `power_reviewer`, explicitly telling it to use `$power-check` with the packet. The agent profile owns its model, effort, and no-write/no-delegation instructions; do not restate or override them.
4. When the reviewer returns, recompute the identity. A mismatch invalidates the result for changed content.
5. When findings lead to fixes, implement them in the main or worker context, then run a **delta** check:
   - if the host can resume the same reviewer context, resume it with a delta-mode packet;
   - otherwise spawn a new reviewer with the delta-mode packet, including the prior result and findings, and disclose that it is a new context. Independence from implementation is the invariant; "same context" is an efficiency and consistency optimization, so degrading it is acceptable and claiming it falsely is not.
   - Require a new **full** check only when material scope, decisions, the decision source, or the evidence boundary changed.
6. If adequate independence cannot be provided at all: do not run the check from the implementation context. Report `CHECK_REQUIRED` with the decision source and the final implementation identity as the check entry point. If the managed reviewer is unavailable but another fresh, behaviorally read-only, non-implementation context is adequate, it may run the check — disclose the substitution.

## Reviewer Protocol

Run this only in a fresh non-implementation context. Do not spawn another reviewer or delegate. Do not edit files, Git state, Issues, PRs, comments, or any external state, even when the sandbox would allow it. Do not re-fetch network state that a verified snapshot in the packet already covers; replay validation only when necessary and proportionate to challenge the supplied evidence, and never on an incompatible platform merely to duplicate evidence already produced on a supported one.

**Evidence boundary.** Use only: the packet's decision source; its explicit non-goals; the final tree and diff at the stated identity; the supplied self-validation and external evidence; and regression risks visible in the final implementation. A Working Strategy, Blueprint, rejected option, historical proposal, or comment that never entered the current Decision Record creates no obligation. Do not add preferences or imagined requirements. Missing tests are a finding only when the decision source's validation expectations or a material risk in the final diff requires them — never as generic coverage appetite.

The first check uses full mode and covers the complete final diff.

**Full mode:**

1. Verify the repository state matches the packet's implementation identity. Report drift or ambiguity instead of guessing.
2. Map each observable outcome and material boundary in the decision source to primary evidence in code, tests, configuration, schema, or safe validation output.
3. Inspect the final diff for obvious regressions and for material behavior, cost, risk, or scope that no current decision covers.
4. Replay safe, proportionate validation when it will not mutate the canonical source or external state; otherwise state what evidence was used and what could not be replayed.
5. Report findings before the conclusion.

**Delta mode:** inspect only the delta, the decision mappings it affects, and the regression evidence it affects. Reuse unchanged mappings, source inspection, and validation evidence from the prior result; do not re-read unrelated files, rerun unrelated suites, or reacquire unchanged external evidence unless the delta invalidates it.

## Result

Return exactly one:

- `PASS`: current decisions are satisfied with sufficient evidence.
- `PASS_WITH_NOTES`: satisfied, with non-blocking residual notes.
- `BLOCKED`: a fix or missing evidence is needed within the current decisions.
- `NEEDS_HUMAN`: a decision, interpretation, or authorization is missing and the caller cannot supply it.
- `CHECK_REQUIRED`: required independent context was unavailable (caller-side result).

Use this output shape, findings before the conclusion, ordered by severity:

```markdown
## Findings
- [Blocker|Major|Minor] <decision evidence → implementation evidence>, or "None"

## Check Result
Result: <PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN | CHECK_REQUIRED>
Mode: <full | delta (previously checked: <identity>)>
Decision source: <as supplied in the packet>
Final implementation identity: <identity actually inspected>
Validation evidence: <checks run or evidence inspected>
Residual risk: <none or remaining risk>
Smallest next action: <none or required action>
```

Example finding:

> - [Blocker] Decision Record「迁移必须可回滚」(Issue #42 rev 3) 缺少实现证据:`migrations/0007_split_events.py` 只有 `upgrade()`,`downgrade()` 抛 `NotImplementedError`;自验证证据未覆盖回滚路径。

For non-pass results, give the smallest next action and cite the decision and implementation evidence used.
