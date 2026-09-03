# Available Agents

This reference is a declarative catalog of the managed agent profiles installed with ohmypowers. It describes capabilities and behavioral boundaries only. Codex owns subagent invocation, scheduling, waiting, and lifecycle behavior.

## Profiles

| Profile | Capability / use | Behavioral boundary |
| --- | --- | --- |
| `power_worker` | Bounded implementation, tests, fixes, documentation, and deterministic validation. | Write-capable within the task boundary; does not recursively delegate. |
| `power_scout` | Bounded factual collection, inventories, direct documentation or history lookup, and log or test summaries. | Behaviorally read-only; does not expand into causal analysis or implementation. |
| `power_explorer` | Multi-hypothesis investigation, repository tracing, root-cause analysis, and scope discovery. | Behaviorally read-only; does not implement changes. |
| `power_planner` | Genuinely ambiguous planning, decomposition, cross-agent synthesis, and conflict analysis. | Behaviorally read-only; does not implement changes or recursively delegate. |
| `power_reviewer` | Independent review of a completed implementation when the applicable checking workflow requires it. | Behaviorally read-only; does not edit or recursively delegate. |

## Profile configuration

Each profile file is the source of its model, reasoning-effort, and developer-instruction settings. An installed profile file describes available configuration; it does not by itself prove that the current host can select or enforce every setting.

Behaviorally read-only profiles rely on their developer instructions unless the host exposes a separate isolation guarantee. The catalog does not turn that instruction boundary into a sandbox claim.

## Scope

This catalog does not prescribe delegation triggers, agent counts, task ordering, parallelism, capacity, task-packet formats, wait or polling behavior, timeout or retry policy, retirement, or other host lifecycle rules. Those decisions remain with Codex and the applicable host or skill contract.
