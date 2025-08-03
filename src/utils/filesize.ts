export const filesizeUtils = {
  bytesToHuman: (bytes: string): string => {
    const b = parseInt(bytes);
    if (isNaN(b)) return "Invalid bytes";

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = b;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  humanToBytes: (sizeStr: string): string => {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([kmgtKMGT]?[bB]?)$/);
    if (!match) return "Invalid format";

    const [, num, unit] = match;
    const value = parseFloat(num);

    const multipliers = {
      b: 1,
      B: 1,
      k: 1024,
      K: 1024,
      kb: 1024,
      KB: 1024,
      m: 1024 ** 2,
      M: 1024 ** 2,
      mb: 1024 ** 2,
      MB: 1024 ** 2,
      g: 1024 ** 3,
      G: 1024 ** 3,
      gb: 1024 ** 3,
      GB: 1024 ** 3,
      t: 1024 ** 4,
      T: 1024 ** 4,
      tb: 1024 ** 4,
      TB: 1024 ** 4,
    };

    const multiplier = multipliers[unit.toLowerCase()] || 1;
    return Math.floor(value * multiplier).toString();
  },
};
