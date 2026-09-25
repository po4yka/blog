---
name: add-data-panel
description: "Add a homepage operator panel (PanelShell in src/components/Decorations/) backed by a real data source: build-time data files or a /api/* fetch. Use when adding or reworking a hero or sidebar panel. Not for fabricated terminal or CLI output, which the design system forbids."
---

# Add Data Panel

Homepage panels are small, flat operator widgets that show real data. `DESIGN.md` section 10 lists the deleted fake widgets (CPU monitors, fabricated CI output, hardcoded git logs) and the real-data panels that replaced them. If there is no real data source for the idea, stop and say so instead of building a placeholder.

## Pick the data path

- **Build-time data** (`@/data/blogMeta`, `@/data/buildMeta`, `@/data/projectsData`): import synchronously and render directly. Import the component directly in the parent island (no `React.lazy`, no `Suspense`) so its content is in the prerendered HTML. Reference: `LatestPostPanel.tsx`, `BuildStats.tsx`.
- **Runtime data** (`/api/github/*` or browser APIs): fetch in `useEffect` (defer with `deferIdle` from `./_utils`), keep an explicit `undefined` loading state and `null` empty state, render nothing or a `.loading-bracket` while loading. Lazy-load it from the parent with `React.lazy` + `<Suspense fallback={null}>`. Reference: `LatestReleasePanel.tsx`, `ActivitySparkline.tsx`.

Client code imports post metadata from `@/data/blogMeta`, never `@/data/blogData`.

## Shape

```tsx
import { PanelShell } from "./_helpers";

export function MyPanel({ delay = 0 }: { delay?: number }) {
  const data = /* real source */;
  if (!data) return null;

  return (
    <PanelShell label="LABEL" labelRight={/* short mono context */} delay={delay}>
      <div className="px-5 py-3.5">{/* content */}</div>
    </PanelShell>
  );
}
```

`PanelShell` already provides the border, 2px radius, header row, drawn rule, and the in-view fade, so do not add another motion wrapper. Export the panel from `src/components/Decorations/index.ts` if it is imported through the barrel, and place it in `Hero.tsx` or the relevant page island.

## Rules that are easy to miss

- Labels use `.label-meta`; numbers use `tabular-nums`; colors come from tokens (`text-muted-foreground`, `text-muted-foreground-dim`, `text-foreground/85`). No accent colors, shadows, pulse loops, or hover geometry changes.
- Panels are secondary content: hide on small screens (`hidden sm:block`) unless the panel carries primary content.
- Links inside panels need a descriptive `aria-label` and a 44px touch target on mobile.

## Done when

- The panel renders real data from the chosen source and handles empty and loading states.
- `npm run typecheck` passes, and `npm run build && npm run preview` shows the panel at mobile and desktop widths with no console errors.
