# ohmypowers

Codex ecosystem skills for Loop Engineering.

`ohmypowers` is a collection of Codex skills and supporting tools that turn agentic coding work into explicit loops: clarify the task, contract the work, execute within boundaries, verify the evidence, and keep reviewable artifacts.

The repository is Codex-first. Skills are plain `SKILL.md` directories designed to be installed into Codex, with explicit custom-agent templates for cost-aware implementation workers, read-only reviewers, and critics.

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
- An issue draft for user review.
- A hosted issue or local issue brief after user confirmation.
- Reserved `Execution Blueprint` and `Agent Dispatch Plan` sections for later planning.
- Requirements-ready handoff guidance for running `power-loop` on the persisted contract.

It does not require exact internal interfaces, files, task ownership, validation commands, or subagent assignments. Those repository-derived implementation decisions belong to `power-loop`. It also does not implement code, generate bounded `/goal`, automatically execute `/goal`, or create hosted issues, PRs, or MRs by default. After the user reviews the generated issue body, it can create a hosted issue if the user explicitly confirms and a supported CLI such as `gh` or `glab` is available.

`power-loop` converts a requirements-ready persisted contract into a confirmed, cost-aware Codex implementation loop:

- Loop readiness check over a hosted issue, local brief, or pasted task contract.
- Risk level and execution decision.
- Repository inspection with source branch and commit baseline.
- Fixed-shape Execution Blueprint for exact files, internal interfaces, dependencies, ownership, isolation, test seams, validation commands, and staleness rules.
- Fixed-shape Agent Dispatch Plan with exact per-task Luna/Terra/Sol assignments, useful parallelism, allowed write paths, dependency waves, and one bounded implementation escalation; the issue does not repeat the static routing table.
- Exact Issue Patch display and explicit confirmation before updating only the execution-planning sections.
- Final Goal Prompt only after the confirmed patch is applied and verified; the user starts it manually.
- One task-level branch/worktree rather than one worktree per subagent.
- Contract-prescribed reviews or a minimum sufficient capability-based review plan, including an implementation-independent contract-conformance review.
- Final Dispatch Summary with model assignments, escalation evidence, parallelism, ownership conflicts, pause reasons, and Initial Assignment Accuracy.
- PR/MR evidence requirements and loop decision rules.

Loop Engineering here means wrapping a coding task so it is executable, verifiable, stoppable, reviewable, and handoff-ready within explicit boundaries. `power-loop` does not detect Ultra mode, clarify vague requirements deeply, implement code directly, mutate requirements, or automatically run `/goal`. Ultra is a recommended user-selected runtime, while the orchestration artifacts are generated for every loop-ready contract.

For an end-to-end walkthrough, see [docs/loop-engineering-tutorial.md](docs/loop-engineering-tutorial.md). It uses a small linear regression gradient descent optimizer task to demonstrate a lighter requirements contract, execution planning, patch confirmation, manual Goal execution, validation, dispatch reporting, and review.

`power-verifier` checks implementation evidence after a bounded loop has run:

- Issue contract, implementation diff, validation output, and PR/MR evidence.
- Acceptance-criteria coverage.
- Scope and non-goal preservation.
- Contract and Goal clause coverage, conflict handling, and evidence freshness against a stable implementation snapshot.
- Independent validation replay when safe, with reviewer provenance and capability/risk-based review selection.
- Loop decision justification.
- One verifier result: `PASS`, `PASS_WITH_NOTES`, `BLOCKED`, or `NEEDS_HUMAN`.

It is read-only and does not edit files, create branches, mutate issues, approve work, merge, or close PRs/MRs.
Repository installer, profile, and fixture checks described below validate this repository's distribution; they are not requirements imposed on target projects using the portable verifier.

`power-curator` manually curates Loop Engineering issue and PR lifecycle state:

- Reads issue bodies, PR/MR bodies, comments, labels, branches, and local git state.
- Treats issue body `Curation status` as canonical lifecycle context and comments as supplementary evidence.
- Produces a curation plan before any mutation.
- Applies issue body updates, comments, labels, closure, or follow-up issue creation only after explicit user confirmation.
- Uses simple optional labels: `agent-active`, `agent-done`, `agent-follow-up`, `agent-superseded`, and `agent-curation-needed`.

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

For implementation evidence correctness, use `power_verifier`. It is a portable, read-only contract-conformance workflow: exact reviewers are honored when the contract requires them; otherwise the minimum sufficient independent review capabilities are selected from the contract, final diff, validation, and material risks. The bundled `power_code_reviewer` is an optional code-review capability, not a universal requirement.

Use them by phase:

- `power-think`: vague idea -> reviewed spec.
- `power-grill`: coding task -> issue draft -> confirmed issue/local brief.
- `power-loop`: requirements-ready issue/local brief -> Blueprint and Dispatch Plan -> confirmed Issue Patch -> ready-to-run `/goal`.
- `power-verifier`: issue contract + diff + validation + PR evidence -> verifier result.
- `power-curator`: issue/PR/comment/branch state -> curation plan -> confirmed lifecycle mutations.
- `power-work-report`: Codex session history -> draft daily report -> confirmed memory update.
- Recommended Loop Engineering flow: `power-grill -> power-loop plan and Issue Patch -> user confirmation -> manual Codex /goal -> contract-prescribed or minimum-sufficient capability/risk-based independent review -> PR evidence -> human review -> power-curator when lifecycle state needs curation`.
- `power-critic`: spec, plan, issue, or model reply -> critique findings.

## Install

Run the idempotent installer from the repository root:

```bash
./scripts/install.sh
```

The installer uses `${CODEX_HOME:-$HOME/.codex}`, synchronizes the seven managed skill directories without creating nested copies, and updates only the custom-agent files owned by this repository. It requires `rsync` and preserves unrelated personal agents.

The skill installation makes `$power-think`, `$power-grill`, `$power-loop`, `$power-verifier`, `$power-curator`, `$power-work-report`, and `$power-critic` available.

The worker profiles pin Luna Medium, Terra Medium, Terra High, and the Sol Medium implementation escalation ceiling. The bundled reviewer profiles provide optional Sol High read-only code-review and evidence-verification capabilities. The verifier does not require a fixed profile count, agent name, model, provider, or review topology unless the contract specifies one. The critic custom-agent installation remains independent from implementation review.

When checking implementation evidence, provide the complete canonical Issue or local contract and final Goal Prompt, capture a stable implementation snapshot, replay safe validation, and record review provenance. Use contract-prescribed reviewers exactly; otherwise select the minimum sufficient independent capabilities and add code, security, compatibility, migration, test, or domain review only when justified by the implementation risk.

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
Use $power-loop on this issue to generate the Blueprint, Dispatch Plan, and Issue Patch. Show the patch for confirmation before generating the Goal Prompt.
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
    power-terra-worker.toml
    power-terra-complex-worker.toml
    power-sol-escalation.toml
    power-code-reviewer.toml
  assets/
    execution-blueprint.md
    agent-dispatch-plan.md
    issue-patch.md
    codex-loop-goal.txt
    loop-readiness-checklist.md
    pr-evidence-template.md
power-verifier/
  SKILL.md
  agents/
    openai.yaml
    power-verifier.toml
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
