"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runConfigureCommand = runConfigureCommand;
const fs_1 = require("fs");
const readline_1 = require("readline");
const process_1 = require("process");
const config_js_1 = require("./config.js");
const THEMES = ['cometix', 'hud', 'neon', 'gruvbox', 'dracula', 'nord'];
const PRESETS = ['full', 'essential', 'minimal'];
const LANGUAGES = ['en', 'zh'];
const ELEMENTS = ['usage', 'cost', 'duration', 'effort', 'tools', 'agents', 'todos'];
const THEME_DESCRIPTIONS = {
    cometix: 'CCometixLine-inspired Nerd Font style',
    hud: 'muted Claude HUD style',
    neon: 'purple HUD style with bracketed mint bars',
    gruvbox: 'warm retro palette',
    dracula: 'modern dark purple palette',
    nord: 'cold Nordic blue-gray palette',
};
const PRESET_DESCRIPTIONS = {
    full: 'full multi-line layout with all elements',
    essential: '2 lines with model, git, context, usage, and cost',
    minimal: '1 line with model and context only',
};
const LANGUAGE_DESCRIPTIONS = {
    en: 'English labels',
    zh: 'Chinese labels',
};
function formatPath(path) {
    const home = process.env.HOME;
    return home && path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}
function defaultChoice(choices, value) {
    return choices.includes(value) ? value : choices[0];
}
function createPrompt() {
    const rl = (0, readline_1.createInterface)({ input: process_1.stdin, crlfDelay: Infinity });
    const lines = [];
    const waiting = [];
    let ended = false;
    rl.on('line', line => {
        const resolve = waiting.shift();
        if (resolve)
            resolve(line);
        else
            lines.push(line);
    });
    rl.on('close', () => {
        ended = true;
        while (waiting.length > 0)
            waiting.shift()?.('');
    });
    return {
        ask(question) {
            process_1.stdout.write(question);
            const line = lines.shift();
            if (line !== undefined)
                return Promise.resolve(line);
            if (ended)
                return Promise.resolve('');
            return new Promise(resolve => waiting.push(resolve));
        },
        close() {
            rl.close();
        },
    };
}
async function askChoice(prompt, label, choices, current, descriptions = {}) {
    const defaultValue = defaultChoice(choices, current);
    while (true) {
        process_1.stdout.write(`\n${label}\n`);
        choices.forEach((choice, index) => {
            const marker = choice === defaultValue ? ' current' : '';
            const description = descriptions[choice] ? ` — ${descriptions[choice]}` : '';
            process_1.stdout.write(`  ${index + 1}. ${choice}${marker}${description}\n`);
        });
        const answer = (await prompt.ask(`Choose ${label.toLowerCase()} [${defaultValue}]: `)).trim();
        if (!answer)
            return defaultValue;
        const byIndex = Number(answer);
        if (Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= choices.length) {
            return choices[byIndex - 1];
        }
        if (choices.includes(answer))
            return answer;
        process_1.stdout.write(`Invalid choice. Enter 1-${choices.length} or one of: ${choices.join(', ')}.\n`);
    }
}
async function askBoolean(prompt, label, current) {
    const suffix = current ? 'Y/n' : 'y/N';
    while (true) {
        const answer = (await prompt.ask(`${label} [${suffix}]: `)).trim().toLowerCase();
        if (!answer)
            return current;
        if (['y', 'yes'].includes(answer))
            return true;
        if (['n', 'no'].includes(answer))
            return false;
        process_1.stdout.write('Enter yes or no.\n');
    }
}
async function askNumber(prompt, label, current, min, max) {
    while (true) {
        const answer = (await prompt.ask(`${label} (${min}-${max}) [${current}]: `)).trim();
        if (!answer)
            return current;
        const value = Number(answer);
        if (Number.isInteger(value) && value >= min && value <= max)
            return value;
        process_1.stdout.write(`Enter a whole number from ${min} to ${max}.\n`);
    }
}
function buildNextConfig(existing, managed) {
    return {
        ...existing,
        ...managed,
        elements: managed.elements
            ? { ...(existing.elements || {}), ...managed.elements }
            : existing.elements,
    };
}
function printStatusLineInstructions() {
    process_1.stdout.write(`\nClaude Code statusLine examples:\n\n`);
    process_1.stdout.write(`npm install:\n`);
    process_1.stdout.write(`{
  "statusLine": {
    "type": "command",
    "command": "cc-fusion",
    "padding": 0
  }
}\n\n`);
    process_1.stdout.write(`curl/source install:\n`);
    process_1.stdout.write(`{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/cc-fusion/dist/index.js",
    "padding": 0
  }
}\n`);
}
async function runConfigureCommand() {
    const configPath = (0, config_js_1.getUserConfigPath)();
    const effectiveConfig = (0, config_js_1.loadConfig)();
    const hasExistingConfig = (0, fs_1.existsSync)(configPath);
    let existingConfig = hasExistingConfig ? (0, config_js_1.readConfigFile)(configPath) : null;
    const prompt = createPrompt();
    try {
        process_1.stdout.write('CC-Fusion guided configuration\n');
        process_1.stdout.write(`Config file: ${formatPath(configPath)}\n`);
        if (hasExistingConfig && !existingConfig) {
            const overwrite = await askBoolean(prompt, 'Existing config is not valid JSON. Overwrite it', false);
            if (!overwrite) {
                process_1.stdout.write('Aborted. Fix the config file or move it aside, then rerun configure.\n');
                return;
            }
            existingConfig = {};
        }
        const theme = await askChoice(prompt, 'Theme (visual style)', THEMES, effectiveConfig.theme, THEME_DESCRIPTIONS);
        const preset = await askChoice(prompt, 'Preset (line layout)', PRESETS, effectiveConfig.preset, PRESET_DESCRIPTIONS);
        const lang = await askChoice(prompt, 'Language', LANGUAGES, effectiveConfig.lang, LANGUAGE_DESCRIPTIONS);
        const showTranscript = await askBoolean(prompt, '\nParse transcript for tools, agents, and todos', effectiveConfig.showTranscript);
        const managed = {
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
            managed.tokenBreakdownThreshold = await askNumber(prompt, 'Token breakdown threshold', effectiveConfig.tokenBreakdownThreshold, 1, 100);
            managed.elements = {};
            process_1.stdout.write('\nElements\n');
            for (const element of ELEMENTS) {
                const current = effectiveConfig.elements?.[element] !== false;
                managed.elements[element] = await askBoolean(prompt, `Show ${element}`, current);
            }
        }
        const nextConfig = buildNextConfig(existingConfig || {}, managed);
        (0, fs_1.mkdirSync)((0, config_js_1.getUserConfigDir)(), { recursive: true });
        (0, fs_1.writeFileSync)(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`);
        process_1.stdout.write(`\nSaved CC-Fusion config to ${formatPath(configPath)}\n`);
        process_1.stdout.write(`\nSelected:\n`);
        process_1.stdout.write(`- theme: ${theme}\n`);
        process_1.stdout.write(`- preset: ${preset}\n`);
        process_1.stdout.write(`- lang: ${lang}\n`);
        process_1.stdout.write(`- showTranscript: ${showTranscript}\n`);
        const showStatusLine = await askBoolean(prompt, '\nShow Claude Code statusLine setup snippet', true);
        if (showStatusLine)
            printStatusLineInstructions();
    }
    finally {
        prompt.close();
    }
}
//# sourceMappingURL=configure.js.map