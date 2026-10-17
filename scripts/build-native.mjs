import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

if (process.platform === "darwin") {
  const root = fileURLToPath(new URL("../", import.meta.url));
  mkdirSync(new URL("../assets", import.meta.url), { recursive: true });
  // Ship both Mac architectures; users do not need a compiler at runtime.
  execFileSync(
    "/usr/bin/xcrun",
    [
      "clang",
      "-fobjc-arc",
      "-O2",
      "-framework",
      "AppKit",
      "-framework",
      "Foundation",
      "-arch",
      "arm64",
      "-arch",
      "x86_64",
      "-mmacosx-version-min=11.0",
      "native/clipboard-reader.m",
      "-o",
      "assets/clipboard-reader",
    ],
    { cwd: root, stdio: "inherit" },
  );
}
