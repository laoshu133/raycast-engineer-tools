import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, open, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import {
  encodeFile,
  fileCandidate,
  FILE_HASH_ALGORITHMS,
  hashFile,
  inspectFile,
  MAX_BASE64_FILE_BYTES,
} from "../src/utils/file-input.ts";

const run = promisify(execFile);

async function directory(t: { after: (callback: () => Promise<void>) => void }) {
  const path = await mkdtemp(join(tmpdir(), "engineer-file-test-"));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

test("file paths support spaces, quotes, home expansion, and encoded local file URLs", () => {
  const path = "/tmp/中文 file🙂.png";
  for (const text of [path, `"${path}"`, `'${path}'`, pathToFileURL(path).href]) {
    assert.deepEqual(fileCandidate(text), { path });
  }
  assert.deepEqual(fileCandidate("~/file.bin"), { path: join(homedir(), "file.bin") });
  assert.equal(fileCandidate("ordinary text"), undefined);
  assert.equal(fileCandidate("/a\n/b"), undefined);
  assert.equal(fileCandidate("/" + "x".repeat(5000)), undefined);
  assert.ok(fileCandidate("file://remote-host/file.bin")?.error);
});

test("native file metadata overrides plain text and explicitly rejects multiple files", () => {
  assert.deepEqual(fileCandidate("some text", ["/tmp/file.bin"]), { path: "/tmp/file.bin" });
  assert.ok(fileCandidate("", ["/tmp/a", "/tmp/b"])?.error);
});

test("file inspection reads metadata and rejects folders and missing files", async (t) => {
  const dir = await directory(t);
  const path = join(dir, "binary.dat");
  await writeFile(path, Buffer.from([0, 255, 128, 10]));
  assert.deepEqual(await inspectFile(path), { path, name: "binary.dat", size: 4 });
  await assert.rejects(inspectFile(dir), /regular files/);
  await assert.rejects(inspectFile(join(dir, "missing")), { code: "ENOENT" });
});

test("binary Base64 spans stream boundaries and Data URLs use MIME with a safe fallback", async (t) => {
  const dir = await directory(t);
  const path = join(dir, "中文 file.png");
  const bytes = Buffer.alloc(200_003);
  for (let index = 0; index < bytes.length; index++) bytes[index] = index % 256;
  await writeFile(path, bytes);
  const encoded = await encodeFile(path);
  assert.equal(encoded, bytes.toString("base64"));
  assert.deepEqual(Buffer.from(encoded, "base64"), bytes);
  assert.equal(await encodeFile(path, true), `data:image/png;base64,${encoded}`);
  const unknown = join(dir, "no-extension");
  await writeFile(unknown, bytes);
  assert.equal(await encodeFile(unknown, true), `data:application/octet-stream;base64,${encoded}`);
  await writeFile(path, Buffer.alloc(0));
  assert.equal(await encodeFile(path), "");
  assert.equal(await encodeFile(path, true), "data:image/png;base64,");
});

test("file hashes use original binary bytes for every algorithm", async (t) => {
  const dir = await directory(t);
  const path = join(dir, "file.bin");
  const bytes = Buffer.from([0, 255, 128, 254, 10, 13, 0, 42]);
  await writeFile(path, bytes);
  for (const algorithm of FILE_HASH_ALGORITHMS) {
    assert.equal(await hashFile(path, algorithm), createHash(algorithm).update(bytes).digest("hex"));
  }
});

test("Base64 rejects oversize files while Hash streams files beyond that limit", async (t) => {
  const dir = await directory(t);
  const path = join(dir, "large.bin");
  const size = MAX_BASE64_FILE_BYTES + 1;
  const handle = await open(path, "w");
  await handle.truncate(size);
  await handle.close();
  await assert.rejects(encodeFile(path), /32 MiB/);
  const expected = createHash("sha256");
  const block = Buffer.alloc(64 * 1024);
  for (let position = 0; position < size; position += block.length) {
    expected.update(block.subarray(0, Math.min(block.length, size - position)));
  }
  assert.equal(await hashFile(path, "sha256"), expected.digest("hex"));
});

test("cancelled reads reject and deleted files cannot return stale results", async (t) => {
  const dir = await directory(t);
  const path = join(dir, "file.bin");
  await writeFile(path, "example");
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(encodeFile(path, false, controller.signal), { name: "AbortError" });
  await assert.rejects(hashFile(path, "md5", controller.signal), { name: "AbortError" });
  const opening = new AbortController();
  const pending = hashFile(path, "sha256", opening.signal);
  queueMicrotask(() => opening.abort());
  await assert.rejects(pending, { name: "AbortError" });
  await rm(path);
  await assert.rejects(encodeFile(path), { code: "ENOENT" });
});

test(
  "native current-pasteboard reader distinguishes files from large text",
  { skip: process.platform !== "darwin" },
  async (t) => {
    const dir = await directory(t);
    const binary = join(dir, "clipboard-native-test");
    const source = fileURLToPath(new URL("../native/clipboard-reader.test.m", import.meta.url));
    await run("/usr/bin/xcrun", [
      "clang",
      "-fobjc-arc",
      "-framework",
      "AppKit",
      "-framework",
      "Foundation",
      source,
      "-o",
      binary,
    ]);
    const { stdout } = await run(binary);
    assert.match(stdout, /passed/);
  },
);
