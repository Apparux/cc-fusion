/**
 * utils.ts — Utility functions for statusline rendering
 */

import { COLORS, colorize } from './colors.js';

/**
 * Render a rounded, medium-flat progress bar.
 * Returns { filled, empty } for separate coloring.
 */
export function renderProgressBar(pct: number, width: number = 16): { filled: string; empty: string } {
  const normalizedPct = Math.max(0, Math.min(100, pct));
  const innerWidth = Math.max(1, width - 2);
  const filledInner = Math.round((normalizedPct / 100) * innerWidth);
  const emptyInner = innerWidth - filledInner;
  const leftCap = '';
  const rightCap = '';
  const barGlyph = '═';

  if (filledInner === 0) {
    return {
      filled: '',
      empty: `${leftCap}${barGlyph.repeat(innerWidth)}${rightCap}`,
    };
  }

  if (emptyInner === 0) {
    return {
      filled: `${leftCap}${barGlyph.repeat(innerWidth)}${rightCap}`,
      empty: '',
    };
  }

  return {
    filled: `${leftCap}${barGlyph.repeat(filledInner)}`,
    empty: `${barGlyph.repeat(emptyInner)}${rightCap}`,
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

/**
 * Strip ANSI escape sequences before display-width calculations.
 */
export function stripAnsi(text: string): string {
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

/**
 * Visible label width after removing ANSI sequences.
 *
 * This is a small wcwidth-style approximation for statusline labels: combining
 * marks and emoji variation selectors have zero width, CJK/fullwidth code
 * points and common emoji presentation characters count as two columns, and
 * everything else counts as one column.
 */
export function displayWidth(text: string): number {
  let width = 0;

  for (const char of stripAnsi(text)) {
    const codePoint = char.codePointAt(0) ?? 0;

    if (isZeroWidthCodePoint(codePoint)) continue;
    width += isWideCodePoint(codePoint) ? 2 : 1;
  }

  return width;
}

function isZeroWidthCodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x200d ||
    codePoint === 0xfe0e ||
    codePoint === 0xfe0f ||
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f) ||
    (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff)
  );
}

function isWideCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f000 && codePoint <= 0x1faff) ||
    (codePoint >= 0x1fc00 && codePoint <= 0x1fffd)
  );
}

/**
 * Width of the first line's title segment, used as the separator alignment target.
 */
export function firstSeparatorTargetWidth(model: string): number {
  return displayWidth(`👾 ${model}`);
}

/**
 * Join line parts while aligning only the first separator.
 */
export function joinWithAlignedFirstSeparator(parts: string[], targetFirstWidth: number): string {
  if (parts.length <= 1) return parts.join('');

  const [firstPart, ...restParts] = parts;
  const padding = ' '.repeat(Math.max(0, targetFirstWidth - displayWidth(firstPart)));
  const firstSeparator = colorize('  |  ', COLORS.gray);
  const remainingSeparator = colorize('  |  ', COLORS.gray);

  return `${firstPart}${padding}${firstSeparator}${restParts.join(remainingSeparator)}`;
}
