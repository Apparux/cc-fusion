# Try Brick Dirty Git Icon

## Goal

Change the dirty git statusline icon from `⛓️‍💥` to `🧱` for local visual tuning, without committing or pushing during this debugging stage.

## Requirements

* Replace only the dirty git status icon in the line 1 git segment.
* Preserve the clean git status icon, branch text, colors, separators, and layout.
* Stop after local verification; do not run finish-work, commit, push, tag, or release.

## Acceptance Criteria

* [ ] Dirty git state renders `🧱`.
* [ ] Clean git state remains `🎯`.
* [ ] TypeScript build succeeds.
* [ ] Whitespace check succeeds.
* [ ] Targeted statusline smoke test shows the new dirty icon.

## Definition of Done

* Local verification passes.
* Git status is reported with uncommitted local changes.
* No commit, push, tag, release, or Trellis finish-work is performed.

## Technical Approach

Edit `src/lines/line1.ts` and replace the dirty git status string literal only, then rebuild `dist/`.

## Decision (ADR-lite)

**Context**: The dirty git icon is being tuned visually before finalizing.
**Decision**: Use `🧱` locally for the dirty state.
**Consequences**: The change remains easy to revise before committing; package/release flow is intentionally deferred.

## Out of Scope

* Making icons configurable.
* Changing clean git status behavior.
* Committing or pushing this trial.
* Releasing to npm.

## Technical Notes

* Previous dirty icon is in `src/lines/line1.ts`.
* This is terminal/statusline presentation work under the frontend spec layer.
