import { parseDocxTables } from "./conversion/docx-table.js";
import { mountConversionWorkbench } from "./conversion/workbench.js";
export function mount(root) { return mountConversionWorkbench(root, { eyebrow: "EXCEL / WORD", title: "Word 表格转 Excel", description: "读取 DOCX 中的表格，每张表将成为一个 Excel 工作表。", acceptedExtensions: [".docx"], parseFile: parseDocxTables, downloadName: "Word 表格" }); }
