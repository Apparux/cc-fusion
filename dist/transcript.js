"use strict";
/**
 * transcript.ts — Parse transcript JSONL for tool stats, agents, todos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTranscript = parseTranscript;
exports.findTranscript = findTranscript;
const fs_1 = require("fs");
/**
 * Parse a transcript JSONL file and extract tool usage statistics.
 * Only reads the last N lines for performance (tail-read).
 */
function parseTranscript(filePath, maxLines = 500) {
    const empty = {
        edits: 0,
        reads: 0,
        greps: 0,
        writes: 0,
        bash: 0,
        webFetches: 0,
        totalCalls: 0,
        agents: 0,
        todos: { done: 0, total: 0 },
    };
    if (!filePath)
        return empty;
    try {
        // Check file exists and size
        const stat = (0, fs_1.statSync)(filePath);
        if (stat.size === 0)
            return empty;
        // Read file, take last N lines
        const raw = (0, fs_1.readFileSync)(filePath, 'utf-8');
        const lines = raw.trim().split('\n');
        const tail = lines.slice(-maxLines);
        const toolCounts = {};
        let lastEditFile;
        let agentCount = 0;
        let todoDone = 0;
        let todoTotal = 0;
        for (const line of tail) {
            if (!line.trim())
                continue;
            let entry;
            try {
                entry = JSON.parse(line);
            }
            catch {
                continue;
            }
            const toolUses = [];
            if (entry.type === 'tool_use') {
                toolUses.push(entry);
            }
            const content = (entry.type === 'assistant' || entry.type === 'user' || entry.type === 'system')
                ? entry.message?.content
                : undefined;
            if (Array.isArray(content)) {
                for (const item of content) {
                    if (item.type === 'tool_use') {
                        toolUses.push(item);
                    }
                }
            }
            for (const tool of toolUses) {
                const name = (tool.name || '').toLowerCase();
                toolCounts[name] = (toolCounts[name] || 0) + 1;
                if (name === 'edit' || name === 'write') {
                    const fp = (tool.input?.file_path || tool.input?.path || '');
                    if (fp)
                        lastEditFile = fp;
                }
                if (name === 'task' || name === 'agent' || name === 'subagent' || name.includes('agent')) {
                    agentCount++;
                }
            }
            // Track todos from assistant messages
            if (entry.type === 'assistant' && content) {
                const text = typeof content === 'string' ? content :
                    Array.isArray(content) ? content.map(c => c.text || '').join(' ') : '';
                // Count TODO patterns: [x] done, [ ] pending
                const doneMatches = text.match(/\[x\]/gi);
                const pendingMatches = text.match(/\[ \]/g);
                if (doneMatches)
                    todoDone += doneMatches.length;
                if (pendingMatches)
                    todoTotal += pendingMatches.length;
            }
        }
        // Aggregate
        const totalCalls = Object.values(toolCounts).reduce((a, b) => a + b, 0);
        return {
            edits: (toolCounts['edit'] || 0) + (toolCounts['write'] || 0),
            reads: toolCounts['read'] || 0,
            greps: (toolCounts['grep'] || 0) + (toolCounts['glob'] || 0) + (toolCounts['lcm_grep'] || 0),
            writes: toolCounts['write'] || 0,
            bash: toolCounts['bash'] || toolCounts['exec'] || 0,
            webFetches: (toolCounts['webfetch'] || 0) + (toolCounts['web_fetch'] || 0),
            totalCalls,
            lastEditFile,
            agents: agentCount,
            todos: { done: todoDone, total: todoDone + todoTotal },
        };
    }
    catch {
        return empty;
    }
}
/**
 * Try multiple transcript path patterns.
 */
function findTranscript(sessionId, cwd, explicitPath) {
    if (explicitPath) {
        try {
            (0, fs_1.statSync)(explicitPath);
            return explicitPath;
        }
        catch { /* try inferred paths */ }
    }
    if (!sessionId || !cwd)
        return null;
    const home = process.env.HOME || '/root';
    // Claude Code patterns — try multiple encodings
    const encoded = cwd.replace(/\//g, '-').replace(/^-/, '');
    const candidates = [
        `${home}/.claude/projects/${encoded}/${sessionId}.jsonl`,
        `${home}/.claude/projects/-${encoded}/${sessionId}.jsonl`,
        `${home}/.claude/projects/${encoded}/sessions/${sessionId}/transcript.jsonl`,
        `${home}/.claude/projects/-${encoded}/sessions/${sessionId}/transcript.jsonl`,
    ];
    // Also try with the raw cwd path (some versions use different encoding)
    const rawParts = cwd.split('/').filter(Boolean);
    for (const part of rawParts) {
        candidates.push(`${home}/.claude/projects/${part}/${sessionId}.jsonl`, `${home}/.claude/projects/${part}/sessions/${sessionId}/transcript.jsonl`);
    }
    for (const p of candidates) {
        try {
            (0, fs_1.statSync)(p);
            return p;
        }
        catch {
            continue;
        }
    }
    return null;
}
//# sourceMappingURL=transcript.js.map