import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { datetimeUtils } from "./utils/datetime";

interface DateTimeFormValues {
  action: "timestampToDate" | "dateToTimestamp" | "now";
  input: string;
}

export default function Command() {
  const [result, setResult] = useState<string>("");

  const handleAction = (values: DateTimeFormValues) => {
    try {
      let output = "";

      switch (values.action) {
        case "timestampToDate":
          output = datetimeUtils.timestampToDate(values.input);
          break;
        case "dateToTimestamp":
          output = datetimeUtils.dateToTimestamp(values.input);
          break;
        case "now":
          output = datetimeUtils.now();
          break;
      }

      setResult(output);
      Clipboard.copy(output);
      showToast(Toast.Style.Success, "Date/time conversion complete!");
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
        <Form.Dropdown.Item value="timestampToDate" title="Timestamp to Date" />
        <Form.Dropdown.Item value="dateToTimestamp" title="Date to Timestamp" />
        <Form.Dropdown.Item value="now" title="Current ISO Date" />
      </Form.Dropdown>

      <Form.TextField
        id="input"
        title="Input"
        placeholder="Enter timestamp or date..."
        info="Timestamp: 1609459200 or 1609459200000, Date: 2021-01-01T00:00:00.000Z"
      />

      {result && <Form.Description title="Result" text={result} />}
    </Form>
  );
}
