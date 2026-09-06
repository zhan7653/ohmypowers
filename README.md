# ohmypowers

Small Codex skills for decision alignment, independent checks, and optional Decision Issue lifecycle curation.

`$power-gan` is the main entry point. It asks only about material user-owned decisions, keeps reversible implementation details autonomous, and uses a current v5 Decision Ledger only for material deliveries. Low-risk local work uses a short confirmation.

The package keeps the safeguards that require explicit state or authorization:

- material launch is bound to a rendered, user-confirmed Snapshot;
- hosted mutations require separate authorization and read-back verification;
- validation must produce evidence for observable behavior;
- `$power-check` supplies a fresh read-only review when its applicability rules require one;
- `$power-curator` is explicit-only and reconciles lifecycle evidence without inventing decisions.

The repository does not preserve retired Ledger or agent-profile compatibility on the current branch. Historical records remain external data and are not modified or migrated.

## Skills

- `$power-gan`: align and deliver a coding task.
- `$power-check`: independently verify a completed implementation when required.
- `$power-curator`: explicitly reconcile Decision Issues and delivery lifecycle state.

Use the Codex built-in `default`, `worker`, and `explorer` agents for ordinary delegation. The only project custom agent is the read-only reviewer at [.codex/agents/reviewer.toml](/home/alan/workspace/ohmypowers/.codex/agents/reviewer.toml). Codex owns spawning and lifecycle; the project profile only defines the review boundary.

## Installation

Run:

```bash
./scripts/install.sh
```

The installer copies the three skills into `${CODEX_HOME:-$HOME/.codex}/skills` and removes retired global ohmypowers skills and profiles. It does not copy project agents into the global profile directory. Start Codex from this repository so it can load the project-scoped reviewer.

## Testing

Run the deterministic, model-free suite:

```bash
node --test tests/*.test.js
```

The opt-in model evidence check uses the installed `$power-gan` and local model credentials:

```bash
node tests/model-evidence.eval.mjs
```

It is representative rather than exhaustive and is intentionally excluded from the default suite.

## Examples

```text
Use $power-gan to implement this small bug fix.
```

```text
Use $power-gan to grill this permission workflow until the decisions are clear; do not implement it.
```

```text
Use $power-check to independently verify this final diff against Issue #42.
```
