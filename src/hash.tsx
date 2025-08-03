import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { hashUtils } from "./utils/encoding";

interface HashFormValues {
  text: string;
  method: "md5" | "sha1" | "sha256";
}

export default function Command() {
  const [result, setResult] = useState<string>("");

  const handleHash = (values: HashFormValues) => {
    try {
      const hashed = hashUtils[values.method](values.text);
      setResult(hashed);
      Clipboard.copy(hashed);
      showToast(Toast.Style.Success, "Hash generated and copied!");
    } catch (error) {
      showToast(Toast.Style.Failure, "Hash generation failed", String(error));
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Hash" onSubmit={handleHash} />
          {result && (
            <>
              <Action.CopyToClipboard content={result} />
              <Action.Paste content={result} />
            </>
          )}
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title="Text to Hash" placeholder="Enter text to hash..." />

      <Form.Dropdown id="method" title="Hash Method">
        <Form.Dropdown.Item value="md5" title="MD5" />
        <Form.Dropdown.Item value="sha1" title="SHA1" />
        <Form.Dropdown.Item value="sha256" title="SHA256" />
      </Form.Dropdown>

      {result && <Form.Description title="Result" text={result} />}
    </Form>
  );
}
