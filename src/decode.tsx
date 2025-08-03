import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { decodeUtils } from "./utils/encoding";
import { getSelectedText } from "@raycast/api";

export default function Command() {
  const [text, setText] = useState<string>("");
  const [results, setResults] = useState<{ method: string; result: string }[]>([]);

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

    const methods = ["url", "base64", "hex", "unicode"];
    const newResults = methods.map((method) => {
      try {
        const result = decodeUtils[method as keyof typeof decodeUtils](text);
        // Skip if result is an error message
        if (result.includes("Invalid") || result.includes("Error")) {
          return null;
        }
        return { method: method.toUpperCase(), result };
      } catch {
        return null;
      }
    }).filter(Boolean) as { method: string; result: string }[];
    setResults(newResults);
  }, [text]);

  const handleDecode = (method: string, result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, `${method} decoded`, result);
  };

  return (
    <List searchText={text} onSearchTextChange={setText}>
      {text.trim() === "" ? (
        <List.EmptyView title="Enter text to decode" description="Type any text to see decoding options" />
      ) : results.length === 0 ? (
        <List.EmptyView title="No valid decoding" description="Text cannot be decoded with available methods" />
      ) : (
        results.map(({ method, result }) => (
          <List.Item
            key={method}
            title={result}
            subtitle={`${method} decoding`}
            actions={
              <ActionPanel>
                <Action title="Copy" onAction={() => handleDecode(method, result)} />
                <Action.Paste content={result} />
                <Action.CopyToClipboard content={result} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}