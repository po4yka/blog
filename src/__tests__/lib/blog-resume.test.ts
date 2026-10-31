import { describe, expect, it } from "vitest";
import { parseResume, resumeAction, resumeKey, resumeScrollTop } from "@/lib/blog/resume";

describe("resumeKey", () => {
  it("is namespaced by language and slug", () => {
    expect(resumeKey("ru", "a")).toBe("read:ru/a");
  });
});

describe("parseResume", () => {
  it("accepts 5 to 95 inclusive", () => {
    expect(parseResume("5")).toBe(5);
    expect(parseResume("95")).toBe(95);
    expect(parseResume("42.5")).toBe(42.5);
  });

  it("rejects out-of-range, non-numeric and missing values", () => {
    for (const raw of ["4", "96", "abc", null, ""]) expect(parseResume(raw)).toBeNull();
  });
});

describe("resumeAction", () => {
  it("saves inside the range, clears past the end, ignores the start", () => {
    expect(resumeAction(4)).toBe("none");
    expect(resumeAction(5)).toBe("save");
    expect(resumeAction(95)).toBe("save");
    expect(resumeAction(96)).toBe("clear");
    expect(resumeAction(100)).toBe("clear");
  });
});

describe("resumeScrollTop", () => {
  it("maps a percent to a scroll offset", () => {
    expect(resumeScrollTop(50, 2000, 1000)).toBe(500);
  });

  it("is not clamped: a viewport taller than the page gives a negative offset (current behaviour)", () => {
    expect(resumeScrollTop(50, 800, 1000)).toBe(-100);
  });
});
