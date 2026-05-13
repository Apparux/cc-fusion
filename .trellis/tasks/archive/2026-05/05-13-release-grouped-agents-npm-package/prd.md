# Release grouped agents npm package

## Goal

Merge the verified grouped-Agents statusline change from `dev` into `main`, publish it as a new npm release, and verify that npm and GitHub show the released version.

## Requirements

* Ensure the working tree is clean except Trellis task files before release operations.
* Merge the current verified `dev` changes into `main`.
* Bump `package.json` and `package-lock.json` from `1.2.1` to `1.3.0` because the change is a user-visible statusline feature.
* Run release verification before tagging: `npm run build`, targeted grouped-agent smoke test, `git diff --check`, and `npm pack --dry-run`.
* Commit the version bump and generated artifacts.
* Push `main`, create and push annotated tag `v1.3.0` to trigger `.github/workflows/npm-publish.yml`.
* Monitor the npm publish workflow and stop on failures.
* After the workflow succeeds, verify `npm view cc-fusion version` reports `1.3.0`.
* Create a GitHub Release for `v1.3.0` with summary and verification notes.
* Archive the Trellis task and record the session journal after release work is complete.

## Acceptance Criteria

* [x] `main` contains the grouped Agents change.
* [x] `package.json` and `package-lock.json` version are `1.3.0`.
* [x] Build, smoke test, whitespace check, and npm package dry run pass.
* [x] `v1.3.0` tag exists on the remote.
* [x] GitHub Actions npm publish workflow for `v1.3.0` succeeds.
* [x] `npm view cc-fusion version` returns `1.3.0`.
* [x] GitHub Release `v1.3.0` exists.
* [ ] Final working tree is clean.

## Definition of Done

* Release commits and tag are pushed to the remote.
* npm registry and GitHub Release are verified.
* Trellis task is archived and session journal is recorded.
* Any blocker is reported rather than bypassed.

## Technical Approach

Follow the repository release flow from `CLAUDE.md`: merge into `main`, use `npm version minor --no-git-tag-version`, verify locally, commit, push `main`, push annotated `v1.3.0`, wait for npm publish workflow, verify npm, then create GitHub Release.

## Decision (ADR-lite)

**Context**: The grouped Agents display changes user-visible statusline behavior.
**Decision**: Release as minor version `1.3.0` rather than patch.
**Consequences**: Version communicates a small feature addition; workflow will publish via tag and requires GitHub Actions/npm token to succeed.

## Out of Scope

* Changing statusline behavior beyond the already verified grouped Agents feature.
* Editing npm workflow or repository secrets.
* Force-pushing, bypassing checks, or publishing manually if the workflow fails.

## Technical Notes

* Current branch before release planning: `dev`.
* Recent grouped-agent work commits on `dev`: `92944a2`, `3446229`, `c4d907b`.
* Current package version: `1.2.1`.
* Repository release workflow: `.github/workflows/npm-publish.yml` publishes when `v*.*.*` tag is pushed.
