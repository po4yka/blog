import { describe, it, expect } from "vitest";
import { pluralize } from "@/lib/plural";

const forms = { en: ["release", "releases"] as [string, string], ru: ["релиз", "релиза", "релизов"] as [string, string, string] };

describe("pluralize", () => {
  it("english singular and plural", () => {
    expect(pluralize(1, "en", forms)).toBe("1 release");
    expect(pluralize(3, "en", forms)).toBe("3 releases");
  });

  it("russian forms by last digit with the 11-14 exception", () => {
    expect(pluralize(1, "ru", forms)).toBe("1 релиз");
    expect(pluralize(2, "ru", forms)).toBe("2 релиза");
    expect(pluralize(5, "ru", forms)).toBe("5 релизов");
    expect(pluralize(11, "ru", forms)).toBe("11 релизов");
    expect(pluralize(14, "ru", forms)).toBe("14 релизов");
    expect(pluralize(21, "ru", forms)).toBe("21 релиз");
    expect(pluralize(24, "ru", forms)).toBe("24 релиза");
    expect(pluralize(111, "ru", forms)).toBe("111 релизов");
  });
});
