/**
 * stdin.ts — Parse Claude Code stdin JSON
 */

import type { StdinData, UsageInfo, UsageMetric } from './types.js';

export function parseStdin(jsonStr: string): StdinData {
  try {
    const data = JSON.parse(jsonStr);
    return data as StdinData;
  } catch {
    return {};
  }
}

export function getSessionId(stdin: StdinData): string | undefined {
  return stdin.sessionId || stdin.session_id;
}

export function getCwd(stdin: StdinData): string | undefined {
  return stdin.cwd || stdin.workspace?.current_dir || stdin.workspace?.project_dir;
}

export function getProjectDir(stdin: StdinData): string | undefined {
  return stdin.workspace?.project_dir || getCwd(stdin);
}

export function getEffortLevel(stdin: StdinData): string | undefined {
  return stdin.effortLevel || stdin.effort_level;
}

export function getProvider(stdin: StdinData): string | undefined {
  return stdin.provider || stdin.api_provider;
}

export function getContextWindowSize(stdin: StdinData): number {
  return stdin.context_window?.context_window_size || stdin.max_context_window_size || 0;
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

/**
 * Calculate context usage percentage.
 * Total tokens used vs max context window.
 */
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

function asMetric(value: unknown): UsageMetric | null {
  if (typeof value === 'number') return { percent: value };
  if (typeof value !== 'object' || value === null) return null;
  return value as UsageMetric;
}

function numberFrom(metric: UsageMetric, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = metric[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function parseResetAt(metric: UsageMetric): number | undefined {
  const value = metric.reset_at ?? metric.resets_at ?? metric.reset_time ?? metric.next_reset ?? metric.reset;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function usageFromMetric(metric: UsageMetric | null): UsageInfo | null {
  if (!metric) return null;

  const directPct = numberFrom(metric, ['percent', 'percentage', 'pct']);
  const used = numberFrom(metric, ['used', 'consumed', 'current']);
  const limit = numberFrom(metric, ['limit', 'max', 'total']);
  const remaining = numberFrom(metric, ['remaining']);

  let pct: number | undefined = directPct;
  if (pct === undefined && used !== undefined && limit !== undefined && limit > 0) {
    pct = (used / limit) * 100;
  }
  if (pct === undefined && remaining !== undefined && limit !== undefined && limit > 0) {
    pct = ((limit - remaining) / limit) * 100;
  }
  if (pct === undefined || !Number.isFinite(pct)) return null;

  return {
    pct: Math.max(0, Math.min(100, Math.round(pct))),
    resetAt: parseResetAt(metric),
  };
}

export function extractUsageInfo(stdin: StdinData): UsageInfo | null {
  const metrics = [stdin.rate_limit, stdin.usage, stdin.limits];
  for (const metric of metrics) {
    const usage = usageFromMetric(asMetric(metric));
    if (usage) return usage;
  }
  return null;
}

export function calcUsagePct(stdin: StdinData): number {
  return extractUsageInfo(stdin)?.pct ?? 0;
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
  const max = getContextWindowSize(stdin);
  if (!max || max <= 0) return null;

  const { input, output, cacheCreate, cacheRead, total } = getContextTokens(stdin);
  const pct = calcContextPct(stdin);
  if (pct < 85) return null;

  return { input, output, cacheCreate, cacheRead, total, max };
}

/**
 * Build a transcript path hint from stdin data.
 */
export function getTranscriptPath(stdin: StdinData): string | null {
  if (stdin.transcript_path) return stdin.transcript_path;

  const sid = getSessionId(stdin);
  const cwd = getCwd(stdin);
  if (!sid || !cwd) return null;

  const home = process.env.HOME || '/root';
  const encoded = cwd.replace(/\//g, '-').replace(/^-/, '');
  return `${home}/.claude/projects/${encoded}/sessions/${sid}/transcript.jsonl`;
}
