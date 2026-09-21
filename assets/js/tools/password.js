const SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*_-+=?",
};

function secureRandom() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 4294967296;
}

export function generatePassword(options, randomSource = secureRandom) {
  const length = Number(options?.length);
  if (!Number.isInteger(length) || length < 8 || length > 64) {
    throw new RangeError("密码长度必须是 8–64 位整数。");
  }

  const alphabet = Object.entries(SETS)
    .filter(([key]) => Boolean(options?.[key]))
    .map(([, characters]) => characters)
    .join("");

  if (!alphabet) throw new Error("请至少选择一种字符类型。");

  let password = "";
  for (let index = 0; index < length; index += 1) {
    const random = Math.min(Math.max(Number(randomSource()), 0), 0.999999999999);
    password += alphabet[Math.floor(random * alphabet.length)];
  }
  return password;
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function mount(container) {
  const panel = createElement("section", "tool-panel tool-panel--password");
  const header = createElement("header", "tool-panel__header");
  header.append(
    createElement("p", "eyebrow", "SECURITY / RANDOMNESS"),
    createElement("h1", "", "密码生成器"),
    createElement("p", "tool-panel__intro", "按你的规则生成随机密码。密码只会显示在当前页面，不会被保存。"),
  );

  const controls = createElement("div", "password-controls");
  const lengthField = createElement("label", "range-field");
  const lengthHead = createElement("span", "range-field__head");
  const lengthLabel = createElement("span", "", "密码长度");
  const lengthValue = createElement("output", "", "16");
  lengthHead.append(lengthLabel, lengthValue);
  const length = document.createElement("input");
  length.type = "range";
  length.min = "8";
  length.max = "64";
  length.value = "16";
  lengthField.append(lengthHead, length);

  const options = createElement("fieldset", "password-options");
  options.append(createElement("legend", "", "包含字符"));
  const choices = [
    ["uppercase", "大写字母 A–Z", true],
    ["lowercase", "小写字母 a–z", true],
    ["numbers", "数字 0–9", true],
    ["symbols", "符号 !@#", false],
  ];
  const checks = new Map();
  for (const [key, label, checked] of choices) {
    const option = createElement("label", "check-option");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    checks.set(key, input);
    option.append(input, createElement("span", "", label));
    options.append(option);
  }
  controls.append(lengthField, options);

  const status = createElement("p", "tool-status");
  status.setAttribute("role", "alert");
  const result = createElement("output", "password-result", "点击生成以创建密码");
  const actions = createElement("div", "tool-actions");
  const generate = createElement("button", "button button--primary", "生成密码");
  const copy = createElement("button", "button", "复制密码");
  generate.type = "button";
  copy.type = "button";
  actions.append(generate, copy);

  function optionValues() {
    return {
      length: Number(length.value),
      uppercase: checks.get("uppercase").checked,
      lowercase: checks.get("lowercase").checked,
      numbers: checks.get("numbers").checked,
      symbols: checks.get("symbols").checked,
    };
  }

  function createPassword() {
    try {
      result.value = generatePassword(optionValues());
      result.textContent = result.value;
      status.textContent = "已生成新的本地随机密码。";
      status.className = "tool-status is-success";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "无法生成密码。";
      status.className = "tool-status is-error";
    }
  }

  async function copyPassword() {
    if (!result.value) return;
    try {
      await navigator.clipboard.writeText(result.value);
      status.textContent = "密码已复制到剪贴板。";
      status.className = "tool-status is-success";
    } catch {
      status.textContent = "浏览器未允许自动复制，请手动选择密码。";
      status.className = "tool-status is-error";
    }
  }

  function updateLength() {
    lengthValue.value = length.value;
    lengthValue.textContent = length.value;
  }

  length.addEventListener("input", updateLength);
  generate.addEventListener("click", createPassword);
  copy.addEventListener("click", copyPassword);
  panel.append(header, controls, result, status, actions);
  container.append(panel);
  createPassword();

  return () => {
    length.removeEventListener("input", updateLength);
    generate.removeEventListener("click", createPassword);
    copy.removeEventListener("click", copyPassword);
  };
}
