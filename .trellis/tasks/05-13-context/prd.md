# 实现 Context 进度条样式

## Goal

把 Claude Code statusline 的 Context 进度条改成更接近用户截图的视觉效果：根据使用率自动变色，帮助用户快速判断上下文资源是否充足、需要注意或接近紧张。

## What I already know

* 用户提供截图，希望 Context 进度条根据使用率自动变色。
* 分段目标：低使用率 0–60% 绿色，中等使用率 60–80% 黄色，高使用率 80–100% 红色。
* 当前仓库是 TypeScript CLI，默认无参数路径渲染 Claude Code statusline。
* 当前渲染入口 `src/render.ts` 固定组合 5 行，其中 `src/lines/line2.ts` 负责 Context 行。
* 当前 Context 行是单行：`🧠 Context`、百分比圆点、10 格进度条、token 使用量。
* 当前 `src/utils.ts` 已有 `progressColor`，但阈值是 `<50` 绿、`50–79` 黄、`>=80` 红，不符合截图的 60/80 分段。

## Assumptions (temporary)

* 目标优先是改善现有 statusline 的 Context 行，而不是把整个 CLI 输出改成截图中的三张说明卡片。
* 不引入新依赖；继续用 ANSI 颜色和终端字符实现。
* 保持默认 statusline 仍为 5 行，避免破坏 README 中的核心定位，除非用户明确想改成多行卡片式输出。

## Open Questions

* None.

## Requirements

* 只改现有 5 行 statusline 中的 Context 单行，不做截图中的多行卡片/说明块。
* 不顺手调整其他 statusline 行、配置项或文档。
* Context 使用率颜色按 0–60% 绿色、60–80% 黄色、80–100% 红色变化。
* 不显示 60%/80% 阈值提示，只通过百分比与进度条颜色表达当前档位。
* 进度条视觉应比当前 `▰▱` 更接近截图里的连续横条效果。
* token 使用量仍显示已用 / 总量。

## Acceptance Criteria

* [ ] 32.5% Context 显示为绿色。
* [ ] 68.7% Context 显示为黄色。
* [ ] 92.3% Context 显示为红色。
* [ ] 50–59.9% 仍为绿色，60–79.9% 为黄色，80% 及以上为红色。
* [ ] `npm run build` 通过。
* [ ] 使用示例 stdin 做低/中/高三档 smoke test，输出颜色/布局符合预期。

## Definition of Done (team quality bar)

* Tests added/updated where appropriate; this repo currently has no dedicated test script.
* Build/typecheck green via `npm run build`.
* Targeted stdin smoke tests cover low, medium, high context usage.
* `git diff --check` passes.
* `npm pack --dry-run` passes if package contents could be affected.
* Docs/notes updated if behavior changes and user wants docs changed.

## Technical Approach

* Update existing Context rendering only, primarily `src/lines/line2.ts` and shared progress/color helpers in `src/utils.ts` if needed.
* Keep `RenderContext` shape and context percentage calculation unchanged.
* Use a continuous-looking terminal progress bar with colored filled segment and dim remainder, preserving a compact single-line statusline.
* Apply traffic-light color thresholds at 60% and 80%.

## Decision (ADR-lite)

**Context**: User wants the screenshot's Context progress style and automatic usage-based color change, but clarified the screenshot is only a style reference and the output should stay focused on the existing Context line.

**Decision**: Keep the 5-line statusline architecture and only enhance the existing Context single-line display. Do not show explicit 60/80 threshold hints.

**Consequences**: The implementation stays compact and low-risk, but will not include the screenshot's explanatory cards, tick marks, or multi-line labels.

## Out of Scope (explicit)

* Replacing the whole 5-line statusline architecture.
* Adding external dependencies for rich terminal UI.
* Changing theme/preset configuration behavior.
* Changing context usage calculation semantics beyond display thresholds.
* Updating README or generated docs in this task.

## Technical Notes

* `src/lines/line2.ts` currently renders the Context line.
* `src/utils.ts` contains `renderProgressBar` and `progressColor`.
* `src/render.ts` composes 5 fixed lines.
* `src/index.ts` computes `contextPct`, `contextUsed`, and `contextTotal` for render context.
* `CLAUDE.md` says there is no dedicated test script; use `npm run build`, smoke tests, `git diff --check`, and `npm pack --dry-run`.
