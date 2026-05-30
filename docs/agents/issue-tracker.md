# Issue Tracker: GitHub

Issues, PRDs, and implementation tickets for this repo live in GitHub Issues.
Use the `gh` CLI for issue operations.

## Repository

- GitHub repository: `luizomf/sshtoolkit`
- Remote: `https://github.com/luizomf/sshtoolkit`
- Run `gh` commands from the repo root so the CLI can infer the repository.

## Common Commands

- Create an issue: `gh issue create --title "..." --body "..."`
- Read an issue: `gh issue view <number> --comments`
- List open issues: `gh issue list --state open`
- Comment on an issue: `gh issue comment <number> --body "..."`
- Apply a label: `gh issue edit <number> --add-label "..."`
- Remove a label: `gh issue edit <number> --remove-label "..."`
- Close an issue: `gh issue close <number> --comment "..."`

Use heredocs or temporary files for multi-line issue bodies and comments.

## Publishing Work Items

When a skill says "publish to the issue tracker", create a GitHub issue.

When a skill says "fetch the relevant ticket", run
`gh issue view <number> --comments`.

## Workflow

Follow the repo workflow from `AGENTS.md`: issue, branch, small conventional
commits, PR, merge. Reference the issue from the PR body so GitHub can close it
automatically.
