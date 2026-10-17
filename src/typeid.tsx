import { withClipboardInput, type InitialInputProps } from "./components/with-clipboard-input";
import { readClipboardText } from "./utils/clipboard";
import { useTextInput } from "./hooks/use-text-input";
import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { typeidUtils } from "./utils/typeid";
import { previewText } from "./utils/text-preview";

function Command({ initialText }: InitialInputProps) {
  const { text, searchText, onSearchTextChange } = useTextInput(initialText);
  const [results, setResults] = useState<{ title: string; subtitle: string; action: string }[]>([]);

  useEffect(() => {
    if (!text.trim()) return;

    const newResults: { title: string; subtitle: string; action: string }[] = [];

    // Encode as TypeID
    const prefixes = ["user", "order", "file", "task", "event", "item"];
    prefixes.forEach((prefix) => {
      try {
        const result = typeidUtils.encode(prefix, text);
        newResults.push({
          title: result,
          subtitle: `TypeID with prefix: ${prefix}`,
          action: "encode",
        });
      } catch {
        newResults.push({
          title: "Error encoding",
          subtitle: `Failed to encode with prefix: ${prefix}`,
          action: "error",
        });
      }
    });

    // Decode TypeID
    if (text.includes("_")) {
      try {
        const result = typeidUtils.decode(text);
        newResults.push({
          title: result,
          subtitle: "Decoded UUID from TypeID",
          action: "decode",
        });
      } catch {
        newResults.push({
          title: "Invalid TypeID",
          subtitle: "Failed to decode TypeID",
          action: "error",
        });
      }
    }

    setResults(newResults);
  }, [text]);

  const handleAction = (result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, "TypeID operation complete", result);
  };

  return (
    <List searchText={searchText} onSearchTextChange={onSearchTextChange}>
      {text.trim() === "" ? (
        <List.EmptyView
          title="Enter text or TypeID"
          description="Type UUID to encode as TypeID, or TypeID to decode to UUID"
        />
      ) : (
        results.map((result, index) => (
          <List.Item
            key={index}
            title={previewText(result.title).text}
            subtitle={result.subtitle}
            actions={
              <ActionPanel>
                <Action title="Copy" onAction={() => handleAction(result.title)} />
                <Action.Paste content={result.title} />
                <Action.CopyToClipboard content={result.title} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

export default withClipboardInput(Command, readClipboardText);
