# GitLab Issue Creation

Use this reference only after the user explicitly confirms that power-grill should create a GitLab issue.

Do not create a GitLab issue by default.

Before running `glab`, inspect project guidance such as `AGENTS.md`, `README.md`, and `git remote -v` for canonical GitLab host rules. Project-specific instructions override generic examples.

Important host rule:

- If project guidance says to pass a full repository URL with `glab -R`, always use the full URL.
- Do not replace a required full URL with shorthand like `group/project`; older `glab` versions may resolve shorthand to `gitlab.com` instead of the intended self-hosted GitLab instance.

Recommended flow:

1. Check `glab auth status` when useful.
2. Identify the canonical repository argument from project guidance or remotes. If there are multiple remotes, conflicting host rules, or unclear guidance, stop and ask before creating the issue.
3. Write the reviewed issue body to a local file such as `.codex/power-grill/issue-brief.md`.
4. Create the issue using the project-required repository argument.

   Full URL example:

   ```bash
   glab issue create -R https://gitlab.example.com/group/project.git -t "<title>" -d "$(cat <body-file>)" -y
   ```

5. Return the issue number and URL.
6. Update the ready-to-run `/goal` so it references the real issue.

Do not create an MR during the pre-goal grilling phase unless the user explicitly asks and there is already an implementation branch to publish.
