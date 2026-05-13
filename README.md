# CC-Fusion

> **Claude Code 5-Line Statusline** — A minimalist, emoji-rich statusline for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with fixed 5-line layout, progress bars, and real-time activity tracking.

A TypeScript CLI for Claude Code that renders a colorful 5-line statusline directly in your terminal — showing model info, context usage, tool activity, agent tracking, and task progress at a glance.

🌐 English | [中文文档](README.zh.md)

---

## 📸 Preview

![CC-Fusion statusline design overview](docs/assets/statusline-design-overview.png)

![CC-Fusion statusline design draft](docs/assets/statusline-design-draft.png)

```
👾 Sonnet 4  |  🧰 cc-fusion  |  🌟 main ✅
🧠 Context  ● 78.0%  ▓▓▓▓▓▓▓▓▒▒  168.4k / 200.0k tokens  [78.0%]
⚡ Activity  |  📖 Read src/index.ts  |  ✏️ Edit utils/parser.ts  |  🔍 Search "token limit"  刚刚
🌀 Agents  |  🟢 Planner 分析需求  |  🟠 Coder 实现功能  |  🔵 Reviewer 审查代码  |  3 运行中
💤 Tasks  |  ✅ 1/5 需求分析  |  ✅ 2/5 设计方案  |  ⚡ 3/5 编码实现  |  ⏳ 4/5 测试验证  |  🕒 5/5 部署上线  |  40%
```

### 5-Line Layout

1. **核心信息** (Core Info) — 👾 Model | 🧰 Project | 🌟 Git branch + status
2. **上下文信息** (Context) — 🧠 Token usage with progress bar and percentage
3. **工具活动** (Activity) — ⚡ Recent file reads, edits, and searches
4. **Agent 追踪** (Agents) — 🌀 Running sub-agents with status indicators
5. **待办进度** (Tasks) — 💤 Task completion progress with status icons

---

## 🚀 Installation

### Prerequisites

- **Node.js** ≥ 18
- **Claude Code** CLI installed
- **Nerd Font** (for icons) — recommended: [JetBrains Mono Nerd Font](https://www.nerdfonts.com/)

### Install via npm

```bash
npm install -g cc-fusion
```

### Update via npm

```bash
npm install -g cc-fusion@latest
cc-fusion --version
```

### Manual Install (from source)

```bash
# Clone
git clone https://github.com/Apparux/cc-fusion.git
cd cc-fusion

# Install & build
npm install
npm run build
```

### Configure Claude Code

Add this to your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "cc-fusion",
    "padding": 0
  }
}
```

For manual installs, use the local build path:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/cc-fusion/dist/index.js",
    "padding": 0
  }
}
```

Restart Claude Code and you're done!

---

## 📊 What Each Line Shows

### Line 1: Core Info
- **👾 Model** — Simplified model name (Opus 4, Sonnet 4, Haiku 4)
- **🧰 Project** — Current project directory name
- **🌟 Git** — Branch name + status (✅ clean, ⚠️ dirty)

### Line 2: Context Usage
- **🧠 Context** — Label
- **● Percentage** — Current context usage
- **Progress bar** — Visual representation (▓▓▓▓▓▓▓▓▒▒)
- **Token count** — Used / Total tokens
- **Badge** — Percentage in brackets

### Line 3: Tool Activity
- **⚡ Activity** — Label
- **📖 Read** — Last file read
- **✏️ Edit** — Last file edited
- **🔍 Search** — Last search query
- **刚刚** — Time indicator (shows "空闲中" when idle)

### Line 4: Agent Tracking
- **🌀 Agents** — Label
- **Status dots** — 🟢 Green, 🟠 Orange, 🔵 Blue, 🟣 Purple, ⚪ White
- **Agent info** — Name + current task
- **Count** — Number of running agents (shows "无活动 Agent" when idle)

### Line 5: Task Progress
- **💤 Tasks** — Label
- **Status icons** — ✅ Done, ⚡ Current, ⏳ Pending, 🕒 Future
- **Task list** — ID/Total + task name
- **Progress** — Overall completion percentage (shows "无待办任务" when idle)

---

## 🔍 Data Sources

### 1. Claude Code Stdin JSON
Primary data source piped from Claude Code on every prompt:
- Model info (name, ID)
- Context window (input/output/cache tokens, max size)
- Working directory
- Session ID

### 2. Git CLI
Collected via `git` commands:
- Current branch
- Dirty state (uncommitted changes)

### 3. Transcript JSONL
Parsed from `~/.claude/projects/` transcript files:
- Tool calls (Read, Edit, Grep, etc.)
- Agent spawns
- Task progress

---

## 🛠️ Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Test with sample stdin
printf '{"model":{"display_name":"Claude Sonnet 4","id":"claude-sonnet-4"},"context_window":{"total_input_tokens":156400,"total_output_tokens":12000,"context_window_size":200000,"used_percentage":78.2},"cwd":"/Users/user/project"}' | node dist/index.js
```

---

## 📁 Architecture

```
cc-fusion/
├── src/
│   ├── index.ts          # Entry point: read stdin, render, output
│   ├── types.ts          # TypeScript interfaces
│   ├── colors.ts         # ANSI color codes
│   ├── utils.ts          # Progress bar, formatters
│   ├── stdin.ts          # Parse Claude Code stdin JSON
│   ├── git.ts            # Git info via child_process
│   ├── transcript.ts     # Parse transcript JSONL
│   ├── render.ts         # Main renderer (composes 5 lines)
│   └── lines/
│       ├── line1.ts      # Core info renderer
│       ├── line2.ts      # Context renderer
│       ├── line3.ts      # Activity renderer
│       ├── line4.ts      # Agents renderer
│       └── line5.ts      # Tasks renderer
├── package.json
├── tsconfig.json
└── README.md
```

### Design Principles

- **Fixed layout** — Always 5 lines, no configuration needed
- **Hardcoded colors** — Purple, orange, yellow, cyan, blue palette
- **Emoji-first** — Visual indicators for quick scanning
- **Zero config** — Works out of the box

---

## 📄 License

MIT

---

## 🙏 Credits

- Inspired by [CCometixLine](https://github.com/Haleclipse/CCometixLine) and [Claude HUD](https://github.com/jarrodwatts/claude-hud)
- Built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
