import { roles } from "@/data/experienceData";

import { SectionHeader } from "./SectionHeader";
import { T } from "./ui/T";

/** Server-only (no client directive): static HTML with both languages, no JS. */
export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="space-y-5">
      <SectionHeader
        number="05"
        label="EXPERIENCE"
        heading={<T k="experience.heading" />}
        meta={`${roles.length} ROLES`}
        id="experience-heading"
      />
      <div className="space-y-0">
          {roles.slice(0, 3).map((role) => {
            const current = role.period.endsWith(" — Present");
            return (
            <div
              key={role.period}
              className="grid grid-cols-1 lg:grid-cols-12 lg:gap-4 py-5 border-b border-border last:border-b-0 -mx-2 px-2 group hover:bg-card transition-colors duration-150 rounded-[2px]"
            >
              <div className="lg:col-span-8">
                <div className="flex items-baseline justify-between lg:justify-start gap-4 flex-wrap">
                  <div className="flex items-baseline gap-2">
                    {/* Status marker: ● current, ○ past */}
                    <span
                      className="shrink-0 font-mono text-mono-sm select-none"
                      style={{ color: "var(--foreground)", opacity: current ? 0.80 : 0.30 }}
                      aria-hidden="true"
                    >
                      {current ? "●" : "○"}
                    </span>
                    {/* Column divider */}
                    <span
                      className="shrink-0 text-muted-foreground-dim font-mono text-mono-sm select-none"
                      aria-hidden="true"
                    >
                      │
                    </span>
                    <span
                      className="text-foreground/80 group-hover:text-foreground transition-colors duration-200 text-sm font-medium font-sans"
                    >
                      {role.title}
                    </span>
                    <span
                      className="text-muted-foreground font-mono text-mono-sm"
                    >
                      {role.company}
                    </span>
                  </div>
                  {/* Inline period — mobile/tablet only; desktop moves it to the timeline rail column */}
                  <span
                    className="lg:hidden text-muted-foreground font-mono text-mono-sm tabular-nums"
                  >
                    {role.period}
                  </span>
                </div>
                <p
                  className="mt-1.5 text-muted-foreground group-hover:text-foreground/70 transition-colors duration-200 font-sans text-mono"
                  style={{ lineHeight: 1.7 }}
                >
                  {role.description}
                </p>
                {role.tags && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-muted-foreground bg-muted px-1.5 py-0.5 cursor-default text-label rounded-[2px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop timeline rail: period right-aligned against a continuous hairline */}
              <div
                className="hidden lg:flex lg:col-span-4 items-start justify-end pl-4"
                style={{ borderLeft: "1px solid var(--rule)" }}
              >
                <span className="text-muted-foreground font-mono text-mono-sm tabular-nums">
                  {role.period}
                </span>
              </div>
            </div>
            );
          })}
      </div>

      <div className="pt-1">
        <a
          href="/experience"
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-200 inline-flex items-center min-h-[44px] font-mono text-mono-sm"
        >
          {/* The accessible name starts with the visible text (WCAG 2.5.3). */}
          <T k="experience.viewAll" />
          <span className="sr-only">
            {" — "}
            <T k="experience.viewAllLabel" />
          </span>
        </a>
      </div>
    </section>
  );
}
