#!/usr/bin/env node
/**
 * index.ts — CC-Fusion Entry Point
 * Reads Claude Code stdin JSON, renders 5-line statusline to stdout.
 */

import { readFileSync } from 'fs';
import { parseStdin, calcContextPct, getCwd, getContextTokens } from './stdin.js';
import { parseTranscript, findTranscript } from './transcript.js';
import { getGitInfo } from './git.js';
import { simplifyModel, getProjectName, formatTokens } from './utils.js';
import { render } from './render.js';
import type { RenderContext, ToolStats } from './types.js';

// ── Read stdin ───────────────────────────────────────────────────────────────

function readStdin(): string {
  try {
    return readFileSync('/dev/stdin', 'utf-8');
  } catch {
    return '{}';
  }
}

// ── CLI commands ─────────────────────────────────────────────────────────────

function printHelp(): void {
  process.stdout.write(`Usage:
  cc-fusion              Render statusline from Claude Code stdin
  cc-fusion --help       Show this help
  cc-fusion --version    Show version
`);
}

function readPackageVersion(): string {
  try {
    const pkgPath = new URL('../package.json', import.meta.url).pathname;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function handleCliCommand(command: string | undefined): boolean {
  if (!command) return false;

  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return true;
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    process.stdout.write(`${readPackageVersion()}\n`);
    return true;
  }

  process.stderr.write(`Unknown command: ${command}\n\n`);
  printHelp();
  process.exitCode = 1;
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  if (handleCliCommand(process.argv[2])) return;

  // 1. Parse stdin JSON
  const rawStdin = readStdin();
  const stdin = parseStdin(rawStdin);

  const cwd = getCwd(stdin);

  // 2. Collect git info
  const git = getGitInfo(cwd);

  // 3. Parse transcript
  const transcriptPath = typeof stdin.transcript_path === 'string' ? stdin.transcript_path : null;
  const tools = parseTranscript(transcriptPath);

  // 4. Build render context
  const model = simplifyModel(stdin.model?.display_name, stdin.model?.id);
  const project = getProjectName(cwd);
  const contextPct = calcContextPct(stdin);

  // Calculate token usage
  const contextWindow = stdin.context_window;
  const totalInput = contextWindow?.total_input_tokens || 0;
  const totalOutput = contextWindow?.total_output_tokens || 0;
  const contextSize = contextWindow?.context_window_size || 200000;
  const contextUsed = formatTokens(totalInput + totalOutput);
  const contextTotal = formatTokens(contextSize);

  const rc: RenderContext = {
    stdin,
    git,
    tools,
    model,
    project,
    contextPct,
    contextUsed,
    contextTotal,
  };

  // 5. Render and output
  const output = render(rc);
  if (output) {
    process.stdout.write(output + '\n');
  }
}

main();
