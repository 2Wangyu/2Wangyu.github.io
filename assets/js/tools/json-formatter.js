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

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function mount(container) {
  const panel = createElement("section", "tool-panel tool-panel--json");
  const header = createElement("header", "tool-panel__header");
  header.append(
    createElement("p", "eyebrow", "DATA / NORMALIZATION"),
    createElement("h1", "", "JSON 格式化"),
    createElement("p", "tool-panel__intro", "检查 JSON 语法，格式化或压缩数据。所有处理均在本地完成。"),
  );

  const inputField = createElement("label", "tool-field tool-field--code");
  inputField.append(createElement("span", "tool-field__label", "原始 JSON"));
  const input = document.createElement("textarea");
  input.placeholder = '{"name":"Yu Wang"}';
  input.spellcheck = false;
  input.rows = 12;
  inputField.append(input);

  const outputField = createElement("label", "tool-field tool-field--code");
  outputField.append(createElement("span", "tool-field__label", "处理结果"));
  const output = document.createElement("textarea");
  output.readOnly = true;
  output.placeholder = "结果将显示在这里";
  output.rows = 12;
  outputField.append(output);

  const status = createElement("p", "tool-status");
  status.setAttribute("role", "status");
  const actions = createElement("div", "tool-actions");
  const format = createElement("button", "button button--primary", "格式化");
  const compact = createElement("button", "button", "压缩");
  const example = createElement("button", "button", "载入示例");
  const copy = createElement("button", "button button--quiet", "复制结果");
  const clear = createElement("button", "button button--quiet", "清空");
  for (const button of [format, compact, example, copy, clear]) button.type = "button";
  actions.append(format, compact, example, copy, clear);

  function process(compactOutput) {
    const result = formatJson(input.value, compactOutput);
    if (result.ok) {
      output.value = result.value;
      status.textContent = compactOutput ? "已压缩 JSON。" : "JSON 格式有效，已完成格式化。";
      status.className = "tool-status is-success";
    } else {
      status.textContent = result.error;
      status.className = "tool-status is-error";
    }
  }

  async function copyOutput() {
    if (!output.value) {
      status.textContent = "没有可复制的结果。";
      status.className = "tool-status is-error";
      return;
    }
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = "结果已复制到剪贴板。";
      status.className = "tool-status is-success";
    } catch {
      output.focus();
      output.select();
      status.textContent = "浏览器未允许自动复制，请手动复制选中的内容。";
      status.className = "tool-status is-error";
    }
  }

  function loadExample() {
    input.value = '{"owner":"余旺","tools":["文本统计","JSON 格式化"],"local":true}';
    process(false);
  }

  function reset() {
    input.value = "";
    output.value = "";
    status.textContent = "";
    status.className = "tool-status";
    input.focus();
  }

  format.addEventListener("click", () => process(false));
  compact.addEventListener("click", () => process(true));
  example.addEventListener("click", loadExample);
  copy.addEventListener("click", copyOutput);
  clear.addEventListener("click", reset);
  panel.append(header, inputField, actions, status, outputField);
  container.append(panel);

  return () => {
    format.replaceWith(format.cloneNode(true));
    compact.replaceWith(compact.cloneNode(true));
    example.replaceWith(example.cloneNode(true));
    copy.replaceWith(copy.cloneNode(true));
    clear.replaceWith(clear.cloneNode(true));
  };
}
