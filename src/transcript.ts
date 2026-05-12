/**
 * transcript.ts — Parse transcript JSONL for tool stats
 */

import { openSync, readSync, closeSync, statSync } from 'fs';
import type { ToolStats, TranscriptEntry, TranscriptToolUse } from './types.js';

const DEFAULT_TAIL_BYTES = 1024 * 512;

function emptyStats(): ToolStats {
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

function readTailLines(filePath: string, maxLines: number, maxBytes: number = DEFAULT_TAIL_BYTES): string[] {
  const stat = statSync(filePath);
  if (stat.size === 0) return [];

  const bytesToRead = Math.min(stat.size, maxBytes);
  const buffer = Buffer.alloc(bytesToRead);
  const fd = openSync(filePath, 'r');
  try {
    readSync(fd, buffer, 0, bytesToRead, stat.size - bytesToRead);
  } finally {
    closeSync(fd);
  }

  return buffer.toString('utf-8').split('\n').filter(Boolean).slice(-maxLines);
}

function collectToolUses(entry: TranscriptEntry): TranscriptToolUse[] {
  const toolUses: TranscriptToolUse[] = [];
  if (entry.type === 'tool_use') {
    toolUses.push(entry as TranscriptToolUse);
  }

  const content = (entry.type === 'assistant' || entry.type === 'user' || entry.type === 'system')
    ? entry.message?.content
    : undefined;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === 'tool_use') {
        toolUses.push(item as unknown as TranscriptToolUse);
      }
    }
  }

  return toolUses;
}

function fileFromTool(tool: TranscriptToolUse): string | undefined {
  const input = tool.input || {};
  const value = input.file_path || input.path || input.notebook_path;
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Parse a transcript JSONL file and extract tool usage statistics.
 */
export function parseTranscript(filePath: string | null, maxLines: number = 500): ToolStats {
  const empty = emptyStats();
  if (!filePath) return empty;

  try {
    const tail = readTailLines(filePath, maxLines);
    let lastRead: string | undefined;
    let lastEdit: string | undefined;
    let lastSearch: string | undefined;
    const agentMap = new Map<string, { name: string; status: string; color: string }>();
    const todoMap = new Map<number, { id: number; name: string; status: 'done' | 'current' | 'pending' | 'future' }>();

    for (const line of tail) {
      let entry: TranscriptEntry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      const toolUses = collectToolUses(entry);
      for (const tool of toolUses) {
        const name = (tool.name || '').toLowerCase();

        // Track last read
        if (name === 'read') {
          const fp = fileFromTool(tool);
          if (fp) lastRead = fp;
        }

        // Track last edit
        if (['edit', 'multiedit', 'write', 'notebookedit'].includes(name)) {
          const fp = fileFromTool(tool);
          if (fp) lastEdit = fp;
        }

        // Track last search (grep)
        if (name === 'grep' || name === 'glob') {
          const pattern = tool.input?.pattern || tool.input?.query;
          if (typeof pattern === 'string') lastSearch = pattern;
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

        // Track todos from TaskCreate/TaskUpdate
        if (name === 'taskcreate') {
          const subject = tool.input?.subject;
          if (typeof subject === 'string') {
            const taskId = todoMap.size + 1;
            todoMap.set(taskId, {
              id: taskId,
              name: subject.slice(0, 30),
              status: 'pending',
            });
          }
        }

        if (name === 'taskupdate') {
          const taskId = tool.input?.taskId;
          const status = tool.input?.status;
          if (typeof taskId === 'string' && typeof status === 'string') {
            const id = parseInt(taskId, 10);
            const existing = todoMap.get(id);
            if (existing) {
              if (status === 'completed') {
                existing.status = 'done';
              } else if (status === 'in_progress') {
                existing.status = 'current';
              }
            }
          }
        }
      }
    }

    const agents = Array.from(agentMap.values()).slice(-5); // Keep last 5 agents
    const todos = Array.from(todoMap.values()).slice(-5); // Keep last 5 todos
    const doneTodos = todos.filter(t => t.status === 'done').length;

    return {
      lastRead,
      lastEdit,
      lastSearch,
      agents,
      todos,
      totalTodos: todos.length,
      doneTodos,
    };
  } catch {
    return empty;
  }
}

/**
 * Try multiple transcript path patterns.
 */
export function findTranscript(
  sessionId: string | undefined,
  cwd: string | undefined,
  explicitPath: string | null
): string | null {
  if (explicitPath) {
    try {
      statSync(explicitPath);
      return explicitPath;
    } catch { /* try inferred paths */ }
  }

  if (!sessionId || !cwd) return null;

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
    candidates.push(
      `${home}/.claude/projects/${part}/${sessionId}.jsonl`,
      `${home}/.claude/projects/${part}/sessions/${sessionId}/transcript.jsonl`
    );
  }

  for (const p of candidates) {
    try {
      statSync(p);
      return p;
    } catch {
      continue;
    }
  }

  return null;
}
