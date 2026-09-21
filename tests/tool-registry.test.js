import test from "node:test";
import assert from "node:assert/strict";
import { TOOLS, resolveToolId } from "../assets/js/tools/registry.js";

test("registry exposes four unique, complete tools", () => {
  assert.equal(TOOLS.length, 4);
  assert.equal(new Set(TOOLS.map(({ id }) => id)).size, 4);
  for (const tool of TOOLS) {
    for (const key of ["id", "index", "name", "category", "description", "load"]) {
      assert.ok(tool[key]);
    }
  }
});

test("resolveToolId accepts known hashes and falls back safely", () => {
  assert.equal(resolveToolId("#json-formatter"), "json-formatter");
  assert.equal(resolveToolId("#unknown"), "text-stats");
  assert.equal(resolveToolId(""), "text-stats");
});
