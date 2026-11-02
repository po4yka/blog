import { describe, expect, it } from "vitest";
import { stripMdxSyntax } from "@/lib/blog/mdx-text";

describe("stripMdxSyntax", () => {
  it("removes ESM lines and JSX components from the prose", () => {
    const source = [
      'import BlogFigure from "../BlogFigure.astro";',
      "export const meta = { a: 1 };",
      "",
      "Intro.",
      "",
      "<BlogFigure src={figures.a} />",
      "",
      "<Callout kind=\"note\">Inside.</Callout>",
    ].join("\n");
    expect(stripMdxSyntax(source)).toBe("Intro.\n\nInside.");
  });

  it("keeps generics and import lines inside fenced code", () => {
    const code = ["```kotlin", "import kotlinx.coroutines.flow.Flow", "", "val x: Flow<String> = flow {}", "fun <T> List<T>.head() = first()", "```"].join("\n");
    expect(stripMdxSyntax(`Text.\n\n${code}`)).toBe(`Text.\n\n${code}`);
  });

  it("keeps code in a fence indented inside a list item", () => {
    const source = ["1. Step:", "", "   ```kotlin", "   import a.B", "   val x: List<B> = emptyList()", "   ```"].join("\n");
    expect(stripMdxSyntax(source)).toBe(source);
  });

  it("does not let a stray backtick shield JSX in later paragraphs", () => {
    expect(stripMdxSyntax("A lone ` here.\n\n<Callout>Note.</Callout> and `code`.")).toBe("A lone ` here.\n\nNote. and `code`.");
  });

  it("keeps generics inside inline code", () => {
    expect(stripMdxSyntax("Return a `Flow<String>` or ``List<T>``.")).toBe("Return a `Flow<String>` or ``List<T>``.");
  });
});
