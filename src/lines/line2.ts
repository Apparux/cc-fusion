/**
 * line2.ts — Context info line with progress pill
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import {
  firstSeparatorTargetWidth,
  joinWithAlignedFirstSeparator,
  renderProgressBar,
  progressColor,
} from '../utils.js';

export function renderLine2(ctx: RenderContext): string {
  const parts: string[] = [];

  parts.push(colorize('🧠 Context', COLORS.pink));

  const pctColor = progressColor(ctx.contextPct);
  const contextParts: string[] = [];
  contextParts.push(colorize(`● ${ctx.contextPct.toFixed(1)}%`, pctColor));

  const { filled, empty } = renderProgressBar(ctx.contextPct, 16);
  contextParts.push(colorize(filled, pctColor) + colorize(empty, COLORS.dim));
  contextParts.push(colorize(`${ctx.contextUsed} / ${ctx.contextTotal} tokens`, COLORS.cyan));

  parts.push(contextParts.join('  '));

  return joinWithAlignedFirstSeparator(parts, firstSeparatorTargetWidth(ctx.model));
}
