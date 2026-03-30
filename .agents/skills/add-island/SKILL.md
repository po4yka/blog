---
name: add-island
description: "Add a new React island component to an Astro page with correct hydration strategy, SSR guards, and motion patterns. Use when creating any new interactive section for the public site. Prevents hydration mismatches and ensures consistent animation integration."
user-invocable: true
argument-hint: "<component-name>"
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
import { motion } from "motion/react";
import { useInView } from "@/components/useInView";
import { MotionProvider } from "@/components/MotionProvider";

interface Props {
  delay?: number;
}

export function MySection({ delay = 0 }: Props) {
  const { ref, inView } = useInView(0.1);

  return (
    <MotionProvider>
      <section ref={ref} className="space-y-6">
        <motion.h2
          className="text-lg font-semibold"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay }}
        >
          Section Title
        </motion.h2>
        {/* Content with staggered animations */}
      </section>
    </MotionProvider>
  );
}
```

Conventions:
- Accept an optional `delay` prop for staggered section reveals
- Use `useInView(0.1)` for scroll-triggered animation (0.1 = 10% visible threshold)
- Wrap in `MotionProvider` for motion context (handles `reduceMotion` preference)
- Use `motion/react` (not `framer-motion`) -- this is the current import path

## Astro Page Integration

Add the island to an `.astro` page (e.g., `src/pages/index.astro`):

```astro
---
import { MySection } from "@/components/MySection";
---
<div class="section-reveal" data-section-name="my-section" style="transition-delay:0.3s">
  <MySection client:visible delay={0.05} />
</div>
```

Integration rules:
- Wrap in a `div` with `class="section-reveal"` for CSS scroll-reveal animation
- Add `data-section-name` attribute for identification (used by scroll observer)
- Set `style="transition-delay:Xs"` -- increment by ~0.05s from the previous section
- Pass `delay` prop for internal motion staggering
- Decorative/non-content sections (terminal blocks, strips) can omit `section-reveal`

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
    <Suspense fallback={<div className="h-40" />}>
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
- Shared utilities: `src/components/useInView.ts`, `src/components/MotionProvider.tsx`
- UI primitives: `src/components/ui/` (shadcn/ui components)

## Checklist

- [ ] Component created in `src/components/`
- [ ] Correct `client:*` directive chosen and applied
- [ ] `MotionProvider` wrapper for animated content
- [ ] `useInView` for scroll-triggered reveals
- [ ] `section-reveal` + `data-section-name` on Astro wrapper
- [ ] No browser API access during initial render (SSR safe)
- [ ] Props are serializable (primitives only from Astro)
- [ ] TypeScript compiles: `npx astro check`
