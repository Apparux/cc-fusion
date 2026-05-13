# 修正 Context 进度条截图样式

## Goal

修正上一版 Context 进度条实现，让现有 5 行 statusline 中的 Context 单行更贴近用户第二张截图：`Context` 标签后直接显示较长、较厚的彩色 pill/track 进度条，最右显示百分比，用颜色表达低/中/高使用率。

## What I already know

* 用户明确指出上一版不符合截图目标。
* 截图目标是一行 Context 样式参考，不是多行说明卡片。
* 目标顺序是：脑图标 + `Context` 标签 → progress bar → percentage。
* 截图中没有 `●` 圆点，也没有 `65.0k / 200.0k tokens` 文本。
* 进度条应更厚、更像 pill，包含彩色已用段和暗色未用轨道，长度明显比当前 10 格更长。
* 使用率颜色仍按 `<60` 绿色、`>=60 && <80` 黄色、`>=80` 红色。
* 当前 `src/lines/line2.ts` 仍渲染 `Context` 标签、`● pct`、10 格进度条、token 文本。
* 当前 `src/utils.ts` 的 `progressColor` 阈值已是 60/80，但 `renderProgressBar` 当前用 `━/─` 且默认宽度 10，视觉仍不够接近截图。
* 当前 `src/stdin.ts` 已保留 decimal percentage，适合显示 `32.5%` / `68.7%` / `92.3%`。

## Assumptions

* 继续只改 Context 单行，不改整体 5 行架构。
* 不新增配置项，不改其他 statusline 行，不更新 README。
* 终端无法真正画 CSS 圆角；用 Unicode 块字符和 ANSI 颜色近似 pill/track 效果。

## Open Questions

* None.

## Requirements

* 使用 Nerd Font / Powerline 圆角端帽字符实现终端里的 pill 圆角效果。
* Context 进度条必须尽量呈现圆角 pill 效果，不能只是普通方块条或细线条。
* Context 行只输出：图标 + `Context` 标签、progress bar、percentage。
* 移除 Context 行里的 `●` 圆点。
* 移除 Context 行里的 token 文本。
* Progress bar 放在 percentage 左侧。
* Progress bar 比当前更长，目标宽度约 14–18 字符。
* Progress bar 使用圆角端帽 + 彩色已用段 + 暗色未用轨道，视觉上比 `━━━───────` 更厚、更接近 pill。
* 低/中/高三档分别使用绿色、黄色、红色，并应用到已用段和百分比。
* 保留 decimal percentage，显示一位小数。
* 维持整体 5 行 statusline 架构不变。

## Acceptance Criteria

* [ ] 32.5% 输出顺序为 `Context` → progress bar → `32.5%`，整体为绿色档位。
* [ ] 68.7% 输出顺序为 `Context` → progress bar → `68.7%`，整体为黄色档位。
* [ ] 92.3% 输出顺序为 `Context` → progress bar → `92.3%`，整体为红色档位。
* [ ] Context 行不包含 `●`。
* [ ] Context 行不包含 `tokens` 或 `65.0k / 200.0k` 这类 token 用量文本。
* [ ] Context 行仍是单行，整体 statusline 仍输出 5 行。
* [ ] 阈值边界 smoke tests 覆盖 `59.9`, `60`, `79.9`, `80`。
* [ ] `npm run build` 通过。
* [ ] `git diff --check` 通过。
* [ ] `npm pack --dry-run` 通过。

## Definition of Done

* Build/typecheck green via `npm run build`.
* Targeted stdin smoke tests cover low/medium/high and threshold boundaries.
* Verify output shape with assertions for ordering and absence of `●` / token text.
* `git diff --check` passes.
* `npm pack --dry-run` passes.

## Technical Approach

* Update `src/lines/line2.ts` to reorder and remove unneeded Context parts.
* Update/reuse `src/utils.ts` progress helper to support a wider, thicker bar suitable for Context, using Nerd Font / Powerline-style rounded caps where feasible.
* Keep `progressColor` thresholds and `calcContextPct` decimal behavior unchanged unless checks reveal a bug.
* Run `npm run build` to regenerate `dist/`; do not hand-edit generated files.

## Decision (ADR-lite)

**Context**: The previous implementation technically changed colors and bar characters but failed the screenshot style: wrong order, extra dot, extra token text, too-short/thin bar.

**Decision**: Treat the screenshot crop as the target for Context line composition: label, Nerd Font / Powerline-style rounded pill progress, percentage only.

**Consequences**: Context line becomes visually cleaner and closer to the screenshot, but no longer shows token counts on that line and expects Nerd Font-compatible rendering for the best rounded-bar appearance.

## Out of Scope

* Multi-line cards, labels, threshold ticks, or explanatory text.
* Changes to other statusline lines.
* New config/theme/preset options.
* README/docs updates.
* npm release/tagging unless requested after verification.

## Technical Notes

* Relevant files: `src/lines/line2.ts`, `src/utils.ts`, generated `dist/**` after build.
* `src/render.ts` composes exactly 5 lines and should stay unchanged.
* `.trellis/spec/backend/quality-guidelines.md` now requires Context threshold smoke tests.
