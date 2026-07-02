---
name: power-work-report
description: Generate a manual Codex daily work report draft, review it with the user, and finalize confirmed reports and memory updates.
---

# Power Work Report

## Overview

Generate a local daily work report from Codex session history.

This skill is a manual workflow wrapper around the `tools/power-work-report` Node CLI. It should generate a draft first, show the user where to review it, and only finalize after explicit user confirmation.

V1 is Codex-only and local-only. It reads local Codex rollout JSONL files, generates JSON/Markdown/HTML reports, proposes todo and idea memory updates, and merges those updates only during `finalize`.

The draft report uses the component-style Codex daily report structure: metadata, overview, outcomes, decisions, tomorrow priorities, backlog, project sections, risk groups, idea chips, and appendix evidence. Markdown is the readable source of review; HTML is a single-file responsive component report with navigation, project accordions, dark mode, print styles, and responsive print support.

## Boundaries

- Read only Codex session JSONL under `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`.
- Do not read `state_*.sqlite`.
- Do not support Claude, Cursor, Copilot, generic agent logs, web UI, databases, vector stores, or remote APIs.
- Do not install or modify schedulers.
- Do not use root privileges.
- Do not finalize reports or update memory without explicit user confirmation.

## Workflow

1. Pick the target date. If the user does not provide one, use today's local date.
2. Run the CLI in draft mode:

   ```bash
   node tools/power-work-report/bin/power-work-report.js run --date YYYY-MM-DD --lang zh-CN
   ```

3. Report the generated draft paths:
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/report.md`
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/report.html`
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/report.json`
   - `~/.codex/daily-reports/YYYY-MM-DD/draft/memory-update.proposed.json`
4. Review the Markdown order before asking for finalization:
   - 今日概览
   - 关键成果
   - 关键决策
   - 明日优先
   - 后续待办
   - 项目进展
   - 风险与阻塞
   - 想法与灵感
   - 附录：证据索引
5. Ask the user to review the draft and confirm whether to finalize.
6. Only after confirmation, run:

   ```bash
   node tools/power-work-report/bin/power-work-report.js finalize --date YYYY-MM-DD
   ```

7. Report the final paths and memory file path.

## Failure Handling

If Codex draft generation fails, the CLI writes a fallback draft with status `codex_failed`. Do not finalize fallback drafts unless the user explicitly asks to allow fallback finalization, then pass `--allow-fallback`.

## Privacy

Reports may contain local project paths, thread content, commands, todos, and ideas from Codex session history. Remind the user to review generated files before sharing them.
