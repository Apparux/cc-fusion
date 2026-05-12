/**
 * line2.ts — Context info line (token usage with progress bar)
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import { renderProgressBar, progressColor } from '../utils.js';

export function renderLine2(ctx: RenderContext): string {
  const parts: string[] = [];

  // 🧠 Context label
  parts.push(colorize('🧠 Context', COLORS.pink));

  // ● Percentage indicator (traffic-light colored)
  const pctColor = progressColor(ctx.contextPct);
  parts.push(colorize(`● ${ctx.contextPct.toFixed(1)}%`, pctColor));

  // Progress bar with traffic-light coloring
  const { filled, empty } = renderProgressBar(ctx.contextPct, 10);
  parts.push(colorize(filled, pctColor) + colorize(empty, COLORS.dim));

  // Token usage
  parts.push(colorize(`${ctx.contextUsed} / ${ctx.contextTotal} tokens`, COLORS.cyan));

  return parts.join('  ');
}
