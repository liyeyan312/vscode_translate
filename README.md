# LLM Comment Translator

一个用于 VS Code 及其兼容/衍生编辑器的中文翻译扩展，例如 Cursor、CodeBuddy、Trae 等。它可以把选中的文本，尤其是代码注释，通过 OpenAI-compatible LLM API 翻译成简体中文。

## 功能特性

- 将选中文本翻译成中文，并插入到原文下方。
- 在 Webview 面板中查看翻译结果。
- 翻译结果可编辑，复制、替换、插入都会使用编辑后的内容。
- 支持重新翻译当前选中文本。
- 支持多种翻译风格：
  - 技术注释
  - 简洁
  - 自然中文
  - 保留英文术语
  - 口语化
- 插入译文时保留常见行注释前缀，例如 `//`、`#`、`--` 和 `;`。
- 翻译面板会复用已有标签页，避免重复打开多个结果页。

## 快捷键

| 功能 | Windows / Linux | macOS |
| --- | --- | --- |
| 插入中文译文到下方 | `Ctrl+Alt+T` | `Cmd+Alt+T` |
| 显示翻译面板 | `Ctrl+Alt+Shift+T` | `Cmd+Alt+Shift+T` |

也可以在命令面板中执行：

- `LLM Translate: Insert Chinese Translation Below`
- `LLM Translate: Show Chinese Translation`

## 使用方式

1. 在编辑器中选中要翻译的文本或注释。
2. 按 `Cmd+Alt+Shift+T` 打开翻译面板，或按 `Cmd+Alt+T` 直接插入译文。
3. 在翻译面板中可以：
   - 修改译文内容。
   - 切换翻译风格后重新翻译。
   - 复制译文。
   - 用译文替换原选区。
   - 将译文插入到原文下方。

## 配置

打开编辑器的 `settings.json`，配置 OpenAI-compatible API：

```json
{
  "llmTranslate.baseUrl": "https://token-plan-cn.xiaomimimo.com/v1",
  "llmTranslate.apiKey": "YOUR_API_KEY",
  "llmTranslate.model": "MiMo-V2.5",
  "llmTranslate.temperature": 0.2
}
```

配置项说明：

| 配置项 | 说明 |
| --- | --- |
| `llmTranslate.baseUrl` | OpenAI-compatible API base URL |
| `llmTranslate.apiKey` | API Key |
| `llmTranslate.model` | 翻译使用的模型名称 |
| `llmTranslate.temperature` | 采样温度，默认 `0.2` |

扩展会调用：

```text
POST /chat/completions
```

## 本地安装

如果已经生成 `.vsix` 文件，可以通过兼容编辑器的命令行安装。VS Code 使用：

```bash
code --install-extension llm-comment-translator-0.0.5.vsix --force
```

Cursor、CodeBuddy、Trae 等 VS Code 衍生编辑器通常也支持从扩展面板安装 `.vsix`：

1. 打开扩展面板。
2. 选择 `Install from VSIX...` 或类似入口。
3. 选择 `llm-comment-translator-0.0.5.vsix`。
4. 重新加载窗口。

如果对应产品提供自己的 CLI，也可以替换下面命令中的 `code`：

```bash
<editor-cli> --install-extension llm-comment-translator-0.0.5.vsix --force
```

当前机器如果使用的是 `/Applications/Visual Studio Code 2.app`，可以运行：

```bash
'/Applications/Visual Studio Code 2.app/Contents/Resources/app/bin/code' --install-extension 'llm-comment-translator-0.0.5.vsix' --force
```

安装后建议执行 `Developer: Reload Window`，或重启当前编辑器。

## 开发

安装依赖：

```bash
npm install
```

运行测试：

```bash
npm test
```

只编译 TypeScript：

```bash
npm run compile
```

开发调试：

1. 用 VS Code 或兼容编辑器打开本项目目录。
2. 按 `F5` 启动 Extension Development Host。
3. 在新窗口中选中文本，使用快捷键或命令面板测试扩展。

## 打包

打包前先运行测试：

```bash
npm test
```

生成 `.vsix`：

```bash
npx --yes @vscode/vsce package --allow-missing-repository
```

版本号来自 `package.json`。更新扩展后，需要同步更新：

- `package.json` 的 `version`
- `package-lock.json` 顶层 `version`
- `package-lock.json` 中根包 `packages[""].version`

打包产物示例：

```text
llm-comment-translator-0.0.5.vsix
```

## 项目结构

```text
src/
  editorText.ts    # 插入译文时的文本格式处理
  extension.ts     # VS Code Extension API 命令、编辑器操作和 Webview 调度
  translator.ts    # 翻译请求和提示词
  webview.ts       # 翻译面板 HTML
test/
  translator.test.ts
  webview.test.ts
```

## 注意事项

- 不要把真实 API Key 提交到仓库。
- 修改源码后不要手动编辑 `out/`，应通过 `npm run compile` 生成。
- 如果安装新版后没有变化，先确认当前编辑器已重新加载，并检查安装版本：

```bash
code --list-extensions --show-versions | rg 'llm-comment-translator'
```
