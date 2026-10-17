import { Buffer, isUtf8 } from "node:buffer";
import { createHash } from "node:crypto";

function decodeUtf8(bytes: Buffer): string {
  if (!isUtf8(bytes)) throw new Error("Decoded bytes are not valid UTF-8 text");
  return bytes.toString("utf8");
}

export const encodeUtils = {
  url: (text: string): string => encodeURIComponent(text),
  base64: (text: string): string => Buffer.from(text, "utf8").toString("base64"),
  hex: (text: string): string => Buffer.from(text, "utf8").toString("hex"),
};

export const decodeUtils = {
  url: (text: string): string => decodeURIComponent(text),
  base64: (text: string): string => {
    // Accept wrapped/unpadded Base64 and Base64URL, but never silently drop data.
    const input = text.replace(/\s/g, "");
    if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(input) || (/[+/]/.test(input) && /[-_]/.test(input))) {
      throw new Error("Invalid Base64 characters");
    }
    const unpadded = input.replace(/=+$/, "");
    if (unpadded.length % 4 === 1 || (input.includes("=") && input.length % 4 !== 0)) {
      throw new Error("Invalid Base64 length or padding");
    }
    const bytes = Buffer.from(unpadded, "base64url");
    if (bytes.toString("base64url") !== unpadded.replace(/\+/g, "-").replace(/\//g, "_")) {
      throw new Error("Invalid Base64 padding bits");
    }
    return decodeUtf8(bytes);
  },
  hex: (text: string): string => {
    const input = text.replace(/\s/g, "");
    if (input.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(input)) {
      throw new Error("Hex must contain complete pairs of hexadecimal digits");
    }
    return decodeUtf8(Buffer.from(input, "hex"));
  },
  unicode: (text: string): string =>
    text.replace(/\\u(?:\{([0-9a-fA-F]{1,6})\}|([0-9a-fA-F]{4}))/g, (_, codePoint, codeUnit) => {
      const value = Number.parseInt(codePoint ?? codeUnit, 16);
      if (value > 0x10ffff) throw new Error("Unicode code point is out of range");
      return String.fromCodePoint(value);
    }),
};

export const hashUtils = {
  md5: (text: string): string => createHash("md5").update(text, "utf8").digest("hex"),
  sha1: (text: string): string => createHash("sha1").update(text, "utf8").digest("hex"),
  sha256: (text: string): string => createHash("sha256").update(text, "utf8").digest("hex"),
};

export type Transform = { method: string; transform: (text: string) => string };
export type TransformResult =
  | { method: string; value: string; error?: never }
  | { method: string; value?: never; error: string };

export function transformText(text: string, transforms: readonly Transform[]): TransformResult[] {
  if (text.length === 0) return [];
  return transforms.map(({ method, transform }) => {
    try {
      return { method, value: transform(text) };
    } catch (error) {
      return { method, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
