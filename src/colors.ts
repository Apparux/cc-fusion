/**
 * colors.ts — ANSI color codes for statusline rendering
 */

export const COLORS = {
  // Basic colors
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Standard colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright colors
  brightBlue: '\x1b[94m',
  brightCyan: '\x1b[96m',
  brightMagenta: '\x1b[95m',

  // 256-color palette
  purple: '\x1b[38;5;141m',
  orange: '\x1b[38;5;208m',
  pink: '\x1b[38;5;213m',
  gray: '\x1b[38;5;240m',

  // Backgrounds
  bgPurple: '\x1b[48;5;141m',
  bgCyan: '\x1b[46m',
} as const;

export function colorize(text: string, color: string): string {
  return `${color}${text}${COLORS.reset}`;
}
