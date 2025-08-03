import { v4 as uuidv4 } from "uuid";

export const uuidUtils = {
  v4: (): string => uuidv4(),

  v7: (): string => {
    // Simple timestamp-based UUID v7-like implementation
    // This is a simplified version for compatibility
    const timestamp = Date.now();
    const uuid = uuidv4();

    // Replace first part with timestamp
    const timestampHex = timestamp.toString(16).padStart(12, "0");
    const parts = uuid.split("-");
    parts[0] = timestampHex.slice(-8); // Use last 8 chars of timestamp
    parts[1] = timestampHex.slice(0, 4) + Math.random().toString(16).slice(2, 6);

    return parts.join("-");
  },
};
