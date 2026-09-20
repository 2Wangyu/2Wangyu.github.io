import test from "node:test";
import assert from "node:assert/strict";
import { PROJECTS } from "../assets/js/data.js";
import { findProject } from "../assets/js/project.js";

test("findProject resolves a valid slug", () => {
  assert.equal(findProject(PROJECTS, "digital-workbench")?.title, "数字工作台");
});

test("findProject returns null for missing or unknown slugs", () => {
  assert.equal(findProject(PROJECTS, null), null);
  assert.equal(findProject(PROJECTS, "unknown"), null);
});
