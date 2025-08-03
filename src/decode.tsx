import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { decodeUtils } from "./utils/encoding";

interface DecodeFormValues {
  text: string;
  method: "url" | "base64" | "hex" | "unicode";
}

export default function Command() {
  const [result, setResult] = useState<string>("");

  const handleDecode = (values: DecodeFormValues) => {
    try {
      const decoded = decodeUtils[values.method](values.text);
      setResult(decoded);
      Clipboard.copy(decoded);
      showToast(Toast.Style.Success, "Decoded and copied to clipboard!");
    } catch (error) {
      showToast(Toast.Style.Failure, "Decoding failed", String(error));
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Decode" onSubmit={handleDecode} />
          {result && (
            <>
              <Action.CopyToClipboard content={result} />
              <Action.Paste content={result} />
            </>
          )}
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title="Text to Decode" placeholder="Enter text to decode..." />

      <Form.Dropdown id="method" title="Decoding Method">
        <Form.Dropdown.Item value="url" title="URL Decode" />
        <Form.Dropdown.Item value="base64" title="Base64" />
        <Form.Dropdown.Item value="hex" title="Hex" />
        <Form.Dropdown.Item value="unicode" title="Unicode" />
      </Form.Dropdown>

      {result && <Form.Description title="Result" text={result} />}
    </Form>
  );
}
