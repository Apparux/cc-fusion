"use strict";
/**
 * render.ts — Main render engine: composes preset elements into lines
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = render;
const utils_js_1 = require("./utils.js");
const context_js_1 = require("./context.js");
const usage_js_1 = require("./usage.js");
const cost_js_1 = require("./cost.js");
const effort_js_1 = require("./effort.js");
// ── Element renderers ────────────────────────────────────────────────────────
function renderModel(rc) {
    const icon = (0, utils_js_1.colorize)(rc.theme.icons.model, rc.theme.colors.modelColor);
    const name = (0, utils_js_1.colorize)(rc.model, rc.theme.colors.modelColor);
    return `${icon} ${name}`;
}
function renderDir(rc) {
    const icon = (0, utils_js_1.colorize)(rc.theme.icons.dir, rc.theme.colors.dirColor);
    const dir = (0, utils_js_1.colorize)(rc.dir, rc.theme.colors.dirColor);
    return `${icon} ${dir}`;
}
function renderGit(rc) {
    if (!rc.git)
        return null;
    const icon = rc.git.dirty
        ? (0, utils_js_1.colorize)(rc.theme.icons.gitDirty, rc.theme.colors.gitColor)
        : (0, utils_js_1.colorize)(rc.theme.icons.git, rc.theme.colors.gitColor);
    let branch = (0, utils_js_1.colorize)(rc.git.branch, rc.theme.colors.gitColor);
    // Dirty indicator
    if (rc.git.dirty) {
        branch += (0, utils_js_1.colorize)('*', rc.theme.colors.yellow);
    }
    let status = `${icon} ${branch}`;
    // Ahead/behind
    if (rc.git.ahead > 0) {
        status += (0, utils_js_1.colorize)(` ↑${rc.git.ahead}`, rc.theme.colors.green);
    }
    if (rc.git.behind > 0) {
        status += (0, utils_js_1.colorize)(` ↓${rc.git.behind}`, rc.theme.colors.red);
    }
    // File stats
    const stats = [];
    if (rc.git.staged > 0)
        stats.push((0, utils_js_1.colorize)(`+${rc.git.staged}`, rc.theme.colors.green));
    if (rc.git.unstaged > 0)
        stats.push((0, utils_js_1.colorize)(`~${rc.git.unstaged}`, rc.theme.colors.yellow));
    if (rc.git.untracked > 0)
        stats.push((0, utils_js_1.colorize)(`?${rc.git.untracked}`, rc.theme.colors.dim));
    if (stats.length > 0) {
        status += ` ${stats.join(' ')}`;
    }
    return status;
}
function renderContextElement(rc) {
    return (0, context_js_1.renderContext)(rc.stdin, rc.theme, {
        width: rc.config.barWidth,
        tokenBreakdownThreshold: rc.config.tokenBreakdownThreshold,
    }, rc.i18n);
}
function renderUsageElement(rc) {
    return (0, usage_js_1.renderUsage)(rc.stdin, rc.theme, {
        width: rc.config.barWidth,
        threshold: rc.config.usageThreshold,
    }, rc.i18n);
}
function renderCostElement(rc) {
    return (0, cost_js_1.renderCost)(rc.stdin, rc.theme, rc.config, rc.i18n);
}
function renderDurationElement(rc) {
    if (!rc.duration)
        return null;
    const icon = (0, utils_js_1.colorize)(rc.theme.icons.clock, rc.theme.colors.dim);
    return `${icon} ${(0, utils_js_1.colorize)(rc.duration, rc.theme.colors.dim)}`;
}
function renderEffortElement(rc) {
    return (0, effort_js_1.renderEffort)(rc.stdin, rc.theme, rc.i18n);
}
function renderTools(rc) {
    const t = rc.tools;
    if (t.totalCalls === 0)
        return null;
    const parts = [];
    if (t.edits > 0) {
        const icon = (0, utils_js_1.colorize)(rc.theme.icons.tool, rc.theme.colors.toolColor);
        const label = (0, utils_js_1.colorize)(rc.i18n.edit || 'Edit', rc.theme.colors.toolColor);
        let editStr = `${icon} ${label}`;
        if (t.lastEditFile) {
            const fname = t.lastEditFile.split('/').pop() || t.lastEditFile;
            editStr += (0, utils_js_1.colorize)(`: ${fname}`, rc.theme.colors.dim);
        }
        if (t.edits > 1)
            editStr += (0, utils_js_1.colorize)(` ×${t.edits}`, rc.theme.colors.dim);
        parts.push(editStr);
    }
    if (t.reads > 0) {
        const icon = (0, utils_js_1.colorize)(rc.theme.icons.read, rc.theme.colors.toolColor);
        parts.push(`${icon} ${(0, utils_js_1.colorize)(rc.i18n.read || 'Read', rc.theme.colors.toolColor)}${(0, utils_js_1.colorize)(` ×${t.reads}`, rc.theme.colors.dim)}`);
    }
    if (t.greps > 0) {
        const icon = (0, utils_js_1.colorize)(rc.theme.icons.grep, rc.theme.colors.toolColor);
        parts.push(`${icon} ${(0, utils_js_1.colorize)(rc.i18n.grep || 'Grep', rc.theme.colors.toolColor)}${(0, utils_js_1.colorize)(` ×${t.greps}`, rc.theme.colors.dim)}`);
    }
    if (t.bash > 0) {
        const icon = (0, utils_js_1.colorize)(rc.theme.icons.bash, rc.theme.colors.toolColor);
        parts.push(`${icon} ${(0, utils_js_1.colorize)(rc.i18n.bash || 'Bash', rc.theme.colors.toolColor)}${(0, utils_js_1.colorize)(` ×${t.bash}`, rc.theme.colors.dim)}`);
    }
    if (t.webFetches > 0) {
        const icon = (0, utils_js_1.colorize)(rc.theme.icons.web, rc.theme.colors.toolColor);
        parts.push(`${icon} ${(0, utils_js_1.colorize)(rc.i18n.web || 'Web', rc.theme.colors.toolColor)}${(0, utils_js_1.colorize)(` ×${t.webFetches}`, rc.theme.colors.dim)}`);
    }
    return parts.length > 0 ? parts.join(' ') : null;
}
function renderAgents(rc) {
    if (rc.tools.agents === 0)
        return null;
    const icon = (0, utils_js_1.colorize)(rc.theme.icons.agent, rc.theme.colors.agentColor);
    let text = `${rc.tools.agents}`;
    if (rc.tools.lastAgent)
        text += ` ${rc.tools.lastAgent}`;
    return `${icon} ${(0, utils_js_1.colorize)(text, rc.theme.colors.agentColor)}`;
}
function renderTodos(rc) {
    const { done, total } = rc.tools.todos;
    if (total === 0)
        return null;
    const icon = done === total
        ? (0, utils_js_1.colorize)(rc.theme.icons.todoDone, rc.theme.colors.todoColor)
        : (0, utils_js_1.colorize)(rc.theme.icons.todo, rc.theme.colors.todoColor);
    return `${icon} ${(0, utils_js_1.colorize)(`${done}/${total}`, rc.theme.colors.todoColor)}`;
}
// ── Element registry ─────────────────────────────────────────────────────────
const ELEMENT_RENDERERS = {
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
function render(rc) {
    const lines = [];
    for (const lineElements of rc.preset.lines) {
        const parts = [];
        for (const elem of lineElements) {
            if (rc.config.elements?.[elem] === false)
                continue;
            const renderer = ELEMENT_RENDERERS[elem];
            if (!renderer)
                continue;
            const result = renderer(rc);
            if (result !== null) {
                parts.push(result);
            }
        }
        if (parts.length > 0) {
            lines.push(parts.join((0, utils_js_1.sep)(rc.theme)));
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=render.js.map