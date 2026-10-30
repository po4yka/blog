import type { ComponentPropsWithRef, CSSProperties, ElementType } from "react";
import type { PanelProps } from "./Panel";

type RevealProps = ComponentPropsWithRef<"div"> &
  Pick<PanelProps, "tone" | "clip"> & {
    /** Element or component to render; defaults to div. Pass tone/clip when it is Panel. */
    as?: ElementType;
    /** Seconds, like Motion's `delay`. Staggers are the caller's `delay + i * stagger.*`. */
    delay?: number;
    /** --dur-fast, --dur-base or --dur-slow. */
    speed?: "fast" | "base" | "slow";
    /** No fade at all, for above-the-fold LCP content. */
    instant?: boolean;
  };

/**
 * CSS-only entrance fade (primitives.css): the static HTML is already in its
 * final state, and `@starting-style` fades it in on first render. Without JS,
 * without @starting-style support or under reduced motion it simply shows.
 */
export function Reveal({ as: Tag = "div", delay = 0, speed = "base", instant = false, style, ...rest }: RevealProps) {
  if (instant) return <Tag style={style} {...rest} />;
  const withDelay = delay > 0 ? ({ ...style, "--reveal-delay": `${Math.round(delay * 1000)}ms` } as CSSProperties) : style;
  return <Tag data-reveal={speed} style={withDelay} {...rest} />;
}
