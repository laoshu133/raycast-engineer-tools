import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { filesizeUtils } from "./utils/filesize";

interface FileSizeFormValues {
  action: "bytesToHuman" | "humanToBytes";
  input: string;
}

export default function Command() {
  const [result, setResult] = useState<string>("");

  const handleAction = (values: FileSizeFormValues) => {
    try {
      let output = "";

      switch (values.action) {
        case "bytesToHuman":
          output = filesizeUtils.bytesToHuman(values.input);
          break;
        case "humanToBytes":
          output = filesizeUtils.humanToBytes(values.input);
          break;
      }

      setResult(output);
      Clipboard.copy(output);
      showToast(Toast.Style.Success, "File size conversion complete!");
    } catch (error) {
      showToast(Toast.Style.Failure, "Conversion failed", String(error));
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Convert" onSubmit={handleAction} />
          {result && (
            <>
              <Action.CopyToClipboard content={result} />
              <Action.Paste content={result} />
            </>
          )}
        </ActionPanel>
      }
    >
      <Form.Dropdown id="action" title="Action">
        <Form.Dropdown.Item value="bytesToHuman" title="Bytes to Human Readable" />
        <Form.Dropdown.Item value="humanToBytes" title="Human Readable to Bytes" />
      </Form.Dropdown>

      <Form.TextField
        id="input"
        title="Input"
        placeholder="Enter file size..."
        info="Examples: 1024, 1.5GB, 2MB, 500KB"
      />

      {result && <Form.Description title="Result" text={result} />}
    </Form>
  );
}
