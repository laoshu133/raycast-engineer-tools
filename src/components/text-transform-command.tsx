import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  Icon,
  Keyboard,
  List,
  Toast,
  getSelectedText,
  showToast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { transformText, type Transform, type TransformResult } from "../utils/encoding";
import { previewText, SEARCH_INPUT_LIMIT, SEARCH_PREVIEW_LENGTH } from "../utils/text-preview";
import { readClipboardText } from "../utils/clipboard";

function TextEditor({ text, onSubmit }: { text: string; onSubmit: (text: string) => void }) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle="Edit Input"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Use Text"
            onSubmit={async (values: { text: string }) => {
              if (values.text.length >= SEARCH_INPUT_LIMIT) {
                await showToast(
                  Toast.Style.Failure,
                  "Editor limit reached",
                  "Use Read Clipboard for the complete text.",
                );
                return;
              }
              onSubmit(values.text);
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="text"
        title="Input"
        defaultValue={text}
        placeholder="Enter or paste text, including multiple lines"
      />
    </Form>
  );
}

type Props = { operation: "encode" | "decode" | "hash"; transforms: readonly Transform[] };

export function TextTransformCommand({ operation, transforms }: Props) {
  const [text, setText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<TransformResult[]>([]);
  const [pending, setPending] = useState(false);
  const [searchLimitReached, setSearchLimitReached] = useState(false);
  const revision = useRef(0);
  const nativeSearchText = useRef("");
  const expectedSearchEcho = useRef<string | undefined>(undefined);
  const { push } = useNavigation();

  const setInput = (value: string, imported = false) => {
    revision.current++;
    setText(value);
    setSearchLimitReached(!imported && value.length >= SEARCH_INPUT_LIMIT);
    // Large/multiline input stays out of the single-line search field.
    // The full value remains the source for every conversion and action.
    const displayedText = value.length > SEARCH_PREVIEW_LENGTH || /[\r\n]/.test(value) ? "" : value;
    if (displayedText !== nativeSearchText.current) expectedSearchEcho.current = displayedText;
    nativeSearchText.current = displayedText;
    setSearchText(displayedText);
  };

  useEffect(() => {
    let cancelled = false;
    const initialRevision = revision.current;
    getSelectedText()
      .then((value) => {
        if (!cancelled && revision.current === initialRevision && value.length > 0) setInput(value, true);
      })
      .catch(() => {
        // Selection is optional; retain anything the user has already entered.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setResults([]);
    if (text.length === 0 || searchLimitReached) {
      setPending(false);
      return;
    }
    setPending(true);
    const timer = setTimeout(
      () => {
        setResults(transformText(text, transforms));
        setPending(false);
      },
      text.length > 16_384 ? 150 : 0,
    );
    return () => clearTimeout(timer);
  }, [text, transforms, searchLimitReached]);

  const readClipboard = async () => {
    const requestRevision = ++revision.current;
    try {
      const value = await readClipboardText();
      if (revision.current !== requestRevision) return;
      if (value === undefined || value.length === 0) {
        await showToast(Toast.Style.Failure, "Clipboard has no text");
        return;
      }
      setInput(value, true);
    } catch (error) {
      await showToast(Toast.Style.Failure, "Could not read clipboard", String(error));
    }
  };

  const copy = async (value: string) => {
    try {
      await Clipboard.copy(value);
      await showToast(Toast.Style.Success, "Copied complete result");
    } catch (error) {
      await showToast(Toast.Style.Failure, "Could not copy result", String(error));
    }
  };
  const paste = async (value: string) => {
    try {
      await Clipboard.paste(value);
    } catch (error) {
      await showToast(Toast.Style.Failure, "Could not paste result", String(error));
    }
  };

  const inputActions = (
    <ActionPanel.Section title="Input">
      <Action
        title="Read Clipboard"
        icon={Icon.Clipboard}
        shortcut={Keyboard.Shortcut.Common.Refresh}
        onAction={readClipboard}
      />
      <Action
        title="Edit Input"
        icon={Icon.Pencil}
        shortcut={{ modifiers: ["cmd"], key: "e" }}
        onAction={async () => {
          if (text.length >= SEARCH_INPUT_LIMIT) {
            await showToast(
              Toast.Style.Failure,
              "Text is too large for the editor",
              "Edit it externally, then use Read Clipboard.",
            );
            return;
          }
          push(<TextEditor text={text} onSubmit={(value) => setInput(value, true)} />);
        }}
      />
      {text.length > 0 && (
        <Action
          title="Clear Input"
          icon={Icon.XMarkCircle}
          shortcut={{ modifiers: ["cmd"], key: "backspace" }}
          onAction={() => setInput("")}
        />
      )}
    </ActionPanel.Section>
  );

  return (
    <List
      filtering={false}
      searchText={searchText}
      onSearchTextChange={(value) => {
        nativeSearchText.current = value;
        // Raycast can echo programmatic changes back through this callback.
        // Clearing only the displayed field must not erase the full input.
        if (value === expectedSearchEcho.current) {
          expectedSearchEcho.current = undefined;
          return;
        }
        expectedSearchEcho.current = undefined;
        setInput(value);
      }}
      searchBarPlaceholder={`Enter text to ${operation}, or use ⌘R to read clipboard`}
      isLoading={pending}
      actions={<ActionPanel>{inputActions}</ActionPanel>}
    >
      <List.EmptyView
        title={
          searchLimitReached
            ? "Search field limit reached"
            : pending
              ? "Processing text…"
              : `Enter text to ${operation}`
        }
        description={
          searchLimitReached
            ? `Raycast may have shortened your paste (${Buffer.byteLength(text).toLocaleString()} bytes received). Press ⌘R to read the complete clipboard text.`
            : "Type or paste into the search bar. Use ⌘R for clipboard text or ⌘E for multiple lines."
        }
        actions={<ActionPanel>{inputActions}</ActionPanel>}
      />
      <List.Section title={text.length > 0 ? `Input: ${Buffer.byteLength(text).toLocaleString()} bytes` : undefined}>
        {!searchLimitReached &&
          results.map((result) => {
            const preview = previewText(result.value ?? result.error);
            return (
              <List.Item
                key={result.method}
                title={preview.text || "(empty result)"}
                subtitle={`${result.method} ${operation === "hash" ? "hash" : `${operation.slice(0, -1)}ing`}`}
                icon={result.error !== undefined ? Icon.Warning : undefined}
                accessories={
                  result.error !== undefined
                    ? [{ text: "Invalid input" }]
                    : preview.truncated
                      ? [{ text: "Preview", tooltip: "Display is shortened. Copy and paste use the complete result." }]
                      : []
                }
                actions={
                  <ActionPanel>
                    {result.value !== undefined && (
                      <ActionPanel.Section title="Result">
                        <Action title="Copy" icon={Icon.CopyClipboard} onAction={() => copy(result.value!)} />
                        <Action
                          title="Paste"
                          icon={Icon.Clipboard}
                          shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
                          onAction={() => paste(result.value!)}
                        />
                      </ActionPanel.Section>
                    )}
                    {inputActions}
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>
    </List>
  );
}
