import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { networkUtils } from "./utils/network";
import { getSelectedText } from "@raycast/api";

export default function Command() {
  const [text, setText] = useState<string>("");
  const [results, setResults] = useState<{ title: string; subtitle: string; details: string }[]>([]);
  const [loading, setLoading] = useState(false);

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
      setResults([]);
      return;
    }

    const ip = text.trim();
    if (!networkUtils.isValidIP(ip)) {
      setResults([
        { title: "Invalid IP format", subtitle: "Enter valid IPv4 or IPv6", details: "" }
      ]);
      return;
    }

    setLoading(true);
    networkUtils.getIPInfo(ip).then(info => {
      if (info.startsWith("Error") || info.startsWith("Invalid")) {
        setResults([
          { title: info, subtitle: "Lookup failed", details: "" }
        ]);
      } else {
        const lines = info.split('\n');
        const results = lines.map(line => {
          const [label, value] = line.split(': ');
          return {
            title: value || line,
            subtitle: label || "Info",
            details: info
          };
        });
        setResults(results);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [text]);

  const handleAction = (result: string, details: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, "IP info copied", result);
  };

  const getCurrentIP = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setText(data.ip);
    } catch (error) {
      showToast(Toast.Style.Failure, "Failed to get current IP", String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <List searchText={text} onSearchTextChange={setText} isLoading={loading}>
      <List.EmptyView
        title="Enter IP address"
        description="Type IPv4/IPv6 address to lookup"
        actions={
          <ActionPanel>
            <Action title="Get Current IP" onAction={getCurrentIP} />
          </ActionPanel>
        }
      />
      {results.map((result, index) => (
        <List.Item
          key={index}
          title={result.title}
          subtitle={result.subtitle}
          actions={
            <ActionPanel>
              <Action title="Copy" onAction={() => handleAction(result.title, result.details)} />
              <Action.Paste content={result.title} />
              <Action.CopyToClipboard content={result.details} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}