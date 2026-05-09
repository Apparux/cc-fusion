/**
 * render.ts — Main render engine: composes all elements into 3 lines
 */

import type { RenderContext, Theme } from './types.js';
import { colorize, sep, simplifyModel, shortenDir, formatDuration, dim, ANSI } from './utils.js';
import { renderContext } from './context.js';
import { renderUsage } from './usage.js';
import { renderCost } from './cost.js';
import { renderEffort } from './effort.js';

// ── Element renderers ────────────────────────────────────────────────────────

function renderModel(rc: RenderContext): string {
  const icon = colorize(rc.theme.icons.model, rc.theme.colors.modelColor);
  const name = colorize(rc.model, rc.theme.colors.modelColor);
  return `${icon} ${name}`;
}

function renderDir(rc: RenderContext): string {
  const icon = colorize(rc.theme.icons.dir, rc.theme.colors.dirColor);
  const dir = colorize(rc.dir, rc.theme.colors.dirColor);
  return `${icon} ${dir}`;
}

function renderGit(rc: RenderContext): string | null {
  if (!rc.git) return null;

  const icon = rc.git.dirty
    ? colorize(rc.theme.icons.gitDirty, rc.theme.colors.gitColor)
    : colorize(rc.theme.icons.git, rc.theme.colors.gitColor);

  let branch = colorize(rc.git.branch, rc.theme.colors.gitColor);

  // Dirty indicator
  if (rc.git.dirty) {
    branch += colorize('*', rc.theme.colors.yellow);
  }

  let status = `${icon} ${branch}`;

  // Ahead/behind
  if (rc.git.ahead > 0) {
    status += colorize(` ↑${rc.git.ahead}`, rc.theme.colors.green);
  }
  if (rc.git.behind > 0) {
    status += colorize(` ↓${rc.git.behind}`, rc.theme.colors.red);
  }

  // File stats
  const stats: string[] = [];
  if (rc.git.staged > 0) stats.push(colorize(`+${rc.git.staged}`, rc.theme.colors.green));
  if (rc.git.unstaged > 0) stats.push(colorize(`~${rc.git.unstaged}`, rc.theme.colors.yellow));
  if (rc.git.untracked > 0) stats.push(colorize(`?${rc.git.untracked}`, rc.theme.colors.dim));
  if (stats.length > 0) {
    status += ` ${stats.join(' ')}`;
  }

  return status;
}

function renderContextElement(rc: RenderContext): string {
  return renderContext(rc.stdin, rc.theme, {
    width: rc.config.barWidth,
    showBreakdown: rc.stdin.effortLevel !== undefined,
  }, rc.i18n);
}

function renderUsageElement(rc: RenderContext): string | null {
  return renderUsage(rc.stdin, rc.theme, {
    width: rc.config.barWidth,
    threshold: rc.config.usageThreshold,
  }, rc.i18n);
}

function renderCostElement(rc: RenderContext): string | null {
  return renderCost(rc.stdin, rc.theme, rc.config, rc.i18n);
}

function renderDurationElement(rc: RenderContext): string | null {
  if (!rc.duration) return null;
  const icon = colorize(rc.theme.icons.clock, rc.theme.colors.dim);
  return `${icon} ${colorize(rc.duration, rc.theme.colors.dim)}`;
}

function renderEffortElement(rc: RenderContext): string | null {
  return renderEffort(rc.stdin, rc.theme, rc.i18n);
}

function renderTools(rc: RenderContext): string | null {
  const t = rc.tools;
  if (t.totalCalls === 0) return null;

  const parts: string[] = [];

  if (t.edits > 0) {
    const icon = colorize(rc.theme.icons.tool, rc.theme.colors.toolColor);
    const label = colorize(rc.i18n.edit || 'Edit', rc.theme.colors.toolColor);
    let editStr = `${icon} ${label}`;
    if (t.lastEditFile) {
      const fname = t.lastEditFile.split('/').pop() || t.lastEditFile;
      editStr += colorize(`: ${fname}`, rc.theme.colors.dim);
    }
    if (t.edits > 1) editStr += colorize(` ×${t.edits}`, rc.theme.colors.dim);
    parts.push(editStr);
  }

  if (t.reads > 0) {
    const icon = colorize(rc.theme.icons.read, rc.theme.colors.toolColor);
    parts.push(`${icon} ${colorize(rc.i18n.read || 'Read', rc.theme.colors.toolColor)}${colorize(` ×${t.reads}`, rc.theme.colors.dim)}`);
  }

  if (t.greps > 0) {
    const icon = colorize(rc.theme.icons.grep, rc.theme.colors.toolColor);
    parts.push(`${icon} ${colorize(rc.i18n.grep || 'Grep', rc.theme.colors.toolColor)}${colorize(` ×${t.greps}`, rc.theme.colors.dim)}`);
  }

  if (t.bash > 0) {
    const icon = colorize(rc.theme.icons.bash, rc.theme.colors.toolColor);
    parts.push(`${icon} ${colorize(rc.i18n.bash || 'Bash', rc.theme.colors.toolColor)}${colorize(` ×${t.bash}`, rc.theme.colors.dim)}`);
  }

  if (t.webFetches > 0) {
    const icon = colorize(rc.theme.icons.web, rc.theme.colors.toolColor);
    parts.push(`${icon} ${colorize(rc.i18n.web || 'Web', rc.theme.colors.toolColor)}${colorize(` ×${t.webFetches}`, rc.theme.colors.dim)}`);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

function renderAgents(rc: RenderContext): string | null {
  if (rc.tools.agents === 0) return null;
  const icon = colorize(rc.theme.icons.agent, rc.theme.colors.agentColor);
  return `${icon} ${colorize(`${rc.tools.agents}`, rc.theme.colors.agentColor)}`;
}

function renderTodos(rc: RenderContext): string | null {
  const { done, total } = rc.tools.todos;
  if (total === 0) return null;

  const icon = done === total
    ? colorize(rc.theme.icons.todoDone, rc.theme.colors.todoColor)
    : colorize(rc.theme.icons.todo, rc.theme.colors.todoColor);

  return `${icon} ${colorize(`${done}/${total}`, rc.theme.colors.todoColor)}`;
}

// ── Element registry ─────────────────────────────────────────────────────────

const ELEMENT_RENDERERS: Record<string, (rc: RenderContext) => string | null> = {
  model: renderModel,
  dir: renderDir,
  git: renderGit,
  context: renderContextElement,
  usage: renderUsageElement,
  cost: renderCostElement,
  duration: renderDurationElement,
  effort: renderEffortElement,
  tools: renderTools,
  agents: renderAgents,
  todos: renderTodos,
};

// ── Main render ──────────────────────────────────────────────────────────────

export function render(rc: RenderContext): string {
  const lines: string[] = [];

  for (const lineElements of rc.preset.lines) {
    const parts: string[] = [];

    for (const elem of lineElements) {
      const renderer = ELEMENT_RENDERERS[elem];
      if (!renderer) continue;

      const result = renderer(rc);
      if (result !== null) {
        parts.push(result);
      }
    }

    if (parts.length > 0) {
      lines.push(parts.join(sep(rc.theme)));
    }
  }

  return lines.join('\n');
}
