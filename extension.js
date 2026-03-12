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
  let line = 1;

  while (i < text.length) {
    if (text[i] === "<" && text[i + 1] === "?") {
      let tagEnd = i;
      let inQuote = false;
      let quoteChar = "";
      const startLine = line;

      while (tagEnd < text.length) {
        const ch = text[tagEnd];
        if (ch === "\n") line++;
        if (inQuote) {
          if (ch === quoteChar) inQuote = false;
        } else {
          if (ch === '"' || ch === "'") {
            inQuote = true;
            quoteChar = ch;
          } else if (ch === ">") {
            break;
          }
        }
        tagEnd++;
      }

      const tag = text.slice(i, tagEnd + 1);
      tokens.push({ type: "tag", value: tag, line: startLine, endLine: line });
      i = tagEnd + 1;
    } else {
      let start = i;
      const tempStartLine = line;

      while (i < text.length && !(text[i] === "<" && text[i + 1] === "?")) {
        if (text[i] === "\n") line++;
        i++;
      }

      const content = text.slice(start, i);

      if (content.trim() !== "") {
        tokens.push({
          type: "content",
          value: content,
          line: tempStartLine,
          endLine: line,
        });
      }
    }
  }

  return tokens;
}

function formatWio(text) {
  const tokens = preprocess(text);
  const result = [];
  let indent = 0;
  let prevLine = 0;

  for (const token of tokens) {
    if (token.type === "tag") {
      const tag = token.value.trim();

      if (isClosingTag(tag)) {
        indent = Math.max(0, indent - 1);

        if (token.line === prevLine) {
          result[result.length - 1] += tag;
          console.log("result= ", result);
        } else {
          result.push(indentStr.repeat(indent) + tag);
        }

        prevLine = token.endLine;
        continue;
      }

      if (isMIELSE(tag)) {
        indent = Math.max(0, indent - 1);

        if (token.line === prevLine) {
          result[result.length - 1] += tag;
        } else {
          result.push(indentStr.repeat(indent) + tag);
        }

        indent++;
        prevLine = token.endLine;
        continue;
      }

      if (isReferenceTag(tag)) {
        if (token.line === prevLine) {
          result[result.length - 1] += tag;
        } else {
          result.push(indentStr.repeat(indent) + tag);
        }

        prevLine = token.endLine;
        continue;
      }

      if (isOpeningTag(tag)) {
        if (token.line === prevLine) {
          result[result.length - 1] += tag;
        } else {
          result.push(indentStr.repeat(indent) + tag);
        }

        indent++;
        prevLine = token.endLine;
        continue;
      }
    }

    if (token.type === "content") {
      const lines = token.value.split("\n");

      for (let li = 0; li < lines.length; li++) {
        const cl = lines[li];

        if (cl.trim() === "") continue;

        const currentLine = token.line + li;

        if (currentLine === prevLine) {
          result[result.length - 1] += cl.trim();
        } else {
          result.push(indentStr.repeat(indent) + cl.trim());
        }

        prevLine = currentLine;
      }
    }
  }

  return result.join("\n");
}
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
