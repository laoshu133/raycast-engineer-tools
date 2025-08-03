import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { encodeUtils } from "./utils/encoding";

interface EncodeFormValues {
  text: string;
  method: "url" | "base64" | "hex";
}

export default function Command() {
  const [result, setResult] = useState<string>("");

  const handleEncode = (values: EncodeFormValues) => {
    try {
      const encoded = encodeUtils[values.method](values.text);
      setResult(encoded);
      Clipboard.copy(encoded);
      showToast(Toast.Style.Success, "Encoded and copied to clipboard!");
    } catch (error) {
      showToast(Toast.Style.Failure, "Encoding failed", String(error));
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Encode" onSubmit={handleEncode} />
          {result && (
            <>
              <Action.CopyToClipboard content={result} />
              <Action.Paste content={result} />
            </>
          )}
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title="Text to Encode" placeholder="Enter text to encode..." />
      <Form.Dropdown id="method" title="Encoding Method">
        <Form.Dropdown.Item value="url" title="URL Encode" />
        <Form.Dropdown.Item value="base64" title="Base64" />
        <Form.Dropdown.Item value="hex" title="Hex" />
      </Form.Dropdown>

      {result && <Form.Description title="Result" text={result} />}
    </Form>
  );
}
