import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

for (const page of ["index.html", "project.html", "tools.html", "404.html"]) {
  test(`${page} references existing local assets`, async () => {
    const html = await readFile(new URL(`../${page}`, import.meta.url), "utf8");
    const refs = [
      ...html.matchAll(/(?:src|href)="(?!#|mailto:)([^"?]+)(?:\?[^\"]*)?"/g),
    ]
      .map((match) => match[1])
      .filter((ref) => !ref.endsWith(".html"));

    for (const ref of refs) {
      await assert.doesNotReject(access(new URL(`../${ref}`, import.meta.url)));
    }
  });
}
