import type { CSSProperties } from "react";

const mask = (url: string): CSSProperties => ({
  backgroundColor: "currentColor",
  maskImage: `url(${url})`,
  WebkitMaskImage: `url(${url})`,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
});

/**
 * 1-bit identity mark from `public/plates/` (scripts/generate-plates.ts). The
 * SVGs are masks, so the mark takes the text colour in both themes. On hover
 * or keyboard focus of the nearest `.group`, the extra pixels of the denser
 * plate fade in: opacity only, the box never changes size.
 */
export function Plate({ slug, size, className = "" }: { slug: string; size: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative shrink-0 text-foreground/55 group-hover:text-foreground/80 group-focus-visible:text-foreground/80 transition-colors duration-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0" style={mask(`/plates/${slug}.svg`)} />
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200"
        style={mask(`/plates/${slug}.hover.svg`)}
      />
    </span>
  );
}
