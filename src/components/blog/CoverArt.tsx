import { useId, useMemo, type CSSProperties } from "react";
import { COVER_H, COVER_W, coverArt, type CoverBlockArt } from "@/lib/cover";

/**
 * The post cover as an inline SVG (rule A8): one group per block of the outline,
 * its pixels split by dissolve rank and its rule or frame as one stroke, so CSS
 * can print it in, dim it and dissolve it without new files (theme.css, "Post cover").
 *
 * - `header`: prints in once, follows reading progress (`--read`, `--unread` on an
 *   ancestor) and reports the section under the pointer.
 * - `strip`: the blog list row; the late ranks dissolve in on row hover.
 * - `map`: the sticky TOC map, the header art turned to run top to bottom.
 */
export function CoverArt({
  outline,
  variant,
  className = "",
  style,
  hot = null,
  activeFigure = null,
  onHot,
  onBlock,
  slug,
}: {
  outline: string;
  variant: "header" | "strip" | "map";
  className?: string;
  style?: CSSProperties;
  /** The h2 section to keep at full ink; the others dim. */
  hot?: number | null;
  /** Index (in reading order) of the figure in view; its frame fills. */
  activeFigure?: number | null;
  onHot?: (section: number | null) => void;
  /** A click on a block: its section, and its figure index when it is a figure. */
  onBlock?: (section: number, figure: number | null) => void;
  /** Marks the strip and the header cover of one post, so a list-to-post swap can tell that the cover arrived (BlogListIsland). */
  slug?: string;
}) {
  const art = useMemo(() => coverArt(outline), [outline]);
  const mask = `cover-read-${useId().replace(/[^\w-]/g, "")}`;
  const vertical = variant === "map";
  const tracksProgress = variant !== "strip";

  return (
    <svg
      aria-hidden="true"
      viewBox={vertical ? `0 0 ${COVER_H} ${COVER_W}` : `0 0 ${COVER_W} ${COVER_H}`}
      shapeRendering="crispEdges"
      className={`cover-art cover-${variant} block ${className}`}
      data-cover-slug={slug}
      style={style}
      onPointerLeave={onHot && (() => onHot(null))}
    >
      {tracksProgress && (
        <defs>
          {/* Read columns keep full ink; the rest fall to --unread once reading starts. */}
          <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width={COVER_W} height={COVER_H}>
            <rect className="cover-unread" width={COVER_W} height={COVER_H} fill="#fff" />
            <rect className="cover-read" width={COVER_W} height={COVER_H} fill="#fff" />
          </mask>
        </defs>
      )}
      <g transform={vertical ? "matrix(0 1 1 0 0 0)" : undefined}>
        <g mask={tracksProgress ? `url(#${mask})` : undefined}>
          {art.map((b, i) => (
            <Block key={i} block={b} dim={hot !== null && b.section !== hot} active={b.figure >= 0 && b.figure === activeFigure} />
          ))}
        </g>
        {(onHot || onBlock) && <HitAreas art={art} onHot={onHot} onBlock={onBlock} />}
      </g>
    </svg>
  );
}

function Block({ block: b, dim, active }: { block: CoverBlockArt; dim: boolean; active: boolean }) {
  return (
    <g
      className="cover-block"
      data-dim={dim || undefined}
      data-active={active || undefined}
      style={{ "--x": (b.x0 / COVER_W).toFixed(3) } as CSSProperties}
    >
      {b.kind === "f" && (
        <rect className="cover-frame-fill" x={b.x0 + 1} y={6} width={Math.max(0, b.x1 - b.x0 - 2)} height={COVER_H - 7} />
      )}
      {b.stroke && <path className={b.kind === "h" ? "cover-stroke cover-rule" : "cover-stroke cover-frame"} pathLength={1} d={b.stroke} />}
      {b.ranks.map((d, r) =>
        d ? <path key={r} className="cover-px" data-late={r >= 2 || undefined} style={{ "--r": r } as CSSProperties} d={d} /> : null,
      )}
    </g>
  );
}

/** Transparent targets over each section and each figure frame, for the pointer only (the numbers are the keyboard path). */
function HitAreas({
  art,
  onHot,
  onBlock,
}: {
  art: CoverBlockArt[];
  onHot?: (section: number | null) => void;
  onBlock?: (section: number, figure: number | null) => void;
}) {
  const sections: { section: number; x0: number; x1: number }[] = [];
  for (const b of art) {
    const last = sections[sections.length - 1];
    if (last && last.section === b.section) last.x1 = b.x1;
    else sections.push({ section: b.section, x0: b.x0, x1: b.x1 });
  }
  const frames = art.filter((b) => b.figure >= 0);
  const target = { fill: "transparent", cursor: onBlock ? "pointer" : undefined } as const;
  return (
    <g className="cover-hit">
      {sections.map((s) => (
        <rect
          key={s.section}
          x={s.x0}
          y={0}
          width={s.x1 - s.x0 + 1}
          height={COVER_H}
          style={target}
          onPointerEnter={() => onHot?.(s.section >= 0 ? s.section : null)}
          onClick={() => onBlock?.(s.section, null)}
        />
      ))}
      {frames.map((f) => (
        <rect
          key={`f${f.figure}`}
          x={f.x0}
          y={5}
          width={f.x1 - f.x0}
          height={COVER_H - 5}
          style={target}
          onPointerEnter={() => onHot?.(f.section >= 0 ? f.section : null)}
          onClick={() => onBlock?.(f.section, f.figure)}
        />
      ))}
    </g>
  );
}
