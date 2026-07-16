# 显示当前 Effort Level

## Goal

在状态栏第一行的 Git 信息右侧显示当前 `/effort` LEVEL，让用户无需额外操作即可看到当前推理强度。

## Confirmed Facts

- 用户指定的展示位置是截图红框处，即第一行 Git 信息右侧。
- 展示内容必须反映当前 `/effort` 的 LEVEL。
- 当前版本使用固定五行布局；第一行顺序是 Model、Project、可选 Git，Git 后没有其他元素。
- 当前 Claude Code 状态栏输入通过 `effort.level` 提供当前回合的实际 LEVEL，并将同一值暴露为 `CLAUDE_EFFORT` 环境变量。
- 当前实现只读取历史扁平字段，因此真实状态栏输入未触发 effort 渲染。
- 项目历史实现兼容 `effortLevel` 与 `effort_level`，并以紧凑的“图标 + 原始 LEVEL”形式展示；缺失时隐藏。
- 本任务按轻量改动规划，不恢复已经删除的 preset/theme 架构。

## Requirements

- 状态栏第一行应以 `│ 🧿 <level>` 的视觉形式展示当前 effort level；分隔符由现有行布局统一生成，元素内容为 `🧿 <level>`。
- `🧿 <level>` 整体视觉应与 `/effort` 选择界面一致：`low` 黄色、`medium` 蓝色、`high` 浅蓝色、`xhigh` 浅紫色；`max` 固定显示为绿色 `m`、浅蓝色 `a`、浅紫色 `x`；`ultra` / `ultracode` 输入统一显示静态的深紫色 `🧿 ultracode`。
- 所有 effort 样式均为静态，不得依赖时间、刷新次数、ANSI blink 或后台常驻进程。
- 展示位置应紧随 Git 信息之后，并沿用现有状态栏视觉风格与分隔方式；非 Git 目录中应改为紧随 Project 信息之后，保证 effort 始终可见。
- 应优先读取当前状态栏 schema 的 `effort.level`，再兼容历史 camelCase `effortLevel` 与 snake_case `effort_level` 字段。
- stdin 未提供有效 LEVEL 时，应优先回退当前回合环境变量 `CLAUDE_EFFORT`，最后回退会话配置覆盖 `CLAUDE_CODE_EFFORT_LEVEL`。
- 不应改变 Context、Activity、Tasks、Agents 等现有行的语义与布局。
- 已知 LEVEL 应按截图中的小写名称显示；输入匹配应忽略大小写并去除首尾空白。
- 未知但有效的字符串 LEVEL 应保留其规范化后的原值，并以中性灰色显示，以兼容未来新增等级。
- effort 数据缺失、为空或类型异常时不得导致状态栏渲染失败，也不得留下多余分隔符。

## Acceptance Criteria

- [x] 提供 effort level 的输入时，第一行 Git 信息右侧按 `│ 🧿 <level>` 显示对应 LEVEL。
- [x] `low`、`medium`、`high` 分别显示为黄色、蓝色、浅蓝色，且图标与 LEVEL 文字同色。
- [x] `xhigh` 的 `🧿 xhigh` 始终显示为静态浅紫色。
- [x] `max` 的 `🧿 max` 始终显示为静态绿蓝紫三色，纯文本严格为单个 `max`。
- [x] `ultra` 与 `ultracode` 输入均统一显示为静态深紫色 `🧿 ultracode`，并与选择界面的视觉层级一致。
- [x] 输出不包含 ANSI blink 或时间驱动样式；重复渲染不影响标签可读性或后续状态栏样式。
- [x] 当前 schema `effort.level` 优先于历史扁平字段，并按当前回合 LEVEL 渲染。
- [x] stdin 未提供 LEVEL 时，`CLAUDE_EFFORT` 优先于 `CLAUDE_CODE_EFFORT_LEVEL` 作为环境回退。
- [x] 切换 `/effort` LEVEL 后，后续状态栏渲染显示新 LEVEL 及其对应视觉效果。
- [x] 非 Git 目录中，effort 紧随 Project 信息显示。
- [x] 未知字符串 LEVEL 以中性灰色显示；大小写和首尾空白被规范化。
- [x] effort 数据缺失、为空或类型异常时，状态栏仍可正常渲染且无多余分隔符。
- [x] 现有自动化测试通过，并有覆盖目标布局、全部 effort 模式视觉、输入兼容和降级行为的回归验证。

## Out of Scope

- 修改 `/effort` 命令本身或 Claude Code 的 effort 状态。
- 重设计主题、Context 进度条或其他状态栏行。

## Open Questions

- None.
