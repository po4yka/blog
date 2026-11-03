export function mount(root, { reducedMotion = false } = {}) {
  const cleanups = [];
  const onDispose = (fn) => { cleanups.push(fn); };
  if (reducedMotion) root.setAttribute("data-motion", "reduce"); else root.removeAttribute("data-motion");

  const stage = root.querySelector(".diagram-stage");
  const readout = root.querySelector("[data-readout]");
  const steps = [{"key":"healthy","bucket":"healthy","nodes":["probe","bucket","verdict-transparent-ok"],"edges":["enter","healthy"]},{"key":"attention","bucket":"attention","nodes":["probe","bucket","verdict-owned-stack-only"],"edges":["enter","attention"]},{"key":"blockpage","bucket":"failed","cls":"http-blockpage","nodes":["probe","bucket","failure-class","verdict-no-direct-solution"],"edges":["enter","failed","blockpage"]},{"key":"pending","bucket":"failed","cls":"ip-block-suspect","gate":true,"nodes":["probe","bucket","failure-class","gate"],"edges":["enter","failed","ip-silent","second-flow"]},{"key":"inconclusive","bucket":"inconclusive","nodes":["probe","bucket","no-change"],"edges":["enter","inconclusive"]}];
  const confirmed = {"nodes":["verdict-ip-block-suspect"],"edges":["confirm"]};
  const text = {"healthy":"TRANSPARENT_OK · works directly, nothing to touch","attention":"OWNED_STACK_ONLY · loads only through the app's own TLS stack","blockpage":"NO_DIRECT_SOLUTION · no packet surgery recovers it, needs a tunnel","pending":"PendingSecondFlow · verdict withheld until a second flow confirms","confirmed":"IP_BLOCK_SUSPECT · second flow confirmed, nothing answers at IP","inconclusive":"No strategy change · transient timeout, retry later"};
  const bucketChips = Array.from(root.querySelectorAll("[data-bucket]"));
  const classChips = Array.from(root.querySelectorAll("[data-class]"));
  const flowChip = root.querySelector("[data-flow]");
  let at = 0;
  let seen = false;
  // Keep the edge arrowheads with their stroke: swap each marker between the
  // muted and accent markers the drawing already defines.
  const arrowed = Array.from(root.querySelectorAll("[data-edge] [marker-end]"));
  for (const el of arrowed) el.dataset.marker = el.getAttribute("marker-end");
  const draw = () => {
    const step = steps[at];
    const fired = step.gate && seen;
    const nodes = new Set(fired ? step.nodes.concat(confirmed.nodes) : step.nodes);
    const edges = new Set(fired ? step.edges.concat(confirmed.edges) : step.edges);
    const end = fired ? "verdict-ip-block-suspect" : step.nodes[step.nodes.length - 1];
    for (const el of root.querySelectorAll("[data-node]")) {
      const on = nodes.has(el.dataset.node);
      el.classList.toggle("is-on", on);
      el.classList.toggle("is-dim", !on);
      el.classList.toggle("is-end", el.dataset.node === end && el.dataset.node !== "gate");
    }
    for (const el of root.querySelectorAll("[data-edge]")) {
      const on = edges.has(el.dataset.edge);
      el.classList.toggle("is-on", on);
      el.classList.toggle("is-dim", !on);
    }
    for (const el of arrowed) {
      const on = el.closest("[data-edge]").classList.contains("is-on");
      el.setAttribute("marker-end", on ? el.dataset.marker.replace(/-arrow\)$/, "-arrow-accent)") : el.dataset.marker);
    }
    for (const el of root.querySelectorAll('[data-mark^="bucket-"]')) {
      const pick = el.dataset.mark === "bucket-" + step.bucket;
      el.classList.toggle("is-pick", pick);
      el.classList.toggle("is-dim", !pick);
    }
    for (const el of root.querySelectorAll('[data-mark^="class-"]')) {
      const pick = Boolean(step.cls) && el.dataset.mark === "class-" + step.cls;
      el.classList.toggle("is-pick", pick);
      el.classList.toggle("is-dim", Boolean(step.cls) && !pick);
    }
    for (const chip of bucketChips) chip.setAttribute("aria-checked", String(chip.dataset.bucket === step.bucket));
    for (const chip of classChips) {
      chip.disabled = !step.cls;
      chip.setAttribute("aria-checked", String(chip.dataset.class === step.cls));
    }
    flowChip.disabled = !step.gate;
    flowChip.setAttribute("aria-pressed", String(Boolean(fired)));
    readout.textContent = text[fired ? "confirmed" : step.key];
  };
  const go = (next) => { at = next; seen = false; draw(); };
  const toggleFlow = () => { seen = !seen; draw(); };
  const onKey = (event) => {
    const last = steps.length - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") go(at === last ? 0 : at + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") go(at === 0 ? last : at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(last);
    else if ((event.key === "Enter" || event.key === " ") && steps[at].gate) toggleFlow();
    else return;
    event.preventDefault();
  };
  const onClick = (event) => {
    const chip = event.target.closest("button");
    if (!chip || chip.disabled) return;
    if (chip.dataset.bucket) {
      const bucket = chip.dataset.bucket;
      if (bucket === steps[at].bucket) return;
      go(steps.findIndex((step) => step.bucket === bucket));
    } else if (chip.dataset.class) {
      if (chip.dataset.class !== steps[at].cls) go(steps.findIndex((step) => step.cls === chip.dataset.class));
    } else if ("flow" in chip.dataset) toggleFlow();
  };
  stage.addEventListener("keydown", onKey);
  root.addEventListener("click", onClick);
  onDispose(() => {
    stage.removeEventListener("keydown", onKey);
    root.removeEventListener("click", onClick);
    for (const el of arrowed) el.setAttribute("marker-end", el.dataset.marker);
  });
  draw();

  return () => { while (cleanups.length) cleanups.pop()(); };
}
