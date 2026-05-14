import type { TranslateStyle } from "./translator";

export type TranslationWebviewInput = {
  nonce: string;
  selectedText: string;
  translatedText: string;
  style?: TranslateStyle;
};

export const TRANSLATION_STYLES: Array<{ id: TranslateStyle; label: string }> = [
  { id: "technical", label: "技术注释" },
  { id: "concise", label: "简洁" },
  { id: "natural", label: "自然中文" },
  { id: "termPreserving", label: "保留英文术语" },
  { id: "casual", label: "口语化" }
];

export function renderTranslationWebviewHtml(input: TranslationWebviewInput): string {
  const selectedText = escapeHtml(input.selectedText);
  const translatedText = escapeHtml(input.translatedText);
  const currentStyle = input.style ?? "technical";
  const styleOptions = TRANSLATION_STYLES.map((style) => {
    const selected = style.id === currentStyle ? " selected" : "";
    return `<option value="${style.id}"${selected}>${escapeHtml(style.label)}</option>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${input.nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Translate</title>
  <style>
    :root {
      color-scheme: light dark;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-width: 360px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      line-height: 1.55;
    }

    .shell {
      display: flex;
      min-height: 100vh;
      flex-direction: column;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 22px 14px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
    }

    .title {
      margin: 0;
      font-size: 15px;
      font-weight: 650;
      letter-spacing: 0;
    }

    .meta {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      white-space: nowrap;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    label {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    select {
      min-height: 28px;
      padding: 3px 24px 3px 8px;
      border: 1px solid var(--vscode-dropdown-border);
      border-radius: 4px;
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      font: inherit;
    }

    .content {
      flex: 1;
      overflow: auto;
      padding: 22px;
    }

    .section {
      margin: 0 0 18px;
    }

    .section-title {
      margin: 0 0 8px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .translation {
      display: block;
      width: 100%;
      min-height: 220px;
      resize: vertical;
      margin: 0;
      padding: 16px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-font-family);
      font-size: 14px;
      line-height: 1.7;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    details {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      background: var(--vscode-sideBar-background);
    }

    summary {
      cursor: pointer;
      padding: 10px 12px;
      color: var(--vscode-descriptionForeground);
      user-select: none;
    }

    .source {
      margin: 0;
      padding: 0 12px 12px;
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-editor-font-family), var(--vscode-font-family);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
      align-items: center;
      padding: 14px 22px;
      border-top: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
    }

    button {
      min-height: 30px;
      padding: 4px 12px;
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      font: inherit;
      cursor: pointer;
    }

    button:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    button:disabled,
    button:disabled:hover {
      opacity: 0.55;
      cursor: not-allowed;
      background: var(--vscode-button-secondaryBackground);
    }

    button.primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    button.primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .status {
      margin-right: auto;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .loading {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-right: auto;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .loading[hidden] {
      display: none;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid var(--vscode-progressBar-background);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
  <main id="app" class="shell" aria-busy="false">
    <header class="header">
      <h1 class="title">LLM Translate</h1>
      <div class="controls">
        <label for="style">风格</label>
        <select id="style">${styleOptions}</select>
      </div>
    </header>

    <section class="content">
      <div class="section">
        <h2 class="section-title">译文</h2>
        <textarea id="translation" class="translation" spellcheck="false">${translatedText}</textarea>
      </div>

      <details>
        <summary>查看原文</summary>
        <pre class="source">${selectedText}</pre>
      </details>
    </section>

    <footer class="actions">
      <span id="status" class="status" aria-live="polite"></span>
      <span id="loading" class="loading" hidden aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        正在重新翻译...
      </span>
      <button type="button" data-action="retranslate">重新翻译</button>
      <button type="button" data-action="copy">复制</button>
      <button type="button" data-action="replace">替换选中内容</button>
      <button type="button" class="primary" data-action="insertBelow">插入到下方</button>
    </footer>
  </main>

  <script nonce="${input.nonce}">
    const vscode = acquireVsCodeApi();
    const main = document.getElementById("app");
    const translation = document.getElementById("translation");
    const style = document.getElementById("style");
    const status = document.getElementById("status");
    const loading = document.getElementById("loading");
    const actionButtons = Array.from(document.querySelectorAll("button[data-action]"));

    function setStatus(text) {
      status.textContent = text;
      if (text) {
        window.setTimeout(() => {
          if (status.textContent === text) {
            status.textContent = "";
          }
        }, 1800);
      }
    }

    function setBusy(busy) {
      main.setAttribute("aria-busy", String(busy));
      loading.hidden = !busy;
      status.hidden = busy;
      actionButtons.forEach((button) => {
        button.disabled = busy;
      });
    }

    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        vscode.postMessage({
          command: button.dataset.action,
          translatedText: translation.value,
          style: style.value
        });
      });
    });

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.command === "setTranslation") {
        translation.value = message.translatedText;
        setStatus("已更新");
      }

      if (message.command === "setBusy") {
        setBusy(message.busy);
      }

      if (message.command === "setStatus") {
        setStatus(message.text);
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
