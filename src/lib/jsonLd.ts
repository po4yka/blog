/**
 * Serialize a JSON-LD node for an inline `<script type="application/ld+json">`.
 * "<" becomes "<" (still valid JSON), so a title or tag that contains
 * "</script>" cannot close the script element.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
