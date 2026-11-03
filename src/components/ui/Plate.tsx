import { useMemo, type CSSProperties } from "react";
import { PLATE_SIZE, plateArt } from "@/lib/plate";

/**
 * 1-bit identity mark (src/lib/plate.ts) as an inline SVG in the text colour.
 * On hover or keyboard focus of the nearest `.group`, the denser inside
 * dissolves in one Bayer rank at a time (theme.css): opacity only, the box
 * never changes size.
 */
export function Plate({ slug, platform, size, className = "" }: { slug: string; platform?: string; size: number; className?: string }) {
  const art = useMemo(() => plateArt(slug, platform), [slug, platform]);
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${PLATE_SIZE} ${PLATE_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`plate-art shrink-0 text-foreground/55 group-hover:text-foreground/80 group-focus-visible:text-foreground/80 transition-colors duration-200 ${className}`}
    >
      <path d={art.rest} />
      {art.late.map((d, r) => (d ? <path key={r} className="plate-late" style={{ "--r": r } as CSSProperties} d={d} /> : null))}
    </svg>
  );
}
