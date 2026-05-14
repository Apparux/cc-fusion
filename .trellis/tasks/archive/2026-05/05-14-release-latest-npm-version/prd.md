# Release Latest npm Version

## Goal

Publish the latest cc-fusion changes to npm as a patch release so users can install the brick dirty git icon update.

## Requirements

* Release from `main`, which already contains the latest `🧱` dirty git icon change.
* Bump package version from `1.3.1` to `1.3.2`.
* Build and package-verify before tagging.
* Commit the version bump.
* Push `main` and create/push tag `v1.3.2` to trigger the npm publish workflow.
* Monitor the GitHub Actions npm publish workflow and stop if it fails.
* Verify npm reports `cc-fusion@1.3.2` after the workflow succeeds.
* Create a GitHub Release for `v1.3.2` after npm publish is verified.

## Acceptance Criteria

* [ ] `package.json` and `package-lock.json` are bumped to `1.3.2`.
* [ ] `npm run build` passes.
* [ ] `npm pack --dry-run` passes.
* [ ] Version bump commit is pushed to `main`.
* [ ] Tag `v1.3.2` is pushed.
* [ ] npm publish workflow succeeds.
* [ ] `npm view cc-fusion version` reports `1.3.2`.
* [ ] GitHub Release `v1.3.2` exists.

## Definition of Done

* All release verification steps pass.
* The release is visible on npm and GitHub Releases.
* Trellis task is archived and journaled after the release work commit.
* Git working tree is clean at the end.

## Technical Approach

Use the project release flow from `CLAUDE.md`: `npm version patch --no-git-tag-version`, build, pack dry-run, commit, push `main`, create annotated tag `v1.3.2`, push the tag, monitor `.github/workflows/npm-publish.yml`, verify npm, and create the GitHub Release.

## Decision (ADR-lite)

**Context**: The latest feature is already merged into `main`, and the published npm version is still `1.3.1`.
**Decision**: Publish a patch release `1.3.2` from `main`.
**Consequences**: Users receive the latest statusline icon change without introducing a minor-version signal; release depends on GitHub Actions and `NPM_TOKEN` availability.

## Out of Scope

* Additional code/UI changes.
* npm prerelease or minor release.
* Changing the publish workflow.
* Force pushing or bypassing failed checks.

## Technical Notes

* Current branch: `main`.
* Current local package version: `1.3.1`.
* Current published npm version: `1.3.1`.
* Publish workflow triggers on pushed tags matching `v*.*.*`.
