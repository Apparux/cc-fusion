#!/usr/bin/env node
// postinstall — print setup instructions after npm install

const chalk = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

console.log(`
${chalk.green('✅ CC-Fusion installed successfully!')}

${chalk.bold('📋 Next step — add this to ~/.claude/settings.json:')}

${chalk.cyan(`  {
    "statusLine": {
      "type": "command",
      "command": "cc-fusion",
      "padding": 0
    }
  }`)}

Then restart Claude Code. Enjoy! 🎉

${chalk.yellow('To uninstall:')} npm uninstall -g cc-fusion
`);
