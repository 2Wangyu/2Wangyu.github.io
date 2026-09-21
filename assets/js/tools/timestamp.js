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

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function resultRows(result) {
  const list = createElement("dl", "result-list");
  for (const [label, value] of result) {
    const row = createElement("div", "result-list__row");
    row.append(createElement("dt", "", label), createElement("dd", "", String(value)));
    list.append(row);
  }
  return list;
}

export function mount(container) {
  const panel = createElement("section", "tool-panel tool-panel--timestamp");
  const header = createElement("header", "tool-panel__header");
  header.append(
    createElement("p", "eyebrow", "TIME / CONVERSION"),
    createElement("h1", "", "时间戳转换"),
    createElement("p", "tool-panel__intro", "在秒级、毫秒级时间戳与日期时间之间快速转换。"),
  );

  const timestampField = createElement("label", "tool-field");
  timestampField.append(createElement("span", "tool-field__label", "时间戳（秒或毫秒）"));
  const timestampInput = document.createElement("input");
  timestampInput.inputMode = "numeric";
  timestampInput.placeholder = "例如：1700000000000";
  timestampField.append(timestampInput);

  const timestampActions = createElement("div", "tool-actions");
  const timestampConvert = createElement("button", "button button--primary", "转换时间戳");
  const useNow = createElement("button", "button", "填入当前时间");
  timestampConvert.type = "button";
  useNow.type = "button";
  timestampActions.append(timestampConvert, useNow);
  const timestampStatus = createElement("p", "tool-status");
  timestampStatus.setAttribute("role", "alert");
  const timestampResult = createElement("div", "tool-result");

  const dateField = createElement("label", "tool-field");
  dateField.append(createElement("span", "tool-field__label", "日期时间"));
  const dateInput = document.createElement("input");
  dateInput.type = "datetime-local";
  dateField.append(dateInput);

  const dateActions = createElement("div", "tool-actions");
  const dateConvert = createElement("button", "button button--primary", "转换为时间戳");
  dateConvert.type = "button";
  dateActions.append(dateConvert);
  const dateStatus = createElement("p", "tool-status");
  dateStatus.setAttribute("role", "alert");
  const dateResult = createElement("div", "tool-result");

  function showStatus(target, message, success) {
    target.textContent = message;
    target.className = `tool-status ${success ? "is-success" : "is-error"}`;
  }

  function convertTimestamp() {
    const result = timestampToDates(timestampInput.value);
    timestampResult.replaceChildren();
    if (!result.ok) return showStatus(timestampStatus, result.error, false);
    timestampStatus.textContent = "";
    timestampStatus.className = "tool-status";
    timestampResult.append(resultRows([
      ["本地时间", result.local],
      ["ISO 时间", result.iso],
      ["秒级时间戳", result.seconds],
      ["毫秒时间戳", result.milliseconds],
    ]));
  }

  function convertDate() {
    const result = dateToTimestamps(dateInput.value);
    dateResult.replaceChildren();
    if (!result.ok) return showStatus(dateStatus, result.error, false);
    dateStatus.textContent = "";
    dateStatus.className = "tool-status";
    dateResult.append(resultRows([
      ["秒级时间戳", result.seconds],
      ["毫秒时间戳", result.milliseconds],
    ]));
  }

  function setNow() {
    timestampInput.value = String(Date.now());
    convertTimestamp();
  }

  const separator = createElement("div", "tool-separator", "DATE → TIMESTAMP");
  panel.append(header, timestampField, timestampActions, timestampStatus, timestampResult, separator, dateField, dateActions, dateStatus, dateResult);
  container.append(panel);
  timestampConvert.addEventListener("click", convertTimestamp);
  useNow.addEventListener("click", setNow);
  dateConvert.addEventListener("click", convertDate);

  return () => {
    timestampConvert.removeEventListener("click", convertTimestamp);
    useNow.removeEventListener("click", setNow);
    dateConvert.removeEventListener("click", convertDate);
  };
}
