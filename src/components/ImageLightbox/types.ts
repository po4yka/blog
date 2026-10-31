import type { VariantSource } from "@/lib/blog/lightbox";

export interface Figure {
  sources: VariantSource[];
  fallbackSrc: string;
  alt: string;
  caption: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface IndexedFigure extends Figure {
  img: HTMLImageElement;
}
