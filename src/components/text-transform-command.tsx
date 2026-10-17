import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  Icon,
  Keyboard,
  List,
  Toast,
  showToast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { transformText, type Transform, type TransformResult } from "../utils/encoding";
import { previewText, SEARCH_INPUT_LIMIT } from "../utils/text-preview";
import { readClipboardInput, readClipboardText } from "../utils/clipboard";
import { useTextInput } from "../hooks/use-text-input";
import { useFileInput } from "../hooks/use-file-input";
import { FileTransformItems } from "./file-transform-items";
import type { InitialInputProps } from "./with-clipboard-input";

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

type Props = InitialInputProps & { operation: "encode" | "decode" | "hash"; transforms: readonly Transform[] };

export function TextTransformCommand({ initialText, initialFiles, operation, transforms }: Props) {
  const {
    text,
    searchText,
    setInput: setTextInput,
    onSearchTextChange,
    searchLimitReached,
    revision,
  } = useTextInput(initialText);
  const [clipboardFiles, setClipboardFiles] = useState({ files: initialFiles, revision: 0 });
  const setInput = (value: string, imported = false) => {
    setTextInput(value, imported);
    setClipboardFiles({ files: undefined, revision: revision.current });
  };
  const selectedFiles = clipboardFiles.revision === revision.current ? clipboardFiles.files : undefined;
  const fileInput = useFileInput(text, selectedFiles, operation !== "decode" && !searchLimitReached);
  const [results, setResults] = useState<TransformResult[]>([]);
  const [pending, setPending] = useState(false);
  const { push } = useNavigation();

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
      const value =
        operation === "decode" ? { text: await readClipboardText(), files: undefined } : await readClipboardInput();
      if (revision.current !== requestRevision) return;
      if (!value.text && !value.files?.length) {
        await showToast(Toast.Style.Failure, "Clipboard has no text or file");
        return;
      }
      setInput(value.text ?? "", true);
      setClipboardFiles({ files: value.files, revision: revision.current });
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
      {(text.length > 0 || !!selectedFiles?.length) && (
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
      onSearchTextChange={onSearchTextChange}
      searchBarPlaceholder={`Enter text to ${operation}, or use ⌘R to read clipboard`}
      isLoading={pending || fileInput.checking}
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
      {fileInput.file && operation !== "decode" && (
        <FileTransformItems
          key={fileInput.file.path}
          file={fileInput.file}
          operation={operation}
          inputActions={inputActions}
        />
      )}
      {fileInput.error && (
        <List.Section title="File Content">
          <List.Item title={fileInput.error} icon={Icon.Warning} actions={<ActionPanel>{inputActions}</ActionPanel>} />
        </List.Section>
      )}
      <List.Section title={text.length > 0 ? `Input: ${Buffer.byteLength(text).toLocaleString()} bytes` : undefined}>
        {!searchLimitReached &&
          !fileInput.checking &&
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
