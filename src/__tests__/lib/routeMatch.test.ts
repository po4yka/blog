import { describe, expect, it } from "vitest";
import { closestRoutes, dice, type KnownRoute } from "@/lib/routeMatch";

const routes: KnownRoute[] = [
  { href: "/", label: "/", kind: "page" },
  { href: "/projects/", label: "/projects/", kind: "page" },
  { href: "/experience/", label: "/experience/", kind: "page" },
  { href: "/blog/", label: "/blog/", kind: "page" },
  { href: "/changelog/", label: "/changelog/", kind: "page" },
  { href: "/blog/rag-breaks-earlier-than-people-think/", label: "RAG breaks earlier", kind: "post", lang: "en" },
  { href: "/blog/network-isnt-broken-just-here/", label: "The Network", kind: "post", lang: "en" },
  { href: "/blog/ru/network-isnt-broken-just-here/", label: "Сеть", kind: "post", lang: "ru" },
  { href: "/projects/#ratatoskr", label: "Ratatoskr", kind: "project" },
];
const hrefs = (path: string) => closestRoutes(path, routes).map((r) => r.href);

describe("closestRoutes", () => {
  it("finds a post from a truncated or misspelt slug", () => {
    expect(hrefs("/blog/rag-breaks")[0]).toBe("/blog/rag-breaks-earlier-than-people-think/");
    expect(hrefs("/blog/netwrok-isnt-broken")[0]).toBe("/blog/network-isnt-broken-just-here/");
  });

  it("prefers the language the path asks for", () => {
    expect(hrefs("/blog/ru/network")[0]).toBe("/blog/ru/network-isnt-broken-just-here/");
    expect(hrefs("/blog/network")[0]).toBe("/blog/network-isnt-broken-just-here/");
  });

  it("does not suggest a route only because it shares the /blog/ prefix", () => {
    expect(hrefs("/blog/rag-breaks")).not.toContain("/blog/ru/");
    expect(hrefs("/blog/rag-breaks")).not.toContain("/blog/");
  });

  it("matches a misspelt page and a project by name", () => {
    expect(hrefs("/projets")[0]).toBe("/projects/");
    expect(hrefs("/changelg/")[0]).toBe("/changelog/");
    expect(hrefs("/ratatoskr")[0]).toBe("/projects/#ratatoskr");
  });

  it("suggests nothing for an unrelated path or the root", () => {
    expect(hrefs("/wp-admin/setup.php")).toEqual([]);
    expect(hrefs("/")).toEqual([]);
  });

  it("returns at most three, best first", () => {
    expect(closestRoutes("/blog", routes).length).toBeLessThanOrEqual(3);
    expect(hrefs("/blog")[0]).toBe("/blog/");
  });
});

describe("dice", () => {
  it("is 1 for equal strings and 0 for disjoint ones", () => {
    expect(dice("blog", "blog")).toBe(1);
    expect(dice("abc", "xyz")).toBe(0);
  });
});
