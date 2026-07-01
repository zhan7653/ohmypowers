---
name: power-work-report
description: Align with the user first, then generate a final Markdown Codex daily work report and memory updates.
---

# Power Work Report

## Overview

Generate a local daily work report from Codex session history.

This skill is a manual workflow wrapper around the `tools/power-work-report` Node CLI. It must align report intent with the user before generating output.

V1 is Codex-only and local-only. It reads local Codex rollout JSONL files, generates a final Markdown report, proposes 待办事项 and idea memory updates, and merges those updates into `memory.json` when the user has confirmed the report intent.

Reports treat `待办事项` as a first-class daily review section. Draft generation should include open 待办事项 from `memory.json` as carryover context and separate inherited, newly discovered, and possibly completed 待办事项 for review.

## Boundaries

- Read only Codex session JSONL under `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`.
- Do not read `state_*.sqlite`.
- Do not support Claude, Cursor, Copilot, generic agent logs, web UI, databases, vector stores, or remote APIs.
- Do not install or modify schedulers.
- Do not use root privileges.
- Do not generate the final report or update memory before aligning the report intent with the user.
- Do not generate HTML in this version; HTML rendering belongs to a later version.

## Workflow

1. Pick the target date. If the user does not provide one, use today's local date.
2. Before running the CLI, ask the user to confirm:
   - today's reporting focus;
   - whether any projects, topics, or sensitive details should be excluded;
   - whether inherited 待办事项 should be included in the report.
3. Restate the confirmed report intent and wait for the user to confirm.
4. After confirmation, run:

   ```bash
   node tools/power-work-report/bin/power-work-report.js run --date YYYY-MM-DD --lang zh-CN
   ```

5. Report the final paths:
   - `~/.codex/daily-reports/YYYY-MM-DD/report.md`
   - `~/.codex/daily-reports/memory.json`

## Failure Handling

If Codex draft generation fails, the CLI writes an internal fallback draft with status `codex_failed` and refuses to write the final Markdown report unless the user explicitly asks to allow fallback finalization, then pass `--allow-fallback`.

If the final Markdown report already exists, the CLI refuses to overwrite it unless the user explicitly confirms overwrite, then pass `--force`.

## Privacy

Reports may contain local project paths, thread content, commands, 待办事项, and ideas from Codex session history. Remind the user to review generated files before sharing them.
