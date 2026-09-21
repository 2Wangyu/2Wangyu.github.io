function copySheets(sheets) {
  return sheets.map((sheet) => ({
    ...sheet,
    rows: sheet.rows.map((row) => [...row]),
  }));
}

function sheetWidth(sheet) {
  return Math.max(1, ...sheet.rows.map((row) => row.length));
}

export function updateCell(sheets, sheetIndex, rowIndex, columnIndex, value) {
  const next = copySheets(sheets);
  const sheet = next[sheetIndex];
  if (!sheet?.rows[rowIndex]) return next;
  const width = Math.max(sheetWidth(sheet), columnIndex + 1);
  sheet.rows = sheet.rows.map((row, index) => Array.from(
    { length: width },
    (_, column) => index === rowIndex && column === columnIndex ? String(value) : row[column] ?? "",
  ));
  return next;
}

export function appendRow(sheets, sheetIndex) {
  const next = copySheets(sheets);
  const sheet = next[sheetIndex];
  if (sheet) sheet.rows.push(Array(sheetWidth(sheet)).fill(""));
  return next;
}

export function appendColumn(sheets, sheetIndex) {
  const next = copySheets(sheets);
  const sheet = next[sheetIndex];
  if (sheet) sheet.rows = sheet.rows.map((row) => [...row, ""]);
  return next;
}

export function renameSheet(sheets, sheetIndex, name) {
  const next = copySheets(sheets);
  if (next[sheetIndex]) next[sheetIndex].name = String(name).trim() || `工作表 ${sheetIndex + 1}`;
  return next;
}
