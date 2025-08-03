
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
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();

      if (data.status === "success") {
        return [
          `IP: ${data.query}`,
          `Country: ${data.country}`,
          `Region: ${data.regionName}`,
          `City: ${data.city}`,
          `ISP: ${data.isp}`,
          `Organization: ${data.org}`,
          `Timezone: ${data.timezone}`,
          `Latitude: ${data.lat}`,
          `Longitude: ${data.lon}`,
        ].join("\n");
      } else {
        return `Error: ${data.message}`;
      }
    } catch (error) {
      return `Failed to fetch IP info: ${error}`;
    }
  },
};
