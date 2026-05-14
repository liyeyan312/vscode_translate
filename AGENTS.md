# Repository Instructions

## 项目概况

这是一个 VS Code 扩展项目，用于把选中的文本或代码注释翻译成中文。

主要源码位于：

- `src/extension.ts`：VS Code 命令、编辑器操作和 Webview 调度。
- `src/translator.ts`：OpenAI-compatible 翻译请求和提示词。
- `src/webview.ts`：翻译结果 Webview HTML。
- `src/editorText.ts`：插入译文时的文本格式处理。
- `test/`：Node test 测试。

## 开发约束

- 修改功能或修复缺陷后，必须运行 `npm test`。
- 修改 TypeScript 源码后，必须确保 `npm run compile` 能通过；`npm test` 已包含编译步骤。
- 不要手动编辑 `out/` 下的编译产物；应修改 `src/` 或 `test/`，再通过编译生成。
- 不要把 API Key、Token 或其它敏感凭据写入源码、README、测试或打包产物。

## 版本与打包约束

- 每次更新扩展功能、行为、配置、UI 或测试后，必须同步提升打包版本号。
- 版本号必须同时更新：
  - `package.json` 的 `version`
  - `package-lock.json` 顶层 `version`
  - `package-lock.json` 中根包 `packages[""].version`
- 打包前必须先通过 `npm test`。
- 打包命令使用：

```bash
npx --yes @vscode/vsce package --allow-missing-repository
```

- 打包产物文件名必须与版本号一致，例如版本 `0.0.2` 应生成：

```text
llm-comment-translator-0.0.2.vsix
```

- 覆盖安装到本机 VS Code 时使用当前机器的 VS Code CLI：

```bash
'/Applications/Visual Studio Code 2.app/Contents/Resources/app/bin/code' --install-extension 'llm-comment-translator-<version>.vsix' --force
```

- 安装后应检查 VS Code 识别到的新版本：

```bash
'/Applications/Visual Studio Code 2.app/Contents/Resources/app/bin/code' --list-extensions --show-versions | rg 'llm-comment-translator'
```

## 用户体验约束

- Webview UI 应使用 VS Code 主题变量，避免硬编码大面积颜色。
- 翻译结果面板应优先复用已有面板，避免每次翻译打开多个标签页。
- 编辑器写入操作完成后，应尽量恢复用户原本的编辑器焦点和选区上下文。
- 可编辑译文、复制、替换、插入、重新翻译等交互应保持轻量，不用系统通知打断用户，除非是错误状态。
