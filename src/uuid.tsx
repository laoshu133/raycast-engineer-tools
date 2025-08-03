import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { uuidUtils } from "./utils/uuid";

export default function Command() {
  const [results, setResults] = useState<{ title: string; uuid: string; type: string }[]>([]);

  const generateUUID = (type: "v4" | "v7", count: number = 1) => {
    const uuids = Array.from({ length: count }, (_, i) => ({
      id: `${type}-${i}`,
      title: type === "v4" ? uuidUtils.v4() : uuidUtils.v7(),
      uuid: type === "v4" ? uuidUtils.v4() : uuidUtils.v7(),
      type: type.toUpperCase()
    }));

    setResults(uuids);
    
    if (count === 1) {
      Clipboard.copy(uuids[0].uuid);
      showToast(Toast.Style.Success, `${type.toUpperCase()} UUID generated`, uuids[0].uuid);
    } else {
      const allUUIDs = uuids.map(u => u.uuid).join('\n');
      Clipboard.copy(allUUIDs);
      showToast(Toast.Style.Success, `${count} ${type.toUpperCase()} UUIDs generated`, allUUIDs);
    }
  };

  const copyUUID = (uuid: string) => {
    Clipboard.copy(uuid);
    showToast(Toast.Style.Success, "UUID copied", uuid);
  };

  return (
    <List>
      <List.Section title="Generate Single UUID">
        <List.Item
          title="Generate UUID v4"
          subtitle="Random UUID"
          actions={
            <ActionPanel>
              <Action title="Generate v4" onAction={() => generateUUID("v4")} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Generate UUID v7"
          subtitle="Timestamp-sorted UUID"
          actions={
            <ActionPanel>
              <Action title="Generate v7" onAction={() => generateUUID("v7")} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Generate Multiple UUIDs">
        {[5, 10, 20, 50].map(count => (
          <List.Item
            key={`v4-${count}`}
            title={`Generate ${count} UUID v4`}
            actions={
              <ActionPanel>
                <Action title="Generate" onAction={() => generateUUID("v4", count)} />
              </ActionPanel>
            }
          />
        ))}
        {[5, 10, 20, 50].map(count => (
          <List.Item
            key={`v7-${count}`}
            title={`Generate ${count} UUID v7`}
            actions={
              <ActionPanel>
                <Action title="Generate" onAction={() => generateUUID("v7", count)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      {results.length > 0 && (
        <List.Section title="Generated UUIDs">
          {results.map((item) => (
            <List.Item
              key={item.id}
              title={item.uuid}
              subtitle={`${item.type} UUID`}
              actions={
                <ActionPanel>
                  <Action title="Copy" onAction={() => copyUUID(item.uuid)} />
                  <Action.Paste content={item.uuid} />
                  <Action.CopyToClipboard content={item.uuid} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}