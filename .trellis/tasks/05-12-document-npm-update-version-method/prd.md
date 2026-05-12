# Document npm update version method

## Goal

Add a concise README section that tells installed users how to update the globally installed `cc-fusion` npm package and verify the installed version.

## What I already know

* The user requested: "readme里补充一下npm更新版本的方法".
* The README files already have matching English and Chinese installation sections.
* `package.json` exposes the `cc-fusion` binary.
* `src/index.ts` supports `cc-fusion --version`, so version verification can be documented.

## Assumptions

* This is user-facing update documentation, not release-publisher version bump instructions.
* Add the content near the existing npm install instructions in both README files.
* Keep the change documentation-only and minimal.

## Requirements

* Add an npm update subsection to `README.md` near installation instructions.
* Add the equivalent npm update subsection to `README.zh.md`.
* Include a command to update globally installed `cc-fusion` to the latest npm release.
* Include a command to verify the installed version.

## Acceptance Criteria

* [ ] `README.md` includes npm update instructions near install instructions.
* [ ] `README.zh.md` includes equivalent Chinese npm update instructions near install instructions.
* [ ] The documented version check command matches the existing CLI implementation.
* [ ] Markdown whitespace checks pass.

## Definition of Done

* Docs/spec-only verification is run with `git diff --check`.
* No code behavior changes are introduced.
* Changes are committed and pushed per project workflow after verification.

## Technical Approach

Insert a short `Update via npm` / `通过 npm 更新` subsection after the `Install via npm` subsection, using `npm install -g cc-fusion@latest` as the canonical update command and `cc-fusion --version` as the verification command.

## Decision (ADR-lite)

**Context**: Users installing the global npm package need a clear update path.
**Decision**: Document the explicit `npm install -g cc-fusion@latest` command because it upgrades or reinstalls the latest published version predictably.
**Consequences**: The README stays focused on end-user updates; release-publisher versioning remains out of scope.

## Out of Scope

* Release publishing workflow or package version bump instructions.
* CLI behavior changes.
* Adding a new update command to the CLI.

## Technical Notes

* Files inspected: `README.md`, `README.zh.md`, `package.json`, `src/index.ts`.
* Relevant existing CLI command: `cc-fusion --version`.
