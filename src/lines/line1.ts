/**
 * line1.ts — Core info line (model, project, git)
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import { getEffortLevel } from '../stdin.js';
import { firstSeparatorTargetWidth, joinWithAlignedFirstSeparator } from '../utils.js';

function renderEffortLevel(level: string): string {
  const label = `🧿 ${level === 'ultra' ? 'ultracode' : level}`;

  switch (level) {
    case 'low':
      return colorize(label, COLORS.yellow);
    case 'medium':
      return colorize(label, COLORS.blue);
    case 'high':
      return colorize(label, COLORS.brightBlue);
    case 'xhigh':
      return colorize(label, COLORS.purple);
    case 'max':
      return `${COLORS.green}🧿 m${COLORS.brightBlue}a${COLORS.purple}x${COLORS.reset}`;
    case 'ultra':
    case 'ultracode':
      return colorize('🧿 ultracode', COLORS.deepPurple);
    default:
      return colorize(label, COLORS.gray);
  }
}

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

  const effort = getEffortLevel(ctx.stdin);
  if (effort) {
    parts.push(renderEffortLevel(effort));
  }

  return joinWithAlignedFirstSeparator(parts, firstSeparatorTargetWidth(ctx.model));
}
