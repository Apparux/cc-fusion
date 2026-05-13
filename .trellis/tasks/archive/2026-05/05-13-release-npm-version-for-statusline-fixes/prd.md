# release npm version for statusline fixes

## Goal

Publish the verified statusline fixes currently on `main` as a new npm patch release so users can install the corrected Context progress bar, task progress parsing, and first separator alignment behavior.

## Requirements

- Bump `cc-fusion` from `1.2.0` to `1.2.1` as a patch release.
- Update both `package.json` and `package-lock.json` version metadata consistently.
- Rebuild generated `dist/` output from source.
- Preview package contents before publishing.
- Commit the release version bump, push `main`, create and push annotated tag `v1.2.1`.
- Confirm the npm publish workflow succeeds.
- Confirm npm reports `cc-fusion@1.2.1`.
- Create a GitHub Release for `v1.2.1` with concise notes.

## Acceptance Criteria

- [ ] `npm run build` passes.
- [ ] Targeted statusline smoke check still renders key corrected UI elements.
- [ ] `git diff --check` passes.
- [ ] `npm pack --dry-run` passes.
- [ ] Release bump commit is pushed to `main`.
- [ ] Annotated tag `v1.2.1` is pushed.
- [ ] GitHub Actions npm publish workflow succeeds for `v1.2.1`.
- [ ] `npm view cc-fusion version` reports `1.2.1`.
- [ ] GitHub Release `v1.2.1` exists.

## Definition of Done

- Version bump, tag, npm publish, and GitHub Release are complete.
- Any blocker such as failed build, failed workflow, auth failure, or npm mismatch is reported without bypassing checks.

## Technical Approach

Use the project release flow from `CLAUDE.md`: `npm version patch --no-git-tag-version`, build and package verification, normal release commit, push `main`, push annotated `v1.2.1` tag, monitor `.github/workflows/npm-publish.yml`, verify npm, then create the matching GitHub Release.

## Out of Scope

- Additional UI or runtime changes.
- Dependency cleanup unrelated to the release.

## Technical Notes

- Relevant release guidance is in project `CLAUDE.md`.
- Quality checks are in `.trellis/spec/backend/quality-guidelines.md`.
