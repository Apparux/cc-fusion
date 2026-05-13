# Group repeated agents in statusline

## Goal

Make the Agents statusline line more compact by grouping repeated agent names and displaying a count suffix such as `x2`, instead of appending the same agent name repeatedly.

## What I already know

* The user showed duplicate entries like `trellis-implement`, `trellis-check`, `trellis-implement`, `trellis-check` in the Agents line.
* Desired display is to group identical agent names and show duplicate counts like `x2` rather than accumulating duplicate labels.
* `src/lines/line5.ts` renders the Agents line from `ctx.tools.agents`.
* `src/transcript.ts` currently tracks agent tool calls by tool id and keeps the last 5 agent entries.
* `src/types.ts` defines `ToolStats.agents` as `{ name, status, color }` items.
* Frontend-equivalent guidelines say terminal UI should stay compact and renderer functions should return strings, not print.

## Assumptions (temporary)

* Identical agent display names should be grouped across the rendered recent-agent window, not only when adjacent.
* The grouped entry should preserve the existing dot/color style and append a compact count suffix when the count is greater than 1.
* No configuration option is needed for this behavior.

## Open Questions

* None.

## Requirements (evolving)

* Group repeated agent names in the Agents line.
* Show duplicate counts with a compact suffix such as `x2` only when the count is greater than 1.
* Keep single-occurrence agent names unchanged without an `x1` suffix.
* Preserve the existing empty-state text `无最近 Agent`.
* Preserve bounded transcript parsing and compact statusline output.

## Acceptance Criteria (evolving)

* [x] When recent agents include two `trellis-implement` and two `trellis-check` entries, the Agents line renders each name once with `x2`.
* [x] Unique agent names still render normally without `x1`.
* [x] The default no-argument statusline output remains stdout-only and compact.
* [x] `npm run build`, `git diff --check`, and a targeted stdin/transcript smoke test pass.

## Definition of Done (team quality bar)

* Tests added/updated where appropriate, or a targeted smoke test covers the behavior.
* TypeScript build passes.
* Whitespace check passes.
* Docs updated only if needed for user-visible behavior.
* Rollout/rollback considered if risky.

## Out of Scope (explicit)

* Changing transcript parsing scope beyond what is needed for agent display.
* Adding new configuration options for grouping.
* Changing colors, icons, or the layout of other statusline lines.

## Technical Notes

* Likely impacted files: `src/lines/line5.ts`, possibly `src/transcript.ts` and `src/types.ts` if count data should be represented before rendering.
* Current transcript aggregation keeps last 5 unique tool ids with `Array.from(agentMap.values()).slice(-5)`.
* Presentation should remain pure string rendering per `.trellis/spec/frontend/component-guidelines.md`.
