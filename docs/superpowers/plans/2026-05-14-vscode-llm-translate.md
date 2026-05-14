# VS Code LLM Translate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension that translates selected text into Chinese using an OpenAI-compatible LLM API.

**Architecture:** The extension entrypoint registers two commands and delegates translation to a small client module. The translator module owns request construction and response validation, while editor insertion helpers stay deterministic and testable.

**Tech Stack:** VS Code Extension API, TypeScript, Node 18+ `fetch`, Node test runner, Assert.

---

## File Structure

- `package.json`: extension manifest, commands, keybindings, config, scripts, dev dependencies.
- `tsconfig.json`: strict TypeScript build settings.
- `.vscodeignore`: packaged extension exclusions.
- `README.md`: setup and usage documentation.
- `src/translator.ts`: OpenAI-compatible translation client and prompt construction.
- `src/extension.ts`: activation, command handlers, VS Code UI, editor edits.
- `test/translator.test.ts`: unit tests for translator and editor text helper behavior.

## Tasks

### Task 1: Project Manifest and Compiler Setup

- [ ] Create `package.json` with extension metadata, two commands, default keybindings, configuration, build/test scripts, and dependencies.
- [ ] Create `tsconfig.json` targeting CommonJS output in `out`.
- [ ] Create `.vscodeignore` to exclude source, tests, and docs from the packaged extension.

### Task 2: Translator Tests First

- [ ] Write `test/translator.test.ts` covering translation request shape, missing API key, HTTP errors, response parsing, and insert-below formatting.
- [ ] Run `npm test` and confirm it fails because implementation files do not exist yet.

### Task 3: Translator Implementation

- [ ] Create `src/translator.ts` with `translateToChinese`, `buildTranslateMessages`, and typed configuration.
- [ ] Run `npm test` and confirm translator tests pass.

### Task 4: Extension Commands

- [ ] Create `src/extension.ts` with command registration for insert-below and popup result modes.
- [ ] Implement selection validation, config reading, insert-below edit, copy/replace/insert actions, and error display.
- [ ] Run `npm run compile`.

### Task 5: Documentation and Final Verification

- [ ] Create `README.md` with setup, API key configuration, commands, and shortcuts.
- [ ] Run `npm test`.
- [ ] Run `npm run compile`.
