export const MAX_FILE_BYTES = 20 * 1024 * 1024;

function extensionOf(name) {
  const match = /\.[^.]+$/.exec(String(name ?? ""));
  return match ? match[0].toLocaleLowerCase("en-US") : "";
}

export function validateFile(file, acceptedExtensions) {
  const extension = extensionOf(file?.name);
  if (!file?.name || !acceptedExtensions.includes(extension)) {
    return { ok: false, message: `请选择 ${acceptedExtensions.join("、")} 文件。` };
  }
  if (file.size === 0) return { ok: false, message: "文件为空，请重新选择。" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: "文件不能超过 20 MB。" };
  return { ok: true };
}

export function normalizeSheets(rawSheets) {
  const sheets = rawSheets
    .filter((sheet) => Array.isArray(sheet?.rows) && sheet.rows.length > 0)
    .map((sheet, index) => {
      const width = Math.max(1, ...sheet.rows.map((row) => Array.isArray(row) ? row.length : 0));
      return {
        name: String(sheet.name ?? "").trim() || `工作表 ${index + 1}`,
        rows: sheet.rows.map((row) => Array.from(
          { length: width },
          (_, column) => String(Array.isArray(row) ? row[column] ?? "" : ""),
        )),
      };
    });
  return { sheets, warnings: [] };
}
