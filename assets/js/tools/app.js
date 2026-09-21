import { TOOLS, resolveToolId } from "./registry.js";

const search = document.querySelector("#tool-search");
const list = document.querySelector("#tool-list");
const workspace = document.querySelector("#tool-workspace");
const drawerToggle = document.querySelector("#tool-drawer-toggle");
const drawerClose = document.querySelector("#tool-drawer-close");
const menuLabel = document.querySelector("#current-tool-label");
let cleanupCurrentTool = null;
let activeToolId = "";

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function closeDrawer() {
  document.body.classList.remove("tools-menu-open");
  drawerToggle.setAttribute("aria-expanded", "false");
}

function renderToolList(query = "") {
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  const visible = TOOLS.filter((tool) =>
    `${tool.name} ${tool.category} ${tool.description}`.toLocaleLowerCase("zh-CN").includes(normalized),
  );
  list.replaceChildren();

  if (!visible.length) {
    const empty = element("div", "tool-list-empty");
    empty.append(
      element("p", "", "没有找到匹配的工具。"),
      element("button", "tool-list-empty__clear", "清除搜索"),
    );
    empty.querySelector("button").type = "button";
    empty.querySelector("button").addEventListener("click", () => {
      search.value = "";
      renderToolList();
      search.focus();
    });
    list.append(empty);
    return;
  }

  for (const tool of visible) {
    const button = element("button", "tool-nav-item");
    button.type = "button";
    button.dataset.toolId = tool.id;
    button.classList.toggle("is-active", tool.id === activeToolId);
    button.setAttribute("aria-current", tool.id === activeToolId ? "page" : "false");
    button.append(
      element("span", "tool-nav-item__index", tool.index),
      element("span", "tool-nav-item__name", tool.name),
      element("span", "tool-nav-item__category", tool.category),
      element("span", "tool-nav-item__arrow", "↗"),
    );
    button.addEventListener("click", () => {
      if (location.hash !== `#${tool.id}`) location.hash = tool.id;
      else activateTool(tool.id);
      closeDrawer();
    });
    list.append(button);
  }
}

async function activateTool(id) {
  const resolvedId = resolveToolId(`#${id}`);
  const tool = TOOLS.find((item) => item.id === resolvedId);
  if (cleanupCurrentTool) cleanupCurrentTool();
  cleanupCurrentTool = null;
  activeToolId = resolvedId;
  menuLabel.textContent = tool.name;
  renderToolList(search.value);
  workspace.replaceChildren(element("p", "tool-loading", `正在载入 ${tool.name}…`));

  try {
    const module = await tool.load();
    if (typeof module.mount !== "function") throw new Error("工具界面尚未就绪");
    workspace.replaceChildren();
    cleanupCurrentTool = module.mount(workspace) ?? null;
  } catch (error) {
    const panel = element("section", "tool-error");
    panel.setAttribute("role", "alert");
    panel.append(
      element("p", "eyebrow", "TOOL OFFLINE"),
      element("h1", "", "工具暂时无法载入"),
      element("p", "", error instanceof Error ? error.message : "请稍后重试。"),
    );
    workspace.replaceChildren(panel);
  }
}

function syncFromLocation() {
  const resolved = resolveToolId(location.hash);
  if (location.hash !== `#${resolved}`) history.replaceState(null, "", `#${resolved}`);
  activateTool(resolved);
}

search.addEventListener("input", () => renderToolList(search.value));
drawerToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("tools-menu-open");
  drawerToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) search.focus();
});
drawerClose.addEventListener("click", closeDrawer);
addEventListener("hashchange", syncFromLocation);

syncFromLocation();
