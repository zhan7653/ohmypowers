# Project Instructions

## Branch Workflow

- Treat `main` as a protected integration branch, not the default development branch.
- Do routine development work and commits on `develop`.
- Merge `develop` into `main` only when explicitly requested or when preparing an integration/release step.
- If currently on `main` when starting development work, switch to `develop` first or create it from `main` if it does not exist.

## GitHub Publication

- For user-authorized GitHub publication in this repository, use `gh` as the default path instead of first attempting Git HTTP. When the remote branch or commit does not yet exist, use `gh api` with GitHub's Git Data API to create the required blobs, tree, commit, and ref, then use `gh pr create` or the corresponding `gh` API operation.
- Treat an API-created remote commit SHA differing from the local commit SHA as an expected property of this publication path, not as a reason to retry Git transport. Require the remote tree SHA to equal the intended local tree SHA before creating or updating the branch, and report both commit identities when they differ.
- Verify every uploaded blob SHA against the intended local Git blob, verify the remote commit's tree and parent, and verify the final branch ref and PR head before reporting success.
- If the default `gh` path fails, stop immediately, report the exact failure, and ask the user before retrying or switching to Git HTTP, WSL, proxy variations, HTTP-version changes, or SSH.
- Do not run speculative transport diagnostics or try multiple publication mechanisms after a failure unless the user explicitly authorizes them.
