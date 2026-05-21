import DOMPurify from "dompurify";

/** Browser-safe HTML sanitization for rich text (replaces sanitize-html). */
export function sanitizeRichTextHtml(html) {
  if (html == null || html === "") return "";
  return DOMPurify.sanitize(String(html), {
    USE_PROFILES: { html: true },
  });
}
