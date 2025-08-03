import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { datetimeUtils } from "./utils/datetime";
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
    if (!text.trim()) {
      // Show current time in multiple formats when no input
      const now = new Date();
      const isoString = datetimeUtils.now();
      const timestamp = datetimeUtils.dateToTimestamp(isoString);
      const localString = now.toLocaleString();
      const unixTimestamp = Math.floor(now.getTime() / 1000).toString();
      const dateString = now.toLocaleDateString();
      const timeString = now.toLocaleTimeString();
      
      setResults([
        { title: localString, subtitle: "Current Local Date/Time" },
        { title: isoString, subtitle: "Current ISO Date" },
        { title: timestamp, subtitle: "Current Timestamp (ms)" },
        { title: unixTimestamp, subtitle: "Current Unix Timestamp (s)" },
        { title: dateString, subtitle: "Current Date" },
        { title: timeString, subtitle: "Current Time" },
      ]);
      return;
    }

    const newResults: { title: string; subtitle: string }[] = [];

    // Try to parse as timestamp
    if (/^\d+$/.test(text.trim())) {
      const date = datetimeUtils.timestampToDate(text);
      newResults.push({ title: date, subtitle: "Timestamp to Date" });
    }

    // Try to parse as date
    const timestamp = datetimeUtils.dateToTimestamp(text);
    if (!timestamp.startsWith("Invalid")) {
      newResults.push({ title: timestamp, subtitle: "Date to Timestamp" });
    }

    // Show both interpretations if ambiguous
    if (newResults.length === 0) {
      newResults.push(
        { title: datetimeUtils.timestampToDate(text), subtitle: "As Timestamp" },
        { title: datetimeUtils.dateToTimestamp(text), subtitle: "As Date" },
      );
    }

    setResults(newResults);
  }, [text]);

  const handleAction = (result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, "Date/time conversion complete", result);
  };

  return (
    <List searchText={text} onSearchTextChange={setText}>
      {results.map((result, index) => (
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
      ))}
    </List>
  );
}
