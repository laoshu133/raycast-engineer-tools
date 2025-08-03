import { uuidUtils } from "./uuid";

export const typeidUtils = {
  encode: (prefix: string, uuid?: string): string => {
    const targetUuid = uuid || uuidUtils.v7();

    // Simple TypeID implementation based on UUID
    const cleanUuid = targetUuid.replace(/-/g, "");
    const encoded = Buffer.from(cleanUuid, "hex").toString("base64url");
    return `${prefix}_${encoded}`;
  },

  decode: (typeid: string): string => {
    const [, encoded] = typeid.split("_");
    if (!encoded) return "Invalid TypeID format";

    try {
      const decoded = Buffer.from(encoded, "base64url").toString("hex");
      // Format as UUID (ensure proper length)
      if (decoded.length !== 32) return "Invalid TypeID length";
      return `${decoded.slice(0, 8)}-${decoded.slice(8, 12)}-${decoded.slice(12, 16)}-${decoded.slice(16, 20)}-${decoded.slice(20)}`;
    } catch {
      return "Invalid TypeID";
    }
  },
};
