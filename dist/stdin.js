/**
 * stdin.ts — Parse Claude Code stdin JSON
 */
function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
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
    return finiteNumber(stdin.context_window?.context_window_size)
        ?? finiteNumber(stdin.context_window_size)
        ?? finiteNumber(stdin.max_context_window_size)
        ?? 0;
}
export function getContextTokens(stdin) {
    const ctx = stdin.context_window || {};
    const usage = ctx.current_usage || ctx;
    const input = finiteNumber(usage.input_tokens)
        ?? finiteNumber(ctx.total_input_tokens)
        ?? finiteNumber(stdin.input_tokens)
        ?? finiteNumber(stdin.total_input_tokens)
        ?? 0;
    const output = finiteNumber(usage.output_tokens)
        ?? finiteNumber(ctx.total_output_tokens)
        ?? finiteNumber(stdin.output_tokens)
        ?? finiteNumber(stdin.total_output_tokens)
        ?? 0;
    const cacheCreate = finiteNumber(usage.cache_creation_input_tokens)
        ?? finiteNumber(stdin.cache_creation_input_tokens)
        ?? 0;
    const cacheRead = finiteNumber(usage.cache_read_input_tokens)
        ?? finiteNumber(stdin.cache_read_input_tokens)
        ?? 0;
    const totalInput = finiteNumber(ctx.total_input_tokens) ?? finiteNumber(stdin.total_input_tokens);
    const totalOutput = finiteNumber(ctx.total_output_tokens) ?? finiteNumber(stdin.total_output_tokens) ?? output;
    const total = totalInput !== undefined
        ? totalInput + totalOutput
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
    return Math.max(0, Math.min(100, (total / max) * 100));
}
//# sourceMappingURL=stdin.js.map