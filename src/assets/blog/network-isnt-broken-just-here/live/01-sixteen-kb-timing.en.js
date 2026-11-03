export function mount(root, { reducedMotion = false } = {}) {
  const cleanups = [];
  const onDispose = (fn) => { cleanups.push(fn); };
  if (reducedMotion) root.setAttribute("data-motion", "reduce"); else root.removeAttribute("data-motion");

  const stage = root.querySelector(".diagram-stage");
  const readout = root.querySelector("[data-readout]");
  const chips = Array.from(root.querySelectorAll("[data-kib]"));
  const t = {"readout":"{k} KiB · {tag} · {note}","value":"{k} KiB sent: {tag}, {note}","bands":{"before":{"tag":"tcp_connect_failed / tls_handshake_failed","note":"before bytes flow"},"early":{"tag":"tcp_reset","note":"early reset"},"late":{"tag":"tcp_reset","note":"tcp_16kb_blocked if responses_seen ≥ 1"},"blocked":{"tag":"tcp_16kb_blocked","note":"reset or freeze at threshold"},"ok":{"tag":"tcp_fat_header_ok","note":"reached 16 KiB cleanly"}}};
  const BANDS = {"before":{"on":["before"],"alt":[],"gate":null,"rst":false},"early":{"on":["reset"],"alt":["timeout"],"gate":null,"rst":true},"late":{"on":["reset"],"alt":["timeout","blocked"],"gate":"gate-8","rst":true},"blocked":{"on":["blocked"],"alt":["freeze"],"gate":"gate-14","rst":true},"ok":{"on":["ok"],"alt":[],"gate":"gate-16","rst":false}};
  const GATES = [8,14,16];
  const OUTCOMES = ["before", "reset", "timeout", "blocked", "ok", "freeze"];
  const band = (k) => (k === 0 ? "before" : k < 8 ? "early" : k < 14 ? "late" : k < 16 ? "blocked" : "ok");
  const fill = (template, k, b) => template.replace("{k}", String(k)).replace("{tag}", t.bands[b].tag).replace("{note}", t.bands[b].note);
  const set = (selector, cls, on) => { for (const el of root.querySelectorAll(selector)) el.classList.toggle(cls, on); };
  let kib = 14;
  const draw = () => {
    const b = band(kib);
    const rule = BANDS[b];
    for (const name of OUTCOMES) {
      const on = rule.on.includes(name);
      const dim = !on && !rule.alt.includes(name);
      set('[data-node="' + name + '"],[data-edge="' + name + '"]', "is-on", on);
      set('[data-node="' + name + '"],[data-edge="' + name + '"]', "is-dim", dim);
    }
    for (const gate of ["gate-8", "gate-14", "gate-16"]) set('[data-node="' + gate + '"]', "is-on", rule.gate === gate);
    set('[data-node="rst-flow"]', "is-dim", !rule.rst);
    stage.style.setProperty("--kib-x", ((40 + 42 * kib) / 960 * 100) + "%");
    stage.setAttribute("aria-valuenow", String(kib));
    stage.setAttribute("aria-valuetext", fill(t.value, kib, b));
    for (const chip of chips) chip.setAttribute("aria-checked", String(Number(chip.dataset.kib) === kib));
    readout.textContent = fill(t.readout, kib, b);
  };
  const go = (next) => { kib = Math.max(0, Math.min(16, next)); draw(); };
  const onKey = (event) => {
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = kib + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = kib - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 16;
    else if (event.key >= "1" && event.key <= "3") next = GATES[Number(event.key) - 1];
    if (next === null) return;
    event.preventDefault();
    go(next);
  };
  const onStageClick = (event) => {
    const svg = event.target.closest("svg");
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (!box.width) return;
    const x = ((event.clientX - box.left) / box.width) * 960;
    go(Math.round((x - 40) / 42));
  };
  const onChip = (event) => {
    const chip = event.target.closest("[data-kib]");
    if (!chip) return;
    go(Number(chip.dataset.kib));
  };
  stage.addEventListener("keydown", onKey);
  stage.addEventListener("click", onStageClick);
  root.addEventListener("click", onChip);
  onDispose(() => {
    stage.removeEventListener("keydown", onKey);
    stage.removeEventListener("click", onStageClick);
    root.removeEventListener("click", onChip);
  });
  draw();

  return () => { while (cleanups.length) cleanups.pop()(); };
}
