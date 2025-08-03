import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { filesizeUtils } from "./utils/filesize";
import { getSelectedText } from "@raycast/api";

export default function Command() {
  const [text, setText] = useState<string>("");
  const [results, setResults] = useState<{ title: string; subtitle: string }[]>([]);

  useEffect(() => {
    async function getText() {
      try {
        const selectedText = await getSelectedText();
        setText(selectedText);
      } catch {
        setText("");
      }
    }
    getText();
  }, []);

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
    <List searchText={text} onSearchTextChange={setText}>
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
