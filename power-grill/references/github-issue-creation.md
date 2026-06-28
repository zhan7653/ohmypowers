# GitHub Issue Creation

Use this reference only after the user explicitly confirms that power-grill should create a GitHub issue.

Do not create a GitHub issue by default.

Recommended flow:

1. Check `gh auth status`.
2. Write the reviewed issue body to a local file such as `.codex/power-grill/issue-brief.md`.
3. Create the issue with:

   ```bash
   gh issue create --title "<title>" --body-file <path>
   ```

4. If optional labels are missing, retry without labels or ask the user.
5. Return the issue number and URL.
6. Update the ready-to-run `/goal` so it references the real issue.

Do not create a PR during the pre-goal grilling phase unless the user explicitly asks and there is already an implementation branch to publish.
