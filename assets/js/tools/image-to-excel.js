import { parseImageTable } from "./conversion/image-table.js";
import { mountConversionWorkbench } from "./conversion/workbench.js";
export function mount(root) { return mountConversionWorkbench(root, { eyebrow: "EXCEL / IMAGE OCR", title: "图片表格转 Excel", description: "识别图片中的文字并整理为可编辑表格。清晰、正面的表格图片效果更好。", acceptedExtensions: [".png", ".jpg", ".jpeg", ".webp"], parseFile: parseImageTable, downloadName: "图片表格" }); }
