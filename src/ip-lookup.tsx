import { Action, ActionPanel, Form, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { networkUtils } from "./utils/network";

export default function Command() {
  const [ipInfo, setIpInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const lookupIP = async (ip: string) => {
    if (!ip.trim()) {
      showToast(Toast.Style.Failure, "Please enter an IP address");
      return;
    }

    setLoading(true);
    try {
      const info = await networkUtils.getIPInfo(ip.trim());
      setIpInfo(info);

      if (!info.startsWith("Invalid") && !info.startsWith("Failed")) {
        Clipboard.copy(info);
        showToast(Toast.Style.Success, "IP information copied to clipboard");
      }
    } catch (error) {
      showToast(Toast.Style.Failure, "Lookup failed", String(error));
    } finally {
      setLoading(false);
    }
  };

  const getCurrentIP = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      const info = await networkUtils.getIPInfo(data.ip);
      setIpInfo(info);

      if (!info.startsWith("Invalid") && !info.startsWith("Failed")) {
        Clipboard.copy(info);
        showToast(Toast.Style.Success, "Current IP information copied to clipboard");
      }
    } catch (error) {
      showToast(Toast.Style.Failure, "Failed to get current IP", String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Lookup IP" onSubmit={(values) => lookupIP(values.ip)} />
          <Action title="Get Current IP" onAction={getCurrentIP} />
          {ipInfo && !ipInfo.startsWith("Invalid") && !ipInfo.startsWith("Failed") && (
            <>
              <Action.CopyToClipboard content={ipInfo} />
              <Action.Paste content={ipInfo} />
            </>
          )}
        </ActionPanel>
      }
    >
      <Form.TextField
        id="ip"
        title="IP Address"
        placeholder="Enter IP address..."
        info="Enter IPv4 or IPv6 address to lookup"
      />

      {ipInfo && <Form.Description title="IP Information" text={ipInfo} />}
    </Form>
  );
}
