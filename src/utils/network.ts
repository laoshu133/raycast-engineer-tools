export const networkUtils = {
  isValidIP: (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  },

  getIPInfo: async (ip: string): Promise<string> => {
    if (!networkUtils.isValidIP(ip)) {
      return "Invalid IP address";
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      interface IpApiCoResponse {
        ip: string;
        city: string;
        region: string;
        region_code: string;
        country: string;
        country_name: string;
        country_code: string;
        continent_code: string;
        postal: string;
        latitude: number;
        longitude: number;
        timezone: string;
        utc_offset: string;
        country_calling_code: string;
        currency: string;
        currency_name: string;
        languages: string;
        asn: string;
        org: string;
      }

      const data = (await response.json()) as IpApiCoResponse;

      return [
        `IP: ${data.ip}`,
        `Country: ${data.country_name} (${data.country_code})`,
        `Region: ${data.region} (${data.region_code})`,
        `City: ${data.city}`,
        `Postal: ${data.postal}`,
        `ISP: ${data.org}`,
        `ASN: ${data.asn}`,
        `Timezone: ${data.timezone}`,
        `Coordinates: ${data.latitude}, ${data.longitude}`,
        `Currency: ${data.currency_name} (${data.currency})`,
        `Languages: ${data.languages}`,
        `Calling Code: ${data.country_calling_code}`,
      ].join("\n");
    } catch (error) {
      return `Failed to fetch IP info: ${error}`;
    }
  },
};
