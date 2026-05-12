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

export function getCwd(stdin: StdinData): string | undefined {
  return stdin.cwd;
}

export function getContextWindowSize(stdin: StdinData): number {
  return stdin.context_window?.context_window_size || 0;
}

export function getContextTokens(stdin: StdinData): {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  total: number;
} {
  const ctx = stdin.context_window || {};
  const usage = ctx.current_usage || ctx;
  const input = usage.input_tokens ?? ctx.total_input_tokens ?? 0;
  const output = usage.output_tokens ?? ctx.total_output_tokens ?? 0;
  const cacheCreate = usage.cache_creation_input_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const total = ctx.total_input_tokens !== undefined
    ? ctx.total_input_tokens + (ctx.total_output_tokens || 0)
    : input + output + cacheCreate + cacheRead;

  return { input, output, cacheCreate, cacheRead, total };
}

export function calcContextPct(stdin: StdinData): number {
  const directPct = stdin.context_window?.used_percentage;
  if (typeof directPct === 'number' && Number.isFinite(directPct)) {
    return Math.max(0, Math.min(100, Math.round(directPct)));
  }

  const max = getContextWindowSize(stdin);
  if (!max || max <= 0) return 0;

  const { total } = getContextTokens(stdin);
  return Math.min(100, Math.round((total / max) * 100));
}
