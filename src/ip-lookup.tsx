import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { networkUtils } from "./utils/network";
import { getSelectedText } from "@raycast/api";
import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

export default function Command() {
  const [text, setText] = useState<string>("");
  const [results, setResults] = useState<{ title: string; subtitle: string; details: string; ip?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [domainResults, setDomainResults] = useState<{ title: string; subtitle: string; ip: string }[]>([]);
  const [currentView, setCurrentView] = useState<"main" | "domain">("main");

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
      setDomainResults([]);
      setCurrentView("main");
      return;
    }

    const input = text.trim();

    // Check if input is an IP address
    if (networkUtils.isValidIP(input)) {
      setLoading(true);
      lookupIPInfo(input);
      return;
    }

    // Check if input is a domain name
    if (isValidDomain(input)) {
      setLoading(true);
      resolveDomain(input);
      return;
    }

    // Invalid format
    setResults([{ title: "Invalid format", subtitle: "Enter valid IP or domain name", details: "" }]);
  }, [text]);

  const isValidDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
    return domainRegex.test(domain) && domain.includes(".");
  };

  const lookupIPInfo = async (ip: string): Promise<void> => {
    try {
      const info = await networkUtils.getIPInfo(ip);
      if (info.startsWith("Error") || info.startsWith("Invalid")) {
        setResults([{ title: info, subtitle: "Lookup failed", details: "" }]);
      } else {
        const lines = info.split("\n");
        const results = lines.map((line) => {
          const [label, value] = line.split(": ");
          return {
            title: value || line,
            subtitle: label || "Info",
            details: info,
          };
        });
        setResults(results);
      }
    } catch (error) {
      setResults([{ title: "Lookup failed", subtitle: String(error), details: "" }]);
    } finally {
      setLoading(false);
    }
  };

  const resolveDomain = async (domain: string): Promise<void> => {
    try {
      const [ipv4Addresses, ipv6Addresses] = await Promise.allSettled([
        resolve4(domain).catch(() => []),
        resolve6(domain).catch(() => []),
      ]);

      const addresses = [
        ...(ipv4Addresses.status === "fulfilled" ? ipv4Addresses.value : []),
        ...(ipv6Addresses.status === "fulfilled" ? ipv6Addresses.value : []),
      ];

      if (addresses.length === 0) {
        setResults([{ title: "Domain not resolved", subtitle: "No IP addresses found", details: "" }]);
        setLoading(false);
        return;
      }

      // Store domain results for drill-down
      const domainResults = addresses.map((ip) => ({
        title: ip,
        subtitle: `Click to view details for ${ip}`,
        ip: ip,
      }));
      setDomainResults(domainResults);
      setCurrentView("domain");
    } catch (error) {
      setResults([{ title: "Domain resolution failed", subtitle: String(error), details: "" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainIPClick = async (ip: string) => {
    setLoading(true);
    setText(ip); // Update search text to show the IP
    await lookupIPInfo(ip);
    setCurrentView("main");
  };

  const handleAction = (result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, "IP info copied", result);
  };

  const getCurrentIP = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data: { ip: string } = await response.json();
      setText(data.ip);
    } catch (error) {
      showToast(Toast.Style.Failure, "Failed to get current IP", String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <List searchText={text} onSearchTextChange={setText} isLoading={loading}>
      {currentView === "domain" ? (
        <>
          <List.EmptyView title={`Domain: ${text}`} description="Select an IP address to view detailed information" />
          {domainResults.map((result, index) => (
            <List.Item
              key={index}
              title={result.title}
              subtitle={result.subtitle}
              actions={
                <ActionPanel>
                  <Action title="View Details" onAction={() => handleDomainIPClick(result.ip)} />
                  <Action title="Copy IP" onAction={() => handleAction(result.title)} />
                  <Action.Paste content={result.title} />
                </ActionPanel>
              }
            />
          ))}
        </>
      ) : (
        <>
          <List.EmptyView
            title="Enter IP address or domain"
            description="Type IPv4/IPv6 address or domain name to lookup"
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
                  <Action title="Copy" onAction={() => handleAction(result.title)} />
                  <Action.Paste content={result.title} />
                  <Action.CopyToClipboard content={result.details} />
                </ActionPanel>
              }
            />
          ))}
        </>
      )}
    </List>
  );
}
