"use strict";
/**
 * stdin.ts — Parse Claude Code stdin JSON
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStdin = parseStdin;
exports.getSessionId = getSessionId;
exports.getCwd = getCwd;
exports.getProjectDir = getProjectDir;
exports.getEffortLevel = getEffortLevel;
exports.getProvider = getProvider;
exports.getContextWindowSize = getContextWindowSize;
exports.getContextTokens = getContextTokens;
exports.calcContextPct = calcContextPct;
exports.extractUsageInfo = extractUsageInfo;
exports.calcUsagePct = calcUsagePct;
exports.getTokenBreakdown = getTokenBreakdown;
exports.getTranscriptPath = getTranscriptPath;
function parseStdin(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        return data;
    }
    catch {
        return {};
    }
}
function getSessionId(stdin) {
    return stdin.sessionId || stdin.session_id;
}
function getCwd(stdin) {
    return stdin.cwd || stdin.workspace?.current_dir || stdin.workspace?.project_dir;
}
function getProjectDir(stdin) {
    return stdin.workspace?.project_dir || getCwd(stdin);
}
function getEffortLevel(stdin) {
    return stdin.effortLevel || stdin.effort_level;
}
function getProvider(stdin) {
    return stdin.provider || stdin.api_provider;
}
function getContextWindowSize(stdin) {
    return stdin.context_window?.context_window_size || stdin.max_context_window_size || 0;
}
function getContextTokens(stdin) {
    const ctx = stdin.context_window || {};
    const usage = ctx.current_usage || ctx;
    const input = usage.input_tokens ?? ctx.total_input_tokens ?? 0;
    const output = usage.output_tokens ?? ctx.total_output_tokens ?? 0;
    const cacheCreate = usage.cache_creation_input_tokens || 0;
    const cacheRead = usage.cache_read_input_tokens || 0;
    const total = ctx.total_input_tokens !== undefined
        ? ctx.total_input_tokens + (ctx.total_output_tokens || 0)
        : input + output + cacheCreate + cacheRead;
    return { input, output, cacheCreate, cacheRead, total };
}
/**
 * Calculate context usage percentage.
 * Total tokens used vs max context window.
 */
function calcContextPct(stdin) {
    const directPct = stdin.context_window?.used_percentage;
    if (typeof directPct === 'number' && Number.isFinite(directPct)) {
        return Math.max(0, Math.min(100, Math.round(directPct)));
    }
    const max = getContextWindowSize(stdin);
    if (!max || max <= 0)
        return 0;
    const { total } = getContextTokens(stdin);
    return Math.min(100, Math.round((total / max) * 100));
}
function asMetric(value) {
    if (typeof value === 'number')
        return { percent: value };
    if (typeof value !== 'object' || value === null)
        return null;
    return value;
}
function numberFrom(metric, keys) {
    for (const key of keys) {
        const value = metric[key];
        if (typeof value === 'number' && Number.isFinite(value))
            return value;
        if (typeof value === 'string' && value.trim()) {
            const parsed = Number(value);
            if (Number.isFinite(parsed))
                return parsed;
        }
    }
    return undefined;
}
function parseResetAt(metric) {
    const value = metric.reset_at ?? metric.resets_at ?? metric.reset_time ?? metric.next_reset ?? metric.reset;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value < 10000000000 ? value * 1000 : value;
    }
    if (typeof value === 'string' && value.trim()) {
        const numeric = Number(value);
        if (Number.isFinite(numeric))
            return numeric < 10000000000 ? numeric * 1000 : numeric;
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return undefined;
}
function usageFromMetric(metric) {
    if (!metric)
        return null;
    const directPct = numberFrom(metric, ['percent', 'percentage', 'pct']);
    const used = numberFrom(metric, ['used', 'consumed', 'current']);
    const limit = numberFrom(metric, ['limit', 'max', 'total']);
    const remaining = numberFrom(metric, ['remaining']);
    let pct = directPct;
    if (pct === undefined && used !== undefined && limit !== undefined && limit > 0) {
        pct = (used / limit) * 100;
    }
    if (pct === undefined && remaining !== undefined && limit !== undefined && limit > 0) {
        pct = ((limit - remaining) / limit) * 100;
    }
    if (pct === undefined || !Number.isFinite(pct))
        return null;
    return {
        pct: Math.max(0, Math.min(100, Math.round(pct))),
        resetAt: parseResetAt(metric),
    };
}
function extractUsageInfo(stdin) {
    const metrics = [stdin.rate_limit, stdin.usage, stdin.limits];
    for (const metric of metrics) {
        const usage = usageFromMetric(asMetric(metric));
        if (usage)
            return usage;
    }
    return null;
}
function calcUsagePct(stdin) {
    return extractUsageInfo(stdin)?.pct ?? 0;
}
/**
 * Get token breakdown for ≥85% display.
 */
function getTokenBreakdown(stdin) {
    const max = getContextWindowSize(stdin);
    if (!max || max <= 0)
        return null;
    const { input, output, cacheCreate, cacheRead, total } = getContextTokens(stdin);
    const pct = calcContextPct(stdin);
    if (pct < 85)
        return null;
    return { input, output, cacheCreate, cacheRead, total, max };
}
/**
 * Build a transcript path hint from stdin data.
 */
function getTranscriptPath(stdin) {
    if (stdin.transcript_path)
        return stdin.transcript_path;
    const sid = getSessionId(stdin);
    const cwd = getCwd(stdin);
    if (!sid || !cwd)
        return null;
    const home = process.env.HOME || '/root';
    const encoded = cwd.replace(/\//g, '-').replace(/^-/, '');
    return `${home}/.claude/projects/${encoded}/sessions/${sid}/transcript.jsonl`;
}
//# sourceMappingURL=stdin.js.map