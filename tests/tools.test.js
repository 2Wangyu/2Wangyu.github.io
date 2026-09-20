import test from "node:test";
import assert from "node:assert/strict";
import { analyzeText } from "../assets/js/tools/text-stats.js";
import { formatJson } from "../assets/js/tools/json-formatter.js";
import { timestampToDates, dateToTimestamps } from "../assets/js/tools/timestamp.js";
import { generatePassword } from "../assets/js/tools/password.js";

test("analyzeText counts mixed Chinese and English text", () => {
  assert.deepEqual(analyzeText("你好 world\n\n第二段"), {
    characters: 13,
    charactersNoSpaces: 10,
    chineseCharacters: 5,
    words: 1,
    paragraphs: 2,
    readingMinutes: 1,
  });
});

test("formatJson formats, compacts, and reports invalid input", () => {
  assert.equal(formatJson('{"a":1}').value, '{\n  "a": 1\n}');
  assert.equal(formatJson('{ "a": 1 }', true).value, '{"a":1}');
  assert.equal(formatJson("{").ok, false);
});

test("timestamp conversion recognizes seconds and milliseconds", () => {
  assert.equal(timestampToDates("0").iso, "1970-01-01T00:00:00.000Z");
  assert.equal(timestampToDates("1700000000000").milliseconds, 1700000000000);
  assert.equal(timestampToDates("not-a-number").ok, false);
  assert.equal(dateToTimestamps("1970-01-01T00:00:00.000Z").seconds, 0);
});

test("password generation validates options and uses enabled sets", () => {
  assert.throws(() => generatePassword({ length: 7, lowercase: true }));
  assert.throws(() => generatePassword({ length: 12 }));
  const password = generatePassword({ length: 12, numbers: true }, () => 0);
  assert.equal(password, "000000000000");
});
