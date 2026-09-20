export function timestampToDates(value) {
  const text = String(value ?? "").trim();
  if (!text) return { ok: false, error: "请输入时间戳。" };

  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return { ok: false, error: "时间戳必须是有效数字。" };

  const milliseconds = Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "时间戳超出有效范围。" };

  return {
    ok: true,
    milliseconds: Math.trunc(milliseconds),
    seconds: Math.trunc(milliseconds / 1000),
    local: date.toLocaleString(),
    iso: date.toISOString(),
  };
}

export function dateToTimestamps(value) {
  const text = String(value ?? "").trim();
  if (!text) return { ok: false, error: "请选择日期和时间。" };

  const milliseconds = new Date(text).getTime();
  if (!Number.isFinite(milliseconds)) return { ok: false, error: "日期时间无效。" };

  return {
    ok: true,
    milliseconds,
    seconds: Math.trunc(milliseconds / 1000),
  };
}
