export interface KnownRoute {
  href: string;
  label: string;
  kind: "page" | "post" | "project";
  lang?: "en" | "ru";
}

/** Lowercase words of a path: "/blog/RAG-breaks/" -> "blog rag breaks". */
function words(path: string): string {
  return decodeURIComponentSafe(path).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function bigrams(s: string): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2);
    out.set(bg, (out.get(bg) ?? 0) + 1);
  }
  return out;
}

/** Sørensen-Dice coefficient on character bigrams, 0..1. */
export function dice(a: string, b: string): number {
  if (a === b) return a.length > 0 ? 1 : 0;
  const A = bigrams(a);
  const B = bigrams(b);
  let shared = 0;
  let total = 0;
  for (const [bg, n] of A) {
    shared += Math.min(n, B.get(bg) ?? 0);
    total += n;
  }
  for (const n of B.values()) total += n;
  return total === 0 ? 0 : (2 * shared) / total;
}

/** The part of a path that names the thing: the #anchor if any, else the last segment. */
function leaf(path: string): string {
  const [base, hash] = path.split("#");
  if (hash) return words(hash);
  const segments = (base ?? "").split("/").filter(Boolean);
  return words(segments[segments.length - 1] ?? "");
}

const isRu = (path: string) => /^\/blog\/ru(\/|$)/.test(path);

/**
 * The known routes closest to a path that did not resolve, best first. Routes
 * are compared on their leaf, not the whole path, so a shared prefix such as
 * /blog/ does not make every blog route look close. A route in the language the
 * path asks for wins a tie. Below MIN_SCORE nothing is suggested rather than a
 * weak guess.
 */
export function closestRoutes(path: string, routes: KnownRoute[], limit = 3): KnownRoute[] {
  const MIN_SCORE = 0.4;
  const req = leaf(path);
  if (!req) return [];
  return routes
    .map((route) => {
      const cand = leaf(route.href);
      const sameLang = isRu(path) === isRu(route.href) ? 0.01 : 0;
      // A cut-off slug ("/blog/network") is the start of the real one.
      const prefix = req.length >= 3 && cand.startsWith(req) ? 0.5 + (0.5 * req.length) / cand.length : 0;
      return { route, score: Math.max(dice(req, cand), prefix) + sameLang };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.route);
}
