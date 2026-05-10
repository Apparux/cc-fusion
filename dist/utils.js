"use strict";
/**
 * utils.ts — ANSI color helpers, progress bar, icon wrappers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANSI = void 0;
exports.colorize = colorize;
exports.bold = bold;
exports.dim = dim;
exports.progressBar = progressBar;
exports.contextTrafficLight = contextTrafficLight;
exports.usageTrafficLight = usageTrafficLight;
exports.effortTrafficLight = effortTrafficLight;
exports.trafficColor = trafficColor;
exports.simplifyModel = simplifyModel;
exports.shortenDir = shortenDir;
exports.formatDuration = formatDuration;
exports.formatTokens = formatTokens;
exports.formatCost = formatCost;
exports.sep = sep;
// ── ANSI escape codes (base) ─────────────────────────────────────────────────
exports.ANSI = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    orange: '\x1b[38;5;208m',
    gold: '\x1b[38;5;220m',
};
// ── Color helper ─────────────────────────────────────────────────────────────
function colorize(text, colorCode) {
    return `${colorCode}${text}${exports.ANSI.reset}`;
}
function bold(text) {
    return `${exports.ANSI.bold}${text}${exports.ANSI.reset}`;
}
function dim(text) {
    return `${exports.ANSI.dim}${text}${exports.ANSI.reset}`;
}
// ── Progress bar ─────────────────────────────────────────────────────────────
function progressBar(pct, width, fillChar, emptyChar, fillColor, emptyColor) {
    const clamped = Math.max(0, Math.min(100, pct));
    const filled = Math.round((clamped / 100) * width);
    const empty = width - filled;
    const fill = fillColor + fillChar.repeat(filled);
    const emptyPart = emptyColor + emptyChar.repeat(empty);
    return `${fill}${emptyPart}${exports.ANSI.reset}`;
}
function contextTrafficLight(pct) {
    if (pct < 50)
        return 'green';
    if (pct < 80)
        return 'yellow';
    return 'red';
}
function usageTrafficLight(pct) {
    if (pct < 50)
        return 'green';
    if (pct < 80)
        return 'yellow';
    return 'red';
}
function effortTrafficLight(effort) {
    const e = effort.toLowerCase();
    if (e === 'low' || e === 'none')
        return 'green';
    if (e === 'medium')
        return 'yellow';
    return 'red';
}
function trafficColor(level, theme) {
    switch (level) {
        case 'green': return theme.colors.green;
        case 'yellow': return theme.colors.yellow;
        case 'red': return theme.colors.red;
    }
}
// ── Model name simplifier ────────────────────────────────────────────────────
function simplifyModel(displayName, modelId) {
    const raw = displayName || modelId || 'Unknown';
    // Try pattern: "claude-<family>-<version>" → "Family X.Y"
    const idMatch = (modelId || '').match(/^claude-(opus|sonnet|haiku)-(\d+)-(\d+)$/i);
    if (idMatch) {
        const family = idMatch[1].charAt(0).toUpperCase() + idMatch[1].slice(1).toLowerCase();
        return `${family} ${idMatch[2]}.${idMatch[3]}`;
    }
    // Try displayName patterns like "Claude Opus 4" or "Claude Sonnet 4.6"
    const dnMatch = raw.match(/(Opus|Sonnet|Haiku)\s*([\d.]+)/i);
    if (dnMatch) {
        return `${dnMatch[1]} ${dnMatch[2]}`;
    }
    // Fallback: strip "claude-" prefix if present
    if (raw.toLowerCase().startsWith('claude-')) {
        return raw.slice(7);
    }
    return raw;
}
// ── Directory shortener ──────────────────────────────────────────────────────
function shortenDir(cwd, home) {
    if (!cwd)
        return '?';
    const h = home || process.env.HOME || '/root';
    let d = cwd;
    if (d.startsWith(h)) {
        d = '~' + d.slice(h.length);
    }
    // If path is very long, keep last 3 segments
    const parts = d.split('/').filter(Boolean);
    if (parts.length > 4) {
        return '…/' + parts.slice(-3).join('/');
    }
    return d;
}
// ── Duration formatter ───────────────────────────────────────────────────────
function formatDuration(ms) {
    if (ms < 0)
        return '0s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60)
        return `${minutes}m${secs > 0 ? secs + 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins + 'm' : ''}`;
}
// ── Safe number formatting ───────────────────────────────────────────────────
function formatTokens(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}
function formatCost(usd) {
    if (usd >= 1)
        return `$${usd.toFixed(2)}`;
    if (usd >= 0.01)
        return `$${usd.toFixed(3)}`;
    return `$${usd.toFixed(4)}`;
}
// ── Separator helper ─────────────────────────────────────────────────────────
function sep(theme) {
    return colorize(` ${theme.icons.separator} `, theme.colors.separatorColor);
}
//# sourceMappingURL=utils.js.map