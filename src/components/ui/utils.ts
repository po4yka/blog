import type { CSSProperties } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Paint `currentColor` through an SVG mask: generated 1-bit art takes the text colour in both themes. */
export function maskStyle(url: string): CSSProperties {
  return {
    backgroundColor: "currentColor",
    maskImage: `url(${url})`,
    WebkitMaskImage: `url(${url})`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
  };
}
