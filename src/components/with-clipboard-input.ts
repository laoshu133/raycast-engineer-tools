import { createElement, useEffect, useRef, useState, type ComponentType } from "react";

export type ClipboardInput = { text: string; files?: string[] };
export type InitialInputProps = { initialText: string; initialFiles?: string[] };

export function withClipboardInput(
  Component: ComponentType<InitialInputProps>,
  readText: () => Promise<string | ClipboardInput | undefined>,
) {
  return function ClipboardInputCommand() {
    const read = useRef<Promise<InitialInputProps> | undefined>(undefined);
    const [input, setInput] = useState<InitialInputProps>();

    useEffect(() => {
      let cancelled = false;
      // Reuse the read when React replays effects. Unavailable text is optional.
      read.current ??= Promise.resolve()
        .then(readText)
        .then((value) =>
          typeof value === "string"
            ? { initialText: value }
            : { initialText: value?.text ?? "", initialFiles: value?.files },
        )
        .catch(() => ({ initialText: "" }));
      read.current.then((value) => {
        if (!cancelled) setInput(value);
      });
      return () => {
        cancelled = true;
      };
    }, []);

    // Raycast selects searchText on the first List render. Updating an already
    // visible List only moves the caret to the end, so finish the read first.
    // The input component then owns its state; no later read can overwrite it.
    return input === undefined ? null : createElement(Component, input);
  };
}
