export function mount(root, { reducedMotion = false } = {}) {
  const cleanups = [];
  const onDispose = (fn) => { cleanups.push(fn); };
  if (reducedMotion) root.setAttribute("data-motion", "reduce"); else root.removeAttribute("data-motion");

  const t = {"observed":"OBSERVED · ещё не валидирована","validated":"VALIDATED · отказов {n}/2","suppressed":"SUPPRESSED · блокировка 24 ч","took":"{event} → {state}","noEdge":"{event} · из {state} перехода нет","next":"далее: {line}","said":["успех","отказ","прошли 24 ч","новая область"]};
  const stage = root.querySelector(".diagram-stage");
  const readout = root.querySelector("[data-readout]");
  const chips = Array.from(root.querySelectorAll("[data-event]"));
  const OUT = { observed: ["new-scope", "validates"], validated: ["new-scope", "success-loop", "fail-lock"], suppressed: ["new-scope", "recover"] };
  const KEYMAP = { KeyS: 0, Digit1: 0, Numpad1: 0, KeyF: 1, Digit2: 1, Numpad2: 1, KeyT: 2, Digit3: 2, Numpad3: 2, KeyR: 3, Digit0: 3, Numpad0: 3 };
  let m = { state: "observed", failures: 0 };
  let took = null;
  let sel = -1;

  // One event on a machine: the next machine and the edge it took (null when none).
  const step = (from, event) => {
    if (event === 3) return { next: { state: "observed", failures: 0 }, edge: "new-scope" };
    if (from.state === "observed") return event === 0 ? { next: { state: "validated", failures: 0 }, edge: "validates" } : { next: from, edge: null };
    if (from.state === "validated") {
      if (event === 0) return { next: { state: "validated", failures: 0 }, edge: "success-loop" };
      if (event === 1) return from.failures + 1 >= 2 ? { next: { state: "suppressed", failures: 2 }, edge: "fail-lock" } : { next: { state: "validated", failures: from.failures + 1 }, edge: null };
      return { next: from, edge: null };
    }
    return event === 1 ? { next: from, edge: null } : { next: { state: "validated", failures: 0 }, edge: "recover" };
  };
  const status = (s) => t[s.state].replace("{n}", String(s.failures));
  const line = (from, event) => {
    const r = step(from, event);
    const changed = r.edge || r.next.failures !== from.failures;
    return (changed ? t.took : t.noEdge).replace("{event}", t.said[event]).replace("{state}", changed ? status(r.next) : from.state.toUpperCase());
  };
  const idle = (event) => { const r = step(m, event); return !r.edge && r.next.failures === m.failures; };

  for (const path of root.querySelectorAll("[data-edge] [marker-end]")) {
    const plain = path.getAttribute("marker-end");
    path.dataset.marker = plain;
    path.dataset.markerOn = plain.replace(/arrow\)$/, "arrow-accent)");
  }

  const draw = () => {
    for (const node of root.querySelectorAll("[data-node]")) {
      const on = node.dataset.node === m.state;
      node.classList.toggle("is-on", on);
      node.classList.toggle("is-dim", !on);
    }
    for (const edge of root.querySelectorAll("[data-edge]")) {
      const name = edge.dataset.edge;
      edge.classList.toggle("is-on", name === took);
      edge.classList.toggle("is-dim", name !== took && !OUT[m.state].includes(name));
    }
    for (const path of root.querySelectorAll("[data-edge] [marker-end]")) {
      path.setAttribute("marker-end", path.closest("[data-edge]").dataset.edge === took ? path.dataset.markerOn : path.dataset.marker);
    }
    chips.forEach((chip, at) => { chip.classList.toggle("is-next", at === sel); chip.classList.toggle("is-idle", idle(at)); });
  };
  const fire = (event) => {
    readout.textContent = line(m, event);
    const r = step(m, event);
    m = r.next;
    took = r.edge;
    sel = event;
    draw();
  };
  const choose = (at) => {
    sel = at;
    readout.textContent = t.next.replace("{line}", line(m, at));
    draw();
  };

  const onKey = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const onChip = event.target.closest("[data-event]");
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const at = ((sel < 0 ? (event.key === "ArrowRight" ? -1 : chips.length) : sel) + (event.key === "ArrowRight" ? 1 : -1) + chips.length) % chips.length;
      choose(at);
      if (onChip) chips[at].focus();
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !onChip) {
      if (sel < 0) return;
      event.preventDefault();
      fire(sel);
      return;
    }
    if (event.code in KEYMAP) { event.preventDefault(); fire(KEYMAP[event.code]); }
  };
  const onClick = (event) => {
    const chip = event.target.closest("[data-event]");
    if (chip) fire(Number(chip.dataset.event));
  };
  root.addEventListener("keydown", onKey);
  root.addEventListener("click", onClick);
  onDispose(() => { root.removeEventListener("keydown", onKey); root.removeEventListener("click", onClick); });
  draw();

  return () => { while (cleanups.length) cleanups.pop()(); };
}
