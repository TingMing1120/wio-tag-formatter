# wio-tag-formatter

Formatter for WIO code files (.wio)。

---

## 功能

- WIO 標籤自動縮排
- 保留文字/SQL 內容格式

---

## 環境需求

- Node.js

---

## 打包方式

1. 安裝 VS Code Extension 工具：
   - npm install -g vsce

2. 確認 package.json 中 publisher、name、version 設定正確
3. 在專案根目錄執行：
   - vsce package
   - 會生成 wio-tag-formatter-0.0.1.vsix

4. 安裝本地 .vsix 測試：
   - VS Code → Extensions → 點右上三點 → Install from VSIX

---
