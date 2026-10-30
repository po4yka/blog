# Phase 0 baseline

Starting point for the redesign, measured on 2026-10-30 at commit `ddf15f0`. Later phases gate on these numbers: a phase may not make any route worse than this table unless the PR says why. Lab numbers only; see "Field data" for what they cannot prove.

## Environment

- Production build (`npm run build`), served with `astro preview` (workerd) on an Apple M2 Pro.
- Lighthouse 13.5.0 through `lhci collect`, Google Chrome 156, 3 runs per URL, median reported. Desktop uses the `desktop` preset; mobile uses the Lighthouse default (simulated slow 4G, 4x CPU slowdown). No upload.
- JS bytes: Playwright Chromium 1234, page loaded to network idle plus 3 s so `client:idle` and `client:visible` islands start. The preview server does not compress, so the brotli column is each script compressed with Node `zlib` (quality 11), as Cloudflare would serve it.

## JS loaded per route

| Route | Scripts | Brotli KB | Decoded KB |
|---|---|---|---|
| `/` (1280 px) | 43 | 139.3 | 469.1 |
| `/` (375 px) | 41 | 138.2 | 466.3 |
| `/blog/` | 35 | 134.3 | 457.5 |
| `/blog/rag-breaks-earlier-than-people-think/` | 37 | 157.2 | 538.4 |
| `/projects/` | 37 | 134.9 | 458.4 |

Every route loads about 134 KB brotli before its own content: React, Motion and the global chrome (Nav, Footer shell, StatusLine, KeyboardShortcuts). The blog post adds 23 KB.

## Lighthouse, desktop

| URL | Perf | A11y | BP | FCP ms | LCP ms | TBT ms | CLS | LCP element |
|---|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 96 | 566 | 726 | 0 | 0.028 | hero intro `p.font-sans` |
| `/blog/` | 97 | 100 | 96 | 466 | 1250 | 0 | 0.015 | first post title `h2.display-2` |
| `/blog/rag-breaks-earlier-than-people-think/` | 92 | 97 | 96 | 510 | 1823 | 0 | 0.006 | first prose `p` inside `astro-slot` |
| `/projects/` | 96 | 100 | 96 | 512 | 1437 | 0 | 0.013 | project description `p.mt-2` |

## Lighthouse, mobile

| URL | Perf | A11y | BP | FCP ms | LCP ms | TBT ms | CLS | LCP element |
|---|---|---|---|---|---|---|---|---|
| `/` | 95 | 100 | 96 | 2089 | 2464 | 0 | 0.051 | hero intro `p.font-sans` |
| `/blog/` | 76 | 100 | 96 | 1889 | 6276 | 0 | 0.028 | first post title `h2.display-2` |
| `/blog/rag-breaks-earlier-than-people-think/` | 65 | 94 | 96 | 4497 | 7529 | 0 | 0.006 | first prose `p` inside `astro-slot` |
| `/projects/` | 75 | 100 | 96 | 2182 | 6464 | 0 | 0.026 | project row `span.text-foreground/90` |

## Findings that change the plan

1. **The LCP element is never the `h1`.** On `/` it is the hero intro paragraph, on the other routes it is island content. The plan assumed the `h1` is the home LCP; Phase 8 must either make the name the LCP on purpose or keep the intro paragraph fast, and the LCP-element assertion must name the real element.
2. **Mobile LCP is 6.3 to 7.5 s on `/blog/`, `/projects/` and the post, while TTFB is under 120 ms.** The time is element render delay. On `/blog/` the static HTML ships the list as `<ul style="opacity:0">` and `<li style="opacity:0">`, so the main content stays invisible until React and Motion hydrate and fade it in. Lighthouse's simulation charges the whole JS chain on slow 4G to that text. Fixing this (content visible in the static HTML, motion only as an enhancement) is the biggest single win available and belongs in Phases 3 and 4. It is also an existing breach of the `DESIGN.md` rule that content must be in the static HTML.
3. **The post page has a 4.5 s mobile FCP** with no `opacity:0` near the prose. Cause not yet found; investigate at the start of Phase 4 (blog island split).
4. **Accessibility debts already present:** `color-contrast` on `span.label-meta.opacity-70` in the post page, `target-size` on the post page social links, and `label-content-name-mismatch` on the home "view all" links (`aria-label="View all projects"` and others do not contain the visible text) and the post page social links. Best practices loses points on the same mismatch plus `inspector-issues`. These get fixed when the components are touched, not in a separate pass.
5. **Three home data panels never load, on production too.** `RealGitLog`, `OpenSourcePanel` and `ActivityCalendar` are `client:visible` islands that render `null` on the server, so the static HTML holds empty `<astro-island>` elements (checked in `dist/client/index.html` and on https://po4yka.dev/). `client:visible` watches the island's children, and an empty island has none, so they never hydrate and never fetch `/api/github/*`. Phase 3's reserved-height placeholders fix this: the placeholder gives the island a child to observe. Until then the visual baselines show these sections empty.
6. **CLS is 0.051 on mobile `/`**: under the 0.1 error line but not 0. The plan's target is 0 on `/` (Phase 3, reserved panel heights).

## Open facts, answered

- **Motion 13 `ScrambleText`:** not present. The installed `motion` is 13.4.4 and has no scramble or text-decode export. S7 (text decode) needs a small custom function.
- **`tw-animate-css` consumers:** only `src/components/ui/dialog.tsx` (imported once in `src/styles/tailwind.css:4`). Removing it means replacing the dialog enter and exit classes.
- **`VisitorContext` consumers:** none. `src/components/Decorations/VisitorContext.tsx` is exported but never imported; delete in Phase 2.
- **CSP path:** prerendered pages get the static `public/_headers` policy: enforced `script-src 'self' 'unsafe-inline'`, and a Report-Only policy with `script-src 'self'` and no inline. Server-rendered responses get a per-request nonce with `'strict-dynamic'` from `src/middleware.ts:17-49`. No `worker-src` is set, so `default-src 'self'` applies: workers from `/_astro/` are allowed, `blob:` workers are not. Canvas 2D needs no CSP change. Any new inline script is flagged by the Report-Only policy.
- **Field LCP and INP:** analytics is self-hosted Umami through a first-party proxy (`src/pages/m.js.ts`, `src/pages/api/m.ts`). Umami does not collect Web Vitals by itself. Field data needs `web-vitals` (about 2 KB) sending custom Umami events. This is an owner decision; until then the budgets rest on lab data only.

## Test scaffolding added in this phase

- `e2e/visual.spec.ts` and `e2e/visual.css`: full-page screenshots of home, blog list, one post, projects and 404, in light and dark, at 375 and 1280 px (20 shots). Live GitHub data is stubbed and masked, build hash and dates are masked, animations are frozen with reduced motion, the page is scrolled once so `client:visible` sections render, `content-visibility` is turned off and the fixed status line is hidden during capture.
- `playwright.config.ts`: the existing suite stays on the `chromium` project (unchanged settings, 25 tests pass locally). New `webkit` and `firefox` projects run the theme and navigation specs. The `visual` project exists only with `VISUAL=1`.
- `.lighthouserc.mobile.json`: mobile run with thresholds set at this baseline, so a regression warns.
- CI (`.github/workflows/ci-cd.yml`): installs WebKit and Firefox, runs mobile Lighthouse after desktop, and adds a `visual` job on a pinned `ubuntu-24.04` runner (the Playwright container image was tried first, but the Cloudflare prerenderer's `workerd` does not start in it). `deploy` does not wait for `visual` yet.

Screenshot baselines are not checked in yet. They must come from the CI `visual` job, not from a Mac or an arm64 Docker host, because font rendering differs. The first CI run of `visual` fails on purpose and uploads the written snapshots as the `visual-diffs` artifact; commit them to `e2e/visual.spec.ts-snapshots/`, then add `visual` to `deploy.needs`.

## Real-device plan

Emulated Lighthouse cannot measure frame time or battery. Before Phase 8 (hero canvas) ships, test by hand on an iPhone with Low Power Mode on and on a mid-range Android phone, and record in the PR: the hero field frame rate (target: steady 15 fps, no dropped input), whether the field pauses when the tab is hidden, and LCP in Safari Web Inspector or Chrome remote debugging.
