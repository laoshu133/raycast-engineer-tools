import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { typeidUtils } from "./utils/typeid";

interface TypeIDFormValues {
  action: "encode" | "decode";
  prefix: string;
  uuid: string;
  typeid: string;
}

export default function Command() {
  const [result, setResult] = useState<string>("");

  const handleAction = (values: TypeIDFormValues) => {
    try {
      let output = "";
      if (values.action === "encode") {
        output = typeidUtils.encode(values.prefix, values.uuid || undefined);
      } else {
        output = typeidUtils.decode(values.typeid);
      }

      setResult(output);
      Clipboard.copy(output);
      showToast(Toast.Style.Success, `${values.action === "encode" ? "Encoded" : "Decoded"} and copied to clipboard!`);
    } catch (error) {
      showToast(Toast.Style.Failure, "TypeID operation failed", String(error));
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Execute" onSubmit={handleAction} />
          {result && (
            <>
              <Action.CopyToClipboard content={result} />
              <Action.Paste content={result} />
            </>
          )}
        </ActionPanel>
      }
    >
      <Form.Dropdown id="action" title="Action Type">
        <Form.Dropdown.Item value="encode" title="Encode" />
        <Form.Dropdown.Item value="decode" title="Decode" />
      </Form.Dropdown>

      <Form.TextField id="prefix" title="Prefix (for encoding)" placeholder="e.g., user, order" />
      <Form.TextField id="uuid" title="UUID (for encoding)" placeholder="UUID to encode" />
      <Form.TextField id="typeid" title="TypeID (for decoding)" placeholder="e.g., user_01H4K8Z9JFV4ZQ3Q2M0N8P1K2L" />

      {result && <Form.Description title="Result" text={result} />}
    </Form>
  );
}
