export function mount(root, { reducedMotion = false } = {}) {
  const cleanups = [];
  const onDispose = (fn) => { cleanups.push(fn); };
  if (reducedMotion) root.setAttribute("data-motion", "reduce"); else root.removeAttribute("data-motion");

  const SYSTEMS = ["wiki","graphrag","zep","hipporag","lazygraphrag","mem0","letta","plain-rag"];
  const QUADRANT = {"wiki":"quad-wiki","graphrag":"quad-graphs","zep":"quad-graphs","hipporag":"quad-graphs","lazygraphrag":"quad-classic","mem0":"quad-classic","letta":"quad-classic","plain-rag":"quad-classic"};
  const READOUT = ["LLM Wiki · ingest-time: each source is compiled once · human-readable artifact: markdown files","GraphRAG · ingest-time: entity graph and community summaries before the first query · opaque store","Zep · Graphiti · ingest-time: every edge gets valid_at and invalid_at · opaque store: a temporal graph","HippoRAG · just past the line to ingest-time: concept graph up front, PageRank per query · opaque store","LazyGraphRAG · query-time: drops the pre-summaries, indexing at 0.1% of GraphRAG · opaque store","Mem0 · query-time: extracts facts from every message · opaque store: vector plus graph","Letta / MemGPT · query-time: pages memory tiers by function call · opaque store","Plain RAG · query-time: re-derives the raw corpus on every query · opaque store: a vector index"];
  const IDLE = "Pick a system to see where it pays";
  const readout = root.querySelector("[data-readout]");
  const chips = Array.from(root.querySelectorAll("[data-pick]"));
  const n = SYSTEMS.length;
  let pick = -1;

  const mark = (el, name, target) => {
    const hit = name === target;
    el.classList.toggle("is-on", pick >= 0 && hit);
    el.classList.toggle("is-dim", pick >= 0 && !hit);
  };
  const draw = () => {
    const on = pick >= 0 ? SYSTEMS[pick] : null;
    const quad = on ? QUADRANT[on] : null;
    for (const node of root.querySelectorAll("[data-node]")) {
      const name = node.dataset.node;
      mark(node, name, name.startsWith("quad-") ? quad : on);
    }
    for (const el of root.querySelectorAll("[data-mark]")) mark(el, el.dataset.mark, quad);
    chips.forEach((chip, at) => chip.setAttribute("aria-checked", String(at === pick)));
    readout.textContent = on ? READOUT[pick] : IDLE;
  };
  const choose = (at, focus) => {
    pick = at;
    draw();
    if (focus && at >= 0) chips[at].focus();
  };

  const onKey = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const onChip = !!event.target.closest("[data-pick]");
    let at = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") at = pick < 0 ? 0 : (pick + 1) % n;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") at = pick < 0 ? n - 1 : (pick - 1 + n) % n;
    else if (event.key === "Home") at = 0;
    else if (event.key === "End") at = n - 1;
    else if (event.key === "Escape" && pick >= 0) at = -1;
    else if (/^(Digit|Numpad)[1-8]$/.test(event.code)) at = Number(event.code.slice(-1)) - 1;
    if (at === null) return;
    event.preventDefault();
    choose(at, onChip);
  };
  const onClick = (event) => {
    const chip = event.target.closest("[data-pick]");
    if (chip) { choose(Number(chip.dataset.pick), false); return; }
    const node = event.target.closest("g[data-node]");
    if (node && SYSTEMS.includes(node.dataset.node)) choose(SYSTEMS.indexOf(node.dataset.node), false);
  };
  root.addEventListener("keydown", onKey);
  root.addEventListener("click", onClick);
  onDispose(() => { root.removeEventListener("keydown", onKey); root.removeEventListener("click", onClick); });
  draw();

  return () => { while (cleanups.length) cleanups.pop()(); };
}
