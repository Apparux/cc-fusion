/**
 * line5.ts — Task progress line
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';

export function renderLine5(ctx: RenderContext): string {
  const parts: string[] = [];

  // 💤 Tasks label
  parts.push(colorize('💤 Tasks', COLORS.purple));

  // Task list
  if (ctx.tools.todos.length > 0) {
    for (const todo of ctx.tools.todos) {
      const icon = todo.status === 'done' ? '✅' :
                   todo.status === 'current' ? '⚡' :
                   todo.status === 'pending' ? '⏳' : '🕒';
      const text = `${icon} ${todo.id}/${ctx.tools.totalTodos} ${todo.name}`;

      const color = todo.status === 'done' ? COLORS.green :
                    todo.status === 'current' ? COLORS.yellow :
                    COLORS.dim;

      parts.push(colorize(text, color));
    }

    // Overall progress percentage
    const progressPct = Math.round((ctx.tools.doneTodos / ctx.tools.totalTodos) * 100);
    parts.push(colorize(`${progressPct}%`, COLORS.purple));
  } else {
    parts.push(colorize('无待办任务', COLORS.dim));
  }

  return parts.join(colorize('  |  ', COLORS.gray));
}
