/**
 * utils.ts — Utility functions for statusline rendering
 */

import { COLORS } from './colors.js';

/**
 * Render a progress bar with filled and empty blocks
 */
export function renderProgressBar(pct: number, width: number = 10): string {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return '▓'.repeat(filled) + '▒'.repeat(empty);
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
