# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project-specific workflow

- After verified changes in this repository, commit and push them yourself by default.
- When changes should be released to npm, bump `package.json`/`package-lock.json` to a new version, commit, push, create a `v*.*.*` tag to trigger the GitHub Actions npm publish workflow, and create a GitHub Release for the same tag after the npm publish workflow succeeds.
- Do not bypass failed builds, failed smoke tests, authentication failures, or token-safety issues. Stop and report the blocker instead.
- Do not commit local Claude Code harness files such as `.claude/settings.local.json`.

## Common commands

```bash
# Install dependencies
npm install

# Build TypeScript into dist/
npm run build

# Run build-backed regression tests
npm test

# Watch build during development
npm run dev

# Run the guided user configuration flow
node dist/index.js configure

# Smoke test statusline rendering with sample stdin
printf '{"model":{"display_name":"Opus 4.7","id":"claude-opus-4-7"},"context_window":{"total_input_tokens":76000,"total_output_tokens":12000,"context_window_size":200000,"used_percentage":38,"current_usage":{"input_tokens":28000,"output_tokens":12000,"cache_creation_input_tokens":8000,"cache_read_input_tokens":40000}},"cost":{"total_cost_usd":0.42},"cwd":"/tmp/project"}' | node dist/index.js

# Preview package contents before publish
npm pack --dry-run
```

Use `npm test`, targeted stdin smoke tests, `git diff --check`, and `npm pack --dry-run` for verification. `npm test` runs `npm run build` first, then executes the Node built-in regression tests.

## Architecture overview

CC-Fusion is a TypeScript CLI package whose `cc-fusion` binary points to `dist/index.js`. The default no-argument path is a Claude Code statusline renderer: it reads JSON from stdin, loads config/theme/preset/i18n, collects Git and transcript-derived activity, then renders one or more statusline rows.

`src/index.ts` owns command dispatch. `configure`, `config`, and `init` run the guided configuration flow in `src/configure.ts`; no-argument execution runs the statusline renderer. Keep command handling before stdin reads so interactive commands do not consume Claude Code statusline input.

Configuration and presentation are intentionally separated:

- `src/config.ts` loads config in this order: built-in defaults, package `config.json`, project `cc-fusion.config.json`, user `~/.claude/cc-fusion/config.json`, then `CC_FUSION_CONFIG`.
- Themes are TOML palettes/icons in `themes/` and optional user overrides in `~/.claude/cc-fusion/themes/`.
- Presets are layout definitions in `presets/` and optional user overrides in `~/.claude/cc-fusion/presets/`.
- Do not couple visual theme changes to preset/layout behavior.

Rendering is organized by elements. `src/render.ts` maps preset element names (`model`, `dir`, `git`, `context`, `usage`, `cost`, `duration`, `effort`, `tools`, `agents`, `todos`) to renderer functions. Individual element modules handle semantics such as context percentage, real usage/rate-limit display, smart cost hiding, and effort coloring.

Claude Code input compatibility is centralized in `src/stdin.ts`. Prefer adding schema compatibility helpers there rather than scattering field checks across renderers. Current context-window support must handle both legacy fields (`input_tokens`, `max_context_window_size`) and current fields (`context_window.used_percentage`, `context_window.context_window_size`, `context_window.current_usage`, `total_input_tokens`, `total_output_tokens`).

Transcript parsing is in `src/transcript.ts`. It tail-reads JSONL files under `~/.claude/projects/`, supports top-level and nested `tool_use` entries, and aggregates tools, agents, todos, and latest edit file for the activity line.

## Release flow

The repository has `.github/workflows/npm-publish.yml`, which publishes to npm when a `v*.*.*` tag is pushed. The workflow expects the repository secret `NPM_TOKEN` and runs `npm ci`, `npm run build`, and `npm publish`.

For a patch release after a verified fix:

```bash
npm version patch --no-git-tag-version
npm run build
npm pack --dry-run
git add package.json package-lock.json dist/ src/ README.md README.zh.md install.sh scripts/ themes/ presets/ i18n/ .github/ CLAUDE.md
git commit -m "chore: bump version to <version>"
git push origin main
git tag -a v<version> -m "Release v<version>"
git push origin v<version>
gh release create v<version> --repo CanCanNeedNei/cc-fusion --title "v<version>" --notes "$(cat <<'EOF'
## Summary
- <release note bullet>

## Verification
- npm publish workflow succeeded
- npm view cc-fusion version reports <version>
EOF
)"
```

Use `minor` instead of `patch` for user-facing features. After pushing a release tag, check GitHub Actions with `gh run list --repo CanCanNeedNei/cc-fusion --workflow npm-publish.yml --limit 5`, confirm npm with `npm view cc-fusion version`, and confirm the GitHub Release with `gh release view v<version> --repo CanCanNeedNei/cc-fusion`.
