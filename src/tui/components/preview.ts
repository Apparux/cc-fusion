/**
 * preview.ts — Preview panel component
 */

import type { Config, Theme, Preset, RenderContext, StdinData, GitInfo, ToolStats } from '../../types.js';
import { render } from '../../render.js';
import { loadI18n } from '../../i18n.js';
import type { Rect } from '../layout.js';
import { ANSI } from '../../utils.js';

export class PreviewPanel {
  private lines: string[] = [];

  render(
    rect: Rect,
    config: Config,
    theme: Theme,
    preset: Preset
  ): string[] {
    const mockContext = this.createMockContext(config, theme, preset);
    const previewOutput = render(mockContext);

    this.lines = previewOutput.split('\n');

    const output: string[] = [];
    const border = this.renderBorder(rect.width, 'Preview');
    output.push(border);

    for (let i = 0; i < rect.height - 2; i++) {
      const line = this.lines[i] || '';
      const padded = this.padLine(line, rect.width - 4);
      output.push(`${ANSI.dim}│${ANSI.reset} ${padded} ${ANSI.dim}│${ANSI.reset}`);
    }

    output.push(this.renderBorder(rect.width, ''));

    return output;
  }

  private createMockContext(config: Config, theme: Theme, preset: Preset): RenderContext {
    const mockStdin: StdinData = {
      model: { display_name: 'Claude Opus 4.7', id: 'claude-opus-4-7' },
      context_window: {
        used_percentage: 45,
        context_window_size: 200000,
        total_input_tokens: 60000,
        total_output_tokens: 30000,
        current_usage: {
          input_tokens: 28000,
          output_tokens: 12000,
          cache_creation_input_tokens: 8000,
          cache_read_input_tokens: 40000,
        },
      },
      cost: { total_cost_usd: 0.42 },
      cwd: '/Users/example/project',
    };

    const mockGit: GitInfo = {
      branch: 'main',
      dirty: true,
      ahead: 2,
      behind: 0,
      staged: 3,
      unstaged: 1,
      untracked: 2,
    };

    const mockTools: ToolStats = {
      totalCalls: 15,
      edits: 5,
      reads: 8,
      greps: 2,
      writes: 0,
      bash: 3,
      webFetches: 1,
      agents: 1,
      lastEditFile: 'src/config.ts',
      lastAgent: 'research',
      todos: { done: 2, total: 5 },
    };

    return {
      stdin: mockStdin,
      git: mockGit,
      tools: mockTools,
      theme,
      preset,
      config,
      i18n: loadI18n(config.lang),
      model: 'Opus 4.7',
      dir: '~/project',
      contextPct: 45,
      usagePct: 60,
      costUsd: 0.42,
      duration: '15m',
      effort: 'medium',
    };
  }

  private renderBorder(width: number, title: string): string {
    if (title) {
      const titlePart = ` ${title} `;
      const remaining = width - titlePart.length - 2;
      const left = Math.floor(remaining / 2);
      const right = remaining - left;
      return `${ANSI.dim}┌${'─'.repeat(left)}${ANSI.reset}${titlePart}${ANSI.dim}${'─'.repeat(right)}┐${ANSI.reset}`;
    }
    return `${ANSI.dim}└${'─'.repeat(width - 2)}┘${ANSI.reset}`;
  }

  private padLine(line: string, width: number): string {
    const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
    const visible = stripAnsi(line);
    const padding = Math.max(0, width - visible.length);
    return line + ' '.repeat(padding);
  }
}
