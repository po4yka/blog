export function mount(root, { reducedMotion = false } = {}) {
  const cleanups = [];
  const onDispose = (fn) => { cleanups.push(fn); };
  if (reducedMotion) root.setAttribute("data-motion", "reduce"); else root.removeAttribute("data-motion");

  const SYSTEMS = ["wiki","graphrag","zep","hipporag","lazygraphrag","mem0","letta","plain-rag"];
  const QUADRANT = {"wiki":"quad-wiki","graphrag":"quad-graphs","zep":"quad-graphs","hipporag":"quad-graphs","lazygraphrag":"quad-classic","mem0":"quad-classic","letta":"quad-classic","plain-rag":"quad-classic"};
  const READOUT = ["LLM Wiki · на ингесте: каждый источник компилируется один раз · читаемый человеком артефакт: файлы Markdown","GraphRAG · на ингесте: граф сущностей и саммари сообществ до первого запроса · непрозрачное хранилище","Zep · Graphiti · на ингесте: каждое ребро получает valid_at и invalid_at · непрозрачное хранилище: темпоральный граф","HippoRAG · сразу за осью, на ингесте: концептный граф заранее, PageRank на каждый запрос · непрозрачное хранилище","LazyGraphRAG · на запросе: без предварительных саммари, индексация стоит 0,1% от GraphRAG · непрозрачное хранилище","Mem0 · на запросе: извлекает факты из каждого сообщения · непрозрачное хранилище: вектор и граф","Letta / MemGPT · на запросе: подкачивает уровни памяти через function call · непрозрачное хранилище","Обычный RAG · на запросе: корпус остаётся сырым, и модель каждый раз выводит его заново · непрозрачное хранилище: векторный индекс"];
  const IDLE = "Выберите систему, чтобы увидеть, где она платит";
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
