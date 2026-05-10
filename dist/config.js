"use strict";
/**
 * config.ts — Config loading (JSON + TOML theme)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.loadTheme = loadTheme;
exports.loadPreset = loadPreset;
const fs_1 = require("fs");
const path_1 = require("path");
const utils_js_1 = require("./utils.js");
// ── Inline TOML parser (simple, no external deps) ────────────────────────────
function parseToml(raw) {
    const result = {};
    let currentSection = result;
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        // Section header: [section] or [section.subsection]
        const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
        if (sectionMatch) {
            const keys = sectionMatch[1].split('.').map(k => k.trim());
            let target = result;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
                    target[keys[i]] = {};
                }
                target = target[keys[i]];
            }
            const lastKey = keys[keys.length - 1];
            if (!target[lastKey] || typeof target[lastKey] !== 'object') {
                target[lastKey] = {};
            }
            currentSection = target[lastKey];
            continue;
        }
        // Key-value: key = "value" or key = 'value'
        const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
        if (kvMatch) {
            const key = kvMatch[1];
            let value = kvMatch[2].trim();
            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            // Process escape sequences in double-quoted strings
            if (kvMatch[2].trim().startsWith('"')) {
                value = value
                    .replace(/\\n/g, '\n')
                    .replace(/\\t/g, '\t')
                    .replace(/\\r/g, '\r')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\"/g, '"');
            }
            currentSection[key] = value;
        }
    }
    return result;
}
// ── File discovery ───────────────────────────────────────────────────────────
function findProjectDir() {
    const candidates = [
        (0, path_1.join)(__dirname, '..'),
        (0, path_1.join)(__dirname, '..', '..'),
        process.cwd(),
    ];
    for (const p of candidates) {
        try {
            (0, fs_1.readFileSync)((0, path_1.join)(p, 'package.json'), 'utf-8');
            return p;
        }
        catch { /* try next */ }
    }
    return candidates[0];
}
function userConfigDir() {
    return (0, path_1.join)(process.env.HOME || '/root', '.claude', 'cc-fusion');
}
function readJsonFile(path) {
    try {
        return JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
    }
    catch {
        return null;
    }
}
function mergeConfig(base, override) {
    if (!override)
        return base;
    const merged = { ...base };
    for (const [key, value] of Object.entries(override)) {
        if (key === 'hideCostFor' && Array.isArray(value) && value.every(v => typeof v === 'string')) {
            merged.hideCostFor = value;
        }
        else if (key === 'elements' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            merged.elements = { ...(merged.elements || {}), ...value };
        }
        else if (key in merged) {
            merged[key] = value;
        }
    }
    return merged;
}
function firstExisting(paths) {
    for (const path of paths) {
        if ((0, fs_1.existsSync)(path))
            return path;
    }
    return null;
}
// ── Default config ───────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
    theme: 'cometix',
    preset: 'full',
    lang: 'en',
    hideCostFor: ['bedrock', 'vertex'],
    usageThreshold: 80,
    tokenBreakdownThreshold: 85,
    barWidth: 20,
    showTranscript: true,
};
function loadConfig() {
    const projectDir = findProjectDir();
    const configPaths = [
        (0, path_1.join)(projectDir, 'config.json'),
        (0, path_1.join)(process.cwd(), 'cc-fusion.config.json'),
        (0, path_1.join)(userConfigDir(), 'config.json'),
    ];
    let config = { ...DEFAULT_CONFIG };
    for (const path of configPaths) {
        config = mergeConfig(config, readJsonFile(path));
    }
    if (process.env.CC_FUSION_CONFIG) {
        config = mergeConfig(config, readJsonFile(process.env.CC_FUSION_CONFIG));
    }
    return config;
}
// ── Theme loading ────────────────────────────────────────────────────────────
const DEFAULT_THEME_COLORS = {
    reset: utils_js_1.ANSI.reset,
    bold: utils_js_1.ANSI.bold,
    dim: utils_js_1.ANSI.dim,
    red: utils_js_1.ANSI.red,
    green: utils_js_1.ANSI.green,
    yellow: utils_js_1.ANSI.yellow,
    blue: utils_js_1.ANSI.blue,
    magenta: utils_js_1.ANSI.magenta,
    cyan: utils_js_1.ANSI.cyan,
    white: utils_js_1.ANSI.white,
    brightBlue: utils_js_1.ANSI.brightBlue,
    brightMagenta: utils_js_1.ANSI.brightMagenta,
    orange: utils_js_1.ANSI.orange,
    gold: utils_js_1.ANSI.gold,
    modelColor: utils_js_1.ANSI.cyan,
    dirColor: utils_js_1.ANSI.blue,
    gitColor: utils_js_1.ANSI.green,
    contextColor: utils_js_1.ANSI.cyan,
    usageColor: utils_js_1.ANSI.blue,
    costColor: utils_js_1.ANSI.gold,
    effortColor: utils_js_1.ANSI.yellow,
    toolColor: utils_js_1.ANSI.magenta,
    agentColor: utils_js_1.ANSI.brightMagenta,
    todoColor: utils_js_1.ANSI.green,
    separatorColor: utils_js_1.ANSI.dim,
    barFill: utils_js_1.ANSI.cyan,
    barEmpty: utils_js_1.ANSI.dim,
};
const DEFAULT_THEME_ICONS = {
    model: '◈',
    git: '⎇',
    gitDirty: '✱',
    dir: '⌂',
    effort: '↯',
    tool: '◐',
    grep: '⌕',
    read: '⊙',
    write: '✎',
    bash: '›_',
    agent: '⊕',
    todo: '☐',
    todoDone: '☑',
    cost: '◆',
    clock: '◷',
    context: '◈',
    usage: '▦',
    web: '⊕',
    separator: '│',
};
// ANSI code mapping for theme TOML values
const ANSI_MAP = {
    reset: utils_js_1.ANSI.reset,
    bold: utils_js_1.ANSI.bold,
    dim: utils_js_1.ANSI.dim,
    red: utils_js_1.ANSI.red,
    green: utils_js_1.ANSI.green,
    yellow: utils_js_1.ANSI.yellow,
    blue: utils_js_1.ANSI.blue,
    magenta: utils_js_1.ANSI.magenta,
    cyan: utils_js_1.ANSI.cyan,
    white: utils_js_1.ANSI.white,
    brightblue: utils_js_1.ANSI.brightBlue,
    brightmagenta: utils_js_1.ANSI.brightMagenta,
    orange: utils_js_1.ANSI.orange,
    gold: utils_js_1.ANSI.gold,
};
function resolveColor(value, fallback) {
    if (!value)
        return fallback;
    const mapped = ANSI_MAP[value.toLowerCase()];
    if (mapped)
        return mapped;
    return value;
}
function loadTheme(name) {
    const projectDir = findProjectDir();
    const themePath = firstExisting([
        (0, path_1.join)(userConfigDir(), 'themes', `${name}.toml`),
        (0, path_1.join)(projectDir, 'themes', `${name}.toml`),
    ]);
    try {
        if (!themePath)
            throw new Error('theme not found');
        const raw = (0, fs_1.readFileSync)(themePath, 'utf-8');
        const parsed = parseToml(raw);
        const colorsSection = (parsed.colors || {});
        const iconsSection = (parsed.icons || {});
        const colors = { ...DEFAULT_THEME_COLORS };
        for (const [key, val] of Object.entries(colorsSection)) {
            if (typeof val === 'string' && key in colors) {
                colors[key] = resolveColor(val, colors[key]);
            }
        }
        const icons = { ...DEFAULT_THEME_ICONS };
        for (const [key, val] of Object.entries(iconsSection)) {
            if (typeof val === 'string' && key in icons) {
                icons[key] = val;
            }
        }
        return { name, colors, icons };
    }
    catch {
        return {
            name: 'default',
            colors: { ...DEFAULT_THEME_COLORS },
            icons: { ...DEFAULT_THEME_ICONS },
        };
    }
}
// ── Preset loading ───────────────────────────────────────────────────────────
const PRESETS = {
    full: {
        name: 'full',
        lines: [
            ['model', 'dir', 'git'],
            ['context', 'usage', 'cost', 'duration', 'effort'],
            ['tools', 'agents', 'todos'],
        ],
    },
    essential: {
        name: 'essential',
        lines: [
            ['model', 'git'],
            ['context', 'usage', 'cost'],
        ],
    },
    minimal: {
        name: 'minimal',
        lines: [
            ['model', 'context'],
        ],
    },
};
function loadPreset(name) {
    const projectDir = findProjectDir();
    const presetPath = firstExisting([
        (0, path_1.join)(userConfigDir(), 'presets', `${name}.json`),
        (0, path_1.join)(projectDir, 'presets', `${name}.json`),
    ]);
    try {
        if (!presetPath)
            throw new Error('preset not found');
        return JSON.parse((0, fs_1.readFileSync)(presetPath, 'utf-8'));
    }
    catch {
        return PRESETS[name] || PRESETS.full;
    }
}
//# sourceMappingURL=config.js.map