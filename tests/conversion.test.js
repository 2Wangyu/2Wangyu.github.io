import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSheets, validateFile } from "../assets/js/tools/conversion/model.js";
import { appendColumn, appendRow, updateCell } from "../assets/js/tools/conversion/editor.js";
import { groupPdfItemsIntoRows } from "../assets/js/tools/conversion/pdf-table.js";
import { wordsToRows } from "../assets/js/tools/conversion/image-table.js";
import { parseDocxTableXml } from "../assets/js/tools/conversion/docx-table.js";

test("validateFile rejects unsupported, empty, and oversized local files", () => {
  assert.deepEqual(validateFile({ name: "report.doc", size: 10 }, [".pdf"]), {
    ok: false,
    message: "请选择 .pdf 文件。",
  });
  assert.deepEqual(validateFile({ name: "report.pdf", size: 0 }, [".pdf"]), {
    ok: false,
    message: "文件为空，请重新选择。",
  });
  assert.deepEqual(validateFile({ name: "report.pdf", size: 20 * 1024 * 1024 + 1 }, [".pdf"]), {
    ok: false,
    message: "文件不能超过 20 MB。",
  });
});

test("normalizeSheets pads table cells and creates usable sheet names", () => {
  assert.deepEqual(normalizeSheets([{ name: "", rows: [["姓名"], ["余旺", "90"]] }]), {
    sheets: [{ name: "工作表 1", rows: [["姓名", ""], ["余旺", "90"]] }],
    warnings: [],
  });
});

test("table edits return a new workbook and preserve existing cells", () => {
  const original = [{ name: "表 1", rows: [["姓名"], ["余旺"]] }];
  const edited = updateCell(original, 0, 1, 1, "90");
  assert.deepEqual(edited, [{ name: "表 1", rows: [["姓名", ""], ["余旺", "90"]] }]);
  assert.deepEqual(original, [{ name: "表 1", rows: [["姓名"], ["余旺"]] }]);
  assert.deepEqual(appendRow(edited, 0)[0].rows, [["姓名", ""], ["余旺", "90"], ["", ""]]);
  assert.deepEqual(appendColumn(edited, 0)[0].rows, [["姓名", "", ""], ["余旺", "90", ""]]);
});

test("groupPdfItemsIntoRows orders extracted PDF text by visual row and column", () => {
  const items = [
    { str: "金额", transform: [1, 0, 0, 1, 90, 100] },
    { str: "名称", transform: [1, 0, 0, 1, 10, 100] },
    { str: "20", transform: [1, 0, 0, 1, 90, 80] },
  ];
  assert.deepEqual(groupPdfItemsIntoRows(items), [["名称", "金额"], ["20"]]);
});

test("wordsToRows keeps nearby OCR words together", () => {
  const words = [
    { text: "名称", bbox: { x0: 10, y0: 10 } },
    { text: "数量", bbox: { x0: 100, y0: 14 } },
    { text: "苹果", bbox: { x0: 10, y0: 45 } },
  ];
  assert.deepEqual(wordsToRows(words), [["名称", "数量"], ["苹果"]]);
});

test("parseDocxTableXml reads Word table cells in order", () => {
  const xml = '<w:document><w:tbl><w:tr><w:tc><w:p><w:r><w:t>姓名</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>分数</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:document>';
  assert.deepEqual(parseDocxTableXml(xml), [{ name: "表 1", rows: [["姓名", "分数"]] }]);
});
