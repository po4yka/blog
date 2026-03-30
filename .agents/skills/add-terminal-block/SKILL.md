---
name: add-terminal-block
description: "Create a new decorative MobileTerminal or Decoration component for the homepage. Use when adding CLI-style visual blocks that simulate developer tool output (build logs, profiler output, test results, lint output, etc.). Follows the MacWindow + motion + hover pattern."
user-invocable: true
argument-hint: "<block-name>"
---

# Add Terminal Block

Create a decorative terminal/CLI output component for the homepage. These are non-interactive visual blocks inside macOS-style windows that simulate real developer tool output.

## Component Anatomy

Every terminal block follows this structure:

```
MotionProvider
  section.space-y-4
    Cmd (command prompt header)
    MacWindow (macOS-style window frame)
      div[ref] (intersection observer target)
        motion.div (header/label row)
        motion.div[] (staggered data rows with hover)
        motion.div (footer/summary)
```

## Template

Create in `src/components/MobileTerminal/<name>.tsx` or `src/components/Decorations/<name>.tsx`:

```tsx
import { motion } from "motion/react";
import { useInView } from "@/components/useInView";
import { useState } from "react";
import { Cmd, Accent, MacWindow } from "@/components/Terminal";
import { MotionProvider } from "@/components/MotionProvider";
import { useCopy } from "./_helpers";

export function MyBlock({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { copiedText, copy } = useCopy();

  const items = [
    // Static data simulating real tool output
    { id: "item-1", label: "...", value: "..." },
    { id: "item-2", label: "...", value: "..." },
  ];

  return (
    <MotionProvider>
      <section className="space-y-4">
        {/* Command prompt */}
        <Cmd delay={delay}>
          tool-name <Accent>subcommand</Accent> --flag
        </Cmd>

        {/* Terminal output window */}
        <MacWindow title="tool — context" dimLights delay={delay + 0.05}>
          <div ref={ref}>
            {/* Optional header */}
            <motion.div
              className="text-muted-foreground/40 pb-2 text-mono"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.08 }}
            >
              Output header text
            </motion.div>

            {/* Data rows with hover + stagger */}
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="flex items-baseline gap-4 py-1 -mx-2 px-2 cursor-pointer text-mono rounded-[4px]"
                style={{
                  lineHeight: 1.7,
                  backgroundColor:
                    hoveredId === item.id
                      ? "rgba(139, 124, 246, 0.05)"
                      : "transparent",
                  transition: "background-color 0.15s ease",
                }}
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: delay + 0.12 + i * 0.05 }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => copy(item.label)}
                title="Click to copy"
              >
                <span className="text-foreground/60 shrink-0">
                  {item.label}
                  {copiedText === item.label && (
                    <span className="text-accent/60 ml-2 text-xs">copied!</span>
                  )}
                </span>
                <span className="text-muted-foreground/35">{item.value}</span>
              </motion.div>
            ))}

            {/* Optional footer */}
            <motion.div
              className="text-muted-foreground/25 pt-2 text-mono-sm"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.3 }}
            >
              Summary line
            </motion.div>
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}
```

## Required Imports

| Import | From | Purpose |
|--------|------|---------|
| `motion` | `motion/react` | Animation primitives |
| `useInView` | `@/components/useInView` | Scroll-triggered animation |
| `useState` | `react` | Hover state tracking |
| `Cmd, Accent, MacWindow` | `@/components/Terminal` | Terminal UI primitives |
| `MotionProvider` | `@/components/MotionProvider` | Motion context (respects reduceMotion) |
| `useCopy` | `./_helpers` | Click-to-copy utility |

## Animation Timing

- `delay` prop: base delay passed from parent, offsets all animations
- `Cmd`: receives `delay` directly
- `MacWindow`: receives `delay + 0.05`
- Header row: `delay + 0.08`
- Data rows: `delay + 0.12 + i * 0.05` (0.05s stagger between rows)
- Footer: `delay + 0.3` (appears after all rows)
- `useInView(0.1)`: triggers when 10% of the element is visible
- Row entrance: `opacity: 0, x: -4` -> `opacity: 1, x: 0` (subtle left-to-right slide)

## Hover State

Each row highlights on hover with the project accent color at 5% opacity:

```tsx
backgroundColor: hoveredId === item.id ? "rgba(139, 124, 246, 0.05)" : "transparent"
```

Use `useState<string | null>(null)` to track which item is hovered. The `transition: "background-color 0.15s ease"` inline style handles the fade.

## Color Conventions

| Purpose | Class/Variable |
|---------|---------------|
| Primary text | `text-foreground/60` |
| Muted text | `text-muted-foreground/35` |
| Very muted | `text-muted-foreground/25` |
| Header/label | `text-muted-foreground/40` |
| Success/green | `var(--signal-green)` with `opacity: 0.7` |
| Warning/yellow | `var(--signal-yellow)` |
| Info/blue | `var(--info)` |
| Accent highlight | `text-accent/60` |
| Mono text | `text-mono` or `text-mono-sm` classes |

## Content Guidelines

- Use **real mobile development tool output** formats (not generic placeholder data)
- Good subjects: `adb`, `gradle`, `xcodebuild`, `fastlane`, `git log`, `ktlint`, `swiftlint`, `cocoapods`, `spm`, `detekt`, `android-lint`, `firebase`, `flipper`
- Data should look believable -- use realistic package names, version numbers, file paths
- Keep 3-8 rows of output (enough to feel real, not so many it overwhelms)
- Include a command header (`Cmd`) and a summary footer line

## Integration

1. **Export** from the barrel file:
   - MobileTerminal blocks: `src/components/MobileTerminal/index.ts`
   - Decoration blocks: `src/components/Decorations/index.ts`

2. **Add to page** in `src/pages/index.astro`:
   ```astro
   <div data-section-name="my-block">
     <MyBlock client:visible delay={0.05} />
   </div>
   ```

3. Terminal blocks typically do NOT use `section-reveal` class (they have their own motion).

4. For side-by-side layout:
   ```astro
   <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" data-section-name="pair">
     <BlockA client:visible delay={0.05} />
     <BlockB client:visible delay={0.1} />
   </div>
   ```

## Checklist

- [ ] Component created in `MobileTerminal/` or `Decorations/`
- [ ] Uses `MotionProvider`, `Cmd`, `MacWindow`, `useInView` pattern
- [ ] Hover state with accent color at 5% opacity
- [ ] Click-to-copy via `useCopy` hook
- [ ] Staggered row animations with `delay + offset + i * 0.05`
- [ ] Exported from barrel file
- [ ] Added to `index.astro` with `client:visible` + `delay` prop
- [ ] Content uses real mobile dev tool output format
- [ ] TypeScript compiles: `npx astro check`
