import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import mime from "mime";

export const MAX_BASE64_FILE_BYTES = 32 * 1024 * 1024;
export const FILE_HASH_ALGORITHMS = ["md5", "sha1", "sha256"] as const;
export type FileHashAlgorithm = (typeof FILE_HASH_ALGORITHMS)[number];
export type InputFile = { path: string; name: string; size: number };
export type FileCandidate = { path: string; error?: never } | { error: string; path?: never };

export function fileCandidate(text: string, files?: string[]): FileCandidate | undefined {
  if (files && files.length > 1) return { error: "Select a single file; multiple files are not supported" };
  let path = files?.[0] ?? text.trim();
  if (!files?.length) {
    if ((path.startsWith('"') && path.endsWith('"')) || (path.startsWith("'") && path.endsWith("'"))) {
      path = path.slice(1, -1);
    }
    if (!path.startsWith("/") && !path.startsWith("~/") && !path.startsWith("file://")) return undefined;
    // Do not stat arbitrary multiline text or huge text that resembles a path.
    if (path.length > 4096 || /[\r\n\0]/.test(path)) return undefined;
  }
  try {
    if (path.startsWith("file://")) path = fileURLToPath(path);
    else if (path.startsWith("~/")) path = join(homedir(), path.slice(2));
    return { path };
  } catch {
    return { error: "Invalid local file URL" };
  }
}

export async function inspectFile(path: string): Promise<InputFile> {
  const info = await stat(path);
  if (!info.isFile()) {
    throw Object.assign(new Error("Only regular files are supported; choose a file rather than a folder or device"), {
      code: "ENOTFILE",
    });
  }
  return { path, name: basename(path), size: info.size };
}

export function fileError(error: unknown): string {
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code === "ENOENT" || code === "ENOTDIR") return "File not found";
  if (code === "EACCES" || code === "EPERM") return "Permission denied when reading file";
  if (error instanceof Error && error.name === "AbortError") return "Cancelled";
  return error instanceof Error ? error.message : String(error);
}

async function consumeFile(
  path: string,
  consume: (chunk: Buffer) => void,
  signal?: AbortSignal,
  limit = Infinity,
): Promise<void> {
  signal?.throwIfAborted();
  const handle = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const before = await handle.stat();
    if (!before.isFile()) throw new Error("Only regular files are supported");
    if (before.size > limit) throw new Error("File exceeds the 32 MiB Base64 limit");
    // A bounded read loop keeps memory flat and checks cancellation around
    // each IO operation, including cancellation while open/stat is pending.
    const block = Buffer.allocUnsafe(256 * 1024);
    let bytes = 0;
    while (true) {
      signal?.throwIfAborted();
      const { bytesRead } = await handle.read(block, 0, block.length, null);
      signal?.throwIfAborted();
      if (bytesRead === 0) break;
      bytes += bytesRead;
      if (bytes > limit) throw new Error("File exceeds the 32 MiB Base64 limit");
      consume(block.subarray(0, bytesRead));
    }
    signal?.throwIfAborted();
    const after = await handle.stat();
    if (
      bytes !== before.size ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs
    ) {
      throw new Error("File changed while reading; try again");
    }
  } finally {
    await handle.close();
  }
}

export async function encodeFile(path: string, dataURL = false, signal?: AbortSignal): Promise<string> {
  const pieces: string[] = [];
  let carry = Buffer.alloc(0);
  await consumeFile(
    path,
    (chunk) => {
      const buffer = carry.length ? Buffer.concat([carry, chunk]) : chunk;
      const end = buffer.length - (buffer.length % 3);
      if (end > 0) pieces.push(buffer.subarray(0, end).toString("base64"));
      carry = Buffer.from(buffer.subarray(end));
    },
    signal,
    MAX_BASE64_FILE_BYTES,
  );
  if (carry.length) pieces.push(carry.toString("base64"));
  const base64 = pieces.join("");
  return dataURL ? `data:${mime.getType(path) ?? "application/octet-stream"};base64,${base64}` : base64;
}

export async function hashFile(path: string, algorithm: FileHashAlgorithm, signal?: AbortSignal): Promise<string> {
  const hash = createHash(algorithm);
  await consumeFile(
    path,
    (chunk) => {
      hash.update(chunk);
    },
    signal,
  );
  return hash.digest("hex");
}
