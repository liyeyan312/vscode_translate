export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type TranslateConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  customInstructions: string;
};

export type TranslateStyle = "technical" | "concise" | "natural" | "termPreserving" | "casual";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const STYLE_INSTRUCTIONS: Record<TranslateStyle, string> = {
  technical: "采用技术注释风格，表达准确、简明，适合直接放回代码注释。",
  concise: "采用简洁风格，压缩冗余表达，保留必要技术信息。",
  natural: "采用自然中文风格，语句通顺，但不改变技术含义。",
  termPreserving: "尽量保留英文术语、代码标识符、函数名、变量名和专有名词，只翻译说明性文本。",
  casual: "采用更口语化的中文表达，适合解释性注释，但不要牺牲准确性。"
};

export function buildTranslateMessages(
  text: string,
  style: TranslateStyle = "technical",
  customInstructions = ""
): ChatMessage[] {
  const customInstructionText = customInstructions.trim();
  const systemInstructions = [
    "你是一个专业的软件工程翻译助手。",
    "把用户选中的文本翻译成简体中文。",
    "主要场景是代码注释，请保留原意、技术术语、代码标识符、函数名、变量名和格式含义。",
    STYLE_INSTRUCTIONS[style]
  ];

  if (customInstructionText) {
    systemInstructions.push(`用户个性化要求：${customInstructionText}`);
  }

  systemInstructions.push("只输出翻译结果，不要解释，不要添加 Markdown 代码块。");

  return [
    {
      role: "system",
      content: systemInstructions.join("")
    },
    {
      role: "user",
      content: text
    }
  ];
}

export async function translateToChinese(
  text: string,
  config: TranslateConfig,
  style: TranslateStyle = "technical",
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error("Missing llmTranslate.apiKey. Configure it in VS Code settings before translating.");
  }

  const response = await fetchImpl(joinUrl(config.baseUrl, "chat/completions"), {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      messages: buildTranslateMessages(text, style, config.customInstructions)
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Translation API request failed (${response.status}): ${body || response.statusText}`);
  }

  const data = await response.json() as ChatCompletionResponse;
  const translatedText = data.choices?.[0]?.message?.content?.trim();
  if (!translatedText) {
    throw new Error("Translation API returned no translated text.");
  }

  return translatedText;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
