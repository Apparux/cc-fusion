/**
 * line1.ts — Core info line (model, project, git)
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import { firstSeparatorTargetWidth, joinWithAlignedFirstSeparator } from '../utils.js';

export function renderLine1(ctx: RenderContext): string {
  const parts: string[] = [];

  // 👾 Model
  parts.push(colorize(`👾 ${ctx.model}`, COLORS.purple));

  // 🗃️ Project
  parts.push(colorize(`🗃️ ${ctx.project}`, COLORS.orange));

  // 🫯 Git branch + status
  if (ctx.git) {
    const status = ctx.git.dirty ? '🧱' : '🎯';
    parts.push(colorize(`🫯 ${ctx.git.branch} ${status}`, COLORS.yellow));
  }

  return joinWithAlignedFirstSeparator(parts, firstSeparatorTargetWidth(ctx.model));
}
