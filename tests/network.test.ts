import assert from "node:assert/strict";
import { test } from "node:test";
import { networkUtils } from "../src/utils/network.ts";

function primary(ip: string) {
  return {
    ip,
    success: true,
    country: "Australia",
    country_code: "AU",
    connection: { asn: 13335, isp: "Cloudflare, Inc.", org: "Cloudflare" },
    timezone: { id: "Australia/Brisbane" },
    latitude: 0,
    longitude: 0,
  };
}

function fallback(ip: string) {
  return { ip, country_name: "Australia", country_code: "AU", org: "Cloudflare", asn: "AS13335" };
}

test("valid IPv4 and compressed IPv6 are accepted, malformed addresses are rejected", () => {
  for (const ip of ["1.1.1.1", "2606:4700:4700::1111", "::1", "::ffff:192.0.2.1"]) {
    assert.equal(networkUtils.isValidIP(ip), true, ip);
  }
  for (const ip of ["999.1.1.1", "01.1.1.1", "example.com", "", "2606:::1"]) {
    assert.equal(networkUtils.isValidIP(ip), false, ip);
  }
});

test("rate limiting switches provider and returns usable fields without undefined values", async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    calls.push(url);
    return calls.length === 1 ? new Response("Rate limited", { status: 429 }) : Response.json(fallback("1.1.1.1"));
  });
  const info = await networkUtils.getIPInfo("1.1.1.1");
  assert.deepEqual(calls, ["https://ipwho.is/1.1.1.1", "https://ipapi.co/1.1.1.1/json/"]);
  assert.equal(info.source, "ipapi.co");
  assert.ok(info.fields.some(({ label, value }) => label === "ISP" && value === "Cloudflare"));
  assert.ok(info.fields.every(({ value }) => !/undefined|null/.test(value)));
});

test("API errors in HTTP 200 responses and incomplete responses trigger fallback", async (t) => {
  for (const [ip, body] of [
    ["1.1.1.2", { success: false, message: "Rate limit exceeded" }],
    ["1.1.1.3", { success: true, ip: "1.1.1.3" }],
  ] as const) {
    let calls = 0;
    const mock = t.mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json(calls === 1 ? body : fallback(ip));
    });
    assert.equal((await networkUtils.getIPInfo(ip)).source, "ipapi.co");
    assert.equal(calls, 2);
    mock.mock.restore();
  }
});

test("successful lookups cache for five minutes and preserve IPv6, ASN, and zero coordinates", async (t) => {
  const ip = "2606:4700:4700::1111";
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json(primary(ip)));
  const first = await networkUtils.getIPInfo(ip);
  assert.equal(first.source, "ipwho.is");
  assert.ok(first.fields.some(({ label, value }) => label === "Coordinates" && value === "0, 0"));
  assert.ok(first.fields.some(({ label, value }) => label === "ASN" && value === "AS13335"));
  assert.deepEqual(await networkUtils.getIPInfo(ip), first);
  assert.equal(fetchMock.mock.callCount(), 1);
  now += 5 * 60_000;
  await networkUtils.getIPInfo(ip);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("both-provider failure includes status and service reason and is not cached", async (t) => {
  const ip = "9.9.9.9";
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (calls === 1) return new Response("", { status: 429 });
    if (calls === 2) return Response.json({ error: true, reason: "Reserved IP Address" });
    return Response.json(primary(ip));
  });
  await assert.rejects(
    networkUtils.getIPInfo(ip),
    /ipwho\.is: Rate limited \(HTTP 429\); ipapi\.co: Reserved IP Address/,
  );
  assert.equal((await networkUtils.getIPInfo(ip)).source, "ipwho.is");
  assert.equal(calls, 3);
});

test("network and timeout failures remain actionable", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    if (++calls === 1) throw new TypeError("fetch failed", { cause: { code: "ENOTFOUND" } });
    throw new DOMException("Timed out", "TimeoutError");
  });
  await assert.rejects(networkUtils.getIPInfo("8.8.4.4"), /ENOTFOUND.*Request timed out after 5 seconds/);
});

test("leaving or editing aborts the active request without starting fallback", async (t) => {
  const controller = new AbortController();
  const fetchMock = t.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    const signal = options.signal!;
    return await new Promise<Response>((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  });
  const request = networkUtils.getIPInfo("8.8.8.8", controller.signal);
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("invalid input never makes a network request", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected request");
  });
  await assert.rejects(networkUtils.getIPInfo("not an IP"), /Invalid IP address/);
  assert.equal(fetchMock.mock.callCount(), 0);
});
