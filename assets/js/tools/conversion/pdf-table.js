import { normalizeSheets } from "./model.js";

export function groupPdfItemsIntoRows(items, tolerance = 4) {
  const rows = [];
  for (const item of items.filter((entry) => entry?.str?.trim())) {
    const x = Number(item.transform?.[4] ?? 0);
    const y = Number(item.transform?.[5] ?? 0);
    let row = rows.find((entry) => Math.abs(entry.y - y) <= tolerance);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push({ x, text: item.str.trim() });
  }
  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) => row.items.sort((left, right) => left.x - right.x).map((item) => item.text));
}

export async function parsePdfTable(file, onProgress = () => {}) {
  onProgress("正在读取 PDF…");
  const pdfjs = await import("../../../vendor/pdfjs/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("../../../vendor/pdfjs/pdf.worker.mjs", import.meta.url).href;
  let document;
  try {
    document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch (error) {
    const reason = error?.name === "PasswordException" ? "受密码保护的 PDF 暂不支持。" : "无法读取此 PDF，请确认文件没有损坏。";
    throw new Error(reason);
  }
  const sheets = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    onProgress(`正在分析第 ${pageNumber} / ${document.numPages} 页…`);
    const content = await (await document.getPage(pageNumber)).getTextContent();
    const rows = groupPdfItemsIntoRows(content.items);
    if (rows.length) sheets.push({ name: `PDF 第 ${pageNumber} 页`, rows });
  }
  if (!sheets.length) throw new Error("未发现可复制文字。扫描版 PDF 请使用“图片表格转 Excel”。");
  return normalizeSheets(sheets);
}
