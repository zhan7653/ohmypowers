# Status Transitions

This is a recommended protocol, not a hard dependency. If a project cannot create labels, record equivalent status in the issue, PR/MR body, or PR/MR comments.

## Labels

- `agent-ready`: the task contract is clarified and ready for loop orchestration.
- `agent-loop-ready`: `power-loop` produced a bounded `/goal`.
- `agent-running`: Codex is executing the bounded implementation loop.
- `agent-blocked`: technical blockers prevent progress.
- `agent-needs-human`: a human decision is required.
- `agent-pr-ready`: a draft PR/MR is ready for review.
- `agent-follow-up-needed`: new work should move to a follow-up issue.
- `agent-done`: human review confirms the task is complete.
- `no-agent`: the task is not suitable for agent execution.

## Normal Flow

```text
agent-ready
  -> agent-loop-ready
  -> agent-running
  -> agent-pr-ready
  -> agent-done
```

## Exception Flow

```text
agent-running
  -> agent-blocked
  -> agent-needs-human
  -> agent-follow-up-needed
```

## Notes

- Do not require label mutation for loop execution.
- If labels are unavailable, include the current status and next status in the PR/MR evidence package.
- `agent-done` should require human confirmation.

