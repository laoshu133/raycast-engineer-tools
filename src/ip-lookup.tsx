import { withClipboardInput, type InitialInputProps } from "./components/with-clipboard-input";
import { readClipboardText } from "./utils/clipboard";
import { useTextInput } from "./hooks/use-text-input";
import { Action, ActionPanel, List, showToast, Toast, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { networkUtils } from "./utils/network";
import dns from "node:dns";
import { promisify } from "node:util";

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
  return domainRegex.test(domain) && domain.includes(".");
}

function Command({ initialText }: InitialInputProps) {
  const { text, searchText, setInput, onSearchTextChange, revision } = useTextInput(initialText);
  const [results, setResults] = useState<{ title: string; subtitle: string; details: string; ip?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [domainResults, setDomainResults] = useState<{ title: string; subtitle: string; ip: string }[]>([]);
  const [currentView, setCurrentView] = useState<"main" | "domain">("main");

  useEffect(() => {
    let active = true;
    const isCurrent = () => active;
    setResults([]);
    setDomainResults([]);
    setCurrentView("main");
    setLoading(false);
    const input = text.trim();
    if (!input) return;

    const isIP = networkUtils.isValidIP(input);
    if (!isIP && !isValidDomain(input)) {
      setResults([{ title: "Invalid format", subtitle: "Enter valid IP or domain name", details: "" }]);
      return;
    }

    setLoading(true);
    // Debounce typing and cancel effect replays before issuing a request.
    const timer = setTimeout(() => {
      if (isIP) lookupIPInfo(input, isCurrent);
      else resolveDomain(input, isCurrent);
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text]);

  const lookupIPInfo = async (ip: string, isCurrent: () => boolean): Promise<void> => {
    try {
      const info = await networkUtils.getIPInfo(ip);
      if (!isCurrent()) return;
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
      if (isCurrent()) setResults([{ title: "Lookup failed", subtitle: String(error), details: "" }]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  const resolveDomain = async (domain: string, isCurrent: () => boolean): Promise<void> => {
    try {
      const [ipv4Addresses, ipv6Addresses] = await Promise.allSettled([
        resolve4(domain).catch(() => []),
        resolve6(domain).catch(() => []),
      ]);

      if (!isCurrent()) return;
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
      if (isCurrent()) setResults([{ title: "Domain resolution failed", subtitle: String(error), details: "" }]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  const handleDomainIPClick = (ip: string) => {
    setInput(ip, true);
  };

  const handleAction = (result: string) => {
    Clipboard.copy(result);
    showToast(Toast.Style.Success, "IP info copied", result);
  };

  const getCurrentIP = async () => {
    const requestRevision = ++revision.current;
    setLoading(true);
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = (await response.json()) as { ip: string };
      if (revision.current === requestRevision) setInput(data.ip, true);
    } catch (error) {
      if (revision.current === requestRevision)
        showToast(Toast.Style.Failure, "Failed to get current IP", String(error));
    } finally {
      if (revision.current === requestRevision) setLoading(false);
    }
  };

  return (
    <List
      filtering={false}
      searchText={searchText}
      onSearchTextChange={onSearchTextChange}
      searchBarPlaceholder="Enter an IP address or domain"
      isLoading={loading}
    >
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

export default withClipboardInput(Command, readClipboardText);
