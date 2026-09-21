import { appendColumn, appendRow, renameSheet, updateCell } from "./editor.js";
import { validateFile } from "./model.js";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function downloadWorkbook(sheets, name) {
  if (!globalThis.XLSX) throw new Error("本地 Excel 导出组件尚未载入，请刷新后重试。");
  const workbook = globalThis.XLSX.utils.book_new();
  for (const sheet of sheets) {
    globalThis.XLSX.utils.book_append_sheet(workbook, globalThis.XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name.slice(0, 31));
  }
  globalThis.XLSX.writeFile(workbook, `${name || "转换结果"}.xlsx`, { compression: true });
}

export function mountConversionWorkbench(root, config) {
  let sheets = [];
  let activeSheet = 0;
  const panel = element("section", "tool-panel conversion-panel");
  const header = element("header", "tool-panel__header");
  header.append(element("p", "eyebrow", config.eyebrow), element("h1", "", config.title), element("p", "", config.description));
  const status = element("p", "conversion-status", "选择文件后将在当前浏览器内处理，不会上传或保存。");
  status.setAttribute("role", "status");
  const picker = element("label", "conversion-picker");
  picker.append(element("span", "conversion-picker__icon", "↥"), element("strong", "", "选择本地文件"), element("small", "", `支持 ${config.acceptedExtensions.join("、")}，最大 20 MB`));
  const input = element("input");
  input.type = "file";
  input.accept = config.acceptedExtensions.join(",");
  picker.append(input);
  const result = element("div", "conversion-result");
  const reset = element("button", "tool-button tool-button--quiet", "重新选择文件");
  reset.type = "button";
  reset.hidden = true;

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function renderGrid() {
    result.replaceChildren();
    if (!sheets.length) return;
    const tabs = element("div", "conversion-tabs");
    sheets.forEach((sheet, index) => {
      const tab = element("button", "conversion-tab", sheet.name);
      tab.type = "button";
      tab.classList.toggle("is-active", index === activeSheet);
      tab.addEventListener("click", () => { activeSheet = index; renderGrid(); });
      tabs.append(tab);
    });
    const current = sheets[activeSheet];
    const nameField = element("label", "conversion-sheet-name");
    nameField.append(element("span", "", "工作表名称"));
    const nameInput = element("input");
    nameInput.value = current.name;
    nameInput.addEventListener("input", () => { sheets = renameSheet(sheets, activeSheet, nameInput.value); tabs.children[activeSheet].textContent = sheets[activeSheet].name; });
    nameField.append(nameInput);
    const tableWrap = element("div", "conversion-table-wrap");
    const table = element("table", "conversion-table");
    const body = element("tbody");
    current.rows.forEach((row, rowIndex) => {
      const tr = element("tr");
      row.forEach((value, columnIndex) => {
        const td = element("td");
        const cell = element("input");
        cell.value = value;
        cell.setAttribute("aria-label", `第 ${rowIndex + 1} 行第 ${columnIndex + 1} 列`);
        cell.addEventListener("input", () => { sheets = updateCell(sheets, activeSheet, rowIndex, columnIndex, cell.value); });
        td.append(cell); tr.append(td);
      });
      body.append(tr);
    });
    table.append(body); tableWrap.append(table);
    const actions = element("div", "conversion-actions");
    const addRow = element("button", "tool-button tool-button--quiet", "增加行");
    const addColumn = element("button", "tool-button tool-button--quiet", "增加列");
    const download = element("button", "tool-button", "下载 Excel ↘");
    for (const button of [addRow, addColumn, download]) button.type = "button";
    addRow.addEventListener("click", () => { sheets = appendRow(sheets, activeSheet); renderGrid(); });
    addColumn.addEventListener("click", () => { sheets = appendColumn(sheets, activeSheet); renderGrid(); });
    download.addEventListener("click", () => { try { downloadWorkbook(sheets, config.downloadName); setStatus("Excel 已开始下载。", "success"); } catch (error) { setStatus(error.message, "error"); } });
    actions.append(addRow, addColumn, download);
    result.append(tabs, nameField, tableWrap, actions);
  }

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    const valid = validateFile(file, config.acceptedExtensions);
    if (!valid.ok) { setStatus(valid.message, "error"); return; }
    sheets = []; result.replaceChildren(); reset.hidden = false;
    try {
      setStatus(`正在本地处理 ${file.name}…`);
      const parsed = await config.parseFile(file, (message) => setStatus(message));
      sheets = parsed.sheets;
      activeSheet = 0;
      renderGrid();
      setStatus(parsed.warnings?.[0] || "处理完成。请核对表格后下载 Excel。", parsed.warnings?.length ? "warning" : "success");
    } catch (error) { setStatus(error instanceof Error ? error.message : "处理失败，请重新选择文件。", "error"); }
  });
  reset.addEventListener("click", () => { input.value = ""; sheets = []; result.replaceChildren(); reset.hidden = true; setStatus("选择文件后将在当前浏览器内处理，不会上传或保存。"); });
  panel.append(header, picker, status, reset, result);
  root.append(panel);
  return () => { sheets = []; input.value = ""; };
}
