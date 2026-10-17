import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { decodeUtils, encodeUtils, hashUtils, transformText } from "../src/utils/encoding.ts";
import { previewText, RESULT_PREVIEW_LENGTH, SEARCH_INPUT_LIMIT } from "../src/utils/text-preview.ts";

for (const [name, encode] of Object.entries(encodeUtils)) {
  test(`${name}: round-trip text larger than the Raycast search field`, () => {
    const input = "中文🙂\n Error: Invalid\t".repeat(40_000) + "END";
    assert.ok(input.length > SEARCH_INPUT_LIMIT);
    const output = encode(input);
    const preview = previewText(output);
    assert.equal(preview.truncated, true);
    assert.equal(decodeUtils[name as keyof typeof encodeUtils](output), input);
    assert.ok(output.length > preview.text.length);
    assert.ok(
      output.endsWith(
        name === "hex" ? "454e44" : name === "url" ? "END" : Buffer.from(input).toString("base64").slice(-8),
      ),
    );
  });
}

test("results containing Error or Invalid are successful data", () => {
  const results = transformText("Error%3A%20Invalid", [{ method: "URL", transform: decodeUtils.url }]);
  assert.deepEqual(results, [{ method: "URL", value: "Error: Invalid" }]);
});

test("whitespace is valid input, while clearing input clears results", () => {
  assert.deepEqual(transformText("", [{ method: "Base64", transform: encodeUtils.base64 }]), []);
  assert.equal(transformText(" \n\t", [{ method: "Base64", transform: encodeUtils.base64 }])[0].value, "IAoJ");
  assert.equal(hashUtils.sha256(" \n\t"), createHash("sha256").update(" \n\t").digest("hex"));
});

test("invalid decoding returns a separate error without a copyable value", () => {
  for (const input of ["!!!!", "aGVsbG8=???", "a", "a===", "Zh==", "Zg=", "ab+_"]) {
    assert.throws(() => decodeUtils.base64(input), Error, input);
  }
  for (const input of ["6869zz", "f", "0x68", "ff"]) assert.throws(() => decodeUtils.hex(input), Error, input);
  assert.throws(() => decodeUtils.base64("/w=="), /UTF-8/);
  assert.deepEqual(transformText("%ZZ", [{ method: "URL", transform: decodeUtils.url }]), [
    { method: "URL", error: "URI malformed" },
  ]);
});

test("Base64 variants and Unicode escapes retain compatibility", () => {
  for (const input of ["aGVsbG8=", "aGVs\nbG8=", "aGVsbG8"]) assert.equal(decodeUtils.base64(input), "hello");
  const unicode = "你好🙂";
  assert.equal(decodeUtils.base64(Buffer.from(unicode).toString("base64url")), unicode);
  assert.equal(decodeUtils.hex("68 65 6c 6c 6f"), "hello");
  assert.equal(decodeUtils.unicode("\\u4f60\\u597d\\uD83D\\uDE42\\u{1F642}"), "你好🙂🙂");
  assert.throws(() => decodeUtils.unicode("\\u{110000}"), /range/);
});

test("previews preserve short results and do not split emoji or combining characters", () => {
  assert.deepEqual(previewText("hello"), { text: "hello", truncated: false });
  assert.deepEqual(previewText("x".repeat(RESULT_PREVIEW_LENGTH)), {
    text: "x".repeat(RESULT_PREVIEW_LENGTH),
    truncated: false,
  });
  assert.deepEqual(previewText("x".repeat(RESULT_PREVIEW_LENGTH + 1)), {
    text: "x".repeat(RESULT_PREVIEW_LENGTH) + "…",
    truncated: true,
  });
  for (const grapheme of ["🙂", "👩‍💻", "e\u0301"]) {
    assert.deepEqual(previewText(grapheme.repeat(257)), { text: grapheme.repeat(256) + "…", truncated: true });
  }
  assert.deepEqual(previewText("one\r\ntwo\tthree"), { text: "one ↵ two ⇥ three", truncated: false });
});
