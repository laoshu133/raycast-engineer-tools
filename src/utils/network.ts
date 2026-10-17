import { isIP } from "node:net";

type Field = { label: string; value: string };
export type IPInfo = { fields: Field[]; source: string };
type Data = Record<string, unknown>;

const cache = new Map<string, { info: IPInfo; expires: number }>();
const CACHE_TTL = 5 * 60_000;
const REQUEST_TIMEOUT = 5_000;

function record(value: unknown): Data {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Data) : {};
}

function value(input: unknown): string {
  return typeof input === "string" || typeof input === "number" ? String(input) : "";
}

function named(name: unknown, code: unknown): string {
  const label = value(name);
  const abbreviation = value(code);
  return label && abbreviation ? `${label} (${abbreviation})` : label || abbreviation;
}

function fields(entries: [string, unknown][]): Field[] {
  return entries.flatMap(([label, input]) => {
    const text = value(input);
    return text ? [{ label, value: text }] : [];
  });
}

function coordinates(data: Data): string {
  return typeof data.latitude === "number" && typeof data.longitude === "number"
    ? `${data.latitude}, ${data.longitude}`
    : "";
}

const providers = [
  {
    name: "ipwho.is",
    url: (ip: string) => `https://ipwho.is/${encodeURIComponent(ip)}`,
    parse(data: Data): Field[] {
      if (data.success !== true) throw new Error(value(data.message) || "Service rejected the lookup");
      const connection = record(data.connection);
      const timezone = record(data.timezone);
      return fields([
        ["IP", data.ip],
        ["Country", named(data.country, data.country_code)],
        ["Region", named(data.region, data.region_code)],
        ["City", data.city],
        ["Postal", data.postal],
        ["ISP", connection.isp],
        ["Organization", connection.org],
        ["ASN", connection.asn == null ? "" : `AS${value(connection.asn)}`],
        ["Timezone", timezone.id],
        ["Coordinates", coordinates(data)],
        ["Calling Code", data.calling_code],
      ]);
    },
  },
  {
    name: "ipapi.co",
    url: (ip: string) => `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
    parse(data: Data): Field[] {
      if (data.error) throw new Error(value(data.reason) || value(data.message) || "Service rejected the lookup");
      return fields([
        ["IP", data.ip],
        ["Country", named(data.country_name, data.country_code)],
        ["Region", named(data.region, data.region_code)],
        ["City", data.city],
        ["Postal", data.postal],
        ["ISP", data.org],
        ["ASN", data.asn],
        ["Timezone", data.timezone],
        ["Coordinates", coordinates(data)],
        ["Currency", named(data.currency_name, data.currency)],
        ["Languages", data.languages],
        ["Calling Code", data.country_calling_code],
      ]);
    },
  },
];

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError") return "Request timed out after 5 seconds";
    // Node fetch often puts useful DNS/TLS/connect errors in cause.
    const cause = record(error.cause);
    const detail = value(cause.code) || value(cause.message);
    return detail ? `${error.message} (${detail})` : error.message;
  }
  return String(error);
}

async function getIPInfo(ip: string, signal?: AbortSignal): Promise<IPInfo> {
  if (!isIP(ip)) throw new Error("Invalid IP address");
  signal?.throwIfAborted();
  const cached = cache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.info;
  cache.delete(ip);

  const errors: string[] = [];
  for (const provider of providers) {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(provider.url(ip), { signal: requestSignal });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(response.status === 429 ? "Rate limited (HTTP 429)" : `HTTP ${response.status}`);
      }
      const data = record(await response.json());
      signal?.throwIfAborted();
      const result = provider.parse(data);
      if (!isIP(value(data.ip)) || !result.some((field) => field.label === "Country")) {
        throw new Error("Service returned incomplete IP information");
      }
      const info = { fields: result, source: provider.name };
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(ip, { info, expires: Date.now() + CACHE_TTL });
      return info;
    } catch (error) {
      signal?.throwIfAborted();
      errors.push(`${provider.name}: ${errorMessage(error)}`);
    }
  }
  throw new Error(errors.join("; "));
}

export const networkUtils = {
  isValidIP: (ip: string): boolean => isIP(ip) !== 0,
  getIPInfo,
};
