---
name: power-work-report
description: Generate a manual Codex daily work report draft, review it with the user, and finalize confirmed reports and memory updates.
---

# Power Work Report

## Overview

Generate a local daily work report from Codex session history.

This skill uses the bundled `scripts/power-work-report` Node CLI. Generate a draft first, show the user where to review it, and only finalize after explicit user confirmation.

V1 is Codex-only and local-only. It reads local Codex rollout JSONL files, reads existing JSON memory, generates JSON/Markdown/HTML reports plus `review.md`, proposes todo and idea memory updates, and merges those updates only during `finalize`.

Daily collection is based on event timestamps mapped to the user's local date, not only the rollout file's directory date. The default scan window is the target date plus the previous 30 days, so a long-running Codex session that started earlier can still contribute today's events.

The draft report uses the component-style Codex daily report structure: metadata, overview, outcomes, decisions, tomorrow priorities, backlog, project sections, risk groups, idea chips, and appendix evidence. `review.md` is the primary confirmation surface for memory-related review; report Markdown remains the readable full report. HTML is a single-file responsive component report with navigation, project accordions, dark mode, print styles, and responsive print support.

## Boundaries

- Read only Codex session JSONL under `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` within the configured lookback window.
- Do not read `state_*.sqlite`.
- Do not support non-Codex agent logs, web UI, databases, vector stores, or remote APIs.
- Do not install or modify schedulers.
- Do not use root privileges.
- Do not finalize reports or update memory without explicit user confirmation.
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
4. Read and summarize `review.md` first. Cover these sections:
   - 今天完成了什么
   - 可能完成的历史待办
   - 新增待办
   - 保留待办
   - 新想法
   - finalize 前必须确认
5. Ask the user to confirm or provide oral edits for todos, completion candidates, and ideas.
6. If the user gives edits, update the draft JSON/proposal files, especially `memory-update.proposed.json`.
   - Keep unconfirmed historical completion candidates in `review`, not `todoUpdates`.
   - Add confirmed completions to `todoUpdates` with `status: "done"` and enough identity to match the memory todo (`id`, or `text` plus `project`).
   - Remove or rewrite proposed new todos/ideas only when the user asks.
   - Re-render affected Markdown/HTML/review files before asking again for final confirmation:

     ```bash
     node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" render --date YYYY-MM-DD
     ```
7. Optionally review the full report Markdown order before finalization:
   - 今日概览
   - 关键成果
   - 关键决策
   - 明日优先
   - 后续待办
   - 项目进展
   - 风险与阻塞
   - 想法与灵感
   - 附录：证据索引
8. Only after explicit user confirmation, run:

   ```bash
   node "${CODEX_HOME:-$HOME/.codex}/skills/power-work-report/scripts/power-work-report/bin/power-work-report.js" finalize --date YYYY-MM-DD
   ```

9. Report the final paths and memory file path.

## Failure Handling

If Codex draft generation fails, the CLI writes a fallback draft with status `codex_failed`. Do not finalize fallback drafts unless the user explicitly asks to allow fallback finalization, then pass `--allow-fallback`.

## Privacy

Reports may contain local project paths, thread content, commands, todos, and ideas from Codex session history. Remind the user to review generated files before sharing them.
