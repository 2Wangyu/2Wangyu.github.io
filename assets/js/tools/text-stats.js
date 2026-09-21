export function analyzeText(text) {
  const value = String(text ?? "");
  const chineseCharacters = value.match(/\p{Script=Han}/gu)?.length ?? 0;
  const words = value.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const paragraphs = value.trim()
    ? value.trim().split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length
    : 0;
  const readingUnits = chineseCharacters / 300 + words / 200;

  return {
    characters: value.length,
    charactersNoSpaces: value.replace(/\s/g, "").length,
    chineseCharacters,
    words,
    paragraphs,
    readingMinutes: readingUnits > 0 ? Math.max(1, Math.ceil(readingUnits)) : 0,
  };
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function mount(container) {
  const panel = createElement("section", "tool-panel tool-panel--text");
  const header = createElement("header", "tool-panel__header");
  header.append(
    createElement("p", "eyebrow", "TEXT / ANALYSIS"),
    createElement("h1", "", "文本统计"),
    createElement("p", "tool-panel__intro", "输入内容后，统计结果会即时更新；文本不会离开当前浏览器。"),
  );

  const field = createElement("label", "tool-field tool-field--large");
  field.append(createElement("span", "tool-field__label", "输入文本"));
  const textarea = document.createElement("textarea");
  textarea.placeholder = "在这里输入或粘贴文本…";
  textarea.rows = 11;
  field.append(textarea);

  const metrics = createElement("dl", "metric-grid");
  const metricDefinitions = [
    ["characters", "字符数"],
    ["charactersNoSpaces", "去空格字符"],
    ["chineseCharacters", "中文字符"],
    ["words", "英文单词"],
    ["paragraphs", "段落数"],
    ["readingMinutes", "预计阅读 / 分钟"],
  ];
  const values = new Map();
  for (const [key, label] of metricDefinitions) {
    const item = createElement("div", "metric");
    const value = createElement("dd", "", "0");
    values.set(key, value);
    item.append(createElement("dt", "", label), value);
    metrics.append(item);
  }

  const actions = createElement("div", "tool-actions");
  const clear = createElement("button", "button button--quiet", "清空文本");
  clear.type = "button";
  actions.append(clear);

  function update() {
    const stats = analyzeText(textarea.value);
    for (const [key, value] of values) value.textContent = String(stats[key]);
  }

  function reset() {
    textarea.value = "";
    update();
    textarea.focus();
  }

  textarea.addEventListener("input", update);
  clear.addEventListener("click", reset);
  panel.append(header, field, metrics, actions);
  container.append(panel);
  update();

  return () => {
    textarea.removeEventListener("input", update);
    clear.removeEventListener("click", reset);
  };
}
