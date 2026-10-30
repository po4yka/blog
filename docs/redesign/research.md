# Redesign research

This file holds the web research for the po4yka.dev redesign. It keeps only what applies to a monochrome operator-console site on Astro 7, React 19 islands, Tailwind 4, Motion 13 and Cloudflare Workers. The plan that uses this research is in `docs/redesign/PLAN.md`.

Confidence tags: **[verified]** means the claim came from an official page or a source that was read. **[secondary]** means it came from a blog or search summary. **[unverified]** means it comes from prior knowledge and needs a check on MDN, caniuse or the library docs before the team depends on it. Page fetches returned text only, so claims about how a site looks or moves are inferred, not observed. Open the live sites in a browser before copying any detail. Exemplar rows marked [secondary] (for example Linear and Muzli) were not opened live; do not copy a detail from them until you have opened the live site.

## 1. Exemplars

| Site | What to take | What to leave |
|---|---|---|
| [Vercel Geist](https://vercel.com/geist/introduction) | The visible grid is part of the look. Geist Sans plus Geist Mono, high-contrast neutral color, hairline structure. [verified] | Nothing. The site already uses Geist. |
| [Rauno Freiberg](https://rauno.me) | Craft in micro-interactions, click-to-copy with inline "Copied" feedback, links to archived earlier versions of the site. [verified for copy and archive links] | Cursor-aware details that move geometry. |
| [Emil Kowalski](https://emilkowal.ski) | Restraint. Motion under about 300 ms with strong ease-out curves, only where it carries meaning. [verified for the writing titles, restraint is inferred] | Nothing. |
| [Paco Coursey](https://paco.me) | Speed as the aesthetic, near-zero JS, the author of cmdk. [secondary] | Nothing. |
| [Cursor](https://cursor.com) | The hero demo is a coded UI replica with realistic task lists and status text, not a video. [verified] | Any invented task data. Our version uses real commits and builds only. |
| [teenage.engineering](https://teenage.engineering) | Hardware-label voice: model, revision, serial style tiny caps. [verified for tone] | The playful copy. |
| [Are.na](https://www.are.na) | Numbered steps, tags as chips, one typeface with character. [verified] | A new display font. Fonts are fixed by `DESIGN.md`. |
| [basement.studio](https://basement.studio) | Restrained WebGL and shader work as one signature moment. It designed the Geist typeface. [verified for the services, shader use is recalled] | Full 3D scenes. |
| [Linear](https://linear.app) | A 2025 site that cut back on color; a hairline light sweep on panel edges. [secondary, not fetched] | Edge glow. A glow breaks the flat-panel rule. |
| [Gwern](https://gwern.net/sidenote), [Vincent Bernat](https://vincent.bernat.ch/en/blog/2026-css-sidenotes), [Tufte CSS](https://edwardtufte.github.io/tufte-css/) | Sidenotes and footnote popups for long reading. [verified] | Tufte CSS itself. It only takes inline content. |
| [Maxime Heckel](https://blog.maximeheckel.com) | Interactive demos inside posts, dithering write-ups. [secondary] | Nothing. |

Gallery searches (Awwwards, Godly, minimal.gallery) returned no useful named winners. One lead worth opening is [Muzli: 100 best designer portfolios of 2026](https://muz.li/blog/top-100-most-creative-and-unique-portfolio-websites-of-2025/).

## 2. Visual techniques that fit a monochrome console

### Dithering and ASCII

- Ordered Bayer dither can be computed in the fragment shader with no texture. It runs fully on the GPU because each cell is independent. [verified in Codrops]
  - [Codrops: Real-Time Dithering Shader](https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/)
  - [Codrops: Interactive WebGL backgrounds with Bayer dithering](https://tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/)
  - [Codrops: efecto ASCII and dithering](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders), which also describes a Canvas 2D fallback.
  - [Maxime Heckel: dithering and retro shading](https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web) compares Bayer with blue noise.
- Floyd-Steinberg is serial, so it fits a build script better than a shader. Run it once and ship a 1-bit PNG or SVG with zero runtime JS. [secondary]
- For ASCII, the best fit is a build-time conversion to a real `<pre>` block in Geist Mono. It is crawlable text and costs 0 KB of JS. Per-frame rewriting of a large `<pre>` is expensive, so animate with canvas if it must move. [secondary]
- Halftone and dither read as two forms of one idea. Pick one as the signature.

### Grain and SVG filters

- Animated `feTurbulence` is slow on iOS and in WebKit ([GreenSock thread](https://greensock.com/forums/topic/33075-gsap-and-feturbulence-mobile-performance/), [WebKit bug 287982](https://bugs.webkit.org/show_bug.cgi?id=287982)). Use a static tile, or a precomputed noise PNG moved with a stepped transform. [secondary]
- A static `feComponentTransfer` with discrete values gives a 1-bit threshold on an image at no JS cost. Apply it to static images only.

### WebGL options

| Option | Cost | Verdict |
|---|---|---|
| Raw WebGL2 | 0 KB library, about 60 to 100 lines of boilerplate for a full-screen quad | Deferred option. The plan uses Canvas 2D with a shared TypeScript Bayer function instead (see `PLAN.md` S1); use WebGL only if a measured frame budget fails. |
| [OGL](https://github.com/oframe/ogl) | About 29 KB gzip before tree-shaking per its readme; a third-party tracker says 33 KB. [secondary] | Deferred. Consider only if a second or third shader appears. |
| three.js | About 140 to 150 KB gzip in an old forum thread. [secondary] | Reject. Too heavy for 2D shader art. |
| WebGPU | Desktop support is good; Firefox and mobile sources disagree. [secondary] | Reject. A 2D shader gains nothing. |

Mobile rules for any shader: cap device pixel ratio at 1 to 1.5, render at half resolution (the pixelated look is the point), pause off-screen with `IntersectionObserver` and on `visibilitychange`, handle `webglcontextlost`, and draw one still frame under reduced motion.

### SVG line drawing and diagrams

- Set `pathLength="1"` and animate `stroke-dashoffset` from 1 to 0, or use Motion's `pathLength`. See [Motion path drawing](https://motion.dev/examples/path-drawing) and [Motion along a path](https://examples.motion.dev/react/motion-path/tutorial). Cost is 0 KB beyond Motion. [verified]
- Scroll-linked draws can use CSS `animation-timeline` with no JS (next section).
- Diagrams must show real architecture or real data, because the project rule bans invented data.

### Text scramble and variable weight

- Motion documents a [ScrambleText](https://motion.dev/docs/react-scramble-text) component driven by motion values, so it avoids a React render per frame. Check that the installed Motion 13 version includes it and that the license tier allows it. [verified docs page, availability unverified]
- A hand-written scramble is about 30 lines. Keep the real string in the HTML and in `aria-label`, scramble once on reveal, skip it under reduced motion, and use Geist Mono so width does not jitter.
- Animating `font-variation-settings` triggers layout, not just paint ([Val Head](https://valhead.com/2020/11/15/animating-variable-fonts-with-css/)). Use it on one headline at most, with width locked. Confirm the shipped Geist files expose a `wght` axis. The site's fonts are variable woff2 with wght 100 to 900, so this is likely true. [secondary]

## 3. Motion platform facts

### Native and Astro view transitions

- Same-document view transitions are Baseline Newly Available since Firefox 144 (October 2025). [verified, [web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)]
- Cross-document transitions (`@view-transition { navigation: auto; }`) work in Chrome and Edge 126+ and Safari 18.2+. Firefox support was not confirmed. [secondary, [joost.blog](https://joost.blog/replacing-astro-clientrouter/)] See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition).
- Astro `ClientRouter` gives `transition:name`, `transition:persist` and `transition:animate`, and it disables transitions under `prefers-reduced-motion`. [verified, [Astro docs](https://docs.astro.build/en/guides/view-transitions/)]
- `transition:persist` keeps an island alive across navigations. Native cross-document transitions cannot do that. This site persists Nav, Footer, KeyboardShortcuts and StatusLine, so it should stay on `ClientRouter`.
- Keep transitions under about 300 ms. Long ones hurt INP.
- Motion's [animateView](https://motion.dev/magazine/a-view-transitions-api-for-the-rest-of-us) wraps the View Transitions API. Named elements are dragged if the update also scrolls. [verified]

### CSS scroll-driven animations

- `animation-timeline: view()` and `scroll()` run off the main thread with 0 KB of JS. Chrome and Edge have had it since 115. Safari status conflicts between sources (18.2 or 26). Firefox stable is reported behind a flag as of mid-2026. [secondary: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline), [buildmvpfast](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026), [ics.media](https://ics.media/en/entry/230718/)] Re-check caniuse before shipping.
- Rules that follow from this:
  - Content must be visible by default. Wrap the effect in `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`.
  - Animate only `transform` and `opacity`, or `clip-path`.
  - Use `animation-fill-mode: both` to avoid a flash before the range starts.
  - This site has `content-visibility: auto` on prose `h2` and `pre` (`src/styles/theme.css` lines 476 to 483). It interacts badly with scroll-driven effects and anchor jumps, so test it.

### `@starting-style`

- Baseline 2024. It replaces most JS mount animation for simple fades and slides, and it pairs with `transition-behavior: allow-discrete` for popovers and dialogs. Put the `@starting-style` rule after its base rule. [verified, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)]

### Motion library sizes (gzip)

These are from the official [bundle-size page](https://motion.dev/docs/react-reduce-bundle-size) and the `animate()` docs. [verified]

| API | Size |
|---|---|
| `motion` component | 43 KB |
| `LazyMotion` with `m`, initial render | about 5 KB |
| `domAnimation` features | +24 KB |
| `domMax` features (drag, layout) | +38 KB |
| `useAnimate` mini (WAAPI) | 3.3 KB |
| `animate()` mini | 3.2 KB |
| `animate()` hybrid | 22 KB |

Layout animation and `layoutId` need `domMax`. No official size was found for `scroll()` or `useScroll`; measure in the real build. Use `MotionConfig reducedMotion="user"`.

### GSAP and Lenis

- GSAP is free for this use. The [Standard License](https://gsap.com/community/standard-license/) includes the former paid plugins (SplitText, DrawSVG, MorphSVG) and only restricts tools that compete with Webflow's visual animation builder. [verified] Core is about 23 KB and ScrollTrigger about 10 KB more. [secondary, approximate]
- It is a second animation engine next to Motion. SplitText rewrites the DOM and needs a re-split after font load, or it causes CLS.
- [Lenis](https://github.com/darkroomengineering/lenis) smooths wheel scroll. It breaks anchor links unless configured, it conflicts with scroll-snap and nested scroll areas, and it fights native scroll-driven CSS. [verified from the README]

### Reduced-motion patterns

- Write the motion version inside `@media (prefers-reduced-motion: no-preference)`; the default state is the finished state.
- Reduced does not mean none. Keep short opacity changes that carry state. Remove parallax, large translation, scale and loops.
- Listen for changes at runtime. Users can toggle the preference without a reload.
- The site has four overlapping reduced-motion layers today (OS query, stored flag, `.reduce-motion` class, `--motion-duration-scale`). Any new motion must be tested against the OS flag and the stored flag separately.

## 4. Typography and layout techniques

- Fluid type with `clamp()`: always include a `rem` term so zoom still scales text (WCAG 1.4.4). Generate the scale with [Utopia](https://utopia.fyi). [unverified]
- `text-wrap: balance` is supported in Chrome and Edge 114+, Firefox 121+ and Safari 17.5+. `text-wrap: pretty` is narrower (Chromium, Safari 26, not Firefox early 2026). `hanging-punctuation` is effectively Safari only. Use all three as enhancements. [verified, [MDN](https://developer.mozilla.org/docs/Web/CSS/text-wrap)]
- Subgrid and container queries are widely available, which suits project rows and panels reused in different slots. [secondary]
- Use named grid lines (`full`, `wide`, `content`, `margin`) for an editorial breakout grid with a margin column for sidenotes. [unverified]
- Geist features: use tabular figures for dates and metrics. Inspect the shipped font with [Wakamai Fondue](https://wakamaifondue.com) to learn which `ss` and `cv` sets exist. [unverified]

## 5. Interaction patterns

- Command palette: [cmdk](https://github.com/pacocoursey/cmdk) is the headless React primitive from Paco Coursey, built on Radix Dialog. A 2026 comparison says cmdk suits headless control and kbar suits action-heavy apps. [secondary, [pkgpulse](https://www.pkgpulse.com/guides/cmdk-vs-kbar-vs-mantine-spotlight-2026)] No source confirmed WCAG 2.2 conformance for either, so test focus trap and restore, combobox and listbox roles, `aria-activedescendant`, a live result count, `Esc`, and a visible opener button.
- Hover and focus without geometry change: draw underlines with `background-size` or `scaleX` on a pseudo-element, shift opacity and background, and use a 2px `outline` with offset for focus.
- Pointer spotlight: update `--mx` and `--my` from `pointermove` in `requestAnimationFrame`. Use it on hairline borders, not as a panel fill. Disable on `pointer: coarse` and reduced motion. It must never carry information alone.
- Keyboard: `g`-prefixed chords already exist. Single-key shortcuts must stay disableable (WCAG 2.1.4).

## 6. Blog reading techniques

| Feature | Approach | Notes |
|---|---|---|
| Reading progress | `animation-timeline: scroll()` on a 1px rail, JS fallback only where unsupported | Decorative, `aria-hidden`. |
| TOC | Build the heading tree at build time; scroll-spy with `IntersectionObserver`; `aria-current="location"` | The current spy picks only the top heading. Track a range per section. |
| Code blocks | Shiki transformers at build time for language label, filename, line numbers, line highlight, diff | [Expressive Code](https://expressive-code.com/key-features/frames) gives frames, copy button and text markers [verified], but the site already runs Shiki with custom monochrome themes, so extending Shiki avoids a second highlighter. Diff markers need `+` and `-` characters, not color. Scrollable blocks need `tabindex="0"`. |
| Sidenotes and footnotes | Wide screens: margin notes with CSS anchor positioning or a build-time rehype move. Narrow screens: Popover API with the `#fn` link as the no-JS fallback | Check anchor-positioning support first. Popups must satisfy WCAG 1.4.13 (dismissible, hoverable, persistent). |
| Image zoom | Shared-element expansion with the View Transitions API from the inline image into the lightbox | The current lightbox only fades. |
| Heading anchors | Always visible on touch, hover or focus on pointer devices | Needs an accessible name. |
| KaTeX | Load the stylesheet only on posts that contain math | It ships on every post today (`src/pages/blog/[slug].astro` line 8). |

## 7. Conflicts with project rules

These are the points where the research collides with `DESIGN.md`, `docs/Guidelines.md` and `AGENTS.md`. The plan resolves each one.

- Motion allowlist: scramble, scroll-driven reveals, dither, shared-element transitions and a pointer highlight are all outside it today. They need a written amendment first.
- "No gradients": a Bayer dither needs none, but a pointer spotlight and a masked fade edge do. The amendment must separate monochrome luminance masks (allowed as texture) from chromatic or decorative fills (still banned).
- "No fabricated data": any generative art must be seeded or driven by real inputs (commit hash, contribution calendar, project fields).
- Static HTML: every effect is a layer over text that is already in the markup. No effect may start a block at `opacity: 0` in a way that hides it from crawlers or no-JS readers.
- CSP: `script-src`, `img-src`, `font-src` and `connect-src` are same-origin, so shaders, fonts and textures must be self-hosted. Workers must be same-origin files, not `blob:`.

## 8. Not checked

- Rendered visuals and motion of any exemplar.
- Real bundle sizes for OGL, cmdk, GSAP plugins and Motion `scroll()` in this repo's build.
- Firefox status for cross-document view transitions and scroll-driven animations; Safari version for scroll-driven animations.
- Whether Motion 13 in `package.json` ships `ScrambleText` and under which license.
- Whether the shipped Geist files expose features beyond `wght`.
- WCAG 2.2 conformance of cmdk and kbar.
