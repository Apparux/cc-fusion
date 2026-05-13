/**
 * line5.ts — Recent agents line
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import { firstSeparatorTargetWidth, joinWithAlignedFirstSeparator } from '../utils.js';

export function renderLine5(ctx: RenderContext): string {
  const parts: string[] = [];

  // 🌀 Agents label
  parts.push(colorize('🌀 Agents', COLORS.brightCyan));

  // Recent agents (not "running")
  if (ctx.tools.agents.length > 0) {
    const groupedAgents = new Map<string, { color: string; count: number }>();
    for (const agent of ctx.tools.agents) {
      const group = groupedAgents.get(agent.name);
      if (group) {
        group.count += 1;
      } else {
        groupedAgents.set(agent.name, { color: agent.color, count: 1 });
      }
    }

    for (const [name, group] of groupedAgents) {
      const dot = group.color === 'green' ? '🟢' :
                  group.color === 'orange' ? '🟠' :
                  group.color === 'blue' ? '🔵' :
                  group.color === 'purple' ? '🟣' : '⚪';
      const count = group.count > 1 ? ` x${group.count}` : '';
      parts.push(colorize(`${dot} ${name}${count}`, COLORS.cyan));
    }
  } else {
    parts.push(colorize('无最近 Agent', COLORS.dim));
  }

  return joinWithAlignedFirstSeparator(parts, firstSeparatorTargetWidth(ctx.model));
}
