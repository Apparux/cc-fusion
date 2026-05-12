/**
 * line2.ts — Context info line (token usage with progress bar)
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import { renderProgressBar } from '../utils.js';

export function renderLine2(ctx: RenderContext): string {
  const parts: string[] = [];

  // 🧠 Context label
  parts.push(colorize('🧠 Context', COLORS.pink));

  // ● Percentage indicator
  parts.push(colorize(`● ${ctx.contextPct.toFixed(1)}%`, COLORS.purple));

  // Progress bar
  const bar = renderProgressBar(ctx.contextPct, 10);
  parts.push(colorize(bar, COLORS.purple));

  // Token usage
  parts.push(colorize(`${ctx.contextUsed} / ${ctx.contextTotal} tokens`, COLORS.cyan));

  // Percentage badge
  parts.push(colorize(`[${ctx.contextPct.toFixed(1)}%]`, COLORS.purple));

  return parts.join('  ');
}
