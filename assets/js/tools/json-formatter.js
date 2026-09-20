export function formatJson(text, compact = false) {
  const value = String(text ?? "").trim();
  if (!value) return { ok: false, error: "请输入需要处理的 JSON。" };

  try {
    const data = JSON.parse(value);
    return {
      ok: true,
      value: JSON.stringify(data, null, compact ? 0 : 2),
    };
  } catch (error) {
    return {
      ok: false,
      error: `JSON 无效：${error instanceof Error ? error.message : "无法解析输入"}`,
    };
  }
}
