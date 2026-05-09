/**
 * types.ts — TypeScript interfaces for CC-Fusion statusline
 */

// ── Stdin JSON from Claude Code ──────────────────────────────────────────────

export interface ModelInfo {
  display_name?: string;
  id?: string;
}

export interface ContextWindow {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface CostInfo {
  total_cost_usd?: number;
}

export interface StdinData {
  model?: ModelInfo;
  context_window?: ContextWindow;
  max_context_window_size?: number;
  cost?: CostInfo;
  effortLevel?: string;
  cwd?: string;
  gitBranch?: string;
  gitStatus?: string;
  sessionId?: string;
  version?: string;
  transcript_path?: string;
  [key: string]: unknown;
}

// ── Transcript JSONL ─────────────────────────────────────────────────────────

export interface TranscriptToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface TranscriptToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content?: string;
  is_error?: boolean;
}

export interface TranscriptMessage {
  type: 'assistant' | 'user' | 'system';
  message?: {
    role?: string;
    content?: string | Array<{ type: string; [key: string]: unknown }>;
  };
  [key: string]: unknown;
}

export type TranscriptEntry = TranscriptToolUse | TranscriptToolResult | TranscriptMessage;

// ── Aggregated Tool Stats ────────────────────────────────────────────────────

export interface ToolStats {
  edits: number;
  reads: number;
  greps: number;
  writes: number;
  bash: number;
  webFetches: number;
  totalCalls: number;
  lastEditFile?: string;
  agents: number;
  todos: { done: number; total: number };
}

// ── Git Info ─────────────────────────────────────────────────────────────────

export interface GitInfo {
  branch: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
}

// ── Theme (from TOML) ───────────────────────────────────────────────────────

export interface ThemeColors {
  reset: string;
  bold: string;
  dim: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlue: string;
  brightMagenta: string;
  orange: string;
  gold: string;
  modelColor: string;
  dirColor: string;
  gitColor: string;
  contextColor: string;
  usageColor: string;
  costColor: string;
  effortColor: string;
  toolColor: string;
  agentColor: string;
  todoColor: string;
  separatorColor: string;
  barFill: string;
  barEmpty: string;
}

export interface ThemeIcons {
  model: string;
  git: string;
  gitDirty: string;
  dir: string;
  effort: string;
  tool: string;
  grep: string;
  read: string;
  write: string;
  bash: string;
  agent: string;
  todo: string;
  todoDone: string;
  cost: string;
  clock: string;
  context: string;
  usage: string;
  web: string;
  separator: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  icons: ThemeIcons;
}

// ── Preset ───────────────────────────────────────────────────────────────────

export interface Preset {
  name: string;
  lines: string[][];
}

// ── Config ───────────────────────────────────────────────────────────────────

export interface Config {
  theme: string;
  preset: string;
  lang: string;
  hideCostFor: string[];
  usageThreshold: number;
  tokenBreakdownThreshold: number;
  barWidth: number;
  showTranscript: boolean;
}

// ── Render Context ───────────────────────────────────────────────────────────

export interface RenderContext {
  stdin: StdinData;
  git: GitInfo | null;
  tools: ToolStats;
  theme: Theme;
  preset: Preset;
  config: Config;
  i18n: Record<string, string>;
  model: string;
  dir: string;
  contextPct: number;
  usagePct: number;
  costUsd: number | null;
  duration: string;
  effort: string;
}
