import { Clipboard, environment } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import type { ClipboardInput } from "../components/with-clipboard-input";

const runFile = promisify(execFile);

export async function readClipboardInput(): Promise<ClipboardInput> {
  if (process.platform !== "darwin") {
    const input = await Clipboard.read();
    return { text: input.file ?? input.text, files: input.file ? [input.file] : [] };
  }
  const { stdout } = await runFile(join(environment.assetsPath, "clipboard-reader"), [], {
    encoding: "utf8",
    maxBuffer: 96 * 1024 * 1024,
    timeout: 10_000,
  });
  const data = JSON.parse(stdout) as { textBase64: string; files: string[] };
  return { text: Buffer.from(data.textBase64, "base64").toString("utf8"), files: data.files };
}

export async function readClipboardText(): Promise<string | undefined> {
  if (process.platform !== "darwin") return Clipboard.readText();
  // Read the current macOS pasteboard directly. Raycast 2.8.2's clipboard API
  // reads history, which can return a file reference instead of a large text.
  // Exceeding this buffer rejects explicitly; partial output is never used.
  const { stdout } = await runFile("/usr/bin/pbpaste", [], {
    // Raycast's extension host may omit a UTF-8 locale. Without this, pbpaste
    // replaces non-ASCII characters with question marks before Node reads them.
    env: { ...process.env, LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8" },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 10_000,
  });
  return stdout;
}
