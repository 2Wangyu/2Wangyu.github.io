import { PROFILE, PROJECTS } from "./data.js";
import { mountAmbient } from "./ambient.js";

const intro = document.querySelector("#intro");
const enterButton = document.querySelector("#enter-site");
const siteShell = document.querySelector("#site-shell");
const mainContent = document.querySelector("#main-content");
const profileIntro = document.querySelector("#profile-intro");
const canvas = document.querySelector("#ambient-canvas");
const projectsGrid = document.querySelector("#projects-grid");
const timeline = document.querySelector("#timeline");
const toolsGrid = document.querySelector("#tools-grid");

profileIntro.textContent = `${PROFILE.name} · ${PROFILE.role}。${PROFILE.intro}`;
const stopAmbient = mountAmbient(canvas);

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderProjects(projects, container) {
  for (const project of projects) {
    const link = element("a", "project-card");
    link.href = `project.html?id=${encodeURIComponent(project.slug)}`;
    link.style.setProperty("--project-accent", project.accent);
    link.setAttribute("aria-label", `查看项目：${project.title}`);

    const top = element("div", "project-card__top");
    top.append(
      element("span", "project-card__index", project.index),
      element("span", "project-card__category", project.category),
    );

    const visual = element("div", "project-card__visual");
    visual.setAttribute("aria-hidden", "true");
    visual.append(
      element("span", "project-card__signal", "PROJECT SIGNAL"),
      element("span", "project-card__glyph", project.index),
    );

    const copy = element("div", "project-card__copy");
    copy.append(
      element("h3", "", project.title),
      element("p", "", project.summary),
    );

    const tags = element("ul", "project-card__tags");
    tags.setAttribute("aria-label", "项目标签");
    for (const tag of project.tags) tags.append(element("li", "", tag));

    const arrow = element("span", "project-card__arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    link.append(top, visual, copy, tags, arrow);
    container.append(link);
  }
}

function renderTimeline(container) {
  const records = [
    {
      date: "NOW",
      title: "个人资料待补充",
      copy: "这里将展示你的当前方向、擅长领域与个人介绍。",
    },
    {
      date: "NEXT",
      title: "项目经验待补充",
      copy: "这里将按时间顺序记录具有代表性的项目与实践经历。",
    },
  ];

  for (const record of records) {
    const item = element("article", "timeline__item");
    item.append(
      element("span", "timeline__date", record.date),
      element("h3", "", record.title),
      element("p", "", record.copy),
      element("span", "timeline__mark", ""),
    );
    container.append(item);
  }
}

function renderTools(container) {
  const tools = [
    ["A", "文本整理器", "快速整理、转换和重组文本内容。"],
    ["B", "图片处理台", "为常用图片任务预留的一站式入口。"],
    ["C", "效率小助手", "把重复步骤变成简单、直接的操作。"],
  ];

  for (const [index, title, copy] of tools) {
    const card = element("article", "tool-card");
    card.dataset.status = "coming-soon";
    card.append(
      element("span", "tool-card__index", index),
      element("span", "tool-card__status", "即将上线"),
      element("h3", "", title),
      element("p", "", copy),
      element("span", "tool-card__corner", "+"),
    );
    container.append(card);
  }
}

renderProjects(PROJECTS, projectsGrid);
renderTimeline(timeline);
renderTools(toolsGrid);

function enterSite() {
  document.body.classList.add("is-entered");
  siteShell.setAttribute("aria-hidden", "false");
  intro.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    mainContent.focus({ preventScroll: true });
    stopAmbient();
  }, document.documentElement.classList.contains("reduce-motion") ? 0 : 900);
}

enterButton.addEventListener("click", enterSite);

if (location.hash) {
  enterSite();
}
