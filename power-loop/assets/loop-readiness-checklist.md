# Loop Readiness Checklist

Use the delivery lane and split decision already recorded in the Task Contract.

Return `LOOP_READY` when the contract has:

- a bounded outcome and user-observable behavior;
- scope and non-goals;
- external API/data, compatibility, security, permission, migration, or business decisions when applicable;
- required safety guarantees and explicit exclusions;
- observable acceptance and validation evidence;
- completion and pause-and-ask conditions.

Return `NEEDS_GRILL` only for a missing requirement-level decision. Repository-derived paths, private interfaces, commands, implementation order, and worktree choices are not requirement gaps.

Return `NEEDS_HUMAN` for missing authority, unauthorized irreversible action, or irreconcilable facts.

If repository evidence contradicts the recorded lane or split decision, route the conflict back to the Task Contract. Do not add a residual-risk or execution-decision classification.
