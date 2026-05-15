# LLM Comment Translator

![Version](https://img.shields.io/badge/version-0.0.11-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.90.0-007ACC)
![License](https://img.shields.io/badge/license-MIT-green)

LLM Comment Translator 是一个 VS Code及其兼容/衍生编辑器（例如 Cursor、CodeBuddy、Trae 等）的中文翻译扩展，用于通过 OpenAI-compatible Chat Completions API 将选中的文本，尤其是代码注释，翻译成简体中文。

这个扩展面向需要阅读英文代码注释的开发者。它可以在编辑器内完成翻译、编辑、复制、替换和插入，减少在浏览器和编辑器之间来回切换。

## 功能特性

- 将选中文本翻译成简体中文。
- 将译文插入到原文下方。
- 使用可编辑的翻译面板查看结果。
- 复制、替换、插入都会使用你编辑后的译文。
- 复用同一个翻译面板，避免重复打开多个标签页。
- 支持重新翻译当前选中文本。
- 支持多种翻译风格：
  - 技术注释
  - 简洁
  - 自然中文
  - 保留英文术语
  - 口语化
- 支持通过 VS Code 设置追加个性化翻译要求。
- 插入译文时保留常见注释格式：
  - `//`
  - `#`
  - `--`
  - `;`
  - JSDoc / 块注释中的 `*`
- 自动清理模型返回中重复的注释前缀，避免出现 `# # ...`、`// // ...`。
- 翻译前会清理选中文本中每行的注释前缀，避免 `#`、`//`、`*` 影响模型理解。
- 插入长注释译文时，会按语义和长度自动换行。

## 示例

原文：

```text
# Build the final system message: cached prompt + ephemeral system prompt.
# Ephemeral additions are API-call-time only (not persisted to session DB).
# External recall context is injected into the user message, not the system
# prompt, so the stable cache prefix remains unchanged.
```

插入后的译文：

```text
# 构建最终系统消息：缓存提示 + 临时性系统提示。
# 临时性添加仅存在于API调用时（不会持久化到会话数据库）。
# 外部召回上下文注入到用户消息中，而非系统提示，
# 因此稳定缓存前缀保持不变。
```

## 安装

### 从 VSIX 安装

本仓库不会提交 `.vsix` 打包产物。你可以从 GitHub Releases 下载发布包，或者按下方“打包”章节在本地生成。

拿到 `.vsix` 文件后，可以通过 VS Code 命令行安装：

```bash
code --install-extension llm-comment-translator-0.0.11.vsix --force
```

也可以在 VS Code 界面中安装：

1. 打开扩展面板。
2. 选择 `Install from VSIX...`。
3. 选择 `llm-comment-translator-0.0.11.vsix`。
4. 执行 `Developer: Reload Window`，或重启 VS Code。

Cursor、Trae、CodeBuddy 等 VS Code 兼容编辑器通常也支持类似的 `Install from VSIX...` 安装方式。

## 配置

打开 `settings.json`，配置 OpenAI-compatible API：

```json
{
  "llmTranslate.baseUrl": "https://example.com/v1",
  "llmTranslate.apiKey": "YOUR_API_KEY",
  "llmTranslate.model": "YOUR_MODEL_NAME",
  "llmTranslate.temperature": 0.2,
  "llmTranslate.customInstructions": "保留 React Hook、Promise 和 callback 等英文术语。"
}
```

| 配置项 | 说明 | 默认值 |
| --- | --- | --- |
| `llmTranslate.baseUrl` | OpenAI-compatible API base URL | `https://token-plan-cn.xiaomimimo.com/v1` |
| `llmTranslate.apiKey` | 请求使用的 API Key | 空 |
| `llmTranslate.model` | 翻译使用的模型名称 | `MiMo-V2.5` |
| `llmTranslate.temperature` | 采样温度 | `0.2` |
| `llmTranslate.customInstructions` | 追加到翻译提示词中的个性化要求，为空时不生效 | 空 |

扩展会调用：

```text
POST /chat/completions
```

不要把真实 API Key 提交到仓库。

## 使用方式

在编辑器中选中文本，然后使用下面的命令或快捷键：

| 功能 | macOS | Windows / Linux |
| --- | --- | --- |
| 插入中文译文到下方 | `Cmd+Alt+T` | `Ctrl+Alt+T` |
| 显示翻译面板 | `Cmd+Alt+Shift+T` | `Ctrl+Alt+Shift+T` |

命令面板中也可以执行：

- `LLM Translate: Insert Chinese Translation Below`
- `LLM Translate: Show Chinese Translation`

翻译面板支持：

- 编辑译文。
- 切换翻译风格并重新翻译。
- 复制译文。
- 用译文替换原选区。
- 将译文插入到原文下方。

## 开发

安装依赖：

```bash
npm install
```

编译：

```bash
npm run compile
```

运行测试：

```bash
npm test
```

本地调试：

1. 用 VS Code 打开本仓库。
2. 按 `F5` 启动 Extension Development Host。
3. 在新窗口中选中文本，测试命令和快捷键。

## 打包

打包前建议先运行测试：

```bash
npm test
```

生成 `.vsix`：

```bash
npx --yes @vscode/vsce package --allow-missing-repository
```

打包文件名来自 `package.json` 中的版本号：

```text
llm-comment-translator-<version>.vsix
```

`out/`、`node_modules/` 和 `*.vsix` 是生成文件，已通过 `.gitignore` 忽略。

## 项目结构

```text
src/
  editorText.ts    文本清理、自动换行和插入格式处理
  extension.ts     VS Code 命令、编辑器操作和 Webview 调度
  translator.ts    OpenAI-compatible 翻译请求逻辑
  webview.ts       翻译面板 HTML 和交互脚本
test/
  translator.test.ts
  webview.test.ts
images/
  icon.png
  icon.svg
```

## 兼容性

- VS Code `^1.90.0`
- OpenAI-compatible Chat Completions API
- VS Code 扩展宿主支持的 Node.js 运行环境

## 常见问题

如果安装新的 VSIX 后没有生效：

1. 执行 `Developer: Reload Window`。
2. 检查已安装版本：

   ```bash
   code --list-extensions --show-versions | rg 'llm-comment-translator'
   ```

3. 如果使用 Cursor、Trae、CodeBuddy 等 VS Code 兼容编辑器，确认扩展安装到了对应编辑器，而不是只安装到了 VS Code。

## 贡献

欢迎提交 Issue 和 Pull Request。

提交改动前请先运行：

```bash
npm test
```

请保持扩展聚焦于代码注释翻译，不要提交生成产物或密钥。

## 许可证

本项目基于 MIT License 开源，详见仓库中的 `LICENSE` 文件。
