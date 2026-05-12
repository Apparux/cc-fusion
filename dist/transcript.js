/**
 * transcript.ts — Parse transcript JSONL for tool stats
 */
import { openSync, readSync, closeSync, statSync } from 'fs';
const DEFAULT_TAIL_BYTES = 1024 * 512;
function emptyStats() {
    return {
        lastRead: undefined,
        lastEdit: undefined,
        lastSearch: undefined,
        agents: [],
        todos: [],
        totalTodos: 0,
        doneTodos: 0,
    };
}
function readTailLines(filePath, maxLines, maxBytes = DEFAULT_TAIL_BYTES) {
    const stat = statSync(filePath);
    if (stat.size === 0)
        return [];
    const bytesToRead = Math.min(stat.size, maxBytes);
    const buffer = Buffer.alloc(bytesToRead);
    const fd = openSync(filePath, 'r');
    try {
        readSync(fd, buffer, 0, bytesToRead, stat.size - bytesToRead);
    }
    finally {
        closeSync(fd);
    }
    return buffer.toString('utf-8').split('\n').filter(Boolean).slice(-maxLines);
}
function collectToolUses(entry) {
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
    return toolUses;
}
function fileFromTool(tool) {
    const input = tool.input || {};
    const value = input.file_path || input.path || input.notebook_path;
    return typeof value === 'string' && value ? value : undefined;
}
/**
 * Parse a transcript JSONL file and extract tool usage statistics.
 */
export function parseTranscript(filePath, maxLines = 500) {
    const empty = emptyStats();
    if (!filePath)
        return empty;
    try {
        const tail = readTailLines(filePath, maxLines);
        let lastRead;
        let lastEdit;
        let lastSearch;
        for (const line of tail) {
            let entry;
            try {
                entry = JSON.parse(line);
            }
            catch {
                continue;
            }
            const toolUses = collectToolUses(entry);
            for (const tool of toolUses) {
                const name = (tool.name || '').toLowerCase();
                // Track last read
                if (name === 'read') {
                    const fp = fileFromTool(tool);
                    if (fp)
                        lastRead = fp;
                }
                // Track last edit
                if (['edit', 'multiedit', 'write', 'notebookedit'].includes(name)) {
                    const fp = fileFromTool(tool);
                    if (fp)
                        lastEdit = fp;
                }
                // Track last search (grep)
                if (name === 'grep' || name === 'glob') {
                    const pattern = tool.input?.pattern || tool.input?.query;
                    if (typeof pattern === 'string')
                        lastSearch = pattern;
                }
            }
        }
        return {
            lastRead,
            lastEdit,
            lastSearch,
            agents: [],
            todos: [],
            totalTodos: 0,
            doneTodos: 0,
        };
    }
    catch {
        return empty;
    }
}
/**
 * Try multiple transcript path patterns.
 */
export function findTranscript(sessionId, cwd, explicitPath) {
    if (explicitPath) {
        try {
            statSync(explicitPath);
            return explicitPath;
        }
        catch { /* try inferred paths */ }
    }
    if (!sessionId || !cwd)
        return null;
    const home = process.env.HOME || '/root';
    const encoded = cwd.replace(/\//g, '-').replace(/^-/, '');
    const candidates = [
        `${home}/.claude/projects/${encoded}/${sessionId}.jsonl`,
        `${home}/.claude/projects/-${encoded}/${sessionId}.jsonl`,
        `${home}/.claude/projects/${encoded}/sessions/${sessionId}/transcript.jsonl`,
        `${home}/.claude/projects/-${encoded}/sessions/${sessionId}/transcript.jsonl`,
    ];
    const rawParts = cwd.split('/').filter(Boolean);
    for (const part of rawParts) {
        candidates.push(`${home}/.claude/projects/${part}/${sessionId}.jsonl`, `${home}/.claude/projects/${part}/sessions/${sessionId}/transcript.jsonl`);
    }
    for (const p of candidates) {
        try {
            statSync(p);
            return p;
        }
        catch {
            continue;
        }
    }
    return null;
}
//# sourceMappingURL=transcript.js.map