---
name: power-work-report
description: Generate a manual Codex daily work report, collect an optional personal memo, review reusable insights, and separately confirm report finalization or persistent Codex instruction changes.
---

# Power Work Report

## Overview

Generate a local daily work report from Codex session history.

This skill uses the bundled `scripts/power-work-report` Node CLI. Generate a draft first, show the user where to review it, and only finalize after explicit user confirmation.

V1 is Codex-only and local-only. It reads local Codex rollout JSONL files, reads existing JSON memory and up to 10 readable finalized reports, generates JSON/Markdown/HTML reports plus `review.md`, proposes todo and idea memory updates, and merges those updates only during `finalize`.

Daily collection is based on event timestamps mapped to the user's local date, not only the rollout file's directory date. The default scan window is the target date plus the previous 30 days, so a long-running Codex session that started earlier can still contribute today's events.

The draft report also includes a reviewed personal reflection and evidence-backed Skill, automation, global-instruction, and project-instruction candidates. Skill and automation candidates are suggestions only. `review.md` is the primary confirmation surface; report Markdown remains the readable full report. HTML is a single-file responsive component report with navigation, project accordions, dark mode, print styles, and responsive print support.

## Boundaries

- Read only Codex session JSONL under `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` within the configured lookback window.
- Do not read `state_*.sqlite`.
- Do not support non-Codex agent logs, web UI, databases, vector stores, or remote APIs.
- Do not install or modify schedulers.
- Do not use root privileges.
- Do not finalize reports or update memory without explicit user confirmation.
- Do not treat report finalization as authorization to modify `AGENTS.md`.
- Do not create or install a Skill, script, hook, automation, scheduler, cron job, or systemd unit from an insight candidate.
- Do not use a `codex_failed` fallback report as actionable insight or instruction evidence.
- Do not auto-close historical todos. Completion candidates in `review.md` are advisory until the user confirms them.

## Workflow

1. Pick the target date. If the user does not provide one, use today's local date.
2. Run the CLI in draft mode:

   ```bash
   node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" run --date YYYY-MM-DD --lang zh-CN --timezone Asia/Shanghai
   ```

   Draft generation defaults to `gpt-5.6-luna` Medium in an isolated read-only Codex run. Use `--model` and `--reasoning-effort` only when the user explicitly requests an override. Do not add an automatic model retry or escalation.

3. Report the generated draft paths:
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/review.md`
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/report.md`
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/report.html`
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/report.json`
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/memory-update.proposed.json`
4. Immediately after the initial draft, always pause at the fixed **personal memo checkpoint**. Ask whether the user wants to add thoughts, reflections, omissions, or a memo that session history did not capture. The user may explicitly say `skip`; skipping must not block review or finalization.
5. If the user provides a memo, first agree on the wording that may appear in the report. Save the reviewed memo as `~/.codex/daily-reports/YYYY-MM-DD/draft/personal-memo.json` using this shape (plain text is also accepted):

   ```json
   {"status":"provided","summary":"Reviewed wording","provenance":"user_memo"}
   ```

   Then regenerate the draft with `run` (or its `draft` alias) and `--memo-file`:

   ```bash
   node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" run --date YYYY-MM-DD --lang zh-CN --timezone Asia/Shanghai --memo-file ~/.codex/daily-reports/YYYY-MM-DD/draft/personal-memo.json
   ```

   Do not silently copy sensitive raw wording into the report. Re-open the regenerated `review.md` before continuing. If the user skips, keep the initial draft and continue without regeneration.
6. Read and summarize `review.md` first. Cover these sections:
   - 今天完成了什么
   - 可能完成的历史待办
   - 新增待办
   - 保留待办
   - 新想法
   - 个人补充与反思
   - Skill 候选
   - 自动化候选
   - 全局 Codex 指令候选
   - 项目 Codex 指令候选
   - 洞察警告
   - finalize 前必须确认
7. Ask the user to confirm or provide oral edits for reflection wording, todos, completion candidates, ideas, and insight candidates. Review each candidate's explicit `conflict`, `nestedScope`, `scopePath`, and `safetyReasons` signals. If conflict or nested-scope signals are present, pause for human scope/rule resolution instead of offering `instruction-plan`. These fields carry explicit or detected safety signals; they do not prove automatic semantic understanding of every possible conflict.
8. If the user gives edits, update the draft JSON/proposal files, especially `memory-update.proposed.json`.
   - Keep unconfirmed historical completion candidates in `review`, not `todoUpdates`.
   - Add confirmed completions to `todoUpdates` with `status: "done"` and enough identity to match the memory todo (`id`, or `text` plus `project`).
   - Remove or rewrite proposed new todos/ideas only when the user asks.
   - Re-render affected Markdown/HTML/review files before asking again for final confirmation:

     ```bash
     node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" render --date YYYY-MM-DD
     ```
9. Review the full report Markdown order before finalization:
   - 今日概览
   - 关键成果
   - 关键决策
   - 明日优先
   - 后续待办
   - 项目进展
   - 风险与阻塞
   - 想法与灵感
   - 个人补充与反思
   - 复用洞察（Skill、自动化、全局指令、项目指令、警告）
   - 附录：证据索引
10. Treat Skill and automation candidates as recommendations only. Explain the evidence, scope, rationale, and expected benefit, but do not create, install, or run anything from them.
11. For a global or project Codex instruction candidate, use a separate two-confirmation workflow:
    - First confirmation: after resolving any explicit conflict or nested-scope signal, the user selects exactly one candidate and action (`add`, managed `update`, or managed `remove`). Run:

      ```bash
      node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" instruction-plan --date YYYY-MM-DD --candidate-id ID --action add|update|remove [--project-root DIR] [--codex-home DIR] [--out-dir DIR]
      ```

      This reads the actual target `AGENTS.md`, writes `draft/instruction-change.proposed.json` and `draft/instruction-change.diff`, and does not write the target file. The proposal's `candidateSnapshot` binds the candidate's recommendation, full evidence, rationale, benefit, provenance, status, and safety/scope signals through the second gate. Explicit conflict or nested-scope signals produce typed `conflict` or `nested_scope` refusal instead of a writable proposal.
    - Show the exact target, managed entry identity, source report, and the complete `draft/instruction-change.diff`.
    - Second confirmation: ask whether to apply that exact displayed diff. Only after explicit confirmation, run:

      ```bash
      node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" instruction-apply --date YYYY-MM-DD [--codex-home DIR] [--out-dir DIR]
      ```

      `instruction-apply` is successful only after the instruction audit is atomically persisted in memory. The target write uses compare-and-commit and never overwrites concurrent target bytes. Memory audit persistence also uses compare-and-commit: if memory changed concurrently, the concurrent memory is preserved, audit persistence fails, the instruction target is rolled back to its exact prior bytes or absence, and no success is claimed. Review current target/memory state, create a fresh plan, and repeat both confirmations. A successful apply requires a new Codex session for normal discovery.
    - If the target, source candidate snapshot, or memory drifts, discard the old confirmation, review current state, regenerate the plan/diff, and ask for both relevant confirmations again. Never apply a stale proposal.
    - Revision and removal of report-managed entries use the same plan, exact-diff review, and separate apply confirmation. Never rewrite content outside the managed region.
12. Pause and explain the specific refusal when planning or applying reports `ambiguous_target`, `nested_scope`, `override_present`, `conflict`, `size_limit`, `permission_denied`, `codex_failed`, `forbidden_content`, `target_drift`, proposal/candidate integrity failure, or atomic-write failure. Report concurrent memory compare-and-commit failure through `audit_persistence_failed` as rolled back: concurrent memory was preserved, the target was restored, and the apply did not succeed. `rollback_failed` is a hard pause requiring inspection of the target and recorded error evidence; never retry automatically or claim success. Do not guess a target, override human rules, or claim a partial write succeeded.
13. Finalization is an independent authorization. The user may finalize without approving any instruction candidate, or plan/apply an instruction without authorizing finalization. Only after explicit report confirmation, run:

   ```bash
   node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" finalize --date YYYY-MM-DD
   ```

14. Report the final paths and memory file path. For an applied instruction, separately report its target path, managed entry identity, action, and source report. Explain that Codex rebuilds its instruction chain when a new run or TUI session starts: global instructions are discovered from the active `CODEX_HOME`, while project instructions are discovered only within the corresponding project scope. Do not claim the current session dynamically reloaded the change.

## Failure Handling

If Codex draft generation fails, the CLI writes a fallback draft with status `codex_failed`. It may show warnings but must contain no actionable reusable or instruction candidates. Do not finalize fallback drafts unless the user explicitly asks to allow fallback finalization, then pass `--allow-fallback`.

If instruction audit persistence fails after a target write, success depends on rollback. This includes concurrent memory changes detected by memory compare-and-commit: preserve the concurrent memory, roll the instruction target back, and require fresh review/planning/confirmation. `audit_persistence_failed` means rollback restored the exact prior target bytes or absence. `rollback_failed` means the final target state requires human inspection using the error evidence; pause without automatic retry.

## Privacy

Reports and personal memos may contain local project paths, thread content, commands, todos, ideas, and private reflections. Use reviewed memo wording in the report and remind the user to inspect every generated file before sharing it.
