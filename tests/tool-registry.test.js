import test from "node:test";
import assert from "node:assert/strict";
import { TOOLS, resolveToolId } from "../assets/js/tools/registry.js";

test("registry exposes seven unique, complete tools including Excel conversion", () => {
  assert.equal(TOOLS.length, 7);
  assert.equal(new Set(TOOLS.map(({ id }) => id)).size, 7);
  for (const tool of TOOLS) {
    for (const key of ["id", "index", "name", "category", "description", "load"]) {
      assert.ok(tool[key]);
    }
  }
  assert.deepEqual(TOOLS.filter(({ group }) => group === "Excel 处理").map(({ id }) => id), ["pdf-to-excel", "image-to-excel", "word-to-excel"]);
});

test("resolveToolId accepts known hashes and falls back safely", () => {
  assert.equal(resolveToolId("#json-formatter"), "json-formatter");
  assert.equal(resolveToolId("#unknown"), "text-stats");
  assert.equal(resolveToolId(""), "text-stats");
});
