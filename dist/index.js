#!/usr/bin/env node
"use strict";
/**
 * index.ts — CC-Fusion Statusline Entry Point
 *
 * Reads Claude Code stdin JSON, collects git + transcript data,
 * renders the 3-line statusline to stdout.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const stdin_js_1 = require("./stdin.js");
const transcript_js_1 = require("./transcript.js");
const git_js_1 = require("./git.js");
const config_js_1 = require("./config.js");
const i18n_js_1 = require("./i18n.js");
const utils_js_1 = require("./utils.js");
const render_js_1 = require("./render.js");
// ── Read stdin ───────────────────────────────────────────────────────────────
function readStdin() {
    try {
        return (0, fs_1.readFileSync)('/dev/stdin', 'utf-8');
    }
    catch {
        return '{}';
    }
}
// ── Session duration estimation ──────────────────────────────────────────────
function estimateDuration(transcriptPath) {
    if (!transcriptPath)
        return '';
    try {
        const raw = (0, fs_1.readFileSync)(transcriptPath, 'utf-8');
        const lines = raw.trim().split('\n');
        if (lines.length < 2)
            return '';
        // Parse first and last timestamps
        const first = JSON.parse(lines[0]);
        const last = JSON.parse(lines[lines.length - 1]);
        const t1 = first.timestamp || first.ts || first.created_at;
        const t2 = last.timestamp || last.ts || last.created_at;
        if (t1 && t2) {
            const d1 = new Date(t1).getTime();
            const d2 = new Date(t2).getTime();
            if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
                return (0, utils_js_1.formatDuration)(d2 - d1);
            }
        }
    }
    catch { /* ignore */ }
    return '';
}
// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
    // 1. Load config, theme, preset, i18n
    const config = (0, config_js_1.loadConfig)();
    const theme = (0, config_js_1.loadTheme)(config.theme);
    const preset = (0, config_js_1.loadPreset)(config.preset);
    const i18n = (0, i18n_js_1.loadI18n)(config.lang);
    // 2. Parse stdin JSON
    const rawStdin = readStdin();
    const stdin = (0, stdin_js_1.parseStdin)(rawStdin);
    // 3. Collect git info
    const git = (0, git_js_1.getGitInfo)(stdin.cwd);
    // 4. Find and parse transcript
    const transcriptPath = config.showTranscript
        ? (0, transcript_js_1.findTranscript)(stdin.sessionId, stdin.cwd, (0, stdin_js_1.getTranscriptPath)(stdin))
        : null;
    const tools = (0, transcript_js_1.parseTranscript)(transcriptPath);
    // 5. Build render context
    const model = (0, utils_js_1.simplifyModel)(stdin.model?.display_name, stdin.model?.id);
    const dir = (0, utils_js_1.shortenDir)(stdin.cwd, process.env.HOME);
    const contextPct = (0, stdin_js_1.calcContextPct)(stdin);
    const usagePct = contextPct; // Same base; layered logic in render
    const costUsd = stdin.cost?.total_cost_usd ?? null;
    const duration = estimateDuration(transcriptPath);
    const effort = stdin.effortLevel || '';
    const rc = {
        stdin,
        git,
        tools,
        theme,
        preset,
        config,
        i18n,
        model,
        dir,
        contextPct,
        usagePct,
        costUsd,
        duration,
        effort,
    };
    // 6. Render and output
    const output = (0, render_js_1.render)(rc);
    if (output) {
        process.stdout.write(output + '\n');
    }
}
main();
//# sourceMappingURL=index.js.map