/**
 * transcript.ts — Parse transcript JSONL for tool stats
 */
import { openSync, readSync, closeSync, statSync } from 'fs';
const DEFAULT_TAIL_BYTES = 1024 * 512;
const TASK_SCAN_BYTES = 1024 * 1024 * 8;
const TASK_SCAN_LINES = 10000;
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
function parseTaskId(value) {
    if (typeof value === 'number' && Number.isInteger(value))
        return value;
    if (typeof value !== 'string')
        return undefined;
    const id = parseInt(value, 10);
    return Number.isNaN(id) ? undefined : id;
}
function textFromValue(value) {
    if (typeof value === 'string')
        return value;
    if (!Array.isArray(value))
        return undefined;
    const parts = [];
    for (const item of value) {
        if (typeof item === 'string') {
            parts.push(item);
        }
        else if (typeof item === 'object' && item !== null && 'text' in item) {
            const text = item.text;
            if (typeof text === 'string')
                parts.push(text);
        }
    }
    return parts.length > 0 ? parts.join('\n') : undefined;
}
function shouldStartNewTaskBatch(todoMap) {
    return todoMap.size > 0 && Array.from(todoMap.values()).every(todo => todo.status === 'done');
}
function addCreatedTask(todoMap, seenTaskIds, taskId, subject) {
    if (seenTaskIds.has(taskId))
        return;
    seenTaskIds.add(taskId);
    if (shouldStartNewTaskBatch(todoMap)) {
        todoMap.clear();
    }
    todoMap.set(taskId, {
        id: taskId,
        name: subject.slice(0, 30),
        status: 'pending',
    });
}
function collectToolResultTexts(entry) {
    const results = [];
    const content = (entry.type === 'assistant' || entry.type === 'user' || entry.type === 'system')
        ? entry.message?.content
        : undefined;
    if (!Array.isArray(content))
        return results;
    for (const item of content) {
        if (item.type !== 'tool_result')
            continue;
        const text = textFromValue(item.content);
        if (!text)
            continue;
        results.push({
            toolUseId: typeof item.tool_use_id === 'string' ? item.tool_use_id : undefined,
            text,
        });
    }
    return results;
}
function collectOrderedTaskEvents(entry) {
    const events = [];
    if (entry.type === 'tool_use') {
        events.push({ kind: 'tool_use', tool: entry });
    }
    const content = (entry.type === 'assistant' || entry.type === 'user' || entry.type === 'system')
        ? entry.message?.content
        : undefined;
    if (!Array.isArray(content))
        return events;
    for (const item of content) {
        if (item.type === 'tool_use') {
            events.push({ kind: 'tool_use', tool: item });
            continue;
        }
        if (item.type === 'tool_result') {
            const text = textFromValue(item.content);
            if (!text)
                continue;
            events.push({
                kind: 'tool_result',
                toolUseId: typeof item.tool_use_id === 'string' ? item.tool_use_id : undefined,
                text,
            });
        }
    }
    return events;
}
function parseTaskCreateResult(text) {
    const match = text.match(/Task #(\d+) created successfully(?::\s*(.+))?/i);
    if (!match)
        return undefined;
    const taskId = parseTaskId(match[1]);
    if (taskId === undefined)
        return undefined;
    const subject = typeof match[2] === 'string' && match[2].trim() ? match[2].trim() : undefined;
    return { taskId, subject };
}
function normalizeTaskStatus(status) {
    if (status === 'completed' || status === 'done')
        return 'done';
    if (status === 'in_progress' || status === 'current')
        return 'current';
    if (status === 'pending')
        return 'pending';
    if (status === 'future')
        return 'future';
    return undefined;
}
function taskSubjectFromTool(tool) {
    const subject = tool.input?.subject ?? tool.input?.description ?? tool.input?.activeForm;
    return typeof subject === 'string' && subject ? subject : undefined;
}
function parseTaskEvents(lines) {
    const todoMap = new Map();
    const seenTaskIds = new Set();
    const taskCreateSubjects = new Map();
    const pendingTaskCreateToolIds = [];
    for (const line of lines) {
        let entry;
        try {
            entry = JSON.parse(line);
        }
        catch {
            continue;
        }
        for (const event of collectOrderedTaskEvents(entry)) {
            if (event.kind === 'tool_use') {
                const tool = event.tool;
                const name = (tool.name || '').toLowerCase();
                if (name === 'taskcreate') {
                    const subject = taskSubjectFromTool(tool);
                    if (!subject)
                        continue;
                    taskCreateSubjects.set(tool.id, subject);
                    const taskId = parseTaskId(tool.input?.taskId ?? tool.input?.id);
                    if (taskId !== undefined) {
                        addCreatedTask(todoMap, seenTaskIds, taskId, subject);
                    }
                    else if (!pendingTaskCreateToolIds.includes(tool.id)) {
                        pendingTaskCreateToolIds.push(tool.id);
                    }
                }
                if (name === 'taskupdate') {
                    const taskId = parseTaskId(tool.input?.taskId ?? tool.input?.id);
                    const status = tool.input?.status;
                    if (taskId === undefined || typeof status !== 'string')
                        continue;
                    const existing = todoMap.get(taskId);
                    const normalized = normalizeTaskStatus(status);
                    if (existing && normalized) {
                        existing.status = normalized;
                    }
                }
                continue;
            }
            const toolId = event.toolUseId || pendingTaskCreateToolIds[0];
            if (!toolId || !taskCreateSubjects.has(toolId))
                continue;
            const created = parseTaskCreateResult(event.text);
            if (!created)
                continue;
            if (event.toolUseId) {
                const pendingIndex = pendingTaskCreateToolIds.indexOf(event.toolUseId);
                if (pendingIndex !== -1)
                    pendingTaskCreateToolIds.splice(pendingIndex, 1);
            }
            else {
                pendingTaskCreateToolIds.shift();
            }
            const subject = taskCreateSubjects.get(toolId) ?? created.subject;
            if (!subject)
                continue;
            addCreatedTask(todoMap, seenTaskIds, created.taskId, subject);
        }
    }
    const allTodos = Array.from(todoMap.values()).map((todo, index) => ({ ...todo, id: index + 1 }));
    const doneTodos = allTodos.filter(t => t.status === 'done').length;
    const todos = allTodos.length > 5
        ? allTodos.filter(todo => todo.status !== 'done').slice(0, 5)
        : allTodos;
    return {
        todos,
        totalTodos: allTodos.length,
        doneTodos,
    };
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
        const taskStats = parseTaskEvents(readTailLines(filePath, TASK_SCAN_LINES, TASK_SCAN_BYTES));
        let lastRead;
        let lastEdit;
        let lastSearch;
        const agentMap = new Map();
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
                // Track agents
                if (name === 'agent' || name === 'task') {
                    const agentName = tool.input?.subagent_type || tool.input?.description || 'Agent';
                    const agentId = tool.id;
                    if (!agentMap.has(agentId)) {
                        const colors = ['green', 'orange', 'blue', 'purple', 'white'];
                        const color = colors[agentMap.size % colors.length];
                        agentMap.set(agentId, {
                            name: String(agentName).slice(0, 20),
                            status: '运行中',
                            color,
                        });
                    }
                }
            }
        }
        const agents = Array.from(agentMap.values()).slice(-5); // Keep last 5 agents
        return {
            lastRead,
            lastEdit,
            lastSearch,
            agents,
            ...taskStats,
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