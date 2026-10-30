import type { ComponentPropsWithRef, CSSProperties, ElementType } from "react";

type RevealOwnProps<T extends ElementType> = {
  /** Element or component to render; defaults to div. Its props are accepted too. */
  as?: T;
  /** Seconds, like Motion's `delay`. Staggers are the caller's `delay + i * stagger.*`. */
  delay?: number;
  /** --dur-fast, --dur-base or --dur-slow. */
  speed?: "fast" | "base" | "slow";
  /** No fade at all, for above-the-fold LCP content. */
  instant?: boolean;
};

type RevealProps<T extends ElementType> = RevealOwnProps<T> &
  Omit<ComponentPropsWithRef<T>, keyof RevealOwnProps<T>>;

/**
 * CSS-only entrance fade (primitives.css): the static HTML is already in its
 * final state, and `@starting-style` fades it in on first render. Without JS,
 * without @starting-style support or under reduced motion it simply shows.
 */
export function Reveal<T extends ElementType = "div">({
  as,
  delay = 0,
  speed = "base",
  instant = false,
  style,
  ...rest
}: RevealProps<T>) {
  const Tag: ElementType = as ?? "div";
  if (instant) return <Tag style={style} {...rest} />;
  const withDelay = delay > 0 ? ({ ...style, "--reveal-delay": `${Math.round(delay * 1000)}ms` } as CSSProperties) : style;
  return <Tag data-reveal={speed} style={withDelay} {...rest} />;
}
