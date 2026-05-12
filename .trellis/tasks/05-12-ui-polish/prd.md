# 重新设计 CC-Fusion 5 行状态栏

## Goal

推倒重做 cc-fusion 项目，实现一个全新的 5 行 Claude Code CLI 状态栏，带有 emoji、彩色分块、进度条和实时更新功能。

## What I already know

### Current Architecture
* **Data collection**: stdin.ts (Claude Code JSON), git.ts (git info), transcript.ts (tool activity)
* **Rendering**: render.ts (element composition), element renderers (model, dir, git, context, usage, cost, duration, effort, tools, agents, todos)
* **Configuration**: config.ts (theme, preset, lang), configure.ts (CLI setup), TUI app (interactive config)
* **Theme system**: TOML-based colors and icons
* **Preset system**: Configurable line layouts

### User Requirements (from image and description)

**5-line statusline design:**

1. **核心信息行** (Core Info)
   - 👾 Model name (e.g., Sonnet 4)
   - 🧰 Project name (e.g., CCometixLine)
   - 🌟 Git branch + status (e.g., master ✅)

2. **上下文信息行** (Context Info)
   - 🧠 Context label
   - Progress bar with percentage (e.g., 78.2% ▓▓▓▒▒▒▒▒)
   - Token usage (e.g., 156.4k / 200.0k tokens)
   - Percentage badge (e.g., 78.2%)

3. **工具活动行** (Tool Activity)
   - ⚡ Activity label
   - 📖 Read file (e.g., Read src/index.ts)
   - ✏️ Edit file (e.g., Edit utils/parser.ts)
   - 🔍 Search query (e.g., Search "token limit")
   - 刚刚 (just now indicator)

4. **Agent 追踪行** (Agent Tracking)
   - 🌀 Agents label
   - 🟢 Planner + status (e.g., 分析需求)
   - 🟠 Coder + status (e.g., 实现功能)
   - 🔵 Reviewer + status (e.g., 审查代码)
   - Running count (e.g., 3 运行中)

5. **待办进度行** (Task Progress)
   - 💤 Tasks label
   - ✅ Completed tasks (e.g., 1/5 需求分析, 2/5 设计方案)
   - ⚡ Current task (e.g., 3/5 编码实现)
   - ⏳ Pending tasks (e.g., 4/5 测试验证)
   - 🕒 Future tasks (e.g., 5/5 部署上线)
   - Overall progress percentage (e.g., 40%)

**Visual requirements:**
- Emoji icons for each section
- Colored blocks/badges
- Progress bars (▓▓▓▒▒▒▒▒ style)
- Real-time updates
- Clean spacing and alignment

### Files to modify/create
* `src/render.ts` - Main rendering logic
* `src/elements/*.ts` - Individual element renderers (may need new files)
* `presets/` - New 5-line preset definition
* `themes/` - May need theme extensions for new colors
* `src/types.ts` - May need new type definitions

## Decision

**选择方案 B: 完全重写**

用户确认完全重写项目，从零开始实现固定 5 行布局。

## Requirements

### Core Functionality
1. **固定 5 行布局**：不可配置，始终输出 5 行
2. **数据收集**：保留 stdin 解析、git 信息、transcript 解析能力
3. **行 1 - 核心信息**：
   - 显示模型名称（带 emoji）
   - 显示项目名称（带 emoji）
   - 显示 git 分支和状态（带 emoji）
4. **行 2 - 上下文信息**：
   - 显示 Context 标签（带 emoji）
   - 显示百分比和进度条（▓▓▓▒▒▒ 样式）
   - 显示 token 使用情况（used / total）
   - 显示百分比徽章
5. **行 3 - 工具活动**：
   - 显示 Activity 标签（带 emoji）
   - 显示最近的文件读取（带 emoji）
   - 显示最近的文件编辑（带 emoji）
   - 显示最近的搜索（带 emoji）
   - 显示时间指示器（刚刚）
6. **行 4 - Agent 追踪**：
   - 显示 Agents 标签（带 emoji）
   - 显示各个 agent 状态（带彩色圆点 emoji）
   - 显示 agent 当前任务描述
   - 显示运行中的 agent 数量
7. **行 5 - 待办进度**：
   - 显示 Tasks 标签（带 emoji）
   - 显示各个任务状态（✅ 完成、⚡ 进行中、⏳ 待办、🕒 未开始）
   - 显示任务编号和名称
   - 显示总体进度百分比

### Visual Requirements
- 使用 emoji 图标
- 使用 ANSI 颜色代码
- 进度条使用 ▓ 和 ▒ 字符
- 使用 | 分隔符
- 彩色圆点：🟢 🟠 🔵 🟣 ⚪
- 状态图标：✅ ⚡ ⏳ 🕒

### Code Structure
- 删除：TUI 相关代码、配置系统、主题系统、预设系统、i18n
- 保留：stdin.ts, git.ts, transcript.ts（数据收集）
- 简化：types.ts（只保留必要类型）
- 重写：render.ts, index.ts（新的渲染逻辑）
- 新增：line1.ts, line2.ts, line3.ts, line4.ts, line5.ts（各行渲染器）

## Acceptance Criteria

* [ ] 删除所有不需要的文件（TUI、配置、主题、预设、i18n）
* [ ] 保留数据收集文件（stdin.ts, git.ts, transcript.ts）
* [ ] 简化 types.ts，只保留必要类型
* [ ] 实现新的 render.ts，固定 5 行布局
* [ ] 实现行 1 渲染器（核心信息）
* [ ] 实现行 2 渲染器（上下文信息 + 进度条）
* [ ] 实现行 3 渲染器（工具活动）
* [ ] 实现行 4 渲染器（Agent 追踪）
* [ ] 实现行 5 渲染器（待办进度）
* [ ] 更新 index.ts，移除配置相关代码
* [ ] TypeScript 编译成功
* [ ] 使用示例 stdin 测试，输出符合预期
* [ ] 更新 package.json，移除不需要的依赖
* [ ] 更新 README，反映新的架构

## Definition of Done

* TypeScript compiles without errors
* `npm run build` succeeds
* Statusline renders correctly with sample stdin
* All 5 lines display with correct emoji, colors, progress bars
* Git status integration works
* Transcript parsing works (tools, agents, todos)
* User approves the visual output

## Technical Approach

### Architecture
- **Single-purpose CLI**: 只做一件事 - 读取 stdin，输出 5 行状态栏
- **No configuration**: 移除所有配置系统，固定布局和样式
- **Hardcoded colors**: 直接在代码中定义颜色，不使用主题系统
- **Modular rendering**: 每行一个独立的渲染器模块

### File Structure
```
src/
  index.ts          # 入口文件，读取 stdin，调用渲染器
  render.ts         # 主渲染器，组合 5 行
  stdin.ts          # 解析 Claude Code stdin JSON（保留）
  git.ts            # 获取 git 信息（保留）
  transcript.ts     # 解析 transcript JSONL（保留）
  types.ts          # 类型定义（简化）
  colors.ts         # ANSI 颜色定义
  utils.ts          # 工具函数（进度条、格式化等）
  lines/
    line1.ts        # 行 1：核心信息
    line2.ts        # 行 2：上下文信息
    line3.ts        # 行 3：工具活动
    line4.ts        # 行 4：Agent 追踪
    line5.ts        # 行 5：待办进度
```

### Implementation Plan

**Phase 1: 清理现有代码**
1. 删除 `src/tui/` 目录（TUI 界面）
2. 删除 `src/configure.ts`（配置向导）
3. 删除 `src/config.ts`（配置加载）
4. 删除 `src/i18n.ts`（国际化）
5. 删除 `src/context.ts`, `src/usage.ts`, `src/cost.ts`, `src/effort.ts`（旧的元素渲染器）
6. 删除 `themes/`, `presets/`, `i18n/` 目录
7. 删除 `scripts/postinstall.js`（配置相关）
8. 保留 `src/stdin.ts`, `src/git.ts`, `src/transcript.ts`

**Phase 2: 创建新的基础设施**
1. 创建 `src/colors.ts`：定义 ANSI 颜色常量
2. 简化 `src/types.ts`：只保留必要的类型
3. 重写 `src/utils.ts`：添加进度条渲染、格式化函数

**Phase 3: 实现各行渲染器**
1. 创建 `src/lines/` 目录
2. 实现 `src/lines/line1.ts`：核心信息（model, project, git）
3. 实现 `src/lines/line2.ts`：上下文信息（context + progress bar）
4. 实现 `src/lines/line3.ts`：工具活动（tools）
5. 实现 `src/lines/line4.ts`：Agent 追踪（agents）
6. 实现 `src/lines/line5.ts`：待办进度（tasks）

**Phase 4: 实现主渲染器**
1. 重写 `src/render.ts`：调用 5 个行渲染器，组合输出

**Phase 5: 更新入口文件**
1. 简化 `src/index.ts`：移除配置、TUI 相关代码
2. 只保留 stdin 读取和渲染调用

**Phase 6: 更新项目配置**
1. 更新 `package.json`：移除不需要的依赖
2. 更新 `package.json` files 字段：移除 themes/, presets/, i18n/

**Phase 7: 编译和测试**
1. 运行 `npm run build`
2. 使用示例 stdin 测试输出
3. 验证 5 行格式正确

## Out of Scope

* 配置系统（config.json, TUI, 主题, 预设）
* 国际化（i18n）
* 可定制布局
* 命令行参数（除了 --help, --version）
* 交互式配置向导
* 主题切换
* 预设切换

## Technical Notes

### Progress Bar Rendering
```typescript
// Example: 78.2% → ▓▓▓▓▓▓▓▒▒▒
function renderProgressBar(pct: number, width: number): string {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return '▓'.repeat(filled) + '▒'.repeat(empty);
}
```

### Color Palette (from image)
- Model: Purple (👾)
- Project: Orange (🧰)
- Git: Yellow (🌟)
- Context: Purple/Pink (🧠)
- Activity: Blue (⚡)
- Agents: Blue (🌀)
- Tasks: Purple (💤)
- Status indicators: 🟢 Green, 🟠 Orange, 🔵 Blue, ⚪ White

### Layout Structure (from image)
```
行 1: 👾 Sonnet 4  |  🧰 CCometixLine  |  🌟 master ✅
行 2: 🧠 Context  ● 78.2% ▓▓▓▓▓▓▓▒▒▒  156.4k / 200.0k tokens  [78.2%]
行 3: ⚡ Activity  |  📖 Read src/index.ts  |  ✏️ Edit utils/parser.ts  |  🔍 Search "token limit"  刚刚
行 4: 🌀 Agents  |  🟢 Planner 分析需求  |  🟠 Coder 实现功能  |  🔵 Reviewer 审查代码  |  3 运行中
行 5: 💤 Tasks  |  ✅ 1/5 需求分析  |  ✅ 2/5 设计方案  |  ⚡ 3/5 编码实现  |  ⏳ 4/5 测试验证  |  🕒 5/5 部署上线  |  40%
```

### Complete Example (all 5 lines together)
```
👾 Sonnet 4  |  🧰 CCometixLine  |  🌟 master ✅
🧠 Context  ● 78.2% ▓▓▓▓▓▓▓▒▒▒  156.4k / 200.0k tokens  [78.2%]
⚡ Activity  |  📖 Read src/index.ts  |  ✏️ Edit utils/parser.ts  |  🔍 Search "token limit"  刚刚
🌀 Agents  |  🟢 Planner 分析需求  |  🟠 Coder 实现功能  |  🔵 Reviewer 审查代码  |  3 运行中
💤 Tasks  |  ✅ 1/5 需求分析  |  ✅ 2/5 设计方案  |  ⚡ 3/5 编码实现  |  ⏳ 4/5 测试验证  |  🕒 5/5 部署上线  |  40%
```
