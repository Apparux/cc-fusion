# Replace Git Warning Icon

## Goal

Replace the dirty git status icon shown in the statusline from `⚠️` to `⛓️‍💥` while preserving all existing git rendering behavior.

## Requirements

* Change only the dirty git status icon for the line 1 git segment.
* Preserve the clean git status icon, branch display, colors, separators, and layout.
* Do not redesign broader statusline UI.

## Acceptance Criteria

* [ ] Dirty git state renders `⛓️‍💥` instead of `⚠️`.
* [ ] Clean git state still renders `🎯`.
* [ ] TypeScript build succeeds.
* [ ] Whitespace check succeeds.
* [ ] Targeted statusline smoke test shows the new dirty icon.

## Definition of Done

* `npm run build` passes.
* `git diff --check` passes.
* Targeted stdin smoke test through `node dist/index.js` confirms visible rendering.
* Git status is reviewed before completion.

## Technical Approach

Edit `src/lines/line1.ts` and replace the dirty git status string literal only.

## Decision (ADR-lite)

**Context**: The requested change is a visual icon tweak for an existing statusline git segment.
**Decision**: Make a surgical renderer change in the existing line 1 renderer rather than introducing theme/config plumbing.
**Consequences**: Minimal blast radius; future icon customization would still require a separate configuration/theme task.

## Out of Scope

* Theme or preset redesign.
* Making git status icons configurable.
* Changing clean git status behavior.
* Changing documentation.

## Technical Notes

* `src/lines/line1.ts` contains the dirty git status icon at the git segment renderer.
* `rg -n "⚠️|warning|warn|git" src package.json` found the relevant icon in `src/lines/line1.ts`.
* Frontend/spec guidance requires `npm run build`, `git diff --check`, and a targeted statusline smoke test for visible rendering changes.
