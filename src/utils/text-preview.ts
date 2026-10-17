// Display budgets, not Raycast input limits. Full values never use this helper.
export const RESULT_PREVIEW_LENGTH = 256;
export const SEARCH_PREVIEW_LENGTH = 2_048;
// Measured on Raycast 2.8.2: the search field accepts 524,288 UTF-16 code units.
// Reaching the boundary cannot prove the original paste was complete.
export const SEARCH_INPUT_LIMIT = 524_288;
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

export function previewText(text: string, limit = RESULT_PREVIEW_LENGTH): { text: string; truncated: boolean } {
  let end = 0;
  let count = 0;
  let truncated = false;
  for (const { segment, index } of segmenter.segment(text)) {
    if (count === limit) {
      truncated = true;
      break;
    }
    end = index + segment.length;
    count++;
  }
  return {
    text:
      text
        .slice(0, end)
        .replace(/\r\n|[\r\n]/g, " ↵ ")
        .replace(/\t/g, " ⇥ ") + (truncated ? "…" : ""),
    truncated,
  };
}
