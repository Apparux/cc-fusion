# 优化 statusline tasks 分波重置展示

## Goal

让状态栏 Tasks 行只展示当前一波任务，避免上一波已经完成的任务和新一波任务混在一起，降低视觉噪音并让进度百分比反映当前工作批次。

## What I already know

* 用户反馈：上一波任务完成后，有新一波任务时应该重置为新的任务批次，而不是在上一波任务后继续追加。
* 截图显示当前 Tasks 行把已完成的 1/4、2/4、3/4 与新任务 4/4 混在一起，进度显示 75%。
* `src/transcript.ts` 从 Claude transcript 聚合 `TaskCreate` / `TaskUpdate`，当前用 `todoMap` 收集尾部任务后 `.slice(-5)`，没有批次边界概念。
* `src/lines/line4.ts` 直接按 `ctx.tools.todos` 渲染，并用 `doneTodos / totalTodos` 计算百分比。
* 现有回归测试在 `test/regression.test.mjs`，已覆盖 transcript discovery 和基础 transcript stats，但未覆盖 TaskCreate/TaskUpdate 分组行为。

## Requirements

* Tasks 行必须能把已完成的一波任务与后续新任务分开。
* 当当前批次所有任务都已 `completed` 后，再遇到新的 `TaskCreate`，必须清空旧批次并从该新任务开始重新计数。
* 新批次开始后，状态栏不再展示旧批次任务，旧批次不参与 `totalTodos` / `doneTodos` / 百分比。
* 如果当前批次还没有全部完成，后续 `TaskCreate` 仍属于同一批次，避免误伤同一波任务的追加。
* 当前任务批次的编号、总数、完成百分比只基于当前批次。
* 本任务优先改 transcript 聚合逻辑，不改 line4 的视觉样式。

## Open Questions

* 无。

## Acceptance Criteria

* [ ] transcript 中先创建并完成一批任务，再创建新任务时，`parseTranscript()` 返回的 `todos` 只包含新批次。
* [ ] 新批次的 `totalTodos` / `doneTodos` 不包含旧批次。
* [ ] 当前批次未全部完成时新增任务不会触发重置，仍计入同一批。
* [ ] 现有 transcript discovery、context token、CLI smoke 回归测试继续通过。

## Definition of Done

* Tests added/updated where appropriate.
* `npm test` passes.
* `git diff --check` passes.
* `npm pack --dry-run` passes if release/package contents may be affected.
* No docs updated unless behavior needs user-facing documentation.

## Out of Scope (explicit)

* 重设计 Tasks 行 UI 样式。
* 按时间间隔自动分波。
* 引入手动 reset 信号。
* 引入持久状态或跨 session 任务存储。
* 改 Claude Code/Trellis 的真实任务生命周期，只改 cc-fusion 对 transcript 的展示聚合。

## Technical Approach

Update `parseTranscript()` in `src/transcript.ts` so the in-memory task aggregation tracks a current batch. Before adding a newly created task, if the current batch is non-empty and every task in it is `done`, clear the batch and start counting from the new task. Preserve the existing behavior that additional `TaskCreate` calls before all current-batch tasks are complete are appended to the same batch. Keep `src/lines/line4.ts` unchanged so rendering remains driven by `ToolStats`.

## Decision (ADR-lite)

**Context**: The current transcript parser slices the last five tasks from the full transcript tail, so completed tasks from the previous work batch can remain visible when a new batch starts.
**Decision**: Define a new batch boundary as “current batch has at least one task, all current-batch tasks are done, and a later `TaskCreate` is observed”.
**Consequences**: This solves the observed noisy statusline without persistent state, time heuristics, manual reset commands, or UI redesign. It intentionally does not split batches while any current-batch task remains unfinished.

## Implementation Plan

1. Add regression coverage in `test/regression.test.mjs` for completed-batch reset and unfinished-batch append behavior.
2. Update `src/transcript.ts` task aggregation to reset `todoMap` at the chosen batch boundary.
3. Run `npm test`, `git diff --check`, and a targeted statusline smoke test if rendering output changes via built parser output.

## Technical Notes

* Likely impacted: `src/transcript.ts`, `test/regression.test.mjs`.
* Renderer: `src/lines/line4.ts` currently trusts `ToolStats.todos` and should remain simple if aggregation can provide current batch only.
* Spec context: `.trellis/spec/backend/index.md`, `.trellis/spec/backend/quality-guidelines.md`, `.trellis/spec/backend/directory-structure.md`, `.trellis/spec/guides/code-reuse-thinking-guide.md`.
