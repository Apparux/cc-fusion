# 修复 statusline tasks 截断计数不一致

## Goal

修复 Tasks 行在当前批次超过 5 个任务时的显示/计数不一致问题：完整当前批次参与总数和百分比计算，但状态栏始终最多展示 5 个任务，并优先展示当前仍需要关注的任务窗口。

## What I already know

* 用户截图显示真实任务批次是 9 个：4 done、1 in progress、4 open。
* 当前 statusline 显示为 `1/5` 到 `5/5`，百分比为 `60%`，这与真实 9 个任务不一致。
* `src/transcript.ts` 当前先 `Array.from(todoMap.values()).slice(-5)`，再用截断后的 `todos.length` 作为 `totalTodos`，并用截断后的 done 数计算 `doneTodos`。
* `src/lines/line4.ts` 用 `todo.id/ctx.tools.totalTodos` 渲染每项，用 `doneTodos / totalTodos` 渲染百分比。
* 上一版已实现“当前批次全部完成后新 TaskCreate 重置批次”，本任务只修复同一当前批次内的截断计数。

## Requirements

* 当前批次的所有任务都必须参与总数和进度计算，即 `totalTodos` 是完整当前批次任务数。
* `doneTodos` 必须等于完整当前批次中 `done` 的任务数，不受最多 5 个展示限制影响。
* 百分比必须基于完整当前批次：`doneTodos / totalTodos`。
* 状态栏始终最多展示 5 个任务，避免过宽。
* 当当前批次超过 5 个任务时，优先展示前 5 个仍未完成或正在进行的任务；已经完成的前置任务从展示窗口中移除，让后续待执行任务补进来。
* 如果当前未完成任务少于 5 个，可以展示这些未完成任务；已完成任务仍计入进度但不需要继续占用展示窗口。
* 展示出来的任务编号必须反映它在完整当前批次中的真实序号，例如后续补进来的任务显示 `6/9` 而不是 `1/5`。
* 不改变 Tasks 行视觉设计的大方向，不引入配置项。

## Open Questions

* 无。

## Acceptance Criteria

* [ ] 当前批次 9 个任务、4 done、1 current、4 pending 时，`totalTodos` 为 `9`，`doneTodos` 为 `4`，进度约为 `44%`。
* [ ] 当前批次 9 个任务、前 4 个已完成时，展示窗口显示第 5-9 个任务，编号为 `5/9..9/9`。
* [ ] 当前批次 9 个任务、前 2 个已完成、第 3-7 个未完成时，展示窗口显示第 3-7 个任务，后续第 8-9 个暂不展示。
* [ ] 当前批次不超过 5 个任务时，现有显示保持一致。
* [ ] 上一版“完成批次后新任务重置”和“未完成批次新增任务追加”的测试继续通过。

## Definition of Done

* Regression tests cover over-5 dynamic task window with full-batch counts.
* `npm test` passes.
* `git diff --check` passes.
* Targeted statusline smoke test confirms rendered Tasks 行不再误导。
* `npm pack --dry-run` passes if packaging/release-sensitive generated files are touched.

## Out of Scope

* 同时展示超过 5 个任务。
* 新增用户配置项控制最大显示数量。
* 改 Tasks 行整体 UI 风格。
* 改 Claude/Trellis 真实任务源。

## Technical Approach

Keep the parser responsible for full-batch aggregation. Compute `allTodos` from the current batch first, then derive `totalTodos` and `doneTodos` from `allTodos`. Separately derive the display window for `todos`: filter out completed tasks, take the first 5 still-active tasks in original task order, and keep each displayed todo's id aligned to its full-batch position. If there are no active tasks left, keep normal completed-batch behavior available for reset on the next `TaskCreate`.

## Decision (ADR-lite)

**Context**: `todos` currently means both “displayed tasks” and “all current-batch tasks”, so truncating for UI width corrupts the aggregate counters.
**Decision**: Split aggregate counting from display selection while preserving the existing `ToolStats` shape: `totalTodos`/`doneTodos` represent the full current batch, and `todos` becomes the first up-to-5 active tasks after completed tasks are removed from the display window, with full-batch display ids.
**Consequences**: Rendering can stay mostly unchanged, completed tasks no longer occupy limited statusline slots after they are done, and parser tests must enforce that display-window movement does not affect totals or progress.

## Technical Notes

* Likely impacted: `src/transcript.ts`, `test/regression.test.mjs`, generated `dist/transcript.js` / map after build.
* Potentially no change needed in `src/lines/line4.ts` if parser returns full-batch ids and totals.
