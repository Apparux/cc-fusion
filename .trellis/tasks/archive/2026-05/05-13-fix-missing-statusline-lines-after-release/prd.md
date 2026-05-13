# Fix missing statusline lines after release

## Goal

After the v1.3.0 release, real Claude Code usage appears to show only the first two statusline rows and lines 3, 4, and 5 disappear. Determine whether this is a packaged code regression, release/main mismatch, installed-command/configuration problem, or Claude Code runtime invocation issue, then apply the smallest safe fix and verify with realistic statusline input.

## What I already know

* The user reported the regression from the real Claude Code statusline after v1.3.0.
* The v1.3.0 change grouped repeated agents in `src/lines/line5.ts` and was released to npm.
* Current repository source still has `src/render.ts` composing five fixed lines: line1 through line5.
* Current repository entrypoint still calls `render(ctx)` and writes the full output to stdout.
* The current shell previously reported `cc-fusion not found`, which suggests the real Claude Code statusline may be invoking a missing command, stale path, or fallback/default statusline rather than the package binary.
* A previous Trellis context command used `--mode current`, which is invalid; valid modes include `default`, `record`, `packages`, and `phase`.

## Assumptions to validate

* Claude Code may be configured to call a command that is not available in the runtime PATH.
* The published npm package may still contain all line renderers, but real usage may not be executing it.
* If the package output itself renders five lines under realistic stdin, the fix is likely configuration/install guidance or command robustness rather than renderer logic.

## Requirements

* Reproduce the issue with realistic Claude Code stdin and transcript/task data, or prove the local/package renderer still outputs five rows.
* Inspect the configured statusline command/path used by Claude Code without modifying local harness settings.
* Compare repository source/build output and published package behavior for v1.3.0.
* If a code/package bug is confirmed, make the smallest runtime fix and prepare a patch release path.
* If configuration/install is the issue, identify the exact broken command/path and provide the corrective command or package-level mitigation.

## Acceptance Criteria

* [ ] Local repository build renders all five rows with realistic stdin.
* [ ] Published or installed v1.3.0 package behavior is checked with realistic stdin.
* [ ] Claude Code statusline configuration/command is inspected enough to explain why real usage dropped lines 3-5.
* [ ] Any code change preserves no-debug-stdout behavior and compact terminal output.
* [ ] Required verification passes: `npm run build`, `git diff --check`, targeted smoke test, and `npm pack --dry-run` if packaging changes are touched.

## Definition of Done

* Root cause is stated clearly with evidence.
* Fix or corrective action is applied within the task scope.
* Verification commands match the touched files and all pass, or blockers are reported without bypassing failures.
* If package code changes are needed, changes are committed and released according to project instructions.

## Out of Scope

* Redesigning the statusline layout.
* Changing accepted grouped-agent display behavior unless directly required for the regression.
* Editing local Claude Code harness settings unless the user explicitly approves that configuration change.

## Technical Notes

* Relevant runtime files: `src/index.ts`, `src/render.ts`, `src/lines/line3.ts`, `src/lines/line4.ts`, `src/lines/line5.ts`, `src/transcript.ts`.
* Applicable quality guidance: backend CLI checks require build, whitespace check, targeted smoke tests, and package preview when release-sensitive.
* Root cause found: the current global `cc-fusion` command was a symlink to this repository's `dist/index.js`, but `npm run build` regenerated `dist/index.js` with mode `0644`. Direct command invocation failed with exit 126 Permission denied, which explains Claude Code falling back/degrading instead of showing the full cc-fusion output.
* User's branch-switch hypothesis was confirmed as the trigger path: `dev`, merge commit `029c7b9`, `v1.3.0`, and release commit `6b9d01b` all store `dist/index.js` as Git mode `100644`; current `main` after fix stores it as `100755`. Switching back to an older branch/ref can therefore make the linked global bin non-executable again.
* `dist/render.js` in `dev`, `029c7b9`, `v1.3.0`, and current `main` all import and render line1 through line5, so the branch switch did not remove line renderers; it changed the executable state of the command entrypoint.
* Published `cc-fusion@1.3.0` installed into a temporary directory had executable mode and rendered all five rows, so the package contents were not missing line renderers.
* Fix: update `package.json` build script to run `chmod 755 dist/index.js` after `tsc`, ensuring linked/local builds preserve executable status for the npm bin entry.
* Verification performed: configured `node .../dist/index.js` smoke output had 5 rows; direct `/opt/homebrew/bin/cc-fusion` failed before fix and rendered 5 rows after fix; `npm run build`; realistic transcript smoke with tasks/agents rendered 5 rows and grouped `trellis-implement x2`; `git diff --check`; `npm pack --dry-run`; `npx --yes cc-fusion@1.3.0` rendered 5 rows.
