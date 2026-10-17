import { createElement, useEffect, useRef, useState, type ComponentType } from "react";

export type InitialInputProps = { initialText: string };

export function withClipboardInput(
  Component: ComponentType<InitialInputProps>,
  readText: () => Promise<string | undefined>,
) {
  return function ClipboardInputCommand() {
    const read = useRef<Promise<string> | undefined>(undefined);
    const [initialText, setInitialText] = useState<string>();

    useEffect(() => {
      let cancelled = false;
      // Reuse the read when React replays effects. Unavailable text is optional.
      read.current ??= Promise.resolve()
        .then(readText)
        .then((text) => text ?? "")
        .catch(() => "");
      read.current.then((text) => {
        if (!cancelled) setInitialText(text);
      });
      return () => {
        cancelled = true;
      };
    }, []);

    // Raycast selects searchText on the first List render. Updating an already
    // visible List only moves the caret to the end, so finish the read first.
    // The input component then owns its state; no later read can overwrite it.
    return initialText === undefined ? null : createElement(Component, { initialText });
  };
}
