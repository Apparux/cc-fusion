/**
 * line3.ts — Tool activity line (read, edit, search)
 */

import type { RenderContext } from '../types.js';
import { COLORS, colorize } from '../colors.js';
import { shortenPath } from '../utils.js';

export function renderLine3(ctx: RenderContext): string {
  const parts: string[] = [];

  // ⚡ Activity label
  parts.push(colorize('⚡ Activity', COLORS.brightBlue));

  // 📖 Read
  if (ctx.tools.lastRead) {
    const path = shortenPath(ctx.tools.lastRead);
    parts.push(colorize(`📖 Read ${path}`, COLORS.cyan));
  }

  // ✏️ Edit
  if (ctx.tools.lastEdit) {
    const path = shortenPath(ctx.tools.lastEdit);
    parts.push(colorize(`✏️ Edit ${path}`, COLORS.yellow));
  }

  // 🔍 Search
  if (ctx.tools.lastSearch) {
    parts.push(colorize(`🔍 Search "${ctx.tools.lastSearch}"`, COLORS.magenta));
  }

  // If no activity, show idle
  if (!ctx.tools.lastRead && !ctx.tools.lastEdit && !ctx.tools.lastSearch) {
    parts.push(colorize('空闲中', COLORS.dim));
  }

  return parts.join(colorize('  |  ', COLORS.gray));
}
