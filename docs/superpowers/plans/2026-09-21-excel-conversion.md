# 本地 Excel 转换工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在静态工具中心中提供 PDF、图片和 DOCX 表格到可编辑 Excel 文件的本地转换流程。

**Architecture:** 所有转换器将用户文件转换为统一的 `{ sheets, warnings }` 数据结构。共享编辑器提供二维表格的修改功能，导出器将其转为 `.xlsx`；三个来源转换器只负责本地解析，彼此不直接依赖。

**Tech Stack:** 原生 ES Modules、File API、pdf.js、Tesseract.js、JSZip、SheetJS、Node 内置测试运行器。

**Spec:** `docs/superpowers/specs/2026-09-21-excel-conversion-design.md`

## Global Constraints

- 文件、识别结果和下载过程只在当前浏览器内存中处理，不上传且不写入持久存储。
- 支持的输入是 `.pdf`、`.png`、`.jpg`、`.jpeg`、`.webp` 和 `.docx`；单文件上限固定为 20 MB。
- PDF 仅承诺文字型 PDF 的表格；扫描 PDF 显示图片工具提示。
- 图片 OCR 的结果必须显示为可编辑表格；复杂、模糊或手写内容必须提示校对。
- Word 工具只提取 DOCX 表格；每张表对应一个 Excel 工作表。
- 所有新增业务函数先由 Node 测试覆盖，先观察失败再实现。

---

## File Structure

- `assets/js/tools/conversion/model.js`：输入文件验证、工作表数据归一化和用户提示。
- `assets/js/tools/conversion/editor.js`：二维表格编辑器与用户编辑后的 `sheets` 状态。
- `assets/js/tools/conversion/export-xlsx.js`：将工作表数据交给 SheetJS 并触发下载。
- `assets/js/tools/conversion/pdf-table.js`：文字型 PDF 坐标文本到工作表的本地解析。
- `assets/js/tools/conversion/image-table.js`：OCR 词块到行列矩阵的本地推断。
- `assets/js/tools/conversion/docx-table.js`：DOCX 的 `w:tbl` XML 表格到工作表的本地解析。
- `assets/js/tools/conversion/workbench.js`：文件选择、进度、警告、编辑器和导出的共享 UI。
- `assets/js/tools/pdf-to-excel.js`、`image-to-excel.js`、`word-to-excel.js`：三个工具页面的轻量挂载入口。
- `assets/js/tools/registry.js`、`assets/js/tools/app.js`、`assets/css/tools.css`：分类导航与转换台样式。
- `tests/conversion.test.js`、`tests/structure.test.js`：纯函数和页面结构回归测试。

### Task 1: 建立转换数据模型和文件校验

**Files:**
- Create: `assets/js/tools/conversion/model.js`
- Create: `tests/conversion.test.js`

**Interfaces:**
- Produces: `validateFile(file, acceptedExtensions)` 和 `normalizeSheets(sheets)`。
- `validateFile` 返回 `{ ok: true }` 或 `{ ok: false, message: string }`。
- `normalizeSheets` 返回 `{ sheets: Array<{ name: string, rows: string[][] }>, warnings: string[] }`。

- [ ] **Step 1: Write the failing test**

```js
import { validateFile, normalizeSheets } from "../assets/js/tools/conversion/model.js";

test("validateFile rejects a file over 20 MB", () => {
  const result = validateFile({ name: "report.pdf", size: 20 * 1024 * 1024 + 1 }, [".pdf"]);
  assert.deepEqual(result, { ok: false, message: "文件不能超过 20 MB。" });
});

test("normalizeSheets pads rows and retains a usable sheet name", () => {
  assert.deepEqual(normalizeSheets([{ name: "", rows: [["A"], ["B", "C"] }]).sheets,
    [{ name: "工作表 1", rows: [["A", ""], ["B", "C"] }]]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/conversion.test.js`

Expected: FAIL because `model.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function validateFile(file, extensions) {
  const extension = `.${String(file?.name ?? "").split(".").pop().toLowerCase()}`;
  if (!file?.name || !extensions.includes(extension)) return { ok: false, message: `请选择 ${extensions.join("、")} 文件。` };
  if (file.size === 0) return { ok: false, message: "文件为空，请重新选择。" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: "文件不能超过 20 MB。" };
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/conversion.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/tools/conversion/model.js tests/conversion.test.js
git commit -m "feat: add local conversion data model"
```

### Task 2: 实现表格编辑器和 Excel 下载适配层

**Files:**
- Create: `assets/js/tools/conversion/editor.js`
- Create: `assets/js/tools/conversion/export-xlsx.js`
- Modify: `tests/conversion.test.js`

**Interfaces:**
- Consumes: `normalizeSheets(sheets)` 的 `sheets`。
- Produces: `updateCell(sheets, sheetIndex, rowIndex, columnIndex, value)`、`appendRow(sheets, sheetIndex)`、`appendColumn(sheets, sheetIndex)` 与 `downloadWorkbook(sheets, filename, xlsx)`。

- [ ] **Step 1: Write the failing test**

```js
import { appendColumn, updateCell } from "../assets/js/tools/conversion/editor.js";

test("updateCell returns a new matrix without changing its input", () => {
  const original = [{ name: "表 1", rows: [["A"]] }];
  assert.deepEqual(updateCell(original, 0, 0, 1, "B"), [{ name: "表 1", rows: [["A", "B"]] }]);
  assert.deepEqual(original, [{ name: "表 1", rows: [["A"]] }]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/conversion.test.js`

Expected: FAIL because `editor.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
export function updateCell(sheets, sheetIndex, rowIndex, columnIndex, value) {
  return sheets.map((sheet, currentSheet) => currentSheet !== sheetIndex ? sheet : {
    ...sheet,
    rows: sheet.rows.map((row, currentRow) => currentRow !== rowIndex ? row :
      Array.from({ length: Math.max(row.length, columnIndex + 1) }, (_, index) => index === columnIndex ? String(value) : row[index] ?? "")),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/conversion.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/tools/conversion/editor.js assets/js/tools/conversion/export-xlsx.js tests/conversion.test.js
git commit -m "feat: add editable workbook export"
```

### Task 3: 增加共享转换工作区

**Files:**
- Create: `assets/js/tools/conversion/workbench.js`
- Modify: `assets/css/tools.css`
- Modify: `tests/structure.test.js`

**Interfaces:**
- Consumes: `{ id, title, eyebrow, acceptedExtensions, parseFile }`，其中 `parseFile(file, onProgress)` 返回 `Promise<{ sheets, warnings }>`。
- Produces: `mountConversionWorkbench(root, config)`，返回清理函数。

- [ ] **Step 1: Write the failing test**

```js
test("tools page registers the three Excel conversion tool ids", async () => {
  const registry = await readFile(new URL("../assets/js/tools/registry.js", import.meta.url), "utf8");
  for (const id of ["pdf-to-excel", "image-to-excel", "word-to-excel"]) assert.match(registry, new RegExp(`id: "${id}"`));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/structure.test.js`

Expected: FAIL because conversion tool ids are absent.

- [ ] **Step 3: Write minimal implementation**

Build a file input with `accept` set from `acceptedExtensions`, a 20 MB local-only helper label, an alert status node, an editable `<table>` rendered from `sheets`, plus “增加行”“增加列”“下载 Excel”“重新选择文件” controls. Clear all module state in the cleanup function.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/structure.test.js`

Expected: PASS after registry integration is completed in Task 7.

- [ ] **Step 5: Commit**

```bash
git add assets/js/tools/conversion/workbench.js assets/css/tools.css tests/structure.test.js
git commit -m "feat: add local conversion workbench"
```

### Task 4: 实现 PDF 表格到二维数据

**Files:**
- Create: `assets/js/tools/conversion/pdf-table.js`
- Create: `assets/js/tools/pdf-to-excel.js`
- Modify: `tests/conversion.test.js`

**Interfaces:**
- Produces: `groupPdfItemsIntoRows(items, tolerance = 4)` 和 `parsePdfTable(file, onProgress)`。
- `groupPdfItemsIntoRows` 接收 `{ str, transform }[]`，按相近 Y 坐标分行、按 X 坐标排序，并返回 `string[][]`。

- [ ] **Step 1: Write the failing test**

```js
import { groupPdfItemsIntoRows } from "../assets/js/tools/conversion/pdf-table.js";

test("groupPdfItemsIntoRows orders PDF text by row then x coordinate", () => {
  const items = [
    { str: "金额", transform: [1, 0, 0, 1, 90, 100] },
    { str: "名称", transform: [1, 0, 0, 1, 10, 100] },
    { str: "20", transform: [1, 0, 0, 1, 90, 80] },
  ];
  assert.deepEqual(groupPdfItemsIntoRows(items), [["名称", "金额"], ["20"]]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/conversion.test.js`

Expected: FAIL because `pdf-table.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement the pure grouping function first. In `parsePdfTable`, dynamically import the locally bundled pdf.js module, reject password-protected and image-only PDF with the designated Chinese warning, and create one sheet for each page that has text rows.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/conversion.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/tools/conversion/pdf-table.js assets/js/tools/pdf-to-excel.js tests/conversion.test.js
git commit -m "feat: add local PDF table conversion"
```

### Task 5: 实现图片 OCR 表格推断

**Files:**
- Create: `assets/js/tools/conversion/image-table.js`
- Create: `assets/js/tools/image-to-excel.js`
- Modify: `tests/conversion.test.js`

**Interfaces:**
- Produces: `wordsToRows(words, tolerance = 12)` 和 `parseImageTable(file, onProgress)`。
- `wordsToRows` 接收 `{ text, bbox: { x0, y0 } }[]` 并输出按视觉行、X 坐标排序的二维字符串数组。

- [ ] **Step 1: Write the failing test**

```js
import { wordsToRows } from "../assets/js/tools/conversion/image-table.js";

test("wordsToRows keeps nearby OCR words on one row", () => {
  const words = [
    { text: "名称", bbox: { x0: 10, y0: 10 } },
    { text: "数量", bbox: { x0: 100, y0: 14 } },
    { text: "苹果", bbox: { x0: 10, y0: 45 } },
  ];
  assert.deepEqual(wordsToRows(words), [["名称", "数量"], ["苹果"]]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/conversion.test.js`

Expected: FAIL because `image-table.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement `wordsToRows`. Then create a Tesseract worker using locally published worker/core/language assets for `chi_sim+eng`; map progress callbacks to Chinese status text; terminate the worker in `finally`; return a warning that the user should verify the editable table.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/conversion.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/tools/conversion/image-table.js assets/js/tools/image-to-excel.js tests/conversion.test.js
git commit -m "feat: add local image table conversion"
```

### Task 6: 实现 DOCX 表格读取

**Files:**
- Create: `assets/js/tools/conversion/docx-table.js`
- Create: `assets/js/tools/word-to-excel.js`
- Modify: `tests/conversion.test.js`

**Interfaces:**
- Produces: `parseDocxTableXml(documentXml)` 和 `parseDocxTables(file, onProgress)`。
- `parseDocxTableXml` 返回 `Array<{ name: string, rows: string[][] }>`。

- [ ] **Step 1: Write the failing test**

```js
import { parseDocxTableXml } from "../assets/js/tools/conversion/docx-table.js";

test("parseDocxTableXml reads Word table cells in order", () => {
  const xml = `<w:document xmlns:w="urn:test"><w:tbl><w:tr><w:tc><w:p><w:r><w:t>姓名</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>分数</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:document>`;
  assert.deepEqual(parseDocxTableXml(xml), [{ name: "表 1", rows: [["姓名", "分数"]] }]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/conversion.test.js`

Expected: FAIL because `docx-table.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Use `DOMParser` to select `w:tbl`, `w:tr`, `w:tc` and concatenate `w:t` descendants per cell. `parseDocxTables` uses locally bundled JSZip to read `word/document.xml`, rejects unsupported ZIP or documents without tables, and calls `normalizeSheets` before returning.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/conversion.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/tools/conversion/docx-table.js assets/js/tools/word-to-excel.js tests/conversion.test.js
git commit -m "feat: add local Word table conversion"
```

### Task 7: 接入工具分类、发布依赖与端到端验证

**Files:**
- Modify: `package.json`
- Create: `assets/vendor/` bundles for pdf.js, Tesseract.js worker/core/language files, JSZip and SheetJS
- Modify: `assets/js/tools/registry.js`
- Modify: `assets/js/tools/app.js`
- Modify: `assets/css/tools.css`
- Modify: `README.md`
- Modify: `tests/assets.test.js`
- Modify: `tests/structure.test.js`

**Interfaces:**
- Consumes: three `mount(root)` modules and all converter interfaces defined above.
- Produces: category-aware navigation with the `Excel 处理` heading and three working conversion tools.

- [ ] **Step 1: Write the failing test**

```js
test("local conversion assets are referenced without remote URLs", async () => {
  const app = await readFile(new URL("../assets/js/tools/app.js", import.meta.url), "utf8");
  const registry = await readFile(new URL("../assets/js/tools/registry.js", import.meta.url), "utf8");
  assert.match(registry, /category: "Excel 处理"/);
  assert.doesNotMatch(app, /https?:\\/\\//);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/structure.test.js`

Expected: FAIL because the category and modules are absent.

- [ ] **Step 3: Write minimal implementation**

Install and bundle compatible local production assets: `pdfjs-dist`, `tesseract.js`, `tesseract.js-core`, `@tesseract.js-data/chi_sim`, `@tesseract.js-data/eng`, `jszip`, and `xlsx`. Register the three tool modules after the existing tools, change the sidebar renderer to group tools by `category`, and update the footer count from the registry length. Document supported formats, 20 MB limit and the user-review requirement.

- [ ] **Step 4: Run automated verification**

Run: `npm run check`

Expected: all existing and new tests PASS.

- [ ] **Step 5: Perform browser verification**

Open `tools.html#pdf-to-excel`, `tools.html#image-to-excel`, and `tools.html#word-to-excel`; confirm each has a local-only notice, file selection, status region, editable preview shell and Excel download button. At 390 px width, confirm no horizontal page overflow and the tool drawer opens.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json assets/vendor assets/js/tools/registry.js assets/js/tools/app.js assets/css/tools.css README.md tests/assets.test.js tests/structure.test.js
git commit -m "feat: add local Excel conversion tools"
```

## Self-Review

- Spec coverage: Tasks 1–3 cover shared local flow, validation, editable preview and Excel download; Tasks 4–6 cover the three required sources; Task 7 covers categories, locally published dependencies, responsive behavior and documentation.
- Placeholder scan: no deferred implementation markers or undefined interfaces remain.
- Type consistency: every parser returns `{ sheets, warnings }`; the workbench consumes `parseFile(file, onProgress)` and the exporter consumes `Array<{ name, rows }>`, matching all task definitions.
