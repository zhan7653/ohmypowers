# Summary

<What changed and why.>

# Contract and planning identity

- Canonical Issue/local body: `<source, host revision when available, exact complete-body SHA-256>`
- Task Contract digest: `<sole normative contract SHA-256>`
- Execution Blueprint: `<source and exact digest; supplementary guidance>`
- Final Git tree digest: `<frozen tree>`

# Changed files

- `<path>`: <reason>

# Clause and acceptance evidence

| Clause / AC | Obligation | Implementation evidence | Validation/review evidence | Status |
|---|---|---|---|---|
| `<AC>` | `<obligation>` | `<files>` | `<evidence>` | `<satisfied/blocker>` |

# Validation

- `V0 Focused`: `<commands and result>`
- `V1 Integration`: `<commands and result>`
- High-risk batched self-review: `<not applicable or findings>`
- Concentrated repair rounds: `<0 or 1>`
- Candidate snapshots: `<count; maximum 3>`
- `V2 Final deterministic`: `<commands and frozen-tree result>`
- `V3 External`: `<not applicable or one post-V2 frozen-tree run>`

# Final review

- Final Review Plan: `<source or attached evidence>`
- Reviewer routing provenance: `<selected supported fields | inherited from parent>`
- Shared frozen Git tree digest: `<digest>`

| Reviewer | Capability | Scope | Result | Findings/notes | Verified tree |
|---|---|---|---|---|---|
| `<identity>` | `<contract-conformance | code-review | risk capability>` | `<scope>` | `<result>` | `<summary>` | `<digest>` |

Coordination evidence:

- Launched reviewers: `<count>`
- `wait_agent` calls: `<count>`
- Maximum consecutive no-information timeouts: `<count>`
- Cumulative wait duration: `<duration>`

# Verifier result

- Result: `<PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN>`
- Evidence source: `<result artifact or summary>`
- Notes/blockers: `<none or exact items>`
- Smallest next action: `<None or action>`

# Risks and out of scope

- Risks/assumptions: `<items>`
- Out of scope: `<preserved non-goals>`

# Loop decision

Decision: `<pr-ready | blocked | needs-human | follow-up-needed | done>`

Reason: `<short evidence-based reason>`

# Reviewer checklist

- [ ] Task Contract alignment and clause evidence.
- [ ] V2/V3 and reviewer evidence use the same frozen tree.
- [ ] Independent contract-conformance and code-review results are present.
- [ ] Reviewer configuration/isolation claims match observable evidence.
- [ ] Verifier result supports the loop decision.
