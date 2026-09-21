import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("home page contains the entrance and portfolio landmarks", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  for (const token of [
    "id=\"intro\"",
    "id=\"enter-site\"",
    "id=\"site-shell\"",
    "id=\"projects-grid\"",
    "id=\"tools-grid\"",
  ]) {
    assert.match(html, new RegExp(token));
  }

  assert.match(html, /余旺/);
  assert.match(html, /prefers-reduced-motion/);
});

test("home page uses only local assets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /https?:\/\//);
});

test("home page links to the real tool center", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../assets/js/app.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /href="tools\.html"/);
  assert.match(app, /project\.html\?id=/);
  for (const id of ["text-stats", "json-formatter", "timestamp", "password"]) {
    assert.match(app, new RegExp(`"${id}"`));
  }
  assert.match(app, /tools\.html#\$\{id\}/);
  assert.doesNotMatch(app, /coming-soon/);
  assert.doesNotMatch(app, /innerHTML\s*=/);
});

test("the offset hero artwork is clipped within the hero section", async () => {
  const css = await readFile(new URL("../assets/css/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.hero\s*\{[^}]*overflow:\s*clip/s);
});
