import { Clipboard } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const runFile = promisify(execFile);

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
