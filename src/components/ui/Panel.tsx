import type { ComponentPropsWithRef } from "react";

export type PanelProps = ComponentPropsWithRef<"div"> & {
  /** solid = var(--card); translucent = var(--panel-bg), for panels over the page grain. */
  tone?: "solid" | "translucent";
  /**
   * hidden (default) clips to the frame; clip clips without creating a scroll
   * container, so position: sticky children keep working; visible does not clip.
   */
  clip?: "hidden" | "clip" | "visible";
};

/** Flat operator panel: 1px var(--border), 2px radius, no shadow. Styles in primitives.css. */
export function Panel({ tone = "solid", clip = "hidden", className, ...rest }: PanelProps) {
  return <div data-tone={tone} data-clip={clip} className={className ? `panel ${className}` : "panel"} {...rest} />;
}
