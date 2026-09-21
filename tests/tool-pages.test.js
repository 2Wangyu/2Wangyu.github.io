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
