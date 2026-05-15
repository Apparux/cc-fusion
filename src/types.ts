/**
 * types.ts — TypeScript interfaces for CC-Fusion statusline
 */

// ── Stdin JSON from Claude Code ──────────────────────────────────────────────

export interface ModelInfo {
  display_name?: string;
  id?: string;
}

export interface ContextUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ContextWindow extends ContextUsage {
  total_input_tokens?: number;
  total_output_tokens?: number;
  context_window_size?: number;
  used_percentage?: number | null;
  remaining_percentage?: number | null;
  current_usage?: ContextUsage | null;
}

export interface StdinData extends ContextUsage {
  model?: ModelInfo;
  context_window?: ContextWindow;
  cwd?: string;
  session_id?: string;
  sessionId?: string;
  transcript_path?: string;
  total_input_tokens?: number;
  total_output_tokens?: number;
  context_window_size?: number;
  max_context_window_size?: number;
  [key: string]: unknown;
}

// ── Transcript JSONL ─────────────────────────────────────────────────────────

export interface TranscriptToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input?: Record<string, unknown>;
}

export interface TranscriptMessage {
  type: 'assistant' | 'user' | 'system';
  message?: {
    role?: string;
    content?: string | Array<{ type: string; [key: string]: unknown }>;
  };
  [key: string]: unknown;
}

export type TranscriptEntry = TranscriptToolUse | TranscriptMessage;

// ── Aggregated Tool Stats ────────────────────────────────────────────────────

export interface ToolStats {
  lastRead?: string;
  lastEdit?: string;
  lastSearch?: string;
  agents: Array<{ name: string; status: string; color: string }>;
  todos: Array<{ id: number; name: string; status: 'done' | 'current' | 'pending' | 'future' }>;
  totalTodos: number;
  doneTodos: number;
}

// ── Git Info ─────────────────────────────────────────────────────────────────

export interface GitInfo {
  branch: string;
  dirty: boolean;
}

// ── Render Context ───────────────────────────────────────────────────────────

export interface RenderContext {
  stdin: StdinData;
  git: GitInfo | null;
  tools: ToolStats;
  model: string;
  project: string;
  contextPct: number;
  contextUsed: string;
  contextTotal: string;
}
