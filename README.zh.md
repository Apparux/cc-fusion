# CC-Fusion

> **Claude Code 状态栏** — 融合 [CCometixLine](https://github.com/Haleclipse/CCometixLine) 的视觉美学与 [Claude HUD](https://github.com/jarrodwatts/claude-hud) 的全功能。

一个 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 TypeScript 插件，在终端底部渲染三行丰富的状态栏——将精致的 Nerd Font 图标、TOML 主题系统、交通灯健康指示器，与 transcript 深度解析、token 明细分解、智能费用隐藏完美结合。

🌐 [English](README.md) | 中文文档

---

## 📸 效果预览

**完整模式（Full）— 三行显示：**
```
◈ Opus 4.6 │ ⌂ ~/my-project │ ⎇ main✱ ↑2 ↓1
◈ Ctx ████████████████░░░░ 82% (164k/200k) │ ▦ Use ████████░░░░░░░░░░░░ 42% (resets 2h30m) │ ◆ $0.42 │ ◷ 12m │ ↯ high
◐ Edit: auth.ts ×3 │ ⊙ Read ×8 │ ⌕ Grep ×2 │ ⊕ 1 agent │ ☑ 3/4 tasks
```

**核心模式（Essential）— 两行：**
```
◈ Opus 4.6 │ ⌂ ~/my-project │ ⎇ main✱
◈ Ctx ████████████████░░░░ 82% │ ▦ Use ████████░░░░░░░░░░░░ 42% │ ◆ $0.42
```

**极简模式（Minimal）— 一行：**
```
◈ Opus 4.6 │ ◈ Ctx ██████░░░░░░░░░░░░░░ 31%
```

### 主题展示

| 主题 | 风格 | 主色调 |
|------|------|--------|
| `cometix` | 默认深色 | 青绿 + 金色 |
| `gruvbox` | 暖色复古 | 棕橙 + 黄绿 |
| `dracula` | 现代暗紫 | 紫色 + 粉色 |
| `nord` | 北欧冷色 | 冰蓝 + 灰色 |

---

## 🚀 安装

### 前置要求

- **Node.js** ≥ 18
- **Claude Code** CLI 已安装
- **Nerd Font** 字体（用于图标显示）— 推荐：[Maple Font](https://github.com/subframe7536/maple-font)（支持中文的 Nerd Font）或 [JetBrains Mono Nerd Font](https://www.nerdfonts.com/)

### 快速安装（推荐）

不需要 npm —— clone 即用：

```bash
# 克隆到 ~/.claude/cc-fusion
git clone https://github.com/CanCanNeedNei/cc-fusion.git ~/.claude/cc-fusion
```

然后配置 Claude Code（见下方）。搞定！

### 手动安装（从源码）

```bash
# 克隆仓库
git clone https://github.com/CanCanNeedNei/cc-fusion.git
cd cc-fusion

# 安装依赖 & 编译
npm install
npm run build
```

### 配置 Claude Code

在 `~/.claude/settings.json` 中添加：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/cc-fusion/dist/index.js",
    "padding": 0
  }
}
```

重启 Claude Code 即可生效！🎉

### 卸载 CC-Fusion

一行命令：

```bash
curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/uninstall.sh | bash
```

或者手动卸载：

```bash
# 删除安装目录
rm -rf ~/.claude/cc-fusion

# 从 settings.json 中移除 statusLine 配置
# 打开 ~/.claude/settings.json，删除 statusLine 那一段
```

### 卸载 CCometixLine

```bash
curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/scripts/uninstall-ccline.sh | bash
```

清理内容：npm 全局包 `@cometix/ccline`、`~/.claude/ccline/` 目录、settings.json 中的 statusLine 配置。

### 卸载 Claude HUD

```bash
curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/scripts/uninstall-claude-hud.sh | bash
```

清理内容：`~/.claude/plugins/claude-hud/` 目录、settings.json 中的 statusLine 配置。

---

## ⚙️ 配置说明

### 主配置文件 (`config.json`)

在项目根目录创建 `config.json`：

```json
{
  "theme": "cometix",
  "preset": "full",
  "lang": "zh",
  "hideCostFor": ["bedrock", "vertex"],
  "usageThreshold": 80,
  "tokenBreakdownThreshold": 85,
  "barWidth": 20,
  "showTranscript": true
}
```

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `theme` | `string` | `"cometix"` | 主题名称（对应 `themes/<name>.toml`） |
| `preset` | `string` | `"full"` | 显示预设：`full`、`essential`、`minimal` |
| `lang` | `string` | `"en"` | 语言：`en`（英文）或 `zh`（中文） |
| `hideCostFor` | `string[]` | `["bedrock","vertex"]` | 费用为 $0 时隐藏费用的提供商列表 |
| `usageThreshold` | `number` | `80` | 用量百分比 ≥ 此值时才显示用量栏 |
| `tokenBreakdownThreshold` | `number` | `85` | 上下文 ≥ 此值时展开 token 明细 |
| `barWidth` | `number` | `20` | 进度条宽度（字符数） |
| `showTranscript` | `boolean` | `true` | 是否解析 transcript 获取工具/Agent/待办信息 |

### 预设系统

预设控制哪些元素显示以及在哪一行。每个预设是一个 JSON 文件，包含 `lines` 数组：

```json
{
  "name": "full",
  "lines": [
    ["model", "dir", "git"],
    ["context", "usage", "cost", "duration", "effort"],
    ["tools", "agents", "todos"]
  ]
}
```

**可用元素：**

| 元素 | 说明 |
|------|------|
| `model` | 简化的模型名称（◈ Opus 4.6） |
| `dir` | 缩短的工作目录 |
| `git` | Git 分支 + dirty + ahead/behind + 文件统计 |
| `context` | 上下文进度条 + 百分比（交通灯变色） |
| `usage` | 用量进度条 + 百分比（仅超过阈值时显示） |
| `cost` | 会话费用（美元） |
| `duration` | 会话时长 |
| `effort` | 推理强度等级（带颜色编码） |
| `tools` | 工具调用统计（编辑、读取、搜索等） |
| `agents` | 已启动的子 Agent 数量 |
| `todos` | 待办进度（已完成/总数） |

### 内置预设

| 预设 | 行数 | 包含元素 |
|------|------|----------|
| `full` | 3 | 全部元素 |
| `essential` | 2 | 模型、Git、上下文、用量、费用 |
| `minimal` | 1 | 模型、上下文 |

---

## 🎨 主题自定义

主题是 `themes/` 目录下的 TOML 文件，每个主题定义一套颜色和图标。

### 主题结构

```toml
name = "my-theme"

[colors]
modelColor = "cyan"
dirColor = "blue"
gitColor = "green"
contextColor = "cyan"
usageColor = "blue"
costColor = "gold"
effortColor = "yellow"
toolColor = "magenta"
agentColor = "brightMagenta"
todoColor = "green"
separatorColor = "dim"
barFill = "cyan"
barEmpty = "dim"

[icons]
model = "◈"
git = "⎇"
gitDirty = "✱"
dir = "⌂"
effort = "↯"
tool = "◐"
grep = "⌕"
read = "⊙"
write = "✎"
bash = "›_"
agent = "⊕"
todo = "☐"
todoDone = "☑"
cost = "◆"
clock = "◷"
context = "◈"
usage = "▦"
web = "⊕"
separator = "│"
```

### 可用颜色

| 名称 | ANSI 码 | 预览 |
|------|---------|------|
| `red` | `\x1b[31m` | 🔴 红色 |
| `green` | `\x1b[32m` | 🟢 绿色 |
| `yellow` | `\x1b[33m` | 🟡 黄色 |
| `blue` | `\x1b[34m` | 🔵 蓝色 |
| `magenta` | `\x1b[35m` | 🟣 紫色 |
| `cyan` | `\x1b[36m` | 🩵 青色 |
| `white` | `\x1b[37m` | ⚪ 白色 |
| `brightBlue` | `\x1b[94m` | 💠 亮蓝 |
| `brightMagenta` | `\x1b[95m` | 💜 亮紫 |
| `orange` | `\x1b[38;5;208m` | 🟠 橙色 |
| `gold` | `\x1b[38;5;220m` | 🟨 金色 |

### 创建自定义主题

1. 复制现有主题：`cp themes/cometix.toml themes/my-theme.toml`
2. 编辑颜色和图标
3. 在 `config.json` 中设置 `"theme": "my-theme"`

---

## 🚦 交通灯系统

所有健康指示器使用统一的交通灯配色：

| 指标 | 🟢 绿色 | 🟡 黄色 | 🔴 红色 |
|------|---------|---------|---------|
| 上下文（Context） | > 50%（余量充足） | 20–50%（开始紧张） | < 20%（快满了） |
| 用量（Usage） | < 50%（额度充足） | 50–80%（注意控制） | > 80%（快用完了） |
| 推理强度（Effort） | low（轻松） | medium（适中） | high（高压） |

> **说明：** 上下文的绿色表示"还有充足空间"（与用量相反）。这是有意设计的——高上下文百分比意味着你在充分利用窗口，而高用量百分比意味着你快用完配额了。

---

## 🔍 数据来源

### 1. Claude Code stdin JSON（主要数据源）

Claude Code 在每次提示时通过 stdin 管道传入 JSON，包含：
- 模型信息（名称、ID）
- 上下文窗口（输入/输出/缓存 token 数，最大窗口大小）
- 费用（总美元花费）
- 推理强度等级
- 工作目录、Git 分支/状态
- 会话 ID

### 2. Transcript JSONL（活动数据源）

从 `~/.claude/projects/*/sessions/*/transcript.jsonl` 解析：
- 工具调用记录（Edit、Read、Grep、Bash 等）
- 子 Agent 启动数量
- 待办进度（`[x]` / `[ ]` 模式匹配）
- 会话时长（首条 → 末条消息时间戳）

### 3. Git CLI（项目信息）

通过 `git` 命令采集：
- 当前分支
- Dirty 状态（是否有未提交的更改）
- 领先/落后远程分支
- 暂存、未暂存、未跟踪的文件数

---

## 📁 文件结构

```
cc-fusion/
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── src/
│   ├── index.ts          # 入口：读取 stdin → 解析 → 渲染 → 输出
│   ├── types.ts          # TypeScript 类型定义
│   ├── config.ts         # 配置 + TOML 主题 + 预设加载
│   ├── stdin.ts          # 解析 Claude Code stdin JSON
│   ├── transcript.ts     # 解析 transcript JSONL
│   ├── git.ts            # Git 信息采集（child_process）
│   ├── render.ts         # 主渲染引擎（组合所有元素）
│   ├── context.ts        # 上下文进度条 + 交通灯
│   ├── usage.ts          # 用量进度条 + 交通灯
│   ├── cost.ts           # 费用显示 + 智能隐藏
│   ├── effort.ts         # 推理强度 + 颜色
│   ├── i18n.ts           # 国际化加载器
│   └── utils.ts          # ANSI 颜色、进度条、工具函数
├── themes/
│   ├── cometix.toml      # 青绿 + 金色（默认）
│   ├── gruvbox.toml      # 暖色复古
│   ├── dracula.toml      # 现代暗紫
│   └── nord.toml         # 北欧冷色
├── presets/
│   ├── full.json         # 完整三行
│   ├── essential.json    # 核心两行
│   └── minimal.json      # 极简一行
├── i18n/
│   ├── en.json           # 英文
│   └── zh.json           # 中文
└── README.md
```

---

## 🌍 国际化

CC-Fusion 开箱支持英文和中文。在 `config.json` 中设置 `"lang": "zh"` 即可切换中文。

### 添加新语言

1. 复制 `i18n/en.json` 为 `i18n/<语言代码>.json`
2. 翻译其中的值
3. 在 `config.json` 中设置 `"lang": "<语言代码>"`

---

## 🛠️ 开发

```bash
# 监听模式（自动编译）
npm run dev

# 编译
npm run build

# 用示例 stdin 测试
echo '{"model":{"display_name":"Opus 4.6","id":"claude-opus-4-6"},"context_window":{"input_tokens":45000,"output_tokens":12000},"max_context_window_size":200000,"cost":{"total_cost_usd":0.42},"effortLevel":"high","cwd":"/home/user/project","sessionId":"test123"}' | node dist/index.js
```

---

## 📄 许可证

MIT

---

## 🙏 致谢

- [CCometixLine](https://github.com/Haleclipse/CCometixLine) — 视觉设计、TOML 主题系统、Nerd Font 图标、预设系统
- [Claude HUD](https://github.com/jarrodwatts/claude-hud) — Transcript 解析、token 明细分解、智能费用隐藏、国际化、元素排序
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — 本插件所扩展的 AI 编程工具
