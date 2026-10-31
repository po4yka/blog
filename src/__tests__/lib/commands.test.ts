import { describe, expect, it, vi } from "vitest";
import { blogPostsMeta } from "@/data/blogMeta";
import { getAllCommands, getCommand, getCommandNames, parseLine, run, type CommandContext } from "@/lib/commands";
import { postPath } from "@/lib/blog/paths";

vi.mock("@/stores/settingsStore", () => ({ useSettingsStore: { getState: () => ({ setLocale: vi.fn() }) } }));
vi.mock("@/lib/themeTransition", () => ({ switchTheme: vi.fn() }));

await import("@/components/Terminal/commands/index");

const navigate = vi.fn();
const ctx = (locale = "en"): CommandContext => ({ history: [], navigate, getTheme: () => "dark", getLocale: () => locale });

describe("parseLine", () => {
  it("splits on runs of whitespace and lower-cases the name only", () => {
    expect(parseLine("  Open   Blog  ")).toEqual({ name: "open", args: ["Blog"] });
    expect(parseLine("   ")).toEqual({ name: "", args: [] });
  });
});

describe("run", () => {
  it("returns null for a blank line", () => {
    expect(run("  ", ctx())).toBeNull();
  });

  it("reports an unknown command", () => {
    expect(run("nope now", ctx())).toBe("shell: command not found: nope");
  });

  it("passes args to the command", () => {
    expect(run("echo  a   b", ctx())).toBe("a b");
  });

  it("returns the clear marker", () => {
    expect(run("clear", ctx())).toBe("__CLEAR__");
  });

  it("resolves every registered name", () => {
    expect(getCommandNames().length).toBeGreaterThan(10);
    for (const cmd of getAllCommands()) expect(getCommand(cmd.name)).toBe(cmd);
    for (const name of ["open", "lang", "copy", "jump", "theme", "help"]) expect(getCommand(name)).toBeDefined();
  });
});

describe("open", () => {
  it("navigates to a page", () => {
    navigate.mockClear();
    run("open projects", ctx());
    expect(navigate).toHaveBeenCalledWith("/projects");
  });

  it("opens an EN post and a RU-only post on the right path", () => {
    const en = blogPostsMeta.find((p) => (p.lang ?? "en") === "en")!;
    navigate.mockClear();
    run(`open ${en.slug}`, ctx("en"));
    expect(navigate).toHaveBeenCalledWith(`/blog/${en.slug}`);
  });

  it("reports a missing target", () => {
    expect(run("open zzz", ctx())).toContain("not found");
  });
});

describe("postPath", () => {
  const posts = [
    { slug: "both", lang: "en" },
    { slug: "both", lang: "ru" },
    { slug: "en-only", lang: "en" },
    { slug: "ru-only", lang: "ru" },
  ];

  it("keeps EN unless the locale is ru and a RU version exists", () => {
    expect(postPath(posts, "both", "en")).toBe("/blog/both");
    expect(postPath(posts, "both", "ru")).toBe("/blog/ru/both");
    expect(postPath(posts, "en-only", "ru")).toBe("/blog/en-only");
  });

  it("uses the RU page when it is the only version", () => {
    expect(postPath(posts, "ru-only", "en")).toBe("/blog/ru/ru-only");
  });

  it("returns null for an unknown slug", () => {
    expect(postPath(posts, "x", "en")).toBeNull();
  });
});

describe("lang, copy, jump", () => {
  it("rejects an invalid language", () => {
    expect(run("lang de", ctx())).toContain("invalid value");
  });

  it("shows usage for copy without email", () => {
    expect(run("copy phone", ctx())).toBe("copy: usage: copy email");
  });

  it("completes copy and lang arguments", () => {
    expect(getCommand("copy")!.completions!("e", [])).toEqual(["email"]);
    expect(getCommand("lang")!.completions!("r", [])).toEqual(["ru"]);
  });
});
