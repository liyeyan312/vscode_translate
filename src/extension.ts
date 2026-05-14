import * as vscode from "vscode";
import { formatTextForInsertionBelow, formatTextForLineInsertion, normalizeTextForTranslation } from "./editorText";
import { translateToChinese, type TranslateConfig, type TranslateStyle } from "./translator";
import { renderTranslationWebviewHtml } from "./webview";

type TranslationPanelMessage = {
  command?: string;
  translatedText?: string;
  style?: string;
};

let translationPanel: vscode.WebviewPanel | undefined;
let translationPanelMessageSubscription: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("llmTranslate.insertBelow", () => runInsertBelow()),
    vscode.commands.registerCommand("llmTranslate.showResult", () => runShowResult())
  );
}

export function deactivate(): void {
  // No background resources to dispose.
}

async function runInsertBelow(): Promise<void> {
  await withTranslation("technical", async ({ editor, selection, selectedText, translatedText }) => {
    await insertBelow(editor, selection, selectedText, translatedText);
    await focusEditor(editor, selection);
  });
}

async function runShowResult(): Promise<void> {
  const style: TranslateStyle = "technical";
  await withTranslation(style, async ({ editor, selection, selectedText, translatedText }) => {
    showTranslationPanel(editor, selection, selectedText, translatedText, style);
  });
}

function showTranslationPanel(
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  selectedText: string,
  translatedText: string,
  style: TranslateStyle
): void {
  const panel = getOrCreateTranslationPanel();
  panel.reveal(vscode.ViewColumn.Beside, false);

  panel.webview.html = renderTranslationWebviewHtml({
    nonce: createNonce(),
    selectedText,
    translatedText,
    style
  });

  translationPanelMessageSubscription?.dispose();
  translationPanelMessageSubscription = panel.webview.onDidReceiveMessage(async (message: TranslationPanelMessage) => {
    const editedText = message.translatedText ?? translatedText;
    const selectedStyle = parseTranslateStyle(message.style);

    if (message.command === "copy") {
      await vscode.env.clipboard.writeText(editedText);
      await panel.webview.postMessage({ command: "setStatus", text: "已复制" });
      return;
    }

    if (message.command === "replace") {
      await editor.edit((editBuilder) => editBuilder.replace(selection, editedText));
      panel.dispose();
      await focusEditor(editor, selection);
      return;
    }

    if (message.command === "insertBelow") {
      await insertBelow(editor, selection, selectedText, editedText);
      panel.dispose();
      await focusEditor(editor, selection);
      return;
    }

    if (message.command === "retranslate") {
      await retranslateIntoPanel(panel, selectedText, selectedStyle);
    }
  });
}

async function withTranslation(
  style: TranslateStyle,
  handler: (result: {
    editor: vscode.TextEditor;
    selection: vscode.Selection;
    selectedText: string;
    translatedText: string;
  }) => Promise<void>
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Open a file and select text before translating.");
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  if (!selectedText.trim()) {
    vscode.window.showWarningMessage("Select text before translating.");
    return;
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Translating selection...",
        cancellable: false
      },
      async () => {
        const translatedText = await translateToChinese(normalizeTextForTranslation(selectedText), readConfig(), style);
        await handler({ editor, selection, selectedText, translatedText });
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`LLM translation failed: ${message}`);
  }
}

function readConfig(): TranslateConfig {
  const config = vscode.workspace.getConfiguration("llmTranslate");

  return {
    baseUrl: config.get<string>("baseUrl", "https://token-plan-cn.xiaomimimo.com/v1"),
    apiKey: config.get<string>("apiKey", ""),
    model: config.get<string>("model", "MiMo-V2.5"),
    temperature: config.get<number>("temperature", 0.2)
  };
}

function getOrCreateTranslationPanel(): vscode.WebviewPanel {
  if (translationPanel) {
    return translationPanel;
  }

  translationPanel = vscode.window.createWebviewPanel(
    "llmTranslate.result",
    "LLM Translate",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  translationPanel.onDidDispose(() => {
    translationPanel = undefined;
    translationPanelMessageSubscription?.dispose();
    translationPanelMessageSubscription = undefined;
  });

  return translationPanel;
}

async function retranslateIntoPanel(
  panel: vscode.WebviewPanel,
  selectedText: string,
  style: TranslateStyle
): Promise<void> {
  try {
    await panel.webview.postMessage({ command: "setBusy", busy: true });
    const translatedText = await translateToChinese(normalizeTextForTranslation(selectedText), readConfig(), style);
    await panel.webview.postMessage({ command: "setTranslation", translatedText });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`LLM translation failed: ${message}`);
  } finally {
    await panel.webview.postMessage({ command: "setBusy", busy: false });
  }
}

async function focusEditor(editor: vscode.TextEditor, selection: vscode.Selection): Promise<void> {
  const focusedEditor = await vscode.window.showTextDocument(
    editor.document,
    editor.viewColumn ?? vscode.ViewColumn.Active,
    false
  );
  focusedEditor.selection = selection;
  focusedEditor.revealRange(selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
}

async function insertBelow(
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  selectedText: string,
  translatedText: string
): Promise<void> {
  const anchorLineNumber = getAnchorLineNumber(selection);
  const anchorLine = editor.document.lineAt(anchorLineNumber);
  const nextLineNumber = anchorLineNumber + 1;

  if (nextLineNumber < editor.document.lineCount) {
    const insertion = formatTextForLineInsertion(selectedText, translatedText, anchorLine.text);
    await editor.edit((editBuilder) => editBuilder.insert(new vscode.Position(nextLineNumber, 0), insertion));
    return;
  }

  const insertion = formatTextForInsertionBelow(anchorLine.text, translatedText);
  await editor.edit((editBuilder) => editBuilder.insert(anchorLine.range.end, insertion));
}

function getAnchorLineNumber(selection: vscode.Selection): number {
  if (selection.end.character === 0 && selection.end.line > selection.start.line) {
    return selection.end.line - 1;
  }

  return selection.end.line;
}

function parseTranslateStyle(value: string | undefined): TranslateStyle {
  if (
    value === "technical" ||
    value === "concise" ||
    value === "natural" ||
    value === "termPreserving" ||
    value === "casual"
  ) {
    return value;
  }

  return "technical";
}

function createNonce(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";

  for (let i = 0; i < 32; i += 1) {
    nonce += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return nonce;
}
