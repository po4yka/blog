---
name: add-island
description: "Add a React island to an Astro page: client:* directive, SSR-safe first render, project motion pattern. Not for admin SPA pages or static content."
---

# Add React Island

Create a new interactive React component (island) and integrate it into an Astro page with correct hydration.

## Hydration Directive Decision

Choose the right `client:*` directive:

| Directive | When to use | Examples |
|-----------|-------------|----------|
| `client:visible` | **Default choice.** Component below the fold or not immediately interactive. | Most homepage sections, decorations, terminal blocks |
| `client:load` | Critical interactivity needed immediately on page load. Above-the-fold interactive content. | Blog post navigation, settings panel, search |
| `client:idle` | Low-priority widget. Can wait until browser is idle. | Analytics widgets, non-essential features |
| No directive | Static content. No JavaScript needed. | Pure display components rendered in `.astro` files |

When unsure, use `client:visible` -- it is the project default.

## Component Structure

Create the component in `src/components/`:

```tsx
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/SectionHeader";

interface Props {
  delay?: number;
}

export function MySection({ delay = 0 }: Props) {
  return (
    <Reveal as="section" delay={delay} className="space-y-6">
      <SectionHeader number="NN" label="LABEL" heading="Section title" meta="…" />
      {/* Content */}
    </Reveal>
  );
}
```

Conventions:
- Accept an optional `delay` prop for staggered section reveals. It is in seconds, like Motion's `delay`
- Use `<Reveal>` from `src/components/ui/Reveal` for entrance fades. It is a CSS fade on first render. It does not wait for scroll
- `Reveal` props: `as` (element or component, default `div`), `delay` (seconds), `speed` (`fast`, `base`, `slow`), `instant` (no fade, for above-the-fold LCP content)
- Do not hide content at `opacity: 0` in the server HTML, and do not hide content and wait for scroll (rule A2). Scroll-linked effects use CSS `animation-timeline` under rule A2
- Use `motion/react` (not `framer-motion`) only for state transitions in the `DESIGN.md` section 9 permitted list. Wrap that code in `MotionProvider` (it handles the `reduceMotion` preference)

## Astro Page Integration

Add the island to an `.astro` page (e.g., `src/pages/index.astro`):

```astro
---
import { MySection } from "@/components/MySection";
---
<div data-section-name="my-section">
  <MySection client:visible delay={0.05} />
</div>
```

Integration rules:
- Wrap in a `div` with a `data-section-name` attribute, matching the other sections in `src/pages/index.astro`
- Pass `delay` prop for internal motion staggering

## SSR Guards

React islands render on the server first, then hydrate on the client. Browser-only APIs will crash during SSR.

### Window/Document access

```tsx
// Guard with typeof check
const isDark = typeof window !== "undefined"
  ? window.matchMedia("(prefers-color-scheme: dark)").matches
  : true;
```

### Zustand store access

The settings store (`src/stores/settingsStore.ts`) uses `persist` middleware with localStorage. During SSR, the store returns defaults. This is safe -- no guard needed for reading store values. But DOM side-effects (like `document.documentElement.classList`) must be guarded:

```tsx
import { useSettingsStore } from "@/stores/settingsStore";

function MyComponent() {
  // Safe: returns default during SSR, hydrates with persisted value
  const theme = useSettingsStore((s) => s.theme);

  // NOT safe without guard -- useEffect only runs client-side, so this is fine:
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
}
```

### Lazy imports

For components that rely heavily on browser APIs, use React.lazy:

```tsx
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => import("./HeavyComponent"));

export function Wrapper() {
  return (
    <Suspense fallback={null}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## Common Pitfalls

1. **Missing `client:*` directive**: Component renders server HTML but never hydrates. No error shown -- it just silently does not become interactive.

2. **Importing server-only code**: Islands cannot import Astro APIs (`Astro.glob`, content collections). Keep island components pure React.

3. **Hydration mismatch**: Server and client render different HTML. Most common cause: reading `window` or `localStorage` during initial render. Use `useEffect` or `useState` with lazy init:
   ```tsx
   const [value, setValue] = useState<string | null>(null);
   useEffect(() => { setValue(localStorage.getItem("key")); }, []);
   ```

4. **Large island boundaries**: Each island is a separate React root. Avoid wrapping entire pages in a single island -- keep islands small and focused.

5. **Passing non-serializable props**: Astro serializes props to HTML attributes. Functions, Dates, and class instances cannot be passed from `.astro` to `client:*` components.

## File Naming

- Page-level interactive sections: `src/components/<Name>.tsx` or `src/components/<Name>Island.tsx`
- Shared utilities: `src/components/ui/Reveal.tsx`, `src/components/MotionProvider.tsx`
- UI primitives: `src/components/ui/` (dialog, sonner, utils)

## Checklist

- [ ] Component created in `src/components/`
- [ ] Correct `client:*` directive chosen and applied
- [ ] `<Reveal>` for entrance fades; `MotionProvider` only around `motion/react` state transitions
- [ ] `data-section-name` on the Astro wrapper
- [ ] No browser API access during initial render (SSR safe)
- [ ] Props are serializable (primitives only from Astro)
- [ ] `npm run typecheck` passes; the island renders in `npm run build && npm run preview` with no hydration warnings in the console
