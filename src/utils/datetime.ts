export const datetimeUtils = {
  timestampToDate: (timestamp: string): string => {
    const ts = parseInt(timestamp);
    if (isNaN(ts)) return "Invalid timestamp";

    // Handle different timestamp units
    let date: Date;
    if (timestamp.length <= 10) {
      // Unix timestamp (seconds)
      date = new Date(ts * 1000);
    } else {
      // Milliseconds
      date = new Date(ts);
    }

    return date.toISOString();
  },

  dateToTimestamp: (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.getTime().toString();
  },

  now: (): string => {
    return new Date().toISOString();
  },
};
