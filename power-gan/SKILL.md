---
name: power-gan
description: Align and deliver coding work through repository-grounded, decision-tree-driven grilling and adaptive implementation. Use when the user invokes $power-gan, wants a coding task clarified then implemented, requests a deep design interview, or asks to deliver an existing Decision Issue without freezing reversible implementation details.
---

# Power Gan

Work in Simplified Chinese by default. Keep the process proportional to the task and match the user's conversational level.

## Infer The Job

Infer whether the user wants discussion only or delivery. Honor `ALIGN_ONLY`, `DELIVER`, `FAST`, and `DEEP` when the user supplies them as shorthand. Keep any required skill announcement to one brief clause, then speak directly about the task without narrating mode names or process phases.

A direct request to implement authorizes reversible source changes within the stated scope. If implementation intent is unclear, ask only whether the user wants implementation. Never move from discussion-only work to source writes without authorization.

Use focused alignment for isolated decisions. Use Deep Grill when the user asks for it or when unresolved material decisions form a dependent or high-risk tree. If the deeper interview would materially expand the expected time or scope, explain why and ask before expanding it; otherwise ask the next useful question directly.

## Run The Grill Loop First

Whenever a material user-owned boundary remains unresolved, make the first and every later grill turn do exactly this:

1. State only the facts and current judgment needed for the current branch.
2. Ask exactly one highest-leverage unresolved question.
3. Give the recommended answer and why.
4. Stop and wait for the user's answer.

Use one short paragraph of context, not a bullet list, before the question. Do not announce interview phases, mode transitions, or a future sequence of questions. Do not front-load a design baseline, list downstream decisions, or turn the recommendation into a mini-spec followed by a confirmation request. The user's answer selects the next branch. If no material user-owned boundary remains, stop grilling and proceed with the requested summary or delivery.

Treat every earlier recommendation, proposal, working assumption, or draft as unresolved until the user clearly accepts it. A request such as “先设计” authorizes the interview, not a full design written on the user's behalf.

If the previous turn made an unconfirmed recommendation, keep the next question on that recommendation. Do not advance to its downstream consequences until the user accepts, rejects, or changes it.

In a grill turn, do not output a design draft, acceptance criteria, a multi-bullet decision list, or numbered alternatives. State one recommendation for the one current question. If the user rejects it or asks for alternatives, explore the next credible path in the following turn.

## Inspect Before Asking

Inspect project guidance, relevant code and tests, user-visible behavior, public API/schema/config documentation, and directly related Issue or PR history before asking questions they can answer.

Stop the initial investigation once there is enough evidence to explain the current problem, distinguish facts from assumptions, and identify the unresolved material boundaries. Do not precompute a blueprint, fixed file list, private interface design, or test matrix before alignment.

## Grill The Missing Boundaries

The user owns observable outcomes, scope and non-goals, public contracts, material cost and risk, irreversible choices, and authorization. The agent owns local, cheap-to-reverse implementation details such as files, private helpers and interfaces, algorithms, work order, and test technique.

Treat an internal architecture choice as material only when it creates a durable subsystem, runtime, deployment, storage, or data-ownership boundary; establishes a shared contract across modules or teams; adopts a long-lived production dependency; or would be costly to reverse after adoption. Do not escalate a local signature or replaceable abstraction merely because it is called architecture.

Maintain a working understanding of the current problem, desired observable behavior, scope/non-goals, relevant public contracts, material risks and costs, authorization, validation expectations, and stop conditions. Cover only what matters to this task; do not turn these topics into a checklist.

After each answer, update the working understanding, inspect newly named evidence when useful, and choose the next highest-leverage unresolved branch. Keep the turn centered on that branch; do not settle downstream material decisions in advance or hide several decisions inside one recommendation. Resolve observable product and state semantics before interface syntax or compatibility mechanics unless the interface itself is the unresolved product contract.

Walk dependent decisions one branch at a time until reaching shared understanding. Be relentless about unresolved boundaries, not about filling fields. Revisit an earlier branch when new evidence invalidates it, and stop when no material user-owned question remains.

Lead with the current judgment and evidence. Do not manufacture alternatives, force symmetry, use a routine A/B/C template, or append a ritual counterargument.

Prefer a turn shaped like: “The unresolved boundary is X. I recommend Y because Z. Should it behave that way?”

Object when evidence shows a real contradiction, excessive complexity, poor value for cost, or ignored risk. State the consequence where it matters. If the user understands and accepts an ordinary product tradeoff, proceed; still stop for safety, law, permission, factual impossibility, unverifiable completion, or missing irreversible authorization.

Do not ask the user to choose reversible implementation mechanics. Treat a boundary as resolved by an explicit decision, a clearly stated repository-derived assumption the user has not disputed, or an explicit not-applicable conclusion. Accept concise confirmation when the immediately preceding question makes its scope unambiguous; clarify only when multiple reasonable interpretations remain.

## Persist Decisions Worth Keeping

Use the smallest durable record justified by repository conventions and coordination needs. Prefer an Issue for high-risk, long-running, cross-session, or collaborative work whose decisions need a canonical home; a normal PR may carry ordinary delivery rationale and evidence; a tiny local change may rely on its commit. Materiality alone does not authorize hosted mutation or force creation of an Issue.

Do not create repository decision Markdown unless the document itself is requested as a deliverable. Before creating or updating hosted state, require explicit authorization for that mutation and read [references/issue-persistence.md](references/issue-persistence.md) in full.

Keep a persisted `Decision Record` concise and current: observable outcome, scope/non-goals, confirmed material decisions with short rationale, accepted material cost/risk, and relevant stop or reopen conditions. Include an unchosen alternative only when it explains a non-obvious boundary or prevents repeated debate. Exclude blueprints, fixed file lists, local interfaces, test matrices, agent assignments, and full transcripts.

If the repository uses decision revisions, increment one only after a confirmed material decision changes. Treat comments as history and evidence, not as a way to add current obligations without updating the canonical record. Follow repository conventions for Issue linkage and lifecycle rather than mutating hosted state by formula.

When creating or updating a delivery PR/MR or preparing an external handoff, read [references/delivery-evidence.md](references/delivery-evidence.md) in full. For historical context, start from the user-provided Issue/PR or affected code, then follow code to commit, commit to PR/MR, PR/MR to Decision Issue, and any `supersedes` link. Use narrow search only when no direct entry point exists.

## Deliver Adaptively

Before the first source write, briefly make the completion basis, hard constraints, smallest credible approach, validation direction, and real stop conditions legible. For a small local task, a sentence is enough. Do not derive or seek approval for a detailed blueprint.

Treat the user's direct implementation request as launch authorization when the stated boundary still matches it. Wait only when implementation would introduce an unresolved material commitment, the user explicitly asked to approve the design before coding, or required external or irreversible authorization is missing.

Within the authorized boundary, change files, private interfaces, algorithms, work order, and test technique without asking for approval. Report a meaningful replan only when it helps the user; mark it as non-blocking when no reply is needed.

Pause when continuing would change the observable outcome, violate a hard constraint, create a new material boundary, exceed an accepted cost or risk, require missing authorization, or make promised validation unattainable. Explain the delta, recommend the smallest credible response, and mention alternatives only when they are genuinely viable. Do not reopen already settled decisions or grill the full history again.

Validate against the current decisions, final diff, actual risks, and relevant regressions. Earlier working ideas, rejected options, and speculative tests add no obligation.

Require an independent `$power-check` when the user asks for it, when the implementation materially affects security, privacy, permissions, persistent state, migration, compatibility, concurrency, or irreversible behavior, when preparing an important merge/release/handoff, when material drift occurred, or when the current Decision Record requires it. Use a fresh non-implementation context when independence matters; if that cannot be provided, return `CHECK_REQUIRED` with the decision source and final implementation entry point.

Finish naturally: for discussion-only work, summarize the decisions and unresolved material questions; for delivery, report the outcome, material deviations, validation evidence, and any required independent check.
