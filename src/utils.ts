/**
 * utils.ts — ANSI color helpers, progress bar, icon wrappers
 */

import type { Theme } from './types.js';

// ── ANSI escape codes (base) ─────────────────────────────────────────────────

export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  orange: '\x1b[38;5;208m',
  gold: '\x1b[38;5;220m',
} as const;

// ── Color helper ─────────────────────────────────────────────────────────────

export function colorize(text: string, colorCode: string): string {
  return `${colorCode}${text}${ANSI.reset}`;
}

export function bold(text: string): string {
  return `${ANSI.bold}${text}${ANSI.reset}`;
}

export function dim(text: string): string {
  return `${ANSI.dim}${text}${ANSI.reset}`;
}

// ── Progress bar ─────────────────────────────────────────────────────────────

export function progressBar(
  pct: number,
  width: number,
  fillChar: string,
  emptyChar: string,
  fillColor: string,
  emptyColor: string
): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const fill = fillColor + fillChar.repeat(filled);
  const emptyPart = emptyColor + emptyChar.repeat(empty);
  return `${fill}${emptyPart}${ANSI.reset}`;
}

// ── Traffic-light color selector ─────────────────────────────────────────────

export type TrafficLevel = 'green' | 'yellow' | 'red';

export function contextTrafficLight(pct: number): TrafficLevel {
  if (pct > 50) return 'green';
  if (pct > 20) return 'yellow';
  return 'red';
}

export function usageTrafficLight(pct: number): TrafficLevel {
  if (pct < 50) return 'green';
  if (pct < 80) return 'yellow';
  return 'red';
}

export function effortTrafficLight(effort: string): TrafficLevel {
  const e = effort.toLowerCase();
  if (e === 'low' || e === 'none') return 'green';
  if (e === 'medium') return 'yellow';
  return 'red';
}

export function trafficColor(level: TrafficLevel, theme: Theme): string {
  switch (level) {
    case 'green': return theme.colors.green;
    case 'yellow': return theme.colors.yellow;
    case 'red': return theme.colors.red;
  }
}

// ── Model name simplifier ────────────────────────────────────────────────────

export function simplifyModel(displayName: string | undefined, modelId: string | undefined): string {
  const raw = displayName || modelId || 'Unknown';

  // Try pattern: "claude-<family>-<version>" → "Family X.Y"
  const idMatch = (modelId || '').match(
    /^claude-(opus|sonnet|haiku)-(\d+)-(\d+)$/i
  );
  if (idMatch) {
    const family = idMatch[1].charAt(0).toUpperCase() + idMatch[1].slice(1).toLowerCase();
    return `${family} ${idMatch[2]}.${idMatch[3]}`;
  }

  // Try displayName patterns like "Claude Opus 4" or "Claude Sonnet 4.6"
  const dnMatch = raw.match(/(Opus|Sonnet|Haiku)\s*([\d.]+)/i);
  if (dnMatch) {
    return `${dnMatch[1]} ${dnMatch[2]}`;
  }

  // Fallback: strip "claude-" prefix if present
  if (raw.toLowerCase().startsWith('claude-')) {
    return raw.slice(7);
  }

  return raw;
}

// ── Directory shortener ──────────────────────────────────────────────────────

export function shortenDir(cwd: string | undefined, home: string | undefined): string {
  if (!cwd) return '?';
  const h = home || process.env.HOME || '/root';
  let d = cwd;
  if (d.startsWith(h)) {
    d = '~' + d.slice(h.length);
  }
  // If path is very long, keep last 3 segments
  const parts = d.split('/').filter(Boolean);
  if (parts.length > 4) {
    return '…/' + parts.slice(-3).join('/');
  }
  return d;
}

// ── Duration formatter ───────────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  if (ms < 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m${secs > 0 ? secs + 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? mins + 'm' : ''}`;
}

// ── Safe number formatting ───────────────────────────────────────────────────

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatCost(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(4)}`;
}

// ── Separator helper ─────────────────────────────────────────────────────────

export function sep(theme: Theme): string {
  return colorize(` ${theme.icons.separator} `, theme.colors.separatorColor);
}
