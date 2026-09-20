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

test("app creates GitHub Pages-safe project links and tool placeholders", async () => {
  const source = await readFile(new URL("../assets/js/app.js", import.meta.url), "utf8");
  assert.match(source, /project\.html\?id=/);
  assert.match(source, /coming-soon/);
  assert.doesNotMatch(source, /innerHTML\s*=/);
});
