# ohmypowers

Small Codex skills for decision alignment, independent checks, and optional Decision Issue lifecycle curation.

`$power-gan` is the main entry point. Every source-writing task starts with a user grill covering the outcome, scope, constraints, validation direction, and smallest recommended approach. The user can end the grill early and delegate remaining ordinary choices; unresolved authorization, irreversible, safety, or external-write boundaries still block implementation. It keeps private reversible mechanics autonomous and uses a current v5 Decision Ledger only for material deliveries.

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

Use the Codex built-in `default` agent for fallback work. The installer places managed profiles in `${CODEX_HOME:-$HOME/.codex}/agents`: `worker.toml`, `explorer.toml`, and the read-only `reviewer.toml`. They shadow the built-in worker/explorer roles and define bounded behavior and model routing. Codex owns spawning and lifecycle.

## Installation

Run:

```bash
./scripts/install.sh
```

The installer copies the three skills into `${CODEX_HOME:-$HOME/.codex}/skills`, installs the three managed profiles into `${CODEX_HOME:-$HOME/.codex}/agents`, sets the global default subagent reasoning effort to `medium`, and removes retired ohmypowers skills and profiles. Existing config and unrelated profiles are preserved. Managed global profiles are templates from this repository; edit the installed files directly when you want a local global-agent override, and rerunning the installer restores the repository templates.

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
