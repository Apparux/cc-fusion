"use strict";
/**
 * preview.ts — Preview panel component
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewPanel = void 0;
const render_js_1 = require("../../render.js");
const i18n_js_1 = require("../../i18n.js");
const utils_js_1 = require("../../utils.js");
class PreviewPanel {
    constructor() {
        this.lines = [];
    }
    render(rect, config, theme, preset) {
        const mockContext = this.createMockContext(config, theme, preset);
        const previewOutput = (0, render_js_1.render)(mockContext);
        this.lines = previewOutput.split('\n');
        const output = [];
        const border = this.renderBorder(rect.width, 'Preview');
        output.push(border);
        for (let i = 0; i < rect.height - 2; i++) {
            const line = this.lines[i] || '';
            const padded = this.padLine(line, rect.width - 4);
            output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${padded} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
        }
        output.push(this.renderBorder(rect.width, ''));
        return output;
    }
    createMockContext(config, theme, preset) {
        const mockStdin = {
            model: { display_name: 'Claude Opus 4.7', id: 'claude-opus-4-7' },
            context_window: {
                used_percentage: 45,
                context_window_size: 200000,
                total_input_tokens: 60000,
                total_output_tokens: 30000,
                current_usage: {
                    input_tokens: 28000,
                    output_tokens: 12000,
                    cache_creation_input_tokens: 8000,
                    cache_read_input_tokens: 40000,
                },
            },
            cost: { total_cost_usd: 0.42 },
            cwd: '/Users/example/project',
        };
        const mockGit = {
            branch: 'main',
            dirty: true,
            ahead: 2,
            behind: 0,
            staged: 3,
            unstaged: 1,
            untracked: 2,
        };
        const mockTools = {
            totalCalls: 15,
            edits: 5,
            reads: 8,
            greps: 2,
            writes: 0,
            bash: 3,
            webFetches: 1,
            agents: 1,
            lastEditFile: 'src/config.ts',
            lastAgent: 'research',
            todos: { done: 2, total: 5 },
        };
        return {
            stdin: mockStdin,
            git: mockGit,
            tools: mockTools,
            theme,
            preset,
            config,
            i18n: (0, i18n_js_1.loadI18n)(config.lang),
            model: 'Opus 4.7',
            dir: '~/project',
            contextPct: 45,
            usagePct: 60,
            costUsd: 0.42,
            duration: '15m',
            effort: 'medium',
        };
    }
    renderBorder(width, title) {
        if (title) {
            const titlePart = ` ${title} `;
            const remaining = width - titlePart.length - 2;
            const left = Math.floor(remaining / 2);
            const right = remaining - left;
            return `${utils_js_1.ANSI.dim}┌${'─'.repeat(left)}${utils_js_1.ANSI.reset}${titlePart}${utils_js_1.ANSI.dim}${'─'.repeat(right)}┐${utils_js_1.ANSI.reset}`;
        }
        return `${utils_js_1.ANSI.dim}└${'─'.repeat(width - 2)}┘${utils_js_1.ANSI.reset}`;
    }
    padLine(line, width) {
        const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');
        const visible = stripAnsi(line);
        const padding = Math.max(0, width - visible.length);
        return line + ' '.repeat(padding);
    }
}
exports.PreviewPanel = PreviewPanel;
//# sourceMappingURL=preview.js.map