import test from "node:test";
import assert from "node:assert/strict";
import { PROFILE, PROJECTS } from "../assets/js/data.js";

test("profile uses the confirmed name", () => {
  assert.equal(PROFILE.name, "余旺");
  assert.equal(PROFILE.romanizedName, "YU WANG");
});

test("three navigable sample projects have complete fields", () => {
  assert.equal(PROJECTS.length, 3);
  assert.equal(new Set(PROJECTS.map(({ slug }) => slug)).size, 3);

  for (const project of PROJECTS) {
    for (const key of [
      "slug",
      "title",
      "summary",
      "description",
      "challenge",
      "process",
      "result",
      "accent",
    ]) {
      assert.ok(project[key], `${project.slug || "project"}.${key} is required`);
    }
    assert.ok(project.tags.length >= 2);
  }
});
