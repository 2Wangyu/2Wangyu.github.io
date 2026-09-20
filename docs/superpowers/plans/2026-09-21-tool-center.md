# 余旺个人网站工具中心 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有个人网站中加入可搜索、可直接操作、可持续扩展的本地工具中心，并把首页工具占位升级为真实入口。

**Architecture:** 新增 `tools.html` 作为共享工作台，通过网址片段选择工具。每个工具模块同时导出纯计算函数和 `mount(container)` 界面挂载函数；注册表只保存元数据和加载器，工作台应用负责选择、搜索、网址同步及移动端列表。

**Tech Stack:** HTML5、CSS3、原生 JavaScript ES Modules、Web Crypto API、Clipboard API、Node.js 内置测试运行器

**Spec:** `docs/superpowers/specs/2026-09-21-tool-center-design.md`

## Global Constraints

- 保留现有作品、关于、经历、工具和联系结构。
- 四个工具全部在浏览器本地运行，不上传、记录或持久化用户输入。
- 工具地址使用 `tools.html#<tool-id>`，网址中不得包含用户输入。
- 不增加框架、组件库、远程字体或运行时依赖。
- 桌面采用导航栏与工作区布局；手机采用可关闭的工具选择面板。
- 所有交互支持键盘、可见焦点和 `prefers-reduced-motion`。

---

### Task 1: 实现四个工具的纯计算核心

**Files:**
- Create: `assets/js/tools/text-stats.js`
- Create: `assets/js/tools/json-formatter.js`
- Create: `assets/js/tools/timestamp.js`
- Create: `assets/js/tools/password.js`
- Create: `tests/tools.test.js`

**Interfaces:**
- `analyzeText(text: string): { characters, charactersNoSpaces, chineseCharacters, words, paragraphs, readingMinutes }`
- `formatJson(text: string, compact?: boolean): { ok: true, value: string } | { ok: false, error: string }`
- `timestampToDates(value: string|number): { ok: true, milliseconds, seconds, local, iso } | { ok: false, error }`
- `dateToTimestamps(value: string): { ok: true, milliseconds, seconds } | { ok: false, error }`
- `generatePassword(options, randomSource?): string`，`options` 包含 `length`, `uppercase`, `lowercase`, `numbers`, `symbols`。

- [ ] **Step 1: 写入失败的工具行为测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { analyzeText } from "../assets/js/tools/text-stats.js";
import { formatJson } from "../assets/js/tools/json-formatter.js";
import { timestampToDates, dateToTimestamps } from "../assets/js/tools/timestamp.js";
import { generatePassword } from "../assets/js/tools/password.js";

test("analyzeText counts mixed Chinese and English text", () => {
  assert.deepEqual(analyzeText("你好 world\n\n第二段"), {
    characters: 13,
    charactersNoSpaces: 10,
    chineseCharacters: 5,
    words: 1,
    paragraphs: 2,
    readingMinutes: 1,
  });
});

test("formatJson formats, compacts, and reports invalid input", () => {
  assert.equal(formatJson('{"a":1}').value, '{\n  "a": 1\n}');
  assert.equal(formatJson('{ "a": 1 }', true).value, '{"a":1}');
  assert.equal(formatJson("{").ok, false);
});

test("timestamp conversion recognizes seconds and milliseconds", () => {
  assert.equal(timestampToDates("0").iso, "1970-01-01T00:00:00.000Z");
  assert.equal(timestampToDates("1700000000000").milliseconds, 1700000000000);
  assert.equal(timestampToDates("not-a-number").ok, false);
  assert.equal(dateToTimestamps("1970-01-01T00:00:00.000Z").seconds, 0);
});

test("password generation validates options and uses enabled sets", () => {
  assert.throws(() => generatePassword({ length: 7, lowercase: true }));
  assert.throws(() => generatePassword({ length: 12 }));
  const password = generatePassword({ length: 12, numbers: true }, () => 0);
  assert.equal(password, "000000000000");
});
```

- [ ] **Step 2: 运行测试并确认四个模块缺失**

Run: `npm test`

Expected: FAIL，提示无法找到 `assets/js/tools/text-stats.js`。

- [ ] **Step 3: 实现 `analyzeText` 和 `formatJson`**

`analyzeText` 使用 Unicode 中文字符范围、英文单词边界、非空段落和每分钟 300 个中文字符或 200 个英文单词估算阅读时间。`formatJson` 在空输入时返回错误；解析成功后使用 `JSON.stringify(data, null, compact ? 0 : 2)`。

- [ ] **Step 4: 实现时间戳转换**

数值绝对值小于 `1e12` 时按秒转换，否则按毫秒。所有结果必须验证 `Number.isFinite` 和 `!Number.isNaN(date.getTime())`，无效输入返回中文错误对象。

- [ ] **Step 5: 实现密码生成核心**

长度限制 8–64；字符集为空时抛出错误。默认随机源使用 `crypto.getRandomValues`，测试通过可注入的 `randomSource()` 返回 0–1 数值。生成结果长度必须严格等于设置值。

- [ ] **Step 6: 运行测试**

Run: `npm test`

Expected: 现有 11 项测试和新增 4 项测试全部 PASS。

- [ ] **Step 7: 提交工具核心**

```bash
git add assets/js/tools tests/tools.test.js
git commit -m "feat: add local utility engines"
```

### Task 2: 建立工具注册表与工作台路由

**Files:**
- Create: `assets/js/tools/registry.js`
- Create: `assets/js/tools/app.js`
- Create: `tools.html`
- Create: `tests/tool-registry.test.js`

**Interfaces:**
- `TOOLS: Array<{ id, index, name, category, description, load }>`。
- `resolveToolId(hash: string, tools = TOOLS): string`，未知标识回退 `text-stats`。
- DOM hooks: `#tool-search`, `#tool-list`, `#tool-workspace`, `#tool-drawer-toggle`, `#tool-drawer-close`。

- [ ] **Step 1: 编写注册表与路由失败测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { TOOLS, resolveToolId } from "../assets/js/tools/registry.js";

test("registry exposes four unique, complete tools", () => {
  assert.equal(TOOLS.length, 4);
  assert.equal(new Set(TOOLS.map(({ id }) => id)).size, 4);
  for (const tool of TOOLS) {
    for (const key of ["id", "index", "name", "category", "description", "load"]) assert.ok(tool[key]);
  }
});

test("resolveToolId accepts known hashes and falls back safely", () => {
  assert.equal(resolveToolId("#json-formatter"), "json-formatter");
  assert.equal(resolveToolId("#unknown"), "text-stats");
  assert.equal(resolveToolId(""), "text-stats");
});
```

- [ ] **Step 2: 运行测试并确认注册表缺失**

Run: `npm test`

Expected: FAIL，提示无法找到 `registry.js`。

- [ ] **Step 3: 创建工具注册表**

注册四个标识：`text-stats`、`json-formatter`、`timestamp`、`password`。每个 `load` 使用对应模块的动态 `import()`；`resolveToolId` 从去除 `#` 的值中匹配。

- [ ] **Step 4: 创建工具中心语义化页面**

`tools.html` 包含站点标识、返回主页、本地运行提示、工具搜索、工具列表、移动端开关和带 `aria-live="polite"` 的工作区。只引用本地 `styles.css`、`tools.css` 和 `assets/js/tools/app.js`。

- [ ] **Step 5: 实现选择、搜索和网址同步**

`app.js` 使用安全 DOM API渲染列表；点击工具写入 `location.hash`，监听 `hashchange` 后加载模块并调用 `mount(workspace)`。搜索只匹配名称、分类和说明；无结果显示可清除搜索的空状态。工具加载失败时显示局部错误并保留导航。

- [ ] **Step 6: 运行测试并提交**

Run: `npm test`

Expected: 所有测试 PASS。

```bash
git add tools.html assets/js/tools/registry.js assets/js/tools/app.js tests/tool-registry.test.js
git commit -m "feat: add tool center navigation"
```

### Task 3: 实现文本统计和 JSON 工具界面

**Files:**
- Modify: `assets/js/tools/text-stats.js`
- Modify: `assets/js/tools/json-formatter.js`
- Create: `assets/css/tools.css`
- Create: `tests/tool-pages.test.js`

**Interfaces:**
- 每个模块导出 `mount(container: HTMLElement): () => void`。
- `mount` 清空容器后创建标题、说明、标签化输入、操作和结果；返回函数移除模块自身监听器。

- [ ] **Step 1: 编写工具页面结构失败测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("tools page exposes accessible workspace hooks", async () => {
  const html = await readFile(new URL("../tools.html", import.meta.url), "utf8");
  for (const id of ["tool-search", "tool-list", "tool-workspace", "tool-drawer-toggle", "tool-drawer-close"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /assets\/css\/tools\.css/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test("text and JSON modules expose the shared mount interface", async () => {
  const [textModule, jsonModule] = await Promise.all([
    import("../assets/js/tools/text-stats.js"),
    import("../assets/js/tools/json-formatter.js"),
  ]);
  assert.equal(typeof textModule.mount, "function");
  assert.equal(typeof jsonModule.mount, "function");
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`

Expected: FAIL，提示 `mount` 导出或 `tools.css` 缺失。

- [ ] **Step 3: 实现文本统计界面**

使用 textarea 的 `input` 事件实时调用 `analyzeText`；显示六项指标和清空按钮。清空后聚焦回输入框，所有指标更新为零。

- [ ] **Step 4: 实现 JSON 界面**

提供输入与只读输出、格式化、压缩、载入示例、复制和清空。错误写入 `role="alert"` 区域；复制只读取结果框，失败时提示手动复制。

- [ ] **Step 5: 完成工具中心基础视觉**

`tools.css` 使用现有变量，实现桌面 19rem 导航栏、弹性工作区、表单控件、指标网格、状态提示和移动端抽屉。所有输入最小字号 16px，避免手机浏览器自动缩放。

- [ ] **Step 6: 运行测试并提交**

Run: `npm test`

Expected: 所有测试 PASS。

```bash
git add assets/js/tools/text-stats.js assets/js/tools/json-formatter.js assets/css/tools.css tests/tool-pages.test.js
git commit -m "feat: add text and JSON tool interfaces"
```

### Task 4: 实现时间戳和密码工具界面

**Files:**
- Modify: `assets/js/tools/timestamp.js`
- Modify: `assets/js/tools/password.js`
- Modify: `assets/css/tools.css`
- Modify: `tests/tool-pages.test.js`

**Interfaces:**
- 两个模块继续实现统一 `mount(container)` 接口。
- 密码复制沿用 JSON 工具的结果状态语言，不共享用户数据。

- [ ] **Step 1: 增加两个 `mount` 导出失败测试**

```js
test("timestamp and password modules expose the shared mount interface", async () => {
  const [timestampModule, passwordModule] = await Promise.all([
    import("../assets/js/tools/timestamp.js"),
    import("../assets/js/tools/password.js"),
  ]);
  assert.equal(typeof timestampModule.mount, "function");
  assert.equal(typeof passwordModule.mount, "function");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test`

Expected: 新增断言 FAIL。

- [ ] **Step 3: 实现时间戳界面**

提供时间戳输入、当前时间填充、转换按钮，以及本地时间、ISO、秒和毫秒结果；另提供 `datetime-local` 输入完成反向转换。无效状态使用 `role="alert"`。

- [ ] **Step 4: 实现密码生成器界面**

提供 8–64 滑块及同步数字显示、四种字符复选框、只读密码结果、生成和复制。字符集为空时显示错误并不覆盖现有密码。

- [ ] **Step 5: 完成控件视觉和移动端布局**

复选框与滑块使用浏览器原生控件并设置 `accent-color: var(--signal)`；结果区域允许长密码换行，操作按钮在窄屏改为纵向排列。

- [ ] **Step 6: 运行测试并提交**

Run: `npm test`

Expected: 所有测试 PASS。

```bash
git add assets/js/tools/timestamp.js assets/js/tools/password.js assets/css/tools.css tests/tool-pages.test.js
git commit -m "feat: add timestamp and password interfaces"
```

### Task 5: 升级首页入口并完成浏览器验收

**Files:**
- Modify: `index.html`
- Modify: `assets/js/app.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/structure.test.js`
- Modify: `tests/assets.test.js`
- Modify: `README.md`

**Interfaces:**
- 顶部“工具”链接指向 `tools.html`。
- 首页工具卡链接指向 `tools.html#<tool-id>`。
- `assets.test.js` 验证 `tools.html` 本地资源存在。

- [ ] **Step 1: 编写首页与资源入口失败测试**

```js
test("home page links to the real tool center", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../assets/js/app.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /href="tools\.html"/);
  for (const id of ["text-stats", "json-formatter", "timestamp", "password"]) {
    assert.match(app, new RegExp(`tools\\.html#${id}`));
  }
  assert.doesNotMatch(app, /coming-soon/);
});
```

同时将资源测试的页面数组改为：

```js
for (const page of ["index.html", "project.html", "tools.html", "404.html"]) {
```

- [ ] **Step 2: 运行测试确认占位入口失败**

Run: `npm test`

Expected: 首页入口断言 FAIL。

- [ ] **Step 3: 更新首页工具区**

将首页工具卡替换为四个可点击真实入口，显示工具名称、用途和“打开工具”；增加“查看全部工具”链接。移除 `coming-soon` 状态和占位文案。

- [ ] **Step 4: 更新发布说明**

README 增加工具模块位置、增加新工具所需的注册步骤，以及所有处理均在浏览器本地完成的说明。

- [ ] **Step 5: 运行完整自动验证**

Run: `npm run check`

Expected: 全部测试 PASS，零失败。

- [ ] **Step 6: 进行桌面和手机浏览器验收**

验证主页进入工具中心、四个工具切换、直接网址访问、未知标识回退、搜索与清空、文本实时统计、JSON 成功与错误、时间戳双向转换、密码选项与复制前状态、返回主页，以及 1440px 和 320px 宽度无横向滚动。

- [ ] **Step 7: 更新交付包并提交**

```bash
git add index.html assets/js/app.js assets/css/styles.css tests README.md
git commit -m "feat: connect portfolio to tool center"
```

重新生成 `outputs/余旺个人作品集网站.zip`，确保不包含 `.git` 目录。
