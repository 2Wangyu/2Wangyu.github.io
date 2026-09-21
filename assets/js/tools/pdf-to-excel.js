import { parsePdfTable } from "./conversion/pdf-table.js";
import { mountConversionWorkbench } from "./conversion/workbench.js";
export function mount(root) { return mountConversionWorkbench(root, { eyebrow: "EXCEL / PDF", title: "PDF 表格转 Excel", description: "提取可复制文字的 PDF 表格。扫描版 PDF 请先转为图片后使用图片工具。", acceptedExtensions: [".pdf"], parseFile: parsePdfTable, downloadName: "PDF 表格" }); }
