/**
 * transcript.ts — Parse transcript JSONL for tool stats, agents, todos
 */

import { openSync, readSync, closeSync, statSync } from 'fs';
import type { ToolStats, TranscriptEntry, TranscriptToolResult, TranscriptToolUse } from './types.js';

const DEFAULT_TAIL_BYTES = 1024 * 512;

function emptyStats(): ToolStats {
  return {
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

function collectToolResults(entry: TranscriptEntry): TranscriptToolResult[] {
  const results: TranscriptToolResult[] = [];
  if (entry.type === 'tool_result') {
    results.push(entry as TranscriptToolResult);
  }

  const content = (entry.type === 'assistant' || entry.type === 'user' || entry.type === 'system')
    ? entry.message?.content
    : undefined;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === 'tool_result') {
        results.push(item as unknown as TranscriptToolResult);
      }
    }
  }

  return results;
}

function fileFromTool(tool: TranscriptToolUse): string | undefined {
  const input = tool.input || {};
  const value = input.file_path || input.path || input.notebook_path;
  return typeof value === 'string' && value ? value : undefined;
}

function textFromEntry(entry: TranscriptEntry): string {
  if (entry.type !== 'assistant' && entry.type !== 'user' && entry.type !== 'system') return '';
  const content = entry.message?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(item => typeof item.text === 'string' ? item.text : '').join(' ');
}

function isUserPromptEntry(entry: TranscriptEntry): boolean {
  if (entry.type !== 'user') return false;
  const content = entry.message?.content;
  if (typeof content === 'string') return content.trim().length > 0;
  if (!Array.isArray(content)) return false;
  return content.some(item => item.type !== 'tool_result');
}

function parseTodoWrite(tool: TranscriptToolUse): { done: number; total: number } | null {
  const todos = tool.input?.todos;
  if (!Array.isArray(todos)) return null;

  let done = 0;
  let total = 0;
  for (const todo of todos) {
    if (typeof todo !== 'object' || todo === null) continue;
    const status = String((todo as Record<string, unknown>).status || '').toLowerCase();
    total++;
    if (isDoneStatus(status)) done++;
  }

  return { done, total };
}

function isDoneStatus(status: string): boolean {
  return status === 'completed' || status === 'done';
}

function taskIdFromCreateResult(result: TranscriptToolResult): string | null {
  if (typeof result.content !== 'string') return null;
  return result.content.match(/Task #(\d+) created successfully/)?.[1] || null;
}

function agentLabel(tool: TranscriptToolUse): string | undefined {
  const input = tool.input || {};
  const value = input.subagent_type || input.description || input.prompt;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 24 ? `${trimmed.slice(0, 24)}…` : trimmed;
}

/**
 * Parse a transcript JSONL file and extract tool usage statistics.
 */
export function parseTranscript(filePath: string | null, maxLines: number = 500): ToolStats {
  const empty = emptyStats();
  if (!filePath) return empty;

  try {
    const tail = readTailLines(filePath, maxLines);
    const toolCounts: Record<string, number> = {};
    let lastEditFile: string | undefined;
    let agentCount = 0;
    let lastAgent: string | undefined;
    let todoDone = 0;
    let todoTotal = 0;
    let sawTodoWrite = false;
    const taskCreateToolIds = new Set<string>();
    const taskStatuses = new Map<string, string>();

    for (const line of tail) {
      let entry: TranscriptEntry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      if (isUserPromptEntry(entry)) {
        taskCreateToolIds.clear();
        taskStatuses.clear();
      }

      const toolUses = collectToolUses(entry);
      for (const tool of toolUses) {
        const name = (tool.name || '').toLowerCase();
        toolCounts[name] = (toolCounts[name] || 0) + 1;

        if (['edit', 'multiedit', 'write', 'notebookedit'].includes(name)) {
          const fp = fileFromTool(tool);
          if (fp) lastEditFile = fp;
        }

        if (['task', 'agent', 'subagent'].includes(name) || name.includes('agent')) {
          agentCount++;
          lastAgent = agentLabel(tool) || lastAgent;
        }

        if (name === 'taskcreate') {
          taskCreateToolIds.add(tool.id);
        }

        if (name === 'taskupdate') {
          const taskId = tool.input?.taskId;
          const status = tool.input?.status;
          if (typeof taskId === 'string' && typeof status === 'string') {
            taskStatuses.set(taskId, status.toLowerCase());
          }
        }

        if (name === 'todowrite' || name === 'todo_write') {
          const parsed = parseTodoWrite(tool);
          if (parsed) {
            todoDone = parsed.done;
            todoTotal = parsed.total;
            sawTodoWrite = true;
          }
        }
      }

      for (const result of collectToolResults(entry)) {
        if (!taskCreateToolIds.has(result.tool_use_id)) continue;
        const taskId = taskIdFromCreateResult(result);
        if (taskId) taskStatuses.set(taskId, taskStatuses.get(taskId) || 'pending');
      }

      const text = textFromEntry(entry);
      if (text && !sawTodoWrite) {
        const doneCount = text.match(/\[x\]/gi)?.length || 0;
        const pendingCount = text.match(/\[ \]/g)?.length || 0;
        todoDone += doneCount;
        todoTotal += doneCount + pendingCount;
      }
    }

    if (!sawTodoWrite && taskStatuses.size > 0) {
      todoTotal = taskStatuses.size;
      todoDone = [...taskStatuses.values()].filter(isDoneStatus).length;
    }

    const totalCalls = Object.values(toolCounts).reduce((a, b) => a + b, 0);
    const writes =
      (toolCounts['write'] || 0) +
      (toolCounts['notebookedit'] || 0);

    return {
      edits:
        (toolCounts['edit'] || 0) +
        (toolCounts['multiedit'] || 0) +
        writes,
      reads:
        (toolCounts['read'] || 0) +
        (toolCounts['notebookread'] || 0),
      greps:
        (toolCounts['grep'] || 0) +
        (toolCounts['glob'] || 0) +
        (toolCounts['lcm_grep'] || 0),
      writes,
      bash: (toolCounts['bash'] || 0) + (toolCounts['exec'] || 0),
      webFetches:
        (toolCounts['webfetch'] || 0) +
        (toolCounts['web_fetch'] || 0) +
        (toolCounts['websearch'] || 0) +
        (toolCounts['web_search'] || 0),
      totalCalls,
      lastEditFile,
      agents: agentCount,
      lastAgent,
      todos: { done: todoDone, total: todoTotal },
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
