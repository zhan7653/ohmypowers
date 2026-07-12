# ohmypowers

Codex ecosystem skills for Loop Engineering.

`ohmypowers` is a collection of Codex skills and supporting tools that turn agentic coding work into explicit loops: clarify the task, contract the work, execute within boundaries, verify the evidence, and keep reviewable artifacts.

The repository is Codex-first. Skills are plain `SKILL.md` directories designed to be installed into Codex. It includes custom-agent templates for hosts that can select them, plus generic role-based delegation for hosts where subagents inherit the parent configuration.

## What It Does

`power-think` guides an agent through:

- Project context gathering.
- Requirement clarification.
- Scope boundary definition.
- Premise challenge.
- Optional landscape research.
- Alternative approaches.
- Given/When/Then acceptance criteria.
- A reviewed spec saved to `docs/specs/YYYY-MM-DD-<feature-name>-spec.md`.

It does not write implementation code or implementation plans.

`power-grill` turns a clarified or half-clear coding task into a requirements-focused contract before implementation starts:

- Requirement-fact inspection before asking the user, without precomputing implementation files or commands.
- A fast path that maps an existing reviewed `power-think` spec and asks only for missing contract fields.
- Focused grill-style questions over behavior, scope, external contracts, risks, validation expectations, and stop conditions.
- A `LIGHT` / `STANDARD` / `HIGH` delivery-lane decision and a split gate that separates independently valuable ordinary work from persistent, permission-sensitive, migratory, concurrent, destructive, or irreversible boundaries.
- Explicit safety-guarantee choices instead of deriving strong transaction, audit, rollback, concurrency, or recovery requirements from a broad word such as “safe”.
- An issue draft for user review.
- A hosted issue or local issue brief after user confirmation.
- Reserved compact `Execution Blueprint` and `Agent Dispatch Plan` reference sections for later planning.
- Requirements-ready handoff guidance for running `power-loop` on the persisted contract.

It does not require exact internal interfaces, files, task ownership, validation commands, or subagent assignments. Those repository-derived implementation decisions belong to `power-loop`. It also does not implement code, generate bounded `/goal`, automatically execute `/goal`, or create hosted issues, PRs, or MRs by default. After the user reviews the generated issue body, it can create a hosted issue if the user explicitly confirms and a supported CLI such as `gh` or `glab` is available.

`power-loop` converts a requirements-ready persisted contract into a confirmed Codex implementation loop:

- Low-cost inspection of the exposed subagent-spawn contract. Conclusive schema evidence avoids a probe spawn and produces one of `strict-selection-supported`, `inherited-model-only`, or `indeterminate`.
- A reported capability conclusion, supporting evidence, uncertainty, recommended execution mode, and mandatory user confirmation before mode-specific planning.
- Loop readiness check over a hosted issue, local brief, or pasted task contract after execution-mode confirmation.
- Confirmed delivery lane, split decision, residual risk level, and execution decision.
- Repository inspection with source branch and commit baseline.
- A confirmed delivery-lane and split gate before repository-aware planning; separable high-risk mutation boundaries return to contract clarification instead of being silently bundled.
- A separately persisted, non-normative fixed-shape Execution Blueprint for exact files, internal interfaces, dependencies, ownership, instruction/isolation boundaries with provenance, test seams, validation commands, and staleness rules.
- Exactly one separately persisted, non-normative Agent Dispatch Plan template for the confirmed mode: `strict-model-routing` preserves selectable Luna/Sol/Terra profiles and their routing policy, while `inherited-model-routing` assigns roles, objectives, ownership, dependencies, deliverables, and parallelism without claiming per-agent model, reasoning, profile, sandbox, escalation, or model-cost control.
- A short decision summary plus exact compact reference patch; the full planning artifacts are not copied into the Issue body.
- Exact contract identity: host revision metadata is provenance, while SHA-256 of the exact full persisted UTF-8 body is authoritative. The Task Contract digest covers exact bytes from document start to the byte before the Blueprint start marker.
- Final Goal Prompt only after the confirmed planning artifacts and compact reference patch are applied and verified. It is a thin launcher that pins the Issue and Task Contract identities plus planning-artifact digests, performs preflight/drift checks, and adds no requirement; the user starts it manually.
- One task-level branch/worktree rather than one worktree per subagent.
- Contract-prescribed reviews or a minimum sufficient capability-based review plan, including an implementation-independent contract-conformance review.
- Mode-accurate capability, dispatch, review, and PR/MR evidence. In inherited mode, fresh context can establish implementation independence, but an instruction-level no-write boundary is not described as host-enforced read-only isolation.
- PR/MR evidence requirements and loop decision rules.

Loop Engineering here means wrapping a coding task so it is executable, verifiable, stoppable, reviewable, and handoff-ready within explicit boundaries. `power-loop` does not detect Ultra mode, clarify vague requirements deeply, implement code directly, mutate requirements, or automatically run `/goal`. Ultra is a recommended user-selected runtime. Execution-mode selection instead depends on visible spawn capabilities and explicit user confirmation. If capability evidence is incomplete or contradictory, or if inherited routing cannot satisfy an exact model, profile, provider, reasoning, sandbox, or isolation requirement, planning pauses for a human decision.

For an end-to-end walkthrough, see [docs/loop-engineering-tutorial.md](docs/loop-engineering-tutorial.md). It uses a small linear regression gradient descent optimizer task to demonstrate a lighter requirements contract, execution planning, patch confirmation, manual Goal execution, validation, dispatch reporting, and review.

`power-verifier` checks implementation evidence after a bounded loop has run:

- The exact pinned Task Contract byte range as the sole normative contract. The complete Issue identifies the persisted container and lifecycle state; planning artifacts, Goal, session, PR/MR text, comments, and runner summaries remain supplementary evidence.
- Issue contract, implementation diff, validation output, and PR/MR evidence.
- Acceptance-criteria coverage.
- Scope and non-goal preservation.
- Contract clause coverage and evidence freshness against a snapshot containing repository/ref, commit, Git tree digest, dirty/generated boundary, and capture time.
- Independent validation replay when safe, with reviewer provenance and capability/risk-based review selection.
- Loop decision justification.
- One verifier result: `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, or `NEEDS_HUMAN`.

It is read-only and does not edit files, create branches, mutate issues, approve work, merge, or close PRs/MRs.
Repository installer, profile, and fixture checks described below validate this repository's distribution; they are not requirements imposed on target projects using the portable verifier.

`power-curator` manually curates Loop Engineering issue and PR lifecycle state:

- Reads issue bodies, PR/MR bodies, comments, labels, branches, and local git state.
- Treats issue body `Curation status` as canonical lifecycle context and comments as supplementary evidence.
- Produces a curation plan before any mutation.
- Compares the verifier snapshot with the final PR/merge snapshot. Equal Git tree digests are reusable even across different commits; changed trees are classified as `reverified`, `human-waived`, `contract-changing`, or `unresolved` before closure.
- Records changed paths, behavior impact, validation coverage, and any complete human waiver without presenting the old PASS as verifier coverage of the final tree. Contract-level changes return to `power-grill` and `power-loop`.
- Applies issue body updates, comments, labels, closure, or follow-up issue creation only after explicit user confirmation.
- Persists only `open`, `in-progress`, `pr-ready`, `merged`, `done`, `superseded`, or `follow-up-needed`. Runtime/verifier outcomes and freshness classifications are not persisted lifecycle states. Labels are optional, non-normative presentation aids.

It does not run as a daemon, scheduler, webhook, database, persistent index, or auto-close service, and it does not replace `power-verifier` for implementation evidence review.

`power-work-report` generates a manual Codex daily work report:

- Reads local Codex session JSONL for a target local date, scanning a lookback window so cross-day Codex sessions can still be sliced by event timestamp.
- Generates a draft Markdown/HTML/JSON report and `review.md` through the CLI bundled inside the installed skill.
- Uses an isolated read-only Luna Medium Codex run by default, with explicit model/reasoning override flags and no automatic escalation.
- Reads JSON memory during draft so historical open todos roll forward.
- Proposes todo and idea memory updates, including explicitly confirmed todo status changes.
- Supports re-rendering edited draft JSON/proposal files before final confirmation.
- Requires explicit confirmation before finalizing reports or merging `memory.json`.
- V1 is Codex-only and does not include scheduler, systemd, cron, web UI, database, vector store, or generic agent-log support.

`power-critic` provides a read-only "找茬" pass over requirements, CLI interaction, specs, plans, or model replies. It builds a Critique Packet, uses a fresh critic subagent when available, and returns a prioritized batch report. It is not for code diff correctness review.

For implementation evidence correctness, use `power_verifier`. It is a portable, read-only contract-conformance workflow: exact reviewers are honored when the contract requires them; otherwise the minimum sufficient independent review capabilities are selected from the contract, final diff, validation, and material risks. In strict mode, selectable Terra High, Sol Medium, and Sol High reviewer profiles provide risk tiers for those capabilities. In inherited mode, verification records fresh-context independence and only the configuration or isolation provenance actually exposed by the host. Neither mode imposes a universal reviewer identity or topology.

Use them by phase:

- `power-think`: vague idea -> reviewed spec.
- `power-grill`: coding task -> issue draft -> confirmed issue/local brief.
- `power-loop`: requirements-ready Issue/local brief -> delivery/split gate -> separate Blueprint and Dispatch artifacts -> confirmed compact reference patch -> ready-to-run `/goal`.
- `power-verifier`: issue contract + diff + validation + PR evidence -> verifier result.
- `power-curator`: issue/PR/comment/branch state -> curation plan -> confirmed lifecycle mutations.
- `power-work-report`: Codex session history -> draft daily report -> confirmed memory update.
- Recommended Loop Engineering flow: `power-grill delivery/split decision -> power-loop capability preflight -> user confirms execution mode -> separate Blueprint and mode-specific Dispatch artifacts -> user confirms the decision summary and compact reference patch -> thin manual Codex /goal -> snapshot-bound verifier -> PR evidence -> power-curator final-tree reconciliation -> confirmed lifecycle mutation`.
- `power-critic`: spec, plan, issue, or model reply -> critique findings.

## Install

Run the idempotent installer from the repository root:

```bash
./scripts/install.sh
```

The installer uses `${CODEX_HOME:-$HOME/.codex}`, synchronizes the seven managed skill directories without creating nested copies, updates the custom-agent files owned by this repository, and removes only explicitly retired owned profile names. It requires `rsync` and preserves unrelated personal agents.

The skill installation makes `$power-think`, `$power-grill`, `$power-loop`, `$power-verifier`, `$power-curator`, `$power-work-report`, and `$power-critic` available.

On a host classified `strict-selection-supported`, a supported model selector or custom-profile selector is enough to recommend `strict-model-routing`. Model, profile, reasoning, and sandbox selection are still independent capabilities: each field or guarantee requires its own evidence and must not be inferred from another selector. When the required selectors are demonstrably supported, the template preserves the full installed profile policy: Luna Max for simple through lower-medium implementation, Sol Medium for anything more complex, at most one direct Luna-to-Sol replacement, no Terra implementation, and Terra High/Sol Medium/Sol High reviewer tiers selected by contract and risk. If a strict plan requires a configuration the host cannot select, planning pauses instead of fabricating that guarantee.

On a host classified `inherited-model-only`, the separate `inherited-model-routing` template records that subagent configuration is inherited. Installed TOML files do not prove they are selectable. The plan therefore makes no per-agent model, reasoning-effort, profile, sandbox, model-escalation, reviewer-tier, model-cost, or Initial Assignment Accuracy guarantee. It retains useful generic delegation, explicit ownership and dependencies, safe parallelism, and fresh-context independent review. Model selection and sandbox selection are evidenced independently in either mode.

When checking implementation evidence, provide the complete canonical Issue identity and body, exact Task Contract digest and boundary, referenced planning-artifact digests, and thin Goal as supplementary evidence. Extract normative clauses only from the Task Contract. Capture repository/ref, commit, Git tree digest, dirty/generated boundary, and capture time; replay safe validation and record review provenance. A verifier PASS covers only that tree. A different final tree requires fresh verification, a complete explicit human waiver, contract-change routing, or an unresolved stop. Use Task-Contract-prescribed reviewers exactly; otherwise select the minimum sufficient independent capabilities and add code, security, compatibility, migration, test, or domain review only when justified by the implementation risk.

Restart Codex after installing or updating skills or custom agents.

## Usage

Ask for requirement thinking or a spec:

```text
Use power-think to help me clarify this feature and write a spec.
```

Ask for a task contract before implementation:

```text
Use $power-grill to grill this feature and draft an issue contract.
```

Ask for repository-aware execution planning from an existing persisted task contract:

```text
Use $power-loop on this issue to confirm the delivery lane and split decision, generate separate Blueprint and Dispatch artifacts, and show the decision summary plus compact reference patch before generating the Goal Prompt.
```

Ask for independent critique:

```text
Use $power-critic to challenge this spec.
```

Ask for implementation verification:

```text
Use $power-verifier to check this issue contract, diff, validation output, and PR evidence.
```

Ask for issue and PR lifecycle curation:

```text
Use $power-curator to curate this issue, linked PRs, comments, and follow-up state.
```

Ask for a manual Codex work report draft:

```text
Use $power-work-report to generate a daily work report draft and review checklist for today.
```

## Repository Layout

```text
power-think/
  SKILL.md
  agents/
    openai.yaml
power-grill/
  SKILL.md
  agents/
    openai.yaml
  assets/
    issue-body.md
  references/
    github-issue-creation.md
    gitlab-issue-creation.md
power-loop/
  SKILL.md
  agents/
    openai.yaml
    power-luna-worker.toml
    power-sol-worker.toml
    power-terra-reviewer.toml
    power-sol-reviewer.toml
    power-sol-high-reviewer.toml
  assets/
    execution-blueprint.md
    agent-dispatch-plan.md
    agent-dispatch-plan-strict.md
    agent-dispatch-plan-inherited.md
    issue-patch.md
    codex-loop-goal.txt
    loop-readiness-checklist.md
    pr-evidence-template.md
power-verifier/
  SKILL.md
  agents/
    openai.yaml
  assets/
    implementation-verifier-checklist.md
    verifier-result-template.md
power-curator/
  SKILL.md
  agents/
    openai.yaml
power-work-report/
  SKILL.md
  agents/
    openai.yaml
  scripts/
    power-work-report/
      package.json
      bin/
      lib/
      schemas/
power-critic/
  SKILL.md
  agents/
    openai.yaml
    power-critic.toml
docs/
  loop-engineering-tutorial.md
  specs/
tests/
  install.test.js
  fixtures/power-loop/sample-contracts.md
  power-work-report/
```

## License

MIT
