export const encodeUtils = {
  url: (text: string): string => encodeURIComponent(text),

  base64: (text: string): string => Buffer.from(text).toString("base64"),

  hex: (text: string): string => Buffer.from(text).toString("hex"),
};

export const decodeUtils = {
  url: (text: string): string => decodeURIComponent(text),

  base64: (text: string): string => {
    try {
      return Buffer.from(text, "base64").toString("utf8");
    } catch {
      return "Invalid base64 string";
    }
  },

  hex: (text: string): string => {
    try {
      return Buffer.from(text, "hex").toString("utf8");
    } catch {
      return "Invalid hex string";
    }
  },

  unicode: (text: string): string => {
    try {
      return text.replace(/\\u[0-9a-fA-F]{4}/g, (match) => {
        return String.fromCharCode(parseInt(match.slice(2), 16));
      });
    } catch {
      return "Invalid unicode escape sequence";
    }
  },
};

import crypto from "crypto";

export const hashUtils = {
  md5: (text: string): string => crypto.createHash("md5").update(text).digest("hex"),

  sha1: (text: string): string => crypto.createHash("sha1").update(text).digest("hex"),

  sha256: (text: string): string => crypto.createHash("sha256").update(text).digest("hex"),
};
