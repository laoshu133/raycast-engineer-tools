import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { uuidUtils } from "./utils/uuid";

export default function Command() {
  const [generating, setGenerating] = useState(false);

  const generateUUIDv4 = () => {
    const uuid = uuidUtils.v4();
    Clipboard.copy(uuid);
    showToast(Toast.Style.Success, "UUID v4 generated and copied!", uuid);
  };

  const generateUUIDv7 = () => {
    const uuid = uuidUtils.v7();
    Clipboard.copy(uuid);
    showToast(Toast.Style.Success, "UUID v7 generated and copied!", uuid);
  };

  const generateMultiple = (count: number) => {
    setGenerating(true);
    const uuids = Array.from({ length: count }, (_, i) => ({
      id: i.toString(),
      title: uuidUtils.v4(),
      type: "v4",
    }));

    // Copy all UUIDs separated by newlines
    const allUUIDs = uuids.map((u) => u.title).join("\n");
    Clipboard.copy(allUUIDs);
    showToast(Toast.Style.Success, `${count} UUIDs generated and copied!`);
    setGenerating(false);
  };

  return (
    <List isLoading={generating}>
      <List.Section title="Single UUID">
        <List.Item
          title="Generate UUID v4"
          subtitle="Random UUID"
          actions={
            <ActionPanel>
              <Action title="Generate V4" onAction={generateUUIDv4} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Generate UUID v7"
          subtitle="Time-sorted UUID"
          actions={
            <ActionPanel>
              <Action title="Generate V7" onAction={generateUUIDv7} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Batch Generate">
        {[5, 10, 20, 50].map((count) => (
          <List.Item
            key={count}
            title={`Generate ${count} UUIDs`}
            subtitle={`Create ${count} UUID v4 strings`}
            actions={
              <ActionPanel>
                <Action title="Generate" onAction={() => generateMultiple(count)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
