import { m } from "motion/react";

export function AnimatedCheck({ size = 12 }: { size?: number }) {
  return (
    <m.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <m.path
        d="M5 12l5 5L20 7"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </m.svg>
  );
}
