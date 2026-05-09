/**
 * stdin.ts — Parse Claude Code stdin JSON
 */

import type { StdinData } from './types.js';

export function parseStdin(jsonStr: string): StdinData {
  try {
    const data = JSON.parse(jsonStr);
    return data as StdinData;
  } catch {
    return {};
  }
}

/**
 * Calculate context usage percentage.
 * Total tokens used vs max context window.
 */
export function calcContextPct(stdin: StdinData): number {
  const max = stdin.max_context_window_size;
  if (!max || max <= 0) return 0;

  const ctx = stdin.context_window || {};
  const total =
    (ctx.input_tokens || 0) +
    (ctx.output_tokens || 0) +
    (ctx.cache_creation_input_tokens || 0) +
    (ctx.cache_read_input_tokens || 0);

  return Math.min(100, Math.round((total / max) * 100));
}

/**
 * Calculate usage percentage (simplified — input + output vs max).
 * This is the "token budget" metric distinct from context fill.
 */
export function calcUsagePct(stdin: StdinData): number {
  return calcContextPct(stdin); // Same source; callers may layer 7-day logic
}

/**
 * Get token breakdown for ≥85% display.
 */
export function getTokenBreakdown(stdin: StdinData): {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  total: number;
  max: number;
} | null {
  const max = stdin.max_context_window_size;
  if (!max || max <= 0) return null;

  const ctx = stdin.context_window || {};
  const input = ctx.input_tokens || 0;
  const output = ctx.output_tokens || 0;
  const cacheCreate = ctx.cache_creation_input_tokens || 0;
  const cacheRead = ctx.cache_read_input_tokens || 0;
  const total = input + output + cacheCreate + cacheRead;

  const pct = (total / max) * 100;
  if (pct < 85) return null;

  return { input, output, cacheCreate, cacheRead, total, max };
}

/**
 * Build a transcript path hint from stdin data.
 */
export function getTranscriptPath(stdin: StdinData): string | null {
  if (stdin.transcript_path) return stdin.transcript_path;
  
  // Try to construct from sessionId and cwd
  const sid = stdin.sessionId;
  const cwd = stdin.cwd;
  if (!sid || !cwd) return null;

  // Claude Code convention: ~/.claude/projects/<encoded-cwd>/sessions/<sessionId>/transcript.jsonl
  const home = process.env.HOME || '/root';
  const encoded = cwd.replace(/\//g, '-').replace(/^-/, '');
  return `${home}/.claude/projects/${encoded}/sessions/${sid}/transcript.jsonl`;
}
