import { normalizeSheets } from "./model.js";

export function wordsToRows(words, tolerance = 12) {
  const rows = [];
  for (const word of words.filter((entry) => entry?.text?.trim())) {
    const x = Number(word.bbox?.x0 ?? 0);
    const y = Number(word.bbox?.y0 ?? 0);
    let row = rows.find((entry) => Math.abs(entry.y - y) <= tolerance);
    if (!row) {
      row = { y, words: [] };
      rows.push(row);
    }
    row.words.push({ x, text: word.text.trim() });
  }
  return rows
    .sort((left, right) => left.y - right.y)
    .map((row) => row.words.sort((left, right) => left.x - right.x).map((word) => word.text));
}

export async function parseImageTable(file, onProgress = () => {}) {
  if (!globalThis.Tesseract) throw new Error("本地 OCR 组件尚未载入，请刷新后重试。");
  onProgress("正在准备本地识别组件…");
  const base = new URL("../../../vendor/tesseract/", import.meta.url).href;
  const worker = await globalThis.Tesseract.createWorker(["chi_sim", "eng"], 1, {
    workerPath: `${base}worker.min.js`,
    corePath: `${base}tesseract-core.wasm.js`,
    langPath: `${base}tessdata`,
    gzip: true,
    logger: ({ status, progress }) => onProgress(`${status} ${Math.round((progress ?? 0) * 100)}%`),
  });
  try {
    const result = await worker.recognize(file);
    const rows = wordsToRows(result.data.words ?? []);
    if (!rows.length) throw new Error("未识别到文字，请使用更清晰、正面的表格图片。");
    const normalized = normalizeSheets([{ name: "图片识别结果", rows }]);
    normalized.warnings.push("已完成本地识别，请在下载前核对表格内容。");
    return normalized;
  } finally {
    await worker.terminate();
  }
}
