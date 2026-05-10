/**
 * usage.ts — Usage bar + traffic-light + reset countdown
 */

import type { Theme, StdinData } from './types.js';
import { extractUsageInfo } from './stdin.js';
import {
  progressBar,
  usageTrafficLight,
  trafficColor,
  colorize,
  bold,
  formatDuration,
} from './utils.js';

export interface UsageRenderOptions {
  width: number;
  threshold: number;
}

export function renderUsage(
  stdin: StdinData,
  theme: Theme,
  opts: UsageRenderOptions,
  i18n: Record<string, string>
): string | null {
  const usage = extractUsageInfo(stdin);
  if (!usage || usage.pct < opts.threshold) return null;

  const level = usageTrafficLight(usage.pct);
  const color = trafficColor(level, theme);
  const icon = colorize(theme.icons.usage, theme.colors.usageColor);
  const bar = progressBar(usage.pct, opts.width, '█', '░', theme.colors.barFill, theme.colors.barEmpty);
  const pctStr = colorize(bold(`${usage.pct}%`), color);

  let line = `${icon} ${i18n.usage || 'Use'} ${bar} ${pctStr}`;

  if (usage.resetAt) {
    const remainingMs = usage.resetAt - Date.now();
    if (remainingMs > 0) {
      const resetLabel = i18n.reset || 'reset';
      line += ` ${colorize(`(${resetLabel} ${formatDuration(remainingMs)})`, theme.colors.dim)}`;
    }
  }

  return line;
}
