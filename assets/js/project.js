import { PROJECTS } from "./data.js";

export function findProject(projects, slug) {
  return projects.find((project) => project.slug === slug) ?? null;
}

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderNotFound(root) {
  document.title = "项目未找到 · 余旺";
  const section = element("section", "not-found");
  section.append(
    element("p", "eyebrow", "SIGNAL NOT FOUND / 404"),
    element("h1", "", "这个项目暂时不存在"),
    element("p", "", "可能是链接已发生变化，也可能这个项目还在准备中。"),
  );
  const link = element("a", "text-link", "返回作品集  ↗");
  link.href = "index.html#work";
  section.append(link);
  root.append(section);
}

function renderProject(root, project) {
  document.title = `${project.title} · 余旺`;
  document.documentElement.style.setProperty("--detail-accent", project.accent);

  const hero = element("section", "detail-hero");
  const meta = element("div", "detail-meta");
  meta.append(
    element("span", "", `PROJECT / ${project.index}`),
    element("span", "", project.category),
    element("span", "", "STATUS / CONCEPT"),
  );
  hero.append(
    meta,
    element("h1", "", project.title),
    element("p", "detail-hero__summary", project.summary),
  );

  const visual = element("div", "detail-visual");
  visual.setAttribute("aria-hidden", "true");
  visual.append(
    element("span", "detail-visual__label", "OUTPUT VISUALIZATION"),
    element("span", "detail-visual__number", project.index),
    element("div", "detail-visual__sphere"),
  );

  const overview = element("section", "detail-overview");
  overview.append(
    element("p", "eyebrow", "OVERVIEW / 项目概览"),
    element("p", "detail-overview__lead", project.description),
  );

  const narrative = element("section", "detail-narrative");
  const sections = [
    ["01", "任务目标", project.challenge],
    ["02", "解决过程", project.process],
    ["03", "最终结果", project.result],
  ];
  for (const [index, title, copy] of sections) {
    const article = element("article", "detail-narrative__item");
    article.append(
      element("span", "detail-narrative__index", index),
      element("h2", "", title),
      element("p", "", copy),
    );
    narrative.append(article);
  }

  const footer = element("section", "detail-close");
  const tags = element("ul", "detail-tags");
  tags.setAttribute("aria-label", "项目标签");
  for (const tag of project.tags) tags.append(element("li", "", tag));
  const link = element("a", "text-link", "返回全部作品  ↗");
  link.href = "index.html#work";
  footer.append(tags, link);

  root.append(hero, visual, overview, narrative, footer);
}

if (typeof document !== "undefined") {
  const root = document.querySelector("#project-content");
  const slug = new URLSearchParams(location.search).get("id");
  const project = findProject(PROJECTS, slug);
  if (project) renderProject(root, project);
  else renderNotFound(root);
}
