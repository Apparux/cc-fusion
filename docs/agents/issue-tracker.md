# Issue tracker: GitHub

Issues and specs for this repo live in GitHub Issues for `Apparux/cc-fusion`.
Use the `gh` CLI for all operations.

## Conventions

- Create an issue: `gh issue create --title "..." --body "..."`.
  Use a heredoc for multi-line bodies.
- Read an issue: `gh issue view <number> --json number,title,body,labels,comments`.
- List issues: `gh issue list --state open --json number,title,body,labels,comments`.
  Use appropriate `--label` and `--state` filters.
- Comment: `gh issue comment <number> --body "..."`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."`
  or `--remove-label "..."`.
- Close: `gh issue close <number> --comment "..."`.
- Link a sub-issue: `gh issue create --parent <parent> ...`
  or `gh issue edit <parent> --add-sub-issue <child>` (`gh` 2.94+).
  Older `gh`: `gh api --method POST repos/{owner}/{repo}/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`.
  If sub-issues are unavailable, put `Part of #<parent>` at the top of the child body.

Infer the repository from `git remote -v`; `gh` does this automatically
inside this clone. Use `--repo Apparux/cc-fusion` when outside the clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares a number space across issues and PRs. A bare `#42` may be
either: resolve with `gh pr view 42`, then fall back to `gh issue view 42`.

## Skill instructions

- "Publish to the issue tracker": create a GitHub issue.
- "Fetch the relevant ticket": read the corresponding GitHub issue.

## Wayfinding operations

- Map: a single issue labelled `wayfinder:map`, holding Notes,
  Decisions-so-far, and Fog.
- Child ticket: a GitHub sub-issue of the map. If unavailable, use a task
  list in the map and `Part of #<map>` in the child.
  Labels: `wayfinder:research`, `wayfinder:prototype`,
  `wayfinder:grilling`, or `wayfinder:task`.
- Blocking: use native issue dependencies:
  `gh api --method POST repos/{owner}/{repo}/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.
  Get the database ID with `gh api repos/{owner}/{repo}/issues/<n> --jq .id`;
  do not use the issue number or node ID.
  If unavailable, use `Blocked by: #<n>, #<n>` at the top of the child body.
- Frontier: list the map's open children, excluding assigned tickets and
  tickets with open blockers. First eligible ticket in map order wins.
- Claim: `gh issue edit <n> --add-assignee @me`.
- Resolve: comment with the result, close the ticket, and append a result
  summary and link to the map's Decisions-so-far.
