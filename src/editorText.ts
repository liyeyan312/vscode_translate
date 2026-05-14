type PrefixParts = {
  indentation: string;
  commentPrefix: string;
};

const COMMENT_WRAP_WIDTH = 100;

export function formatTextForInsertionBelow(selectedText: string, translatedText: string): string {
  const prefix = detectPrefix(selectedText);
  const formattedLines = formatTranslatedLines(translatedText, prefix);

  return `\n${formattedLines.join("\n")}`;
}

export function formatTextForLineInsertion(
  selectedText: string,
  translatedText: string,
  anchorLineText: string = selectedText
): string {
  const prefix = detectPrefix(anchorLineText);
  const formattedLines = formatTranslatedLines(translatedText, prefix);

  return `${formattedLines.join("\n")}\n`;
}

export function normalizeTextForTranslation(selectedText: string): string {
  return selectedText
    .split(/\r?\n/)
    .map((line) => stripTranslationInputPrefix(line))
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function formatTranslatedLines(translatedText: string, prefix: PrefixParts): string[] {
  if (!prefix.commentPrefix) {
    return translatedText.trim().split(/\r?\n/).map((line) => `${prefix.indentation}${line.trimEnd()}`);
  }

  const paragraphs = buildTranslatedParagraphs(translatedText);

  return paragraphs.flatMap((paragraph) => {
    const wrappedLines = paragraph ? wrapCommentParagraph(paragraph, COMMENT_WRAP_WIDTH) : [""];
    return wrappedLines.map((line) => `${prefix.indentation}${prefix.commentPrefix}${line}`);
  });
}

function buildTranslatedParagraphs(translatedText: string): string[] {
  const paragraphs: string[] = [];

  for (const line of translatedText.trim().split(/\r?\n/)) {
    const content = stripLeadingCommentPrefix(line).trim();
    if (content) {
      paragraphs.push(content);
    }
  }

  return paragraphs;
}

function wrapCommentParagraph(paragraph: string, maxLength: number): string[] {
  const lines: string[] = [];
  let remaining = paragraph.trim();

  while (remaining.length > maxLength) {
    const breakIndex = findWrapBreakIndex(remaining, maxLength);
    lines.push(remaining.slice(0, breakIndex).trimEnd());
    remaining = remaining.slice(breakIndex).trimStart();
  }

  if (remaining) {
    lines.push(remaining);
  }

  return lines;
}

function findWrapBreakIndex(text: string, maxLength: number): number {
  const window = text.slice(0, maxLength + 1);
  const punctuationBreak = Math.max(
    window.lastIndexOf("。") + 1,
    window.lastIndexOf("！") + 1,
    window.lastIndexOf("？") + 1,
    window.lastIndexOf("；") + 1,
    window.lastIndexOf(";") + 1,
    window.lastIndexOf("，") + 1,
    window.lastIndexOf(",") + 1,
    window.lastIndexOf("、") + 1,
    window.lastIndexOf("：") + 1,
    window.lastIndexOf(":") + 1
  );

  if (punctuationBreak > 0) {
    return punctuationBreak;
  }

  const whitespaceBreak = window.search(/\s+\S*$/);
  if (whitespaceBreak > 0) {
    return whitespaceBreak;
  }

  return maxLength;
}

function stripLeadingCommentPrefix(line: string): string {
  return line.replace(/^\s*(?:\/\/|#|--|;|\*)\s?/, "");
}

function stripTranslationInputPrefix(line: string): string {
  const trimmed = line.trim();
  if (/^\/\*\*?$/.test(trimmed) || /^\*\/$/.test(trimmed)) {
    return "";
  }

  return stripLeadingCommentPrefix(line).trimEnd();
}

function detectPrefix(selectedText: string): PrefixParts {
  const firstNonEmptyLine = selectedText.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const indentation = firstNonEmptyLine.match(/^\s*/)?.[0] ?? "";
  const trimmed = firstNonEmptyLine.slice(indentation.length);

  if (/^\/\*\*/.test(trimmed)) {
    return {
      indentation: `${indentation} `,
      commentPrefix: "* "
    };
  }

  const blockInteriorPrefix = trimmed.match(/^\*\s*/)?.[0];
  if (blockInteriorPrefix) {
    return {
      indentation,
      commentPrefix: blockInteriorPrefix
    };
  }

  const singleLinePrefix = trimmed.match(/^(\/\/|#|--|;)\s*/)?.[1];
  if (singleLinePrefix) {
    return {
      indentation,
      commentPrefix: `${singleLinePrefix} `
    };
  }

  return {
    indentation,
    commentPrefix: ""
  };
}
