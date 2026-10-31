const GLYPHS = "0123456789abcdef";
const DURATION_MS = 420; // --dur-slow
const SCRAMBLABLE = /[\p{L}\p{N}]/u;

/** The first `revealed` characters stay final; later letters and digits become mono glyphs. Spaces and punctuation never change. */
export function scramble(text: string, revealed: number, rand: () => number = Math.random): string {
  let i = 0;
  let out = "";
  for (const ch of text) {
    out += i++ < revealed || !SCRAMBLABLE.test(ch) ? ch : GLYPHS[Math.floor(rand() * GLYPHS.length)];
  }
  return out;
}

/** Motion rules from the shared contract: read the DOM, not the store. */
export function decodeAllowed(root: HTMLElement = document.documentElement): boolean {
  return root.dataset.motion !== "reduce" && (root.dataset.effects ?? "full") === "full";
}

type State = { text: string; raf: number; running: boolean };
const states = new WeakMap<HTMLElement, State>();
const WIDTH_PROPS = ["display", "width", "white-space"] as const;

function finish(el: HTMLElement, s: State, text: string) {
  el.textContent = text;
  WIDTH_PROPS.forEach((p) => el.style.removeProperty(p));
  el.removeAttribute("aria-label");
  el.removeAttribute("role");
  // After the observer has seen (and skipped) our own final write.
  queueMicrotask(() => (s.running = false));
}

/** Decode `el` from mono glyphs to its current text. The width is pinned to the final string, and the final text is exposed to screen readers throughout. */
export function decode(el: HTMLElement, s: State = { text: "", raf: 0, running: false }): void {
  const text = el.textContent ?? "";
  cancelAnimationFrame(s.raf);
  if (!text || !decodeAllowed()) return;
  s.text = text;
  const { width } = el.getBoundingClientRect();
  if (getComputedStyle(el).display === "inline") el.style.display = "inline-block";
  el.style.width = `${width}px`;
  el.style.whiteSpace = "nowrap";
  // role=img makes the aria-label reliable on a generic span.
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", text);
  s.running = true;
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / DURATION_MS, 1);
    if (p >= 1) return finish(el, s, text);
    el.textContent = scramble(text, Math.floor(p * [...text].length));
    s.raf = requestAnimationFrame(step);
  };
  s.raf = requestAnimationFrame(step);
}

let started = false;

/** One delegated observer: every [data-decode] element decodes when it first enters the viewport, and again when its text changes. */
export function initDecode(): void {
  if (started || typeof IntersectionObserver === "undefined") return;
  started = true;
  const state = (el: HTMLElement) => {
    let s = states.get(el);
    if (!s) states.set(el, (s = { text: "", raf: 0, running: false }));
    return s;
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      decode(e.target as HTMLElement, state(e.target as HTMLElement));
    }
  });
  const textWatch = new MutationObserver((records) => {
    const changed = new Set<HTMLElement>();
    for (const r of records) {
      const el = (r.target instanceof HTMLElement ? r.target : r.target.parentElement)?.closest<HTMLElement>("[data-decode]");
      if (el && !state(el).running) changed.add(el);
    }
    changed.forEach((el) => decode(el, state(el)));
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
