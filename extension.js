const vscode = require("vscode");

function activate(context) {
  console.log("wio-tag-formatter is now active!");

  const formatter = vscode.languages.registerDocumentFormattingEditProvider(
    { language: "wio" },
    {
      provideDocumentFormattingEdits(document) {
        // 呼叫格式化函數
        const formattedText = formatWio(document.getText());

        const range = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length),
        );

        return [vscode.TextEdit.replace(range, formattedText)];
      },
    },
  );

  context.subscriptions.push(formatter);
}
// 每層縮排兩個空格
const indentStr = "  ";

// 轉大寫方便判斷標籤
const upperLine = (line) => line.toUpperCase();

// 判斷各種標籤類型
const isOpeningTag = (line) => {
  const u = upperLine(line);
  return /^<\?[A-Z]+/.test(u) && !/^<\?\//.test(u) && !/^<\?MIELSE/.test(u);
};
const isClosingTag = (line) => /^<\?\/[A-Z]+/.test(upperLine(line));
const isMIELSE = (line) => /^<\?MIELSE/.test(upperLine(line));
const isReferenceTag = (line) =>
  /^<\?(?!MI)[A-Z]/.test(upperLine(line)) && !/^<\?\//.test(upperLine(line));

// 將原始 WIO 文字拆成標籤與內容
function preprocess(text) {
  const tokens = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === "<" && text[i + 1] === "?") {
      let tagEnd = i,
        inQuote = false,
        quoteChar = "";
      while (tagEnd < text.length) {
        const ch = text[tagEnd];
        if (inQuote) {
          if (ch === quoteChar) inQuote = false;
        } else {
          if (ch === '"' || ch === "'") {
            inQuote = true;
            quoteChar = ch;
          } else if (ch === ">") break;
        }
        tagEnd++;
      }
      tokens.push({ type: "tag", value: text.slice(i, tagEnd + 1) });
      i = tagEnd + 1;
    } else {
      let start = i;
      while (i < text.length && !(text[i] === "<" && text[i + 1] === "?")) i++;
      const content = text.slice(start, i);
      if (content.trim() !== "")
        tokens.push({ type: "content", value: content });
    }
  }

  const lines = [];
  for (const token of tokens) {
    if (token.type === "tag") lines.push(token.value.trim());
    else {
      const contentLines = token.value
        .split("\n")
        .map((l) => l.trimEnd())
        .join("\n")
        .trim();
      if (contentLines !== "") lines.push(contentLines);
    }
  }
  return lines.join("\n");
}

// 主要格式化函數
function formatWio(text) {
  const preprocessed = preprocess(text);
  const lines = preprocessed.split("\n");
  const result = [];
  let indent = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;

    if (isClosingTag(trimmed)) {
      indent = Math.max(0, indent - 1);
      result.push(indentStr.repeat(indent) + trimmed);
      continue;
    }

    if (isMIELSE(trimmed)) {
      indent = Math.max(0, indent - 1);
      result.push(indentStr.repeat(indent) + trimmed);
      indent++;
      continue;
    }

    if (isReferenceTag(trimmed)) {
      result.push(indentStr.repeat(indent) + trimmed);
      continue;
    }

    if (isOpeningTag(trimmed)) {
      result.push(indentStr.repeat(indent) + trimmed);
      indent++;
      continue;
    }

    // 文字/SQL 內容，依縮排輸出
    const contentLines = trimmed.split("\n");
    for (const cl of contentLines) {
      if (cl.trim() !== "") result.push(indentStr.repeat(indent) + cl.trim());
    }
  }

  return result.join("\n");
}
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
