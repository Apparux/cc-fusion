/**
 * stdin.ts — Parse Claude Code stdin JSON
 */
export function parseStdin(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        return data;
    }
    catch {
        return {};
    }
}
export function getCwd(stdin) {
    return stdin.cwd;
}
export function getContextWindowSize(stdin) {
    return stdin.context_window?.context_window_size || 0;
}
export function getContextTokens(stdin) {
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
export function calcContextPct(stdin) {
    const directPct = stdin.context_window?.used_percentage;
    if (typeof directPct === 'number' && Number.isFinite(directPct)) {
        return Math.max(0, Math.min(100, directPct));
    }
    const max = getContextWindowSize(stdin);
    if (!max || max <= 0)
        return 0;
    const { total } = getContextTokens(stdin);
    return Math.min(100, (total / max) * 100);
}
//# sourceMappingURL=stdin.js.map