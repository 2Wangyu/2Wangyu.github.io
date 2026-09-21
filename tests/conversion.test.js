import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSheets, validateFile } from "../assets/js/tools/conversion/model.js";

test("validateFile rejects unsupported, empty, and oversized local files", () => {
  assert.deepEqual(validateFile({ name: "report.doc", size: 10 }, [".pdf"]), {
    ok: false,
    message: "请选择 .pdf 文件。",
  });
  assert.deepEqual(validateFile({ name: "report.pdf", size: 0 }, [".pdf"]), {
    ok: false,
    message: "文件为空，请重新选择。",
  });
  assert.deepEqual(validateFile({ name: "report.pdf", size: 20 * 1024 * 1024 + 1 }, [".pdf"]), {
    ok: false,
    message: "文件不能超过 20 MB。",
  });
});

test("normalizeSheets pads table cells and creates usable sheet names", () => {
  assert.deepEqual(normalizeSheets([{ name: "", rows: [["姓名"], ["余旺", "90"]] }]), {
    sheets: [{ name: "工作表 1", rows: [["姓名", ""], ["余旺", "90"]] }],
    warnings: [],
  });
});
