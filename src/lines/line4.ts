/**
 * line4.ts — Agent tracking line
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';

export function renderLine4(ctx: RenderContext): string {
  const parts: string[] = [];

  // 🌀 Agents label
  parts.push(colorize('🌀 Agents', COLORS.brightCyan));

  // Agent status
  if (ctx.tools.agents.length > 0) {
    for (const agent of ctx.tools.agents) {
      const dot = agent.color === 'green' ? '🟢' :
                  agent.color === 'orange' ? '🟠' :
                  agent.color === 'blue' ? '🔵' :
                  agent.color === 'purple' ? '🟣' : '⚪';
      parts.push(colorize(`${dot} ${agent.name} ${agent.status}`, COLORS.cyan));
    }

    // Running count
    const runningCount = ctx.tools.agents.length;
    parts.push(colorize(`${runningCount} 运行中`, COLORS.brightBlue));
  } else {
    parts.push(colorize('无活动 Agent', COLORS.dim));
  }

  return parts.join(colorize('  |  ', COLORS.gray));
}
