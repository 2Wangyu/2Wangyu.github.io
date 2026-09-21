import { normalizeSheets } from "./model.js";

function decodeXml(value) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

export function parseDocxTableXml(xml) {
  const tables = [...String(xml).matchAll(/<w:tbl(?:\s[^>]*)?>([\s\S]*?)<\/w:tbl>/g)];
  return tables.map((table, tableIndex) => ({
    name: `表 ${tableIndex + 1}`,
    rows: [...table[1].matchAll(/<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g)].map((row) =>
      [...row[1].matchAll(/<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g)].map((cell) =>
        decodeXml([...cell[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((text) => text[1]).join("")),
      ),
    ),
  }));
}

export async function parseDocxTables(file, onProgress = () => {}) {
  if (!globalThis.JSZip) throw new Error("本地 Word 读取组件尚未载入，请刷新后重试。");
  onProgress("正在读取 Word 表格…");
  let archive;
  try {
    archive = await globalThis.JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new Error("无法读取此 DOCX，请确认文件没有损坏。");
  }
  const documentFile = archive.file("word/document.xml");
  if (!documentFile) throw new Error("该文件不是可读取的 DOCX 文档。");
  const tables = parseDocxTableXml(await documentFile.async("text"));
  if (!tables.length) throw new Error("此 Word 文档中没有找到表格。");
  return normalizeSheets(tables);
}
