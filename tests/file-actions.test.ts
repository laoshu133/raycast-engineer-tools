import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Exercise real action callbacks and real file IO without writing the user's
// pasteboard. Native keyboard dispatch still requires a Raycast UI check.
const shim = `
import { createElement } from "react";
export const copies = [];
export const toasts = [];
export const Clipboard = { copy: async (value) => { copies.push(value); } };
export const Toast = { Style: { Animated: "animated", Success: "success", Failure: "failure" } };
export async function showToast(options) { const toast = { ...options }; toasts.push(toast); return toast; }
export const Icon = { CopyClipboard: "copy", Document: "file", Warning: "warning" };
export const Action = (props) => createElement("action", props);
export const ActionPanel = (props) => createElement("actions", null, props.children);
export const List = {
  Section: (props) => createElement("section", null, props.children),
  Item: (props) => createElement("item", props, props.actions),
};
`;

test("file actions copy binary Base64, Shift+Return Data URL, and file hashes only on execution", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "engineer-action-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const resolve = createRequire(import.meta.url).resolve;
  const source = fileURLToPath(new URL("../src/components/file-transform-items.tsx", import.meta.url));
  const output = await build({
    stdin: {
      contents: `export { FileTransformItems } from ${JSON.stringify(source)}; export { useFileInput } from ${JSON.stringify(fileURLToPath(new URL("../src/hooks/use-file-input.ts", import.meta.url)))}; export { copies, toasts } from "@raycast/api";`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    jsx: "automatic",
    plugins: [
      {
        name: "raycast-test-host",
        setup(builder) {
          builder.onResolve({ filter: /^@raycast\/api$/ }, () => ({ path: "raycast", namespace: "test-host" }));
          builder.onLoad({ filter: /.*/, namespace: "test-host" }, () => ({ contents: shim }));
          builder.onResolve({ filter: /^(react(?:\/.*)?|mime)$/ }, (args) => ({
            path: resolve(args.path),
            external: true,
          }));
        },
      },
    ],
  });
  const modulePath = join(dir, "file-actions.mjs");
  await writeFile(modulePath, output.outputFiles[0].text);
  const { FileTransformItems, useFileInput, copies, toasts } = await import(pathToFileURL(modulePath).href);
  const path = join(dir, "binary.png");
  const bytes = Buffer.from([0, 128, 255, 10, 13, 42]);
  await writeFile(path, bytes);
  const props = { file: { path, name: "binary.png", size: bytes.length }, operation: "encode", inputActions: null };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(createElement(FileTransformItems, props));
  });
  assert.deepEqual(copies, [], "listing files must not encode or copy");
  const action = (title: string) => view.root.findAllByType("action").find((node) => node.props.title === title)!;
  await act(async () => action("Copy File Base64").props.onAction());
  assert.equal(copies.at(-1), bytes.toString("base64"));
  assert.deepEqual(action("Copy File Data URL").props.shortcut, { modifiers: ["shift"], key: "return" });
  await act(async () => action("Copy File Data URL").props.onAction());
  assert.equal(copies.at(-1), `data:image/png;base64,${bytes.toString("base64")}`);

  await act(async () => view.update(createElement(FileTransformItems, { ...props, operation: "hash" })));
  for (const algorithm of ["md5", "sha1", "sha256"]) {
    await act(async () => action(`Copy File ${algorithm.toUpperCase()}`).props.onAction());
    assert.equal(copies.at(-1), createHash(algorithm).update(bytes).digest("hex"));
  }
  const count = copies.length;
  await rm(path);
  await act(async () => action("Copy File MD5").props.onAction());
  assert.equal(copies.length, count, "failed actions must leave the clipboard intact");
  assert.equal(toasts.at(-1).style, "failure");

  await writeFile(path, bytes);
  let pending: Promise<void>;
  await act(async () => {
    pending = action("Copy File SHA256").props.onAction();
    view.unmount();
  });
  await pending!;
  assert.equal(copies.length, count, "leaving the file cancels pending clipboard writes");

  // Check text paths remain useful while explicit clipboard files report
  // missing/unsupported inputs. Poll through act so async renders are flushed.
  async function inspect(text: string, files?: string[]) {
    let state: { checking: boolean; error?: string; file?: unknown };
    const Probe = () => {
      state = useFileInput(text, files, true);
      return null;
    };
    await act(async () => {
      view = create(createElement(Probe));
    });
    for (let attempt = 0; state!.checking && attempt < 100; attempt++) {
      await act(async () => new Promise<void>((resolve) => setTimeout(resolve, 1)));
    }
    assert.equal(state!.checking, false);
    await act(async () => view.unmount());
    return state!;
  }
  const missing = join(dir, "api", "users");
  assert.equal((await inspect(missing)).error, undefined);
  assert.equal((await inspect(dir)).error, undefined);
  assert.equal((await inspect(missing, [missing])).error, "File not found");
  assert.match((await inspect(dir, [dir])).error!, /regular files/);
});
