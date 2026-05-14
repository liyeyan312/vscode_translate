# VS Code LLM Translate Extension Design

## Goal

Build a VS Code extension that translates selected text, especially code comments, into Chinese through an OpenAI-compatible LLM API.

## Commands

The extension provides two commands with separate default keybindings:

- `llmTranslate.insertBelow`: translate the active selection and insert the Chinese result below the selected block.
- `llmTranslate.showResult`: translate the active selection and show the Chinese result in a modal with actions to copy, replace the selection, or insert below.

## Configuration

The extension reads these settings from VS Code:

- `llmTranslate.baseUrl`, default `https://token-plan-cn.xiaomimimo.com/v1`
- `llmTranslate.apiKey`, default empty string
- `llmTranslate.model`, default `MiMo-V2.5`
- `llmTranslate.temperature`, default `0.2`

The API key is never hardcoded in source files.

## Architecture

`src/extension.ts` owns VS Code activation, command registration, editor edits, and user-facing messages. `src/translator.ts` owns configuration normalization, prompt construction, OpenAI-compatible HTTP calls, and response parsing. This keeps VS Code APIs out of translation logic so the LLM client can be unit tested.

## Data Flow

When a command runs, the extension reads the active editor selection. If it is empty, it shows a warning. Otherwise it calls the translator with the selected text. For insert mode, the result is inserted below the selected selection range. For popup mode, the result is shown through `showInformationMessage` with action buttons.

## Error Handling

Missing API key, failed HTTP responses, missing choices, and network failures surface as clear VS Code error messages. Translator errors include short actionable messages and avoid printing the secret key.

## Testing

Unit tests cover prompt construction, OpenAI response parsing, HTTP error handling, and editor-independent insertion text calculation. TypeScript compilation verifies extension packaging types.
