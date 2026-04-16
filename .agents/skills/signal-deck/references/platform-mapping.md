# Signal Deck -- Platform Mapping

How to implement the design system across platforms while preserving the same visual language.

**Core principle:** The system should feel identical in character across platforms. Same hierarchy, same restraint, same signal logic. Platform-specific idioms (native controls, navigation patterns) are respected, but the visual voice stays consistent.

---

## 1. HTML / CSS / WEB

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS Custom Properties (Dark Mode Default)

```css
:root {
  /* Background & Surface */
  --bg: #0A0A0C;
  --surface: #131316;
  --surface-raised: #1C1C20;

  /* Borders */
  --border: #1F1F24;
  --border-visible: #2E2E35;

  /* Text */
  --text-muted: #4A4A55;
  --text-secondary: #8A8A96;
  --text-primary: #D8D8DE;
  --text-display: #F0F0F4;

  /* Signal Accent (choose one, comment others) */
  --signal: #39FF85;          /* Phosphor Green */
  /* --signal: #FFB833; */    /* Amber */
  /* --signal: #5BA8FF; */    /* Cool Blue */
  --signal-subtle: color-mix(in srgb, var(--signal) 12%, transparent);

  /* Status */
  --status-ok: #3DB86A;
  --status-warn: #D4A32C;
  --status-error: #D83B4D;

  /* Typography */
  --font-display: 'IBM Plex Mono', 'JetBrains Mono', 'SF Mono', monospace;
  --font-body: 'Inter', 'DM Sans', system-ui, sans-serif;
  --font-data: 'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', monospace;

  /* Spacing */
  --space-1: 2px;
  --space-2: 4px;
  --space-3: 8px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  /* Radius */
  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --radius-pill: 999px;

  /* Motion */
  --ease-out: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-step: steps(4, end);
  --ease-instant: steps(1, end);
  --duration-micro: 100ms;
  --duration-standard: 200ms;
  --duration-sequence: 40ms;
}
```

### Light Mode Override

```css
[data-theme="light"], .light {
  --bg: #F4F4F6;
  --surface: #FFFFFF;
  --surface-raised: #EDEDF0;
  --border: #E0E0E4;
  --border-visible: #C8C8CE;
  --text-muted: #A0A0AA;
  --text-secondary: #6A6A76;
  --text-primary: #1A1A1E;
  --text-display: #08080A;
}
```

Or use `prefers-color-scheme`:

```css
@media (prefers-color-scheme: light) {
  :root { /* light values here */ }
}
```

### Utility Classes

```css
/* Labels */
.label {
  font-family: var(--font-data);
  font-size: 11px;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

/* Signal glow */
.signal-glow {
  color: var(--signal);
  text-shadow: 0 0 8px color-mix(in srgb, var(--signal) 30%, transparent);
}

/* Dot grid */
.dot-grid {
  background-image: radial-gradient(circle, var(--border-visible) 1px, transparent 1px);
  background-size: 16px 16px;
}

/* Scanline accent */
.scanline-accent {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    color-mix(in srgb, var(--signal) 4%, transparent) 2px,
    color-mix(in srgb, var(--signal) 4%, transparent) 4px
  );
}

/* Status brackets */
.status-ok::before { content: '[OK] '; color: var(--status-ok); }
.status-err::before { content: '[!!] '; color: var(--status-error); }
.status-load::before { content: '[..] '; color: var(--text-muted); }
.status-info::before { content: '[--] '; color: var(--text-secondary); }
.status-active::before { content: '[>>] '; color: var(--signal); }

/* Cursor blink */
.cursor-blink {
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Segmented spinner */
@keyframes segmented-spin {
  to { transform: rotate(360deg); }
}
.segmented-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--text-display);
  border-radius: 50%;
  animation: segmented-spin 1s steps(8) infinite;
}
```

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | < 640px | Single column. Status-line at bottom. Instrument panels stack. |
| Tablet | 640-1024px | 2-column grids. Side-by-side panels where space allows. |
| Desktop | > 1024px | Full layout. 80-120 character columns. Side panels. |

Max content width: 1080px. Instrument panels can extend to full viewport width for dashboard layouts.

---

## 2. REACT / TAILWIND CSS

### Tailwind Config Extensions

```js
// tailwind.config.js (or inline in v4)
{
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        'border-visible': 'var(--border-visible)',
        'text-muted': 'var(--text-muted)',
        'text-secondary': 'var(--text-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-display': 'var(--text-display)',
        signal: 'var(--signal)',
        'signal-subtle': 'var(--signal-subtle)',
        'status-ok': 'var(--status-ok)',
        'status-warn': 'var(--status-warn)',
        'status-error': 'var(--status-error)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        data: 'var(--font-data)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
    },
  },
}
```

### Component Patterns (React + Tailwind)

**Label component:**
```tsx
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-data text-[11px] leading-tight tracking-[0.08em] uppercase text-text-secondary">
      {children}
    </span>
  );
}
```

**Status bracket:**
```tsx
function StatusBracket({ status, children }: { status: 'ok' | 'err' | 'load' | 'info' | 'active'; children: React.ReactNode }) {
  const prefixMap = {
    ok: { text: '[OK]', color: 'text-status-ok' },
    err: { text: '[!!]', color: 'text-status-error' },
    load: { text: '[..]', color: 'text-text-muted' },
    info: { text: '[--]', color: 'text-text-secondary' },
    active: { text: '[>>]', color: 'text-signal' },
  };
  const { text, color } = prefixMap[status];
  return (
    <span className="font-data text-xs">
      <span className={color}>{text}</span>{' '}
      <span className="text-text-primary">{children}</span>
    </span>
  );
}
```

**Stat row:**
```tsx
function StatRow({ label, value, status }: { label: string; value: string; status?: 'ok' | 'warn' | 'error' }) {
  const statusColor = status ? `text-status-${status}` : 'text-text-primary';
  return (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <Label>{label}</Label>
      <span className={`font-data text-sm ${statusColor}`}>{value}</span>
    </div>
  );
}
```

**Segmented bar:**
```tsx
function SegmentedBar({ value, max, segments = 20, status = 'neutral' }: {
  value: number; max: number; segments?: number; status?: 'neutral' | 'ok' | 'warn' | 'error';
}) {
  const filled = Math.round((value / max) * segments);
  const colorMap = { neutral: 'bg-text-display', ok: 'bg-status-ok', warn: 'bg-status-warn', error: 'bg-status-error' };
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 ${i < filled ? colorMap[status] : 'bg-border'}`}
        />
      ))}
    </div>
  );
}
```

---

## 3. SWIFTUI / iOS

### Font Registration

Bundle `IBMPlexMono-Light.ttf`, `IBMPlexMono-Regular.ttf`, `IBMPlexMono-Medium.ttf`, `JetBrainsMono-Regular.ttf`, `JetBrainsMono-Medium.ttf` in app. Register in Info.plist under `UIAppFonts`. Inter is available as a system-installable variable font or bundled.

### Color Extension

```swift
extension Color {
    // Dark mode values (use with @Environment(\.colorScheme))
    static let sdBg = Color(hex: "0A0A0C")
    static let sdSurface = Color(hex: "131316")
    static let sdSurfaceRaised = Color(hex: "1C1C20")
    static let sdBorder = Color(hex: "1F1F24")
    static let sdBorderVisible = Color(hex: "2E2E35")
    static let sdTextMuted = Color(hex: "4A4A55")
    static let sdTextSecondary = Color(hex: "8A8A96")
    static let sdTextPrimary = Color(hex: "D8D8DE")
    static let sdTextDisplay = Color(hex: "F0F0F4")
    static let sdSignal = Color(hex: "39FF85")       // Phosphor Green
    static let sdStatusOk = Color(hex: "3DB86A")
    static let sdStatusWarn = Color(hex: "D4A32C")
    static let sdStatusError = Color(hex: "D83B4D")
}
```

### Pattern Examples

```swift
// Label style
Text("SYSTEM STATUS")
    .font(.custom("JetBrainsMono-Regular", size: 11))
    .tracking(0.88) // 0.08em * 11
    .textCase(.uppercase)
    .foregroundColor(.sdTextSecondary)

// Hero metric
Text("2.4GHz")
    .font(.custom("IBMPlexMono-Light", size: 48))
    .tracking(-0.96) // -0.02em * 48
    .foregroundColor(.sdTextDisplay)

// Status bracket
HStack(spacing: 4) {
    Text("[OK]").foregroundColor(.sdStatusOk)
    Text("Connected").foregroundColor(.sdTextPrimary)
}
.font(.custom("JetBrainsMono-Regular", size: 12))
```

### Key SwiftUI Conventions

- Use `ZStack` with `.background()` for surface cards -- never `.shadow()`.
- Borders via `.overlay(RoundedRectangle(...).stroke(...))`.
- Use `@Environment(\.colorScheme)` to switch dark/light token sets.
- Respect Dynamic Type: allow font sizes to scale, but cap display sizes to prevent layout breakage.
- Safe area: status-line component should respect `.safeAreaInset(edge: .bottom)`.

---

## 4. JETPACK COMPOSE / ANDROID

### Theme Setup

```kotlin
object SignalDeckColors {
    // Dark
    val bg = Color(0xFF0A0A0C)
    val surface = Color(0xFF131316)
    val surfaceRaised = Color(0xFF1C1C20)
    val border = Color(0xFF1F1F24)
    val borderVisible = Color(0xFF2E2E35)
    val textMuted = Color(0xFF4A4A55)
    val textSecondary = Color(0xFF8A8A96)
    val textPrimary = Color(0xFFD8D8DE)
    val textDisplay = Color(0xFFF0F0F4)
    val signal = Color(0xFF39FF85)
    val statusOk = Color(0xFF3DB86A)
    val statusWarn = Color(0xFFD4A32C)
    val statusError = Color(0xFFD83B4D)
}

object SignalDeckTypography {
    val display = FontFamily(Font(R.font.ibm_plex_mono_light, FontWeight.Light))
    val body = FontFamily(Font(R.font.inter_regular, FontWeight.Normal))
    val data = FontFamily(Font(R.font.jetbrains_mono_regular, FontWeight.Normal))

    val label = TextStyle(
        fontFamily = data,
        fontSize = 11.sp,
        letterSpacing = 0.88.sp,
        lineHeight = 13.2.sp,
    )
}
```

### Key Compose Conventions

- Cards: `Surface(color = SignalDeckColors.surface, border = BorderStroke(1.dp, SignalDeckColors.border), shape = RoundedCornerShape(8.dp))`. No `elevation`.
- Dividers: `Divider(color = SignalDeckColors.border, thickness = 1.dp)`.
- Use `isSystemInDarkTheme()` to select token sets.
- Touch targets: `Modifier.defaultMinSize(minHeight = 44.dp)`.
- Status bar: transparent with matching `--bg` color via `WindowCompat.setDecorFitsSystemWindows`.

---

## 5. DESIGN TOOLS / STATIC MOCKUPS

### Setup Process

1. Create document with `--bg` background color.
2. Set up color styles for all tokens.
3. Create text styles for each type scale entry.
4. Build component library: label, stat-row, button variants, segmented bar, status-line.

### Grid Setup

- Layout grid: 8px baseline grid.
- Character-cell overlay: 8px columns for mono-aligned zones.
- Max content width: 1080px with 24px side margins.

### Mockup Conventions

- Dark mode as primary artboard.
- Light mode as a separate artboard (not derived/inverted).
- Export: 2x PNG for review, SVG for icons.
- Annotate: use `--label` style for dimension callouts and token references.

---

## Cross-Platform Rules

These hold regardless of platform:

1. **Same three fonts** (or platform equivalents) everywhere.
2. **Same grayscale hierarchy** -- 4 text levels, same relative contrast.
3. **Same signal accent** -- one color, same usage rules.
4. **Same component anatomy** -- a stat-row looks like a stat-row on every platform.
5. **No shadows anywhere.** Elevation through color shift and borders.
6. **Labels always mono, ALL CAPS, letterspaced.** This is the visual signature.
7. **Status brackets** (`[OK]`, `[!!]`) work on every platform as inline text.
8. **Segmented bars** use discrete blocks with gaps, not smooth fills.
9. **Motion is discrete** -- `steps()` easing, mechanical feel, no spring physics.
10. **Platform-native controls** (toggles, pickers, sheets) are acceptable when they follow the token values. Do not fight the platform for controls; fight it for surfaces and hierarchy.
