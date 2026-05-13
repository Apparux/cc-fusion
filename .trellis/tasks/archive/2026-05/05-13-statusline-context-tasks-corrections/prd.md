# 修正 Context 进度条对齐、分隔符和 Tasks 进度

## Goal

修正用户截图中指出的三处 statusline 回归：Context 进度条不能向下偏移，Context 标签后需要恢复分隔符，Tasks 行不能在任务已完成后仍显示 0%。保持当前信息结构和整体 5 行 statusline 不变，只修正这些渲染/聚合问题。

## What I already know

* 用户明确指出三点问题：进度条向下偏移、Context 后分隔符被删、Tasks 已完成仍显示 0%。
* 当前 `src/utils.ts` 使用 `▄` 作为进度条主体；这是下半块字符，视觉天然向下偏移。
* 用户之前要求中等厚度：不能退回 `━/─` 细线，也不能用过厚 `█`。
* 当前 `src/lines/line2.ts` 保留了 `● xx.x%` 和 token 文本，但 Context 标签后没有灰色分隔符。
* 当前 `src/lines/line4.ts` 使用 `ctx.tools.doneTodos / ctx.tools.totalTodos` 渲染进度。
* 当前 `src/transcript.ts` 对 TaskCreate 使用局部递增 id，但 TaskUpdate 使用工具输入里的真实 `taskId`，当 transcript tail 未包含早期 TaskCreate 或任务编号不是从 1 开始时会错配，导致完成状态没有更新，进度卡在 0%。

## Assumptions

* 使用视觉居中的中等厚度字符（优先 `▬`）替换 `▄`，避免下沉，同时仍比 `━/─` 更厚、比 `█` 更扁。
* Context 标签后的分隔符应和其他行一致使用灰色 `|`，但不强制在 Context 行所有元素之间都插入 `|`。
* Tasks 进度应基于 Claude Code Task 工具的真实任务编号关联 TaskCreate 和 TaskUpdate；如果无法从 TaskCreate 输入直接得到 ID，则需要从相邻 tool result 文本解析 `Task #N created successfully`。

## Open Questions

* None.

## Requirements

* Context 进度条不能使用会明显下沉的 `▄`。
* Context 进度条不能退回 `━` / `─` 细线主体。
* Context 进度条不能使用过厚 `█` 主体。
* Context 进度条应使用中等厚度且视觉居中的 glyph，优先 `▬`。
* Context 标签后恢复灰色分隔符 `|`。
* Context 行保留 `● xx.x%`。
* Context 行保留 cyan token 用量文本：`${ctx.contextUsed} / ${ctx.contextTotal} tokens`。
* Context 行整体顺序应为 `Context` → gray separator `|` → `● xx.x%` → progress bar → token usage。
* Tasks 行完成百分比必须能随 TaskUpdate completed 正确变化，不能在可解析已完成任务时仍卡 0%。
* TaskCreate 和 TaskUpdate 的关联必须使用真实 task id，而不是仅使用 transcript tail 内局部递增序号。
* 整体 statusline 仍输出 5 行。
* 不改 README/docs，不新增配置，不做 npm release。

## Acceptance Criteria

* [ ] Context 行包含 `Context` 后的灰色 `|` 分隔符。
* [ ] Context 行包含 `● xx.x%`。
* [ ] Context 行包含 token 用量文本和 `tokens`。
* [ ] Context 进度条使用 `▬` 或等价视觉居中的中等厚度 glyph。
* [ ] Context 进度条不包含 `▄`、`█`、`━`、`─`。
* [ ] 32.5% 为绿色档位，68.7% 为黄色档位，92.3% 为红色档位。
* [ ] 阈值边界 smoke tests 覆盖 `59.9`, `60`, `79.9`, `80`。
* [ ] 人工/合成 transcript smoke 覆盖 TaskCreate 真实编号不是从 1 开始时，TaskUpdate completed 仍能更新 doneTodos。
* [ ] 合成 transcript 中 2/2 completed 时 Tasks 行显示 `100%`，不是 `0%`。
* [ ] 整体 statusline 仍输出 5 行。
* [ ] `npm run build` 通过。
* [ ] `git diff --check` 通过。
* [ ] `npm pack --dry-run` 通过。

## Definition of Done

* Build/typecheck green via `npm run build`.
* Targeted stdin smoke tests cover Context low/medium/high and threshold boundaries.
* Transcript smoke test covers TaskCreate/TaskUpdate id association and Tasks percentage.
* `git diff --check` passes.
* `npm pack --dry-run` passes.
* Work is committed and pushed per project workflow.

## Technical Approach

* Update `src/utils.ts` `renderProgressBar` body glyph from `▄` to a centered medium-thickness glyph such as `▬`.
* Update `src/lines/line2.ts` to render a gray separator immediately after the Context label while preserving the rest of the Context metadata.
* Update `src/transcript.ts` to associate TaskCreate entries with the actual task IDs emitted by tool results, then apply TaskUpdate status changes to those IDs.
* Prefer minimal transcript parsing changes scoped to TaskCreate/TaskUpdate; keep existing read/edit/search/agent behavior unchanged.
* Run `npm run build` to regenerate `dist/`; do not hand-edit generated files.

## Decision (ADR-lite)

**Context**: The prior medium-flat bar used `▄`, which solved thickness but introduced vertical downward offset. Also, the statusline Tasks aggregation used local task numbering that could diverge from Claude Code task IDs, causing stale 0% progress.

**Decision**: Use a centered medium bar glyph for Context and parse real Task IDs from TaskCreate tool results so TaskUpdate can update the correct todo entries.

**Consequences**: The visual bar remains medium-weight without baseline shift, and Tasks progress becomes reliable across sessions where task IDs do not start at 1 within the transcript tail.

## Out of Scope

* Changing other statusline rows beyond required Tasks progress correctness.
* Redesigning task UI layout.
* New config/theme/preset options.
* README/docs updates.
* npm release/tagging.

## Technical Notes

* Relevant files: `src/utils.ts`, `src/lines/line2.ts`, `src/transcript.ts`, generated `dist/**` after build.
* `src/render.ts` composes exactly 5 lines and should stay unchanged.
* `.trellis/spec/backend/quality-guidelines.md` requires Context threshold smoke tests.
