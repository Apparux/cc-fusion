/**
 * usage.ts — Usage bar + traffic-light + 7-day threshold
 */

import type { Theme, StdinData } from './types.js';
import {
  progressBar,
  usageTrafficLight,
  trafficColor,
  colorize,
  bold,
} from './utils.js';

export interface UsageRenderOptions {
  width: number;
  threshold: number; // Only show if ≥ this %
  resetCountdown?: string;
}

export function renderUsage(
  stdin: StdinData,
  theme: Theme,
  opts: UsageRenderOptions,
  i18n: Record<string, string>
): string | null {
  const max = stdin.max_context_window_size || 200000;
  const ctx = stdin.context_window || {};
  const total =
    (ctx.input_tokens || 0) +
    (ctx.output_tokens || 0) +
    (ctx.cache_creation_input_tokens || 0) +
    (ctx.cache_read_input_tokens || 0);
  const pct = Math.min(100, Math.round((total / max) * 100));

  // Only show if above threshold (7-day usage rule)
  if (pct < opts.threshold) return null;

  const level = usageTrafficLight(pct);
  const color = trafficColor(level, theme);
  const icon = colorize(theme.icons.usage, theme.colors.usageColor);
  const bar = progressBar(pct, opts.width, '█', '░', color, theme.colors.dim);
  const pctStr = colorize(bold(`${pct}%`), color);

  let line = `${icon} ${i18n.usage || 'Use'} ${bar} ${pctStr}`;

  if (opts.resetCountdown) {
    line += ` ${colorize(`(${opts.resetCountdown})`, theme.colors.dim)}`;
  }

  return line;
}
