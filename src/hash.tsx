import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { hashUtils } from "./utils/encoding";
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

    const methods = ["md5", "sha1", "sha256"];
    const newResults = methods.map((method) => {
      try {
        const result = hashUtils[method as keyof typeof hashUtils](text);
        return { method: method.toUpperCase(), result };
      } catch {
        return { method: method.toUpperCase(), result: "Error hashing" };
      }
    });
    setResults(newResults);
  }, [text]);

  const handleHash = (method: string, result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, `${method} hash generated`, result);
  };

  return (
    <List searchText={text} onSearchTextChange={setText}>
      {text.trim() === "" ? (
        <List.EmptyView title="Enter text to hash" description="Type any text to see hash options" />
      ) : (
        results.map(({ method, result }) => (
          <List.Item
            key={method}
            title={result}
            subtitle={`${method} hash`}
            actions={
              <ActionPanel>
                <Action title="Copy" onAction={() => handleHash(method, result)} />
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