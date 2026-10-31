import { Fragment, useEffect, useRef, useState } from "react";
import { T } from "@/components/ui/T";
import { fieldSeed } from "@/data/fieldSeed";
import { heroField, weeklyDensity, type HeroFieldParams } from "@/lib/dither";
import { t, type Locale } from "@/lib/i18n";

const CELL = 2; // CSS px per cell: half resolution, coarser when the layer would pass MAX_CELLS
const FRAME_MS = 1000 / 15;
const MAX_CELLS = 720;
const WEEKS = fieldSeed.counts.length / 7;

type Connection = { saveData?: boolean };

/** The seed caption in one language, with its numbers marked for the decode effect. */
function caption(lang: Locale) {
  if (WEEKS === 0) return t(lang, "hero.fieldNoData");
  return t(lang, "hero.fieldCaption")
    .split(/(\{weeks\}|\{hash\})/)
    .map((part, i) =>
      part === "{weeks}" || part === "{hash}" ? (
        <span key={i} data-decode>
          {part === "{weeks}" ? WEEKS : fieldSeed.hash}
        </span>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}

/**
 * The hero field: a Bayer-dithered layer behind the name (density follows the
 * commit seed, the live name is echoed through a glyph mask, a fine pointer
 * pushes the dither aside) and a caption row with the pause control. The
 * server renders the poster layer and the caption; the canvas takes over after
 * idle. Effects come from <html> only: data-effects ("reduced" and "off") and
 * data-motion ("reduce"). Reduced states draw one still frame (name mask, no
 * pointer) and never loop. saveData and effects "off" never create the canvas
 * buffers: saveData keeps the poster, off hides the layer.
 */
export function DitherField() {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const applyRef = useRef<() => void>(() => {});
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    // The island element is display: contents, so the grid zone is the nearest .hero-zone, not the parent.
    const zone = layer?.closest<HTMLElement>(".hero-zone");
    const ctx = canvas?.getContext("2d");
    if (!layer || !canvas || !zone || !ctx) return;

    const root = document.documentElement;
    const weeks = weeklyDensity(fieldSeed.counts);
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    const pointer = { x: 0, y: 0 };
    const params: HeroFieldParams = { weeks, width: 0, height: 0, step: 0, mask: null, pointer: null };
    let bits: Uint8Array | null = null;
    let image: ImageData | null = null;
    let pixels: Uint32Array | null = null;
    let ink = 0;
    let step = 0;
    // CSS px per cell for the current build; CELL unless the layer is larger than MAX_CELLS cells.
    let cell = CELL;
    let acc = 0;
    let last = 0;
    let raf = 0;
    let rebuildRaf = 0;
    let visible = false;
    let hasPointer = false;
    let pointerOn = false;
    let pageLeft = 0;
    let pageTop = 0;
    let locale = root.dataset.locale;
    let disposed = false;

    const effects = () => root.dataset.effects ?? "full";
    const saveData = () => (navigator as Navigator & { connection?: Connection }).connection?.saveData === true;
    const isLive = () => effects() === "full" && root.dataset.motion !== "reduce";
    // Off and saveData never allocate or draw the canvas.
    const canvasWanted = () => effects() !== "off" && !saveData();

    // The canvas holds ink as one opaque colour; the CSS opacity does the rest.
    const resolveInk = () => {
      const probe = document.createElement("canvas").getContext("2d");
      if (!probe) return;
      probe.canvas.width = probe.canvas.height = 1;
      probe.fillStyle = getComputedStyle(root).getPropertyValue("--foreground").trim() || "#000";
      probe.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
      // shortcut: assumes little-endian pixel order, true on every browser target; upgrade if a big-endian one appears.
      ink = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
    };

    /** The visible name drawn once, at cell resolution, with the CSS weights and letter-spacing read from each line. */
    const buildMask = (rect: DOMRect, width: number, height: number): Uint8Array | null => {
      const h1 = document.getElementById("hero-heading");
      const off = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      if (!h1 || !off) return null;
      off.canvas.width = width;
      off.canvas.height = height;
      off.scale(1 / cell, 1 / cell);
      off.fillStyle = "#000";
      const range = document.createRange();
      for (const name of h1.querySelectorAll<HTMLElement>("[data-l]")) {
        if (name.getClientRects().length === 0) continue;
        for (const line of name.querySelectorAll<HTMLElement>(".display-name-given, .display-name-family")) {
          const style = getComputedStyle(line);
          off.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          off.letterSpacing = style.letterSpacing;
          range.selectNodeContents(line);
          const box = range.getBoundingClientRect();
          const text = line.textContent ?? "";
          off.fillText(text, box.left - rect.left, box.top - rect.top + off.measureText(text).fontBoundingBoxAscent);
        }
      }
      const data = off.getImageData(0, 0, width, height).data;
      const mask = new Uint8Array(width * height);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3]! > 127 ? 1 : 0;
      return mask;
    };

    const draw = () => {
      if (!bits || !image || !pixels) return;
      params.step = step;
      params.pointer = hasPointer ? pointer : null;
      heroField(params, bits);
      for (let i = 0; i < pixels.length; i++) pixels[i] = bits[i] ? ink : 0;
      ctx.putImageData(image, 0, 0);
      layer.dataset.field = "live";
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.pageX - pageLeft) / cell;
      pointer.y = (e.pageY - pageTop) / cell;
      hasPointer = true;
    };
    const onEnter = () => {
      const rect = layer.getBoundingClientRect();
      pageLeft = rect.left + window.scrollX;
      pageTop = rect.top + window.scrollY;
    };
    const onLeave = () => {
      hasPointer = false;
    };
    const setPointer = (on: boolean) => {
      if (on === pointerOn) return;
      pointerOn = on;
      hasPointer = false;
      const toggle = on ? zone.addEventListener.bind(zone) : zone.removeEventListener.bind(zone);
      toggle("pointerenter", onEnter);
      toggle("pointermove", onMove as EventListener, on ? { passive: true } : undefined);
      toggle("pointerleave", onLeave);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = now - last;
      last = now;
      // A stalled tab or a first frame must not fire a burst of catch-up frames.
      acc += dt > 4 * FRAME_MS ? FRAME_MS : dt;
      if (acc < FRAME_MS) return;
      acc %= FRAME_MS;
      step++;
      draw();
    };

    const apply = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!canvasWanted()) {
        setPointer(false);
        return;
      }
      const live = isLive();
      zone.dataset.fieldMode = live ? "live" : "still";
      // A paused field ignores the pointer, so any redraw while paused (resize, theme) gives the same frame.
      setPointer(live && fine.matches && !pausedRef.current);
      draw();
      if (live && visible && !document.hidden && !pausedRef.current) {
        last = performance.now();
        acc = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    applyRef.current = apply;

    const build = async () => {
      rebuildRaf = 0;
      await document.fonts.ready;
      if (disposed || !canvasWanted()) return;
      const rect = layer.getBoundingClientRect();
      // Mask and pointer share this cell size, so a layer past MAX_CELLS coarsens the grid instead of stretching it.
      cell = Math.max(CELL, rect.width / MAX_CELLS, rect.height / MAX_CELLS);
      const width = Math.ceil(rect.width / cell);
      const height = Math.ceil(rect.height / cell);
      if (width === 0 || height === 0) return;
      canvas.width = width;
      canvas.height = height;
      pageLeft = rect.left + window.scrollX;
      pageTop = rect.top + window.scrollY;
      bits = new Uint8Array(width * height);
      image = ctx.createImageData(width, height);
      pixels = new Uint32Array(image.data.buffer);
      params.width = width;
      params.height = height;
      params.mask = buildMask(rect, width, height);
      apply();
    };
    // One rebuild per burst of resizes.
    const rebuild = () => {
      if (!rebuildRaf) rebuildRaf = requestAnimationFrame(() => void build());
    };

    const mutations = new MutationObserver(() => {
      resolveInk();
      if (root.dataset.locale !== locale) {
        locale = root.dataset.locale;
        rebuild();
      } else if (!bits && canvasWanted()) {
        // Effects came back from off: the first build was skipped.
        rebuild();
      }
      apply();
    });
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? false;
      apply();
    });
    const resize = new ResizeObserver(rebuild);
    const onVisibility = () => apply();

    // After first paint: the island hydrates on idle, and the first build waits for idle again.
    const start = () => {
      if (disposed) return;
      resolveInk();
      if (saveData()) zone.dataset.fieldMode = "still";
      mutations.observe(root, { attributes: true, attributeFilter: ["class", "data-locale", "data-effects", "data-motion"] });
      intersection.observe(layer);
      resize.observe(layer);
      document.addEventListener("visibilitychange", onVisibility);
      fine.addEventListener("change", apply);
      void build();
    };
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle ? window.requestIdleCallback(start) : window.setTimeout(start, 1);

    return () => {
      disposed = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rebuildRaf);
      setPointer(false);
      mutations.disconnect();
      intersection.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      fine.removeEventListener("change", apply);
    };
  }, []);

  const toggle = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    applyRef.current();
  };

  return (
    <>
      <div ref={layerRef} className="hero-field" aria-hidden="true">
        <div className="hero-field-poster" />
        <canvas ref={canvasRef} />
      </div>
      <div className="hero-field-row lg:col-span-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="label-meta m-0 text-muted-foreground">
          <span data-l="en">{caption("en")}</span> <span data-l="ru" lang="ru">{caption("ru")}</span>
        </p>
        {/* One signal for the state: the label names the action (pause or resume), so no aria-pressed.
            The 44px hit area is a ::after, so the row keeps its one-line height and the box covers nothing else. */}
        <button
          type="button"
          onClick={toggle}
          data-paused={paused || undefined}
          className="hero-field-pause relative label-meta inline-flex items-center justify-center min-w-[12ch] px-2 rounded-[2px] text-muted-foreground hover:text-foreground hover:underline underline-offset-4 data-paused:bg-muted data-paused:text-foreground transition-colors duration-150 cursor-pointer active:opacity-70 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']"
        >
          <T k={paused ? "hero.fieldResume" : "hero.fieldPause"} />
        </button>
      </div>
    </>
  );
}
