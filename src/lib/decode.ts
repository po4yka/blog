const GLYPHS = "0123456789abcdef";
const DURATION_MS = 420; // --dur-slow
const SCRAMBLABLE = /[\p{L}\p{N}]/u;

/** The first `revealed` characters stay final; later letters and digits become mono glyphs. Spaces and punctuation never change. */
export function scramble(text: string, revealed: number, rand: () => number = Math.random): string {
  let i = 0;
  let out = "";
  for (const ch of text) {
    out += i++ < revealed || !SCRAMBLABLE.test(ch) ? ch : GLYPHS[(rand() * 16) | 0];
  }
  return out;
}

// last: the text this module last wrote; final: the real value the current decode ends on.
type State = { last: string; final: string; raf: number };
const states = new WeakMap<HTMLElement, State>();

/** The text node a framework rendered for the value (skips whitespace and comment nodes). */
const valueNode = (el: HTMLElement) =>
  [...el.childNodes].find((n): n is Text => n instanceof Text && n.data.trim() !== "");

const release = (el: HTMLElement) => ["aria-label", "role"].forEach((a) => el.removeAttribute(a));

/**
 * Decode `el` from mono glyphs to its current text, and keep the final text exposed to screen
 * readers. Only monospace values decode: a same-length scramble then has the same width, so
 * nothing is pinned and no layout changes. Frames go into the existing text node, so a framework
 * that owns the node keeps it. Returns false when the element is hidden, to retry later.
 */
export function decode(el: HTMLElement, s: State): boolean {
  const node = valueNode(el);
  cancelAnimationFrame(s.raf);
  release(el);
  // Motion rules from the shared contract: read the DOM, not the store.
  const { motion, effects = "full" } = document.documentElement.dataset;
  if (!node || motion === "reduce" || effects !== "full" || !/mono/i.test(getComputedStyle(el).fontFamily)) return true;
  const { width, height } = el.getBoundingClientRect();
  // Hidden (the other language's copy, or display: none): try again when it shows.
  if (width === 0 && height === 0) return false;
  // A restart mid-decode finds one of our own frames in the node; the value is still s.final.
  const text = node.data === s.last && s.final ? s.final : node.data;
  s.final = s.last = text;
  // role=img makes the aria-label reliable on a generic span.
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", text);
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / DURATION_MS, 1);
    node.data = s.last = p < 1 ? scramble(text, Math.floor(p * [...text].length)) : text;
    if (p < 1) s.raf = requestAnimationFrame(step);
    else release(el);
  };
  s.raf = requestAnimationFrame(step);
  return true;
}

let started = false;

/** One delegated observer: every [data-decode] element decodes when it first enters the viewport, and again (from the new text) when its text changes. */
export function initDecode(): void {
  if (started) return;
  started = true;
  const state = (el: HTMLElement) => {
    let s = states.get(el);
    if (!s) states.set(el, (s = { last: "", final: "", raf: 0 }));
    return s;
  };
  // React hydrates an island against its server text; a scrambled frame there is a hydration
  // mismatch (#418). Inside an island that has not hydrated yet, wait until Astro drops `ssr`.
  const whenHydrated = (el: HTMLElement, run: () => void) => {
    const island = el.closest("astro-island[ssr]");
    if (!island) return run();
    const mo = new MutationObserver(() => {
      if (island.hasAttribute("ssr")) return;
      mo.disconnect();
      run();
    });
    mo.observe(island, { attributes: true, attributeFilter: ["ssr"] });
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      whenHydrated(el, () => {
        if (!decode(el, state(el))) io.observe(el);
      });
    }
  });
  const textWatch = new MutationObserver((records) => {
    const changed = new Set<HTMLElement>();
    for (const r of records) {
      const el = (r.target instanceof HTMLElement ? r.target : r.target.parentElement)?.closest<HTMLElement>("[data-decode]");
      // Our own frames equal s.last; anything else is a new value. Compare the value's text node, not
      // textContent, which also holds whitespace and other nodes and would never match.
      if (el && valueNode(el)?.data !== state(el).last) changed.add(el);
    }
    changed.forEach((el) => whenHydrated(el, () => decode(el, state(el))));
  });
  const watch = (el: HTMLElement) => {
    if (states.has(el)) return;
    state(el);
    io.observe(el);
    textWatch.observe(el, { characterData: true, childList: true, subtree: true });
  };
  const scan = (root: ParentNode) => {
    if (root instanceof HTMLElement && root.matches("[data-decode]")) watch(root);
    root.querySelectorAll<HTMLElement>("[data-decode]").forEach(watch);
  };
  scan(document);
  // Islands and page swaps add elements after load.
  new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => n instanceof HTMLElement && scan(n));
  }).observe(document.documentElement, { childList: true, subtree: true });
}
