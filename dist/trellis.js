/**
 * trellis.ts — Read Trellis active task fallback for the Tasks line
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'path';
function readJsonObject(filePath) {
    try {
        const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? parsed
            : null;
    }
    catch {
        return null;
    }
}
function isDirectory(path) {
    try {
        return statSync(path).isDirectory();
    }
    catch {
        return false;
    }
}
function findTrellisRoot(cwd) {
    if (!cwd)
        return null;
    let current = resolve(cwd);
    while (true) {
        if (isDirectory(join(current, '.trellis')))
            return current;
        const parent = dirname(current);
        if (parent === current)
            return null;
        current = parent;
    }
}
function sanitizeSessionId(value) {
    return value
        .replace(/[^A-Za-z0-9._-]+/g, '_')
        .replace(/^[._-]+|[._-]+$/g, '')
        .slice(0, 160);
}
function getSessionId(stdin) {
    if (typeof stdin.session_id === 'string' && stdin.session_id.trim())
        return stdin.session_id.trim();
    if (typeof stdin.sessionId === 'string' && stdin.sessionId.trim())
        return stdin.sessionId.trim();
    return undefined;
}
function listSessionFiles(sessionsDir) {
    try {
        return readdirSync(sessionsDir)
            .filter(name => name.endsWith('.json'))
            .map(name => join(sessionsDir, name))
            .filter(path => {
            try {
                return statSync(path).isFile();
            }
            catch {
                return false;
            }
        })
            .sort();
    }
    catch {
        return [];
    }
}
function resolveSessionFile(trellisRoot, stdin) {
    const sessionsDir = join(trellisRoot, '.trellis', '.runtime', 'sessions');
    const sessionId = getSessionId(stdin);
    if (sessionId) {
        const safeSessionId = sanitizeSessionId(sessionId);
        if (safeSessionId) {
            const exactPath = join(sessionsDir, `claude_${safeSessionId}.json`);
            if (existsSync(exactPath))
                return exactPath;
        }
    }
    const sessionFiles = listSessionFiles(sessionsDir);
    return sessionFiles.length === 1 ? sessionFiles[0] : null;
}
function resolveTaskDir(trellisRoot, taskRef) {
    const normalized = taskRef.trim().replace(/\\/g, '/').replace(/^\.\//, '');
    if (!normalized)
        return null;
    const tasksDir = join(trellisRoot, '.trellis', 'tasks');
    const candidate = isAbsolute(normalized)
        ? normalized
        : normalized.startsWith('.trellis/')
            ? join(trellisRoot, normalized)
            : normalized.startsWith('tasks/')
                ? join(trellisRoot, '.trellis', normalized)
                : join(tasksDir, normalized);
    const resolvedCandidate = resolve(candidate);
    const relativeToTasks = relative(tasksDir, resolvedCandidate);
    if (relativeToTasks.startsWith('..') || isAbsolute(relativeToTasks))
        return null;
    if (relativeToTasks.split(sep)[0] === 'archive')
        return null;
    if (!isDirectory(resolvedCandidate))
        return null;
    return resolvedCandidate;
}
function normalizeTrellisStatus(status) {
    if (status === 'completed' || status === 'done')
        return 'done';
    if (status === 'in_progress' || status === 'current')
        return 'current';
    if (status === 'planning' || status === 'pending')
        return 'pending';
    return 'future';
}
export function readTrellisTaskStats(cwd, stdin) {
    const trellisRoot = findTrellisRoot(cwd);
    if (!trellisRoot)
        return null;
    const sessionFile = resolveSessionFile(trellisRoot, stdin);
    if (!sessionFile)
        return null;
    const session = readJsonObject(sessionFile);
    const currentTask = session?.current_task;
    if (typeof currentTask !== 'string' || !currentTask.trim())
        return null;
    const taskDir = resolveTaskDir(trellisRoot, currentTask);
    if (!taskDir)
        return null;
    const task = readJsonObject(join(taskDir, 'task.json'));
    const title = task?.title;
    const status = task?.status;
    if (typeof title !== 'string' || !title.trim())
        return null;
    if (typeof status !== 'string' || !status.trim())
        return null;
    const normalizedStatus = normalizeTrellisStatus(status);
    return {
        todos: [{
                id: 1,
                name: `Trellis ${title.trim()}`,
                status: normalizedStatus,
                source: 'trellis',
                statusLabel: status.trim(),
            }],
        totalTodos: 1,
        doneTodos: normalizedStatus === 'done' ? 1 : 0,
    };
}
//# sourceMappingURL=trellis.js.map