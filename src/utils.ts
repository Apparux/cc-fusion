/**
 * utils.ts — Utility functions for statusline rendering
 */

import { COLORS } from './colors.js';

/**
 * Render a medium-flat progress bar.
 * Returns { filled, empty } for separate coloring.
 */
export function renderProgressBar(pct: number, width: number = 16): { filled: string; empty: string } {
  const normalizedPct = Math.max(0, Math.min(100, pct));
  const barWidth = Math.max(1, width);
  const filledCount = Math.round((normalizedPct / 100) * barWidth);
  const emptyCount = barWidth - filledCount;
  const barGlyph = '▬';

  return {
    filled: barGlyph.repeat(filledCount),
    empty: barGlyph.repeat(emptyCount),
  };
}

/**
 * Get traffic-light color based on percentage.
 * 0–59.9 green, 60–79.9 yellow, 80+ red.
 */
export function progressColor(pct: number): string {
  if (pct >= 80) return COLORS.red;
  if (pct >= 60) return COLORS.yellow;
  return COLORS.green;
}

/**
 * Format token count with k/M suffix
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return tokens.toString();
}

/**
 * Simplify model name for display
 */
export function simplifyModel(displayName?: string, id?: string): string {
  const name = displayName || id || 'Unknown';

  if (name.includes('Opus')) return 'Opus 4';
  if (name.includes('Sonnet')) return 'Sonnet 4';
  if (name.includes('Haiku')) return 'Haiku 4';

  return name;
}

/**
 * Get project name from cwd
 */
export function getProjectName(cwd?: string): string {
  if (!cwd) return 'Unknown';
  const parts = cwd.split('/');
  return parts[parts.length - 1] || 'Unknown';
}

/**
 * Shorten file path for display
 */
export function shortenPath(path: string): string {
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  return parts.slice(-2).join('/');
}
