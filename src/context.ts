/**
 * context.ts — Context bar + traffic-light rendering
 */

import type { Theme, StdinData } from './types.js';
import {
  progressBar,
  contextTrafficLight,
  trafficColor,
  formatTokens,
  colorize,
  bold,
  ANSI,
} from './utils.js';

export interface ContextRenderOptions {
  width: number;
  tokenBreakdownThreshold: number;
}

export function renderContext(
  stdin: StdinData,
  theme: Theme,
  opts: ContextRenderOptions,
  i18n: Record<string, string>
): string {
  const max = stdin.max_context_window_size || 200000;
  const ctx = stdin.context_window || {};
  const input = ctx.input_tokens || 0;
  const output = ctx.output_tokens || 0;
  const cacheCreate = ctx.cache_creation_input_tokens || 0;
  const cacheRead = ctx.cache_read_input_tokens || 0;
  const total = input + output + cacheCreate + cacheRead;
  const pct = Math.min(100, Math.round((total / max) * 100));

  const level = contextTrafficLight(pct);
  const color = trafficColor(level, theme);
  const icon = colorize(theme.icons.context, theme.colors.contextColor);
  const bar = progressBar(pct, opts.width, '█', '░', color, theme.colors.dim);
  const pctStr = colorize(bold(`${pct}%`), color);

  let line = `${icon} ${i18n.context || 'Ctx'} ${bar} ${pctStr}`;

  if (pct >= opts.tokenBreakdownThreshold) {
    const parts: string[] = [];
    parts.push(`${colorize('I', ANSI.cyan)}${formatTokens(input)}`);
    parts.push(`${colorize('O', ANSI.green)}${formatTokens(output)}`);
    if (cacheCreate > 0) parts.push(`${colorize('W', ANSI.orange)}${formatTokens(cacheCreate)}`);
    if (cacheRead > 0) parts.push(`${colorize('R', ANSI.brightBlue)}${formatTokens(cacheRead)}`);
    line += ` ${colorize('(', theme.colors.dim)}${parts.join(colorize('/', theme.colors.dim))}${colorize(')', theme.colors.dim)}`;
  }

  return line;
}
