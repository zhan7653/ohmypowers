# Verifier Result

Result: `<PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN>`

## Identity And Freshness

- Canonical Issue and Task Contract: `<source, execution body digest, Task Contract digest, matched/mismatch>`
- Execution Blueprint: `<source/digest/matched or not used>`
- Final snapshot: `<repository/ref, commit if available, Git tree digest, dirty/generated boundary, capture time>`
- Evidence freshness: `<fresh | tree-equivalent | stale | insufficient>`

## Contract Exceptions

Passing clauses checked: `<count>`

| Clause | Nonconformance, missing evidence, ambiguity, or stale evidence |
|---|---|
| `<clause or None>` | `<finding>` |

## Review And Validation Exceptions

- Final Review Record: `<source, digest, result, frozen tree match>`
- Required independent capabilities: `<present or missing items>`
- Unsupported routing/isolation claims: `<None or items>`
- V2/V3 or replay exceptions: `<None or items>`

## Notes And Next Action

- Nonblocking notes: `<None or items>`
- Smallest next action: `<None or action>`
