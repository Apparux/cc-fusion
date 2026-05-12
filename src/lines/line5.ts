/**
 * line5.ts — Recent agents line
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';

export function renderLine5(ctx: RenderContext): string {
  const parts: string[] = [];

  // 🌀 Agents label
  parts.push(colorize('🌀 Agents', COLORS.brightCyan));

  // Recent agents (not "running")
  if (ctx.tools.agents.length > 0) {
    for (const agent of ctx.tools.agents) {
      const dot = agent.color === 'green' ? '🟢' :
                  agent.color === 'orange' ? '🟠' :
                  agent.color === 'blue' ? '🔵' :
                  agent.color === 'purple' ? '🟣' : '⚪';
      parts.push(colorize(`${dot} ${agent.name}`, COLORS.cyan));
    }
  } else {
    parts.push(colorize('无最近 Agent', COLORS.dim));
  }

  return parts.join(colorize('  |  ', COLORS.gray));
}
