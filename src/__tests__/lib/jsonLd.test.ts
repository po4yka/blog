import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/jsonLd";

describe("serializeJsonLd", () => {
  it("escapes '<' so a string cannot close the script element", () => {
    const out = serializeJsonLd({ headline: "a</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ headline: "a</script><script>alert(1)</script>" });
  });
});
