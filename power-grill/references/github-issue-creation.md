# GitHub Issue Creation Or Update

Use this reference only after the user explicitly confirms that power-grill should create or update a GitHub issue.

Do not create or update a GitHub issue by default.

Recommended flow:

1. Check `gh auth status`.
2. Inspect project guidance such as `AGENTS.md`, `README.md`, issue templates, and `git remote -v` for canonical GitHub host or repository rules.
3. Identify the canonical repository argument. If there are multiple remotes, an enterprise host, or unclear guidance, stop and ask before creating or updating the issue.
4. Write the reviewed issue body to a local file such as `.codex/power-grill/issue-brief.md`.
5. For a new issue, create the issue with an explicit repository argument when one is known:

   ```bash
   gh issue create --repo <owner/repo> --title "<title>" --body-file <path>
   ```

   If project guidance requires a different host-aware form, follow the project guidance instead.

6. For an existing issue update, update only the confirmed issue body:

   ```bash
   gh issue edit <number-or-url> --repo <owner/repo> --body-file <path>
   ```

7. If optional labels are missing, retry without labels or ask the user.
8. Return the issue number and URL.
9. Tell the user to run `power-loop` on the issue URL when they want a bounded Codex `/goal`.

Do not create a PR during the issue-contract phase unless the user explicitly asks and there is already an implementation branch to publish.
