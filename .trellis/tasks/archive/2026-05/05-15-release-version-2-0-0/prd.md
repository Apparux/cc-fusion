# Release version 2.0.0

## Goal

Merge the verified `dev` branch into `main` and publish cc-fusion as version `2.0.0` through the existing GitHub Actions npm publish workflow.

## Requirements

- Start from a clean working tree and the migrated `origin` remote.
- Ensure `dev` is pushed and contains the latest verified work.
- Update local refs from `origin` before touching `main`.
- Switch to `main`, fast-forward or merge the current `dev` work into `main` without force-push.
- Bump `package.json` and `package-lock.json` to exactly `2.0.0`.
- Ensure `package-lock.json` is consistent with `package.json` before release.
- Run release verification locally: `npm test`, targeted stdin smoke test, `git diff --check`, and `npm pack --dry-run`.
- Commit the version bump/release metadata on `main`.
- Push `main` to `origin`.
- Create and push annotated tag `v2.0.0` to trigger `.github/workflows/npm-publish.yml`.
- Check the npm publish GitHub Actions workflow result.
- Confirm npm reports version `2.0.0` after workflow success.
- Create a GitHub Release for `v2.0.0` after npm publish succeeds.

## Acceptance Criteria

- [ ] `main` contains the latest `dev` changes including `17bc0ae` or equivalent merge history.
- [ ] `package.json` version is `2.0.0`.
- [ ] `package-lock.json` root package version is `2.0.0`.
- [ ] `npm test` passes.
- [ ] Targeted statusline smoke test passes.
- [ ] `git diff --check` passes.
- [ ] `npm pack --dry-run` passes.
- [ ] Release commit is pushed to `origin/main`.
- [ ] Annotated tag `v2.0.0` is pushed.
- [ ] GitHub Actions npm publish workflow succeeds for `v2.0.0`.
- [ ] `npm view cc-fusion version` reports `2.0.0`.
- [ ] GitHub Release `v2.0.0` exists.

## Definition of Done

- Local working tree is clean after release task bookkeeping.
- Release commit, task archive commit, and journal commit are recorded.
- No force push or bypassed verification.
- Any authentication, CI, npm, or GitHub Release blocker is reported instead of bypassed.

## Technical Approach

Use the repository's existing release flow from `CLAUDE.md`: version bump, local verification, push `main`, push `v*.*.*` tag, wait for npm publish workflow, confirm npm, then create the GitHub Release.

## Decision (ADR-lite)

**Context**: The user explicitly requested a major release `2.0.0` after merging `dev` into `main`.

**Decision**: Perform a direct `main` release using the existing tag-triggered npm publish workflow, not a separate PR.

**Consequences**: This is visible remote state and package publication. Do not force push or skip failures; stop on verification/publish blockers.

## Out of Scope

- Changing product/runtime behavior beyond required version metadata.
- Force pushing any branch or tag.
- Publishing manually with local `npm publish` unless the workflow fails and the user explicitly requests a different recovery path.
- Creating a release before npm publish succeeds.

## Technical Notes

- `.github/workflows/npm-publish.yml` publishes on tags matching `v*.*.*` and runs `npm ci`, `npm run build`, and `npm publish` with `NPM_TOKEN`.
- The migrated remote is `ssh://git@ssh.github.com:443/Apparux/cc-fusion.git`.
- `package-lock.json` currently needs to be kept consistent with `package.json` before release.
