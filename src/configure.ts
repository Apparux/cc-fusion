import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'process';
import type { Config } from './types.js';
import { getUserConfigDir, getUserConfigPath, loadConfig, readConfigFile } from './config.js';

const THEMES = ['cometix', 'hud', 'neon', 'gruvbox', 'dracula', 'nord'] as const;
const PRESETS = ['full', 'essential', 'minimal'] as const;
const LANGUAGES = ['en', 'zh'] as const;
const ELEMENTS = ['usage', 'cost', 'duration', 'effort', 'tools', 'agents', 'todos'] as const;

const THEME_DESCRIPTIONS: Record<string, string> = {
  cometix: 'CCometixLine-inspired Nerd Font style',
  hud: 'muted Claude HUD style',
  neon: 'purple HUD style with bracketed mint bars',
  gruvbox: 'warm retro palette',
  dracula: 'modern dark purple palette',
  nord: 'cold Nordic blue-gray palette',
};

const PRESET_DESCRIPTIONS: Record<string, string> = {
  full: '3 lines with all elements',
  essential: '2 lines with model, git, context, usage, and cost',
  minimal: '1 line with model and context only',
};

const LANGUAGE_DESCRIPTIONS: Record<string, string> = {
  en: 'English labels',
  zh: 'Chinese labels',
};

type Choice = readonly string[];

type Prompt = {
  ask(question: string): Promise<string>;
  close(): void;
};

type ManagedConfig = Pick<
  Config,
  'theme' | 'preset' | 'lang' | 'showTranscript' | 'barWidth' | 'usageThreshold' | 'tokenBreakdownThreshold'
> & { elements?: Record<string, boolean> };

function formatPath(path: string): string {
  const home = process.env.HOME;
  return home && path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

function defaultChoice<T extends Choice>(choices: T, value: string): T[number] {
  return choices.includes(value) ? value : choices[0];
}

function createPrompt(): Prompt {
  const rl = createInterface({ input, crlfDelay: Infinity });
  const lines: string[] = [];
  const waiting: Array<(line: string) => void> = [];
  let ended = false;

  rl.on('line', line => {
    const resolve = waiting.shift();
    if (resolve) resolve(line);
    else lines.push(line);
  });

  rl.on('close', () => {
    ended = true;
    while (waiting.length > 0) waiting.shift()?.('');
  });

  return {
    ask(question: string): Promise<string> {
      output.write(question);
      const line = lines.shift();
      if (line !== undefined) return Promise.resolve(line);
      if (ended) return Promise.resolve('');
      return new Promise(resolve => waiting.push(resolve));
    },
    close(): void {
      rl.close();
    },
  };
}

async function askChoice<T extends Choice>(
  prompt: Prompt,
  label: string,
  choices: T,
  current: string,
  descriptions: Record<string, string> = {}
): Promise<T[number]> {
  const defaultValue = defaultChoice(choices, current);

  while (true) {
    output.write(`\n${label}\n`);
    choices.forEach((choice, index) => {
      const marker = choice === defaultValue ? ' current' : '';
      const description = descriptions[choice] ? ` — ${descriptions[choice]}` : '';
      output.write(`  ${index + 1}. ${choice}${marker}${description}\n`);
    });

    const answer = (await prompt.ask(`Choose ${label.toLowerCase()} [${defaultValue}]: `)).trim();
    if (!answer) return defaultValue;

    const byIndex = Number(answer);
    if (Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= choices.length) {
      return choices[byIndex - 1];
    }

    if (choices.includes(answer)) return answer;
    output.write(`Invalid choice. Enter 1-${choices.length} or one of: ${choices.join(', ')}.\n`);
  }
}

async function askBoolean(
  prompt: Prompt,
  label: string,
  current: boolean
): Promise<boolean> {
  const suffix = current ? 'Y/n' : 'y/N';

  while (true) {
    const answer = (await prompt.ask(`${label} [${suffix}]: `)).trim().toLowerCase();
    if (!answer) return current;
    if (['y', 'yes'].includes(answer)) return true;
    if (['n', 'no'].includes(answer)) return false;
    output.write('Enter yes or no.\n');
  }
}

async function askNumber(
  prompt: Prompt,
  label: string,
  current: number,
  min: number,
  max: number
): Promise<number> {
  while (true) {
    const answer = (await prompt.ask(`${label} (${min}-${max}) [${current}]: `)).trim();
    if (!answer) return current;

    const value = Number(answer);
    if (Number.isInteger(value) && value >= min && value <= max) return value;
    output.write(`Enter a whole number from ${min} to ${max}.\n`);
  }
}

function buildNextConfig(existing: Record<string, unknown>, managed: ManagedConfig): Record<string, unknown> {
  return {
    ...existing,
    ...managed,
    elements: managed.elements
      ? { ...((existing.elements as Record<string, boolean> | undefined) || {}), ...managed.elements }
      : existing.elements,
  };
}

function printStatusLineInstructions(): void {
  output.write(`\nClaude Code statusLine examples:\n\n`);
  output.write(`npm install:\n`);
  output.write(`{
  "statusLine": {
    "type": "command",
    "command": "cc-fusion",
    "padding": 0
  }
}\n\n`);
  output.write(`curl/source install:\n`);
  output.write(`{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/cc-fusion/dist/index.js",
    "padding": 0
  }
}\n`);
}

export async function runConfigureCommand(): Promise<void> {
  const configPath = getUserConfigPath();
  const effectiveConfig = loadConfig();
  const hasExistingConfig = existsSync(configPath);
  let existingConfig = hasExistingConfig ? readConfigFile(configPath) : null;

  const prompt = createPrompt();
  try {
    output.write('CC-Fusion guided configuration\n');
    output.write(`Config file: ${formatPath(configPath)}\n`);

    if (hasExistingConfig && !existingConfig) {
      const overwrite = await askBoolean(
        prompt,
        'Existing config is not valid JSON. Overwrite it',
        false
      );
      if (!overwrite) {
        output.write('Aborted. Fix the config file or move it aside, then rerun configure.\n');
        return;
      }
      existingConfig = {};
    }

    const theme = await askChoice(prompt, 'Theme (visual style)', THEMES, effectiveConfig.theme, THEME_DESCRIPTIONS);
    const preset = await askChoice(prompt, 'Preset (line layout)', PRESETS, effectiveConfig.preset, PRESET_DESCRIPTIONS);
    const lang = await askChoice(prompt, 'Language', LANGUAGES, effectiveConfig.lang, LANGUAGE_DESCRIPTIONS);
    const showTranscript = await askBoolean(
      prompt,
      '\nParse transcript for tools, agents, and todos',
      effectiveConfig.showTranscript
    );

    const managed: ManagedConfig = {
      theme,
      preset,
      lang,
      showTranscript,
      barWidth: effectiveConfig.barWidth,
      usageThreshold: effectiveConfig.usageThreshold,
      tokenBreakdownThreshold: effectiveConfig.tokenBreakdownThreshold,
    };

    const configureAdvanced = await askBoolean(prompt, '\nConfigure advanced display options', false);
    if (configureAdvanced) {
      managed.barWidth = await askNumber(prompt, 'Progress bar width', effectiveConfig.barWidth, 5, 60);
      managed.usageThreshold = await askNumber(prompt, 'Usage display threshold', effectiveConfig.usageThreshold, 1, 100);
      managed.tokenBreakdownThreshold = await askNumber(
        prompt,
        'Token breakdown threshold',
        effectiveConfig.tokenBreakdownThreshold,
        1,
        100
      );

      managed.elements = {};
      output.write('\nElements\n');
      for (const element of ELEMENTS) {
        const current = effectiveConfig.elements?.[element] !== false;
        managed.elements[element] = await askBoolean(prompt, `Show ${element}`, current);
      }
    }

    const nextConfig = buildNextConfig(existingConfig || {}, managed);
    mkdirSync(getUserConfigDir(), { recursive: true });
    writeFileSync(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`);

    output.write(`\nSaved CC-Fusion config to ${formatPath(configPath)}\n`);
    output.write(`\nSelected:\n`);
    output.write(`- theme: ${theme}\n`);
    output.write(`- preset: ${preset}\n`);
    output.write(`- lang: ${lang}\n`);
    output.write(`- showTranscript: ${showTranscript}\n`);

    const showStatusLine = await askBoolean(
      prompt,
      '\nShow Claude Code statusLine setup snippet',
      true
    );
    if (showStatusLine) printStatusLineInstructions();
  } finally {
    prompt.close();
  }
}
