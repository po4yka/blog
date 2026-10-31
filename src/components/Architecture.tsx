import type { CSSProperties } from "react";
import { SectionHeader } from "./SectionHeader";
import { T } from "./ui/T";

/**
 * Server-only diagram of how a request reaches this site (DESIGN.md "Architecture
 * Diagram"). Every box and line names code in the repo: wrangler.toml (route, D1
 * binding), astro.config.mjs (static output, Cloudflare adapter), src/lib/cf-cache.ts,
 * src/pages/api/github/*, src/lib/admin-handler.ts. The flows draw on scroll (scroll.css).
 */
export function Architecture() {
  const flow = (i: number) => ({ className: "arch-flow", pathLength: 1, style: { "--i": i } as CSSProperties });
  return (
    <section aria-labelledby="architecture-heading" className="space-y-6">
      <SectionHeader
        id="architecture-heading"
        number="08"
        label="ARCHITECTURE"
        heading={<T k="architecture.heading" />}
        description={<T k="architecture.description" />}
      />
      <figure className="arch m-0 border border-border rounded-[2px] p-4">
        {/* Phones scroll the diagram sideways instead of shrinking its 11px labels. */}
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Architecture diagram">
        <svg
          viewBox="0 0 640 264"
          className="block w-full min-w-[560px] h-auto text-foreground"
          role="img"
          aria-label="Diagram: browser, Cloudflare edge with static assets, the Worker, caches.default, api.github.com and D1"
        >
          <g fill="none" stroke="var(--border)">
            <rect x="144" y="8" width="344" height="248" strokeDasharray="4 3" />
            <rect x="16" y="112" width="96" height="48" />
            <rect x="160" y="40" width="312" height="48" />
            <rect x="160" y="112" width="200" height="128" />
            <rect x="376" y="112" width="96" height="48" />
            <rect x="520" y="112" width="104" height="48" />
            <rect x="520" y="192" width="104" height="48" />
          </g>
          <g fill="currentColor" fontSize="11" style={{ fontFamily: "var(--font-mono)" }}>
            <text x="152" y="28" fill="var(--muted-foreground)">cloudflare edge · po4yka.dev/*</text>
            <text x="28" y="140">browser</text>
            <text x="172" y="60">static assets</text>
            <text x="172" y="78" fill="var(--muted-foreground)">dist/client, prerendered</text>
            <text x="172" y="132">worker po4yka-blog</text>
            <text x="388" y="132">caches.default</text>
            <text x="532" y="132">api.github.com</text>
            <text x="532" y="212">D1 blog-db</text>
            <g fill="var(--muted-foreground)">
              <text x="172" y="168">2 /api/github/*</text>
              <text x="172" y="190">3 /api/admin/*</text>
              <text x="186" y="206">withAdmin()</text>
              <text x="172" y="228">3 /admin/* · SPA</text>
              <text x="388" y="150">CACHE_TTL_S</text>
              <text x="532" y="150">REST, on miss</text>
              <text x="532" y="230">env.DB</text>
            </g>
            <text x="124" y="96">1</text>
            <text x="148" y="131">2</text>
            <text x="124" y="184">3</text>
          </g>
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <path {...flow(0)} d="M112 120H134V64H160" />
            <path {...flow(1)} d="M112 136H160M360 136H376M472 136H520" />
            <path {...flow(2)} d="M112 152H134V200H160M360 216H520" />
          </g>
        </svg>
        </div>
        <figcaption className="mt-4">
          <ol className="m-0 pl-5 space-y-1.5 font-sans text-mono-sm text-foreground/80">
            <li><T k="architecture.static" /></li>
            <li><T k="architecture.api" /></li>
            <li><T k="architecture.admin" /></li>
          </ol>
        </figcaption>
      </figure>
    </section>
  );
}
