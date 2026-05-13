/**
 * line2.ts — Context info line with progress pill
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import { renderProgressBar, progressColor } from '../utils.js';

export function renderLine2(ctx: RenderContext): string {
  const parts: string[] = [];

  parts.push(colorize('🧠 Context', COLORS.pink));

  const pctColor = progressColor(ctx.contextPct);
  const { filled, empty } = renderProgressBar(ctx.contextPct, 16);
  parts.push(colorize(filled, pctColor) + colorize(empty, COLORS.dim));
  parts.push(colorize(`${ctx.contextPct.toFixed(1)}%`, pctColor));

  return parts.join('  ');
}
