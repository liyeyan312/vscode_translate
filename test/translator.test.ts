import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatTextForInsertionBelow,
  formatTextForLineInsertion,
  normalizeTextForTranslation
} from "../src/editorText";
import { buildTranslateMessages, translateToChinese, type TranslateConfig } from "../src/translator";

const baseConfig: TranslateConfig = {
  baseUrl: "https://example.test/v1",
  apiKey: "secret-key",
  model: "MiMo-V2.5",
  temperature: 0.2
};

describe("translator", () => {
  it("buildTranslateMessages asks for Chinese translation while preserving code identifiers", () => {
    const messages = buildTranslateMessages("// Retry failed request when token expires");

    assert.equal(messages.length, 2);
    assert.equal(messages[0].role, "system");
    assert.match(messages[0].content, /中文/);
    assert.match(messages[0].content, /代码标识符/);
    assert.equal(messages[1].role, "user");
    assert.match(messages[1].content, /Retry failed request/);
  });

  it("buildTranslateMessages includes the requested translation style", () => {
    const messages = buildTranslateMessages("// Retry failed request when token expires", "concise");

    assert.match(messages[0].content, /简洁/);
    assert.match(messages[0].content, /压缩冗余表达/);
  });

  it("translateToChinese sends an OpenAI-compatible chat completions request", async () => {
    let requestedUrl = "";
    let requestedBody: unknown;
    let authorization = "";

    const fakeFetch: typeof fetch = async (url, init) => {
      requestedUrl = String(url);
      requestedBody = JSON.parse(String(init?.body));
      authorization = new Headers(init?.headers).get("authorization") ?? "";

      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: "当令牌过期时重试失败的请求"
            }
          }
        ]
      }), { status: 200 });
    };

    const result = await translateToChinese("// Retry failed request when token expires", baseConfig, "technical", fakeFetch);

    assert.equal(result, "当令牌过期时重试失败的请求");
    assert.equal(requestedUrl, "https://example.test/v1/chat/completions");
    assert.equal(authorization, "Bearer secret-key");
    assert.deepEqual(requestedBody, {
      model: "MiMo-V2.5",
      temperature: 0.2,
      messages: buildTranslateMessages("// Retry failed request when token expires", "technical")
    });
  });

  it("translateToChinese rejects missing API keys before making a request", async () => {
    let called = false;
    const fakeFetch: typeof fetch = async () => {
      called = true;
      return new Response("{}", { status: 200 });
    };

    await assert.rejects(
      () => translateToChinese("hello", { ...baseConfig, apiKey: " " }, "technical", fakeFetch),
      /Missing llmTranslate.apiKey/
    );
    assert.equal(called, false);
  });

  it("translateToChinese includes HTTP status and response body for API errors", async () => {
    const fakeFetch: typeof fetch = async () => new Response("quota exceeded", { status: 429 });

    await assert.rejects(
      () => translateToChinese("hello", baseConfig, "technical", fakeFetch),
      /Translation API request failed \(429\): quota exceeded/
    );
  });

  it("translateToChinese rejects empty model responses", async () => {
    const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ choices: [] }), { status: 200 });

    await assert.rejects(
      () => translateToChinese("hello", baseConfig, "technical", fakeFetch),
      /Translation API returned no translated text/
    );
  });
});

describe("editor text helpers", () => {
  it("formatTextForInsertionBelow keeps line comment style for translated comment text", () => {
    const result = formatTextForInsertionBelow("    // Retry failed request", "重试失败的请求");

    assert.equal(result, "\n    // 重试失败的请求");
  });

  it("formatTextForInsertionBelow preserves indentation for plain selected text", () => {
    const result = formatTextForInsertionBelow("  Retry failed request", "重试失败的请求");

    assert.equal(result, "\n  重试失败的请求");
  });

  it("formatTextForInsertionBelow formats multi-line translations with the detected prefix", () => {
    const result = formatTextForInsertionBelow("\t# Retry failed request", "第一行\n第二行");

    assert.equal(result, "\n\t# 第一行\n\t# 第二行");
  });

  it("formatTextForLineInsertion uses the full anchor line when only part of a comment is selected", () => {
    const result = formatTextForLineInsertion("Retry failed request", "重试失败的请求", "    // Retry failed request");

    assert.equal(result, "    // 重试失败的请求\n");
  });

  it("formatTextForLineInsertion aligns with JSDoc interior comment prefixes", () => {
    const result = formatTextForLineInsertion("Retry failed request", "重试失败的请求", "     * Retry failed request");

    assert.equal(result, "     * 重试失败的请求\n");
  });

  it("formatTextForLineInsertion uses JSDoc interior prefix from an opening block line", () => {
    const result = formatTextForLineInsertion("/**", "重试失败的请求", "    /**");

    assert.equal(result, "     * 重试失败的请求\n");
  });

  it("formatTextForLineInsertion preserves indentation for plain text", () => {
    const result = formatTextForLineInsertion("Retry failed request", "重试失败的请求", "    Retry failed request");

    assert.equal(result, "    重试失败的请求\n");
  });

  it("formatTextForLineInsertion does not duplicate hash comment prefixes returned by the translator", () => {
    const result = formatTextForLineInsertion(
      "Build the final system message",
      "# 构建最终系统消息\n# 临时性添加仅存在于API调用时",
      "# Build the final system message"
    );

    assert.equal(result, "# 构建最终系统消息\n# 临时性添加仅存在于API调用时\n");
  });

  it("formatTextForLineInsertion does not duplicate slash comment prefixes returned by the translator", () => {
    const result = formatTextForLineInsertion(
      "Retry failed request",
      "// 重试失败的请求\n// 保留错误上下文",
      "    // Retry failed request"
    );

    assert.equal(result, "    // 重试失败的请求\n    // 保留错误上下文\n");
  });

  it("formatTextForLineInsertion does not duplicate JSDoc interior prefixes returned by the translator", () => {
    const result = formatTextForLineInsertion(
      "Retry failed request",
      "* 重试失败的请求\n* 保留错误上下文",
      "     * Retry failed request"
    );

    assert.equal(result, "     * 重试失败的请求\n     * 保留错误上下文\n");
  });

  it("formatTextForLineInsertion preserves leading hash text when the anchor line is not a comment", () => {
    const result = formatTextForLineInsertion(
      "Build the final system message",
      "# 构建最终系统消息",
      "Build the final system message"
    );

    assert.equal(result, "# 构建最终系统消息\n");
  });

  it("formatTextForLineInsertion wraps translated comment text at 100 characters", () => {
    const result = formatTextForLineInsertion(
      "Build the final system message",
      "构建最终系统消息：缓存提示 + 临时性系统提示。临时性添加仅存在于API调用时（不会持久化到会话数据库）。外部召回上下文注入到用户消息中，而非系统提示，因此稳定缓存前缀保持不变。这个额外句子用于确保译文超过一百个字符并触发自动换行。",
      "# Build the final system message"
    );

    assert.equal(
      result,
      [
        "# 构建最终系统消息：缓存提示 + 临时性系统提示。临时性添加仅存在于API调用时（不会持久化到会话数据库）。外部召回上下文注入到用户消息中，而非系统提示，因此稳定缓存前缀保持不变。",
        "# 这个额外句子用于确保译文超过一百个字符并触发自动换行。\n"
      ].join("\n")
    );
  });

  it("formatTextForLineInsertion wraps translator-prefixed multi-line comments as one normalized paragraph", () => {
    const result = formatTextForLineInsertion(
      "Build the final system message",
      "# 构建最终系统消息：缓存提示 + 临时性系统提示。\n# 临时性添加仅存在于API调用时（不会持久化到会话数据库）。",
      "# Build the final system message"
    );

    assert.equal(
      result,
      "# 构建最终系统消息：缓存提示 + 临时性系统提示。\n# 临时性添加仅存在于API调用时（不会持久化到会话数据库）。\n"
    );
  });

  it("formatTextForLineInsertion does not wrap plain text insertions", () => {
    const result = formatTextForLineInsertion(
      "Build the final system message",
      "构建最终系统消息：缓存提示 + 临时性系统提示。临时性添加仅存在于API调用时（不会持久化到会话数据库）。",
      "Build the final system message"
    );

    assert.equal(result, "构建最终系统消息：缓存提示 + 临时性系统提示。临时性添加仅存在于API调用时（不会持久化到会话数据库）。\n");
  });

  it("normalizeTextForTranslation removes line comment prefixes before sending text to the translator", () => {
    const result = normalizeTextForTranslation([
      "# Build the final system message: cached prompt + ephemeral system prompt.",
      "# Ephemeral additions are API-call-time only (not persisted to session DB)."
    ].join("\n"));

    assert.equal(
      result,
      [
        "Build the final system message: cached prompt + ephemeral system prompt.",
        "Ephemeral additions are API-call-time only (not persisted to session DB)."
      ].join("\n")
    );
  });

  it("normalizeTextForTranslation removes JSDoc structural prefixes before sending text to the translator", () => {
    const result = normalizeTextForTranslation([
      "/**",
      " * Build the final system message.",
      " * Ephemeral additions are API-call-time only.",
      " */"
    ].join("\n"));

    assert.equal(
      result,
      [
        "Build the final system message.",
        "Ephemeral additions are API-call-time only."
      ].join("\n")
    );
  });
});
