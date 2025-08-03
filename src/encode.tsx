import { Action, ActionPanel, List, showToast, Toast, Clipboard, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";
import { encodeUtils } from "./utils/encoding";
import { getSelectedText } from "@raycast/api";

interface Preferences {
  defaultMethod: string;
}

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

    const methods = ["url", "base64", "hex"];
    const newResults = methods.map((method) => {
      try {
        const result = encodeUtils[method as keyof typeof encodeUtils](text);
        return { method: method.toUpperCase(), result };
      } catch {
        return { method: method.toUpperCase(), result: "Error encoding" };
      }
    });
    setResults(newResults);
  }, [text]);

  const handleEncode = (method: string, result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, `${method} encoded`, result);
  };

  return (
    <List searchText={text} onSearchTextChange={setText}>
      {text.trim() === "" ? (
        <List.EmptyView title="Enter text to encode" description="Type any text to see encoding options" />
      ) : (
        results.map(({ method, result }) => (
          <List.Item
            key={method}
            title={result}
            subtitle={`${method} encoding`}
            actions={
              <ActionPanel>
                <Action title="Copy" onAction={() => handleEncode(method, result)} />
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