import { withClipboardInput, type InitialInputProps } from "./components/with-clipboard-input";
import { readClipboardText } from "./utils/clipboard";
import { useTextInput } from "./hooks/use-text-input";
import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { filesizeUtils } from "./utils/filesize";

function Command({ initialText }: InitialInputProps) {
  const { text, searchText, onSearchTextChange } = useTextInput(initialText);
  const [results, setResults] = useState<{ title: string; subtitle: string }[]>([]);

  useEffect(() => {
    if (!text.trim()) return;

    const newResults: { title: string; subtitle: string }[] = [];

    // Try to parse as bytes
    if (/^\d+$/.test(text.trim())) {
      const human = filesizeUtils.bytesToHuman(text);
      newResults.push({ title: human, subtitle: "Bytes to Human Readable" });
    }

    // Try to parse as human readable
    const bytes = filesizeUtils.humanToBytes(text);
    if (!bytes.startsWith("Invalid")) {
      newResults.push({ title: bytes, subtitle: "Human Readable to Bytes" });
    }

    // Show both interpretations if ambiguous
    if (newResults.length === 0) {
      newResults.push(
        { title: filesizeUtils.bytesToHuman(text), subtitle: "As Bytes" },
        { title: filesizeUtils.humanToBytes(text), subtitle: "As Human Readable" },
      );
    }

    setResults(newResults);
  }, [text]);

  const handleAction = (result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, "File size conversion complete", result);
  };

  return (
    <List searchText={searchText} onSearchTextChange={onSearchTextChange}>
      {text.trim() === "" ? (
        <List.EmptyView title="Enter file size" description="Type bytes (1024) or human readable (1.5GB)" />
      ) : (
        results.map((result, index) => (
          <List.Item
            key={index}
            title={result.title}
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
