import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderTranslationWebviewHtml, TRANSLATION_STYLES } from "../src/webview";

describe("translation webview", () => {
  it("renders a VS Code themed translation panel with action buttons", () => {
    const html = renderTranslationWebviewHtml({
      nonce: "abc123",
      selectedText: "// Retry failed request",
      translatedText: "重试失败的请求"
    });

    assert.match(html, /LLM Translate/);
    assert.match(html, /重试失败的请求/);
    assert.match(html, /复制/);
    assert.match(html, /替换选中内容/);
    assert.match(html, /插入到下方/);
    assert.match(html, /重新翻译/);
    assert.match(html, /<textarea[^>]*id="translation"/);
    assert.match(html, /<select[^>]*id="style"/);
    assert.match(html, /var\(--vscode-editor-background\)/);
    assert.match(html, /nonce="abc123"/);
  });

  it("renders all translation styles and marks the current style as selected", () => {
    const html = renderTranslationWebviewHtml({
      nonce: "abc123",
      selectedText: "// Retry failed request",
      translatedText: "重试失败的请求",
      style: "concise"
    });

    for (const style of TRANSLATION_STYLES) {
      assert.match(html, new RegExp(style.label));
    }

    assert.match(html, /<option value="concise" selected>/);
  });

  it("escapes translated and selected text before placing them in HTML", () => {
    const html = renderTranslationWebviewHtml({
      nonce: "abc123",
      selectedText: "<script>alert('source')</script>",
      translatedText: "<img src=x onerror=alert('translated')>",
      style: "technical"
    });

    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;script&gt;alert\(&#39;source&#39;\)&lt;\/script&gt;/);
    assert.match(html, /&lt;img src=x onerror=alert\(&#39;translated&#39;\)&gt;/);
  });

  it("posts the edited translation and selected style with actions", () => {
    const html = renderTranslationWebviewHtml({
      nonce: "abc123",
      selectedText: "// Retry failed request",
      translatedText: "重试失败的请求",
      style: "technical"
    });

    assert.match(html, /translatedText: translation\.value/);
    assert.match(html, /style: style\.value/);
    assert.match(html, /data-action="retranslate"/);
    assert.match(html, /command: button\.dataset\.action/);
    assert.match(html, /message\.command === "setTranslation"/);
  });

  it("shows loading state and disables action buttons while retranslating", () => {
    const html = renderTranslationWebviewHtml({
      nonce: "abc123",
      selectedText: "// Retry failed request",
      translatedText: "重试失败的请求",
      style: "technical"
    });

    assert.match(html, /id="loading"/);
    assert.match(html, /aria-busy="false"/);
    assert.match(html, /function setBusy\(busy\)/);
    assert.match(html, /button\.disabled = busy/);
    assert.match(html, /loading\.hidden = !busy/);
    assert.match(html, /main\.setAttribute\("aria-busy", String\(busy\)\)/);
  });
});
