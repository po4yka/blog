import { projects } from "@/data/projectsData";
import { Tag } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { T } from "./ui/T";
import { Plate } from "./ui/Plate";
import { plateCaption } from "@/lib/dither";

/** "owner/name" of the first GitHub link, or undefined: the spec sheet prints only real fields. */
function repoOf(links: { href: string }[]): string | undefined {
  for (const { href } of links) {
    const m = /^https:\/\/github\.com\/([^/#?]+\/[^/#?]+)/.exec(href);
    if (m) return m[1];
  }
  return undefined;
}

const SPEC_KEY = "text-muted-foreground-dim mr-2";

/** Server-only (no client directive): static HTML with both languages, no JS. */
export function Projects() {
  const homeProjects = projects.slice(0, 4);

  return (
    <section id="projects" aria-labelledby="projects-heading" className="space-y-5">
      <SectionHeader
        number="04"
        label="PROJECTS"
        heading={<T k="projects.heading" />}
        meta={`${projects.length} RECORDS`}
        id="projects-heading"
      />
      <div className="space-y-0">
          {homeProjects.map((project, i) => {
            const isLast = i === homeProjects.length - 1;
            const branch = isLast ? "└──" : "├──";
            const cont = isLast ? "   " : "│  ";
            return (
            <a
              key={project.slug}
              href={`/projects#${project.slug}`}
              className="group flex items-start gap-2 py-4 border-b border-border last:border-b-0 -mx-2 px-2 hover:bg-card transition-colors duration-150 rounded-[2px]"
            >
              <Plate slug={project.slug ?? project.id} size={32} className="hidden sm:block mt-0.5" />

              {/* Tree branch prefix */}
              <span
                className="shrink-0 text-muted-foreground-dim transition-colors duration-200 font-mono text-mono-sm pt-0.5 select-none"
                aria-hidden="true"
              >
                {branch}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* First line: platform · name · year */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-muted-foreground font-mono text-mono-sm shrink-0 letter-wide" aria-hidden="true">
                    [{project.platforms[0]?.toLowerCase() ?? ""}]
                  </span>
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors duration-200 truncate text-sm font-sans">
                    {project.name}
                  </span>
                  <span className="text-muted-foreground-dim font-mono text-mono-sm" aria-hidden="true">·</span>
                  <span className="text-muted-foreground font-mono text-mono-sm shrink-0">{project.year}</span>
                  {project.featured && (
                    <>
                      <span className="text-muted-foreground-dim font-mono text-mono-sm" aria-hidden="true">·</span>
                      <Tag variant="highlight"><T k="projects.featured" /></Tag>
                    </>
                  )}
                </div>
                {/* Second line: continuation + description */}
                <div className="flex items-start gap-1.5 mt-0.5">
                  <span
                    className="shrink-0 text-muted-foreground-dim font-mono text-mono-sm select-none"
                    aria-hidden="true"
                  >
                    {cont} └─
                  </span>
                  {/* Description and spec sheet share one grid cell, so the row keeps its height
                      when hover or focus swaps them (opacity only). The spec sheet repeats
                      /projects fields, so it is hidden from assistive tech. */}
                  <div className="grid min-w-0 flex-1">
                    <p className="[grid-area:1/1] text-muted-foreground group-hover:opacity-0 group-focus-visible:opacity-0 transition-opacity duration-200 font-sans text-sm leading-[1.55] line-clamp-2">
                      {project.description}
                    </p>
                    <dl
                      aria-hidden="true"
                      className="[grid-area:1/1] m-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 font-mono text-mono-sm leading-[1.55] text-foreground/80 min-w-0"
                    >
                      <div className="truncate">
                        <dt className={`inline ${SPEC_KEY}`}>STACK</dt>
                        <dd className="inline m-0">{project.tags.join(" · ")}</dd>
                      </div>
                      <div className="truncate">
                        <dt className={`inline ${SPEC_KEY}`}>PLATFORMS</dt>
                        <dd className="inline m-0 mr-3">{project.platforms.join(" / ")}</dd>
                        {repoOf(project.links) && (
                          <>
                            <dt className={`inline ${SPEC_KEY}`}>REPO</dt>
                            <dd className="inline m-0 mr-3">{repoOf(project.links)}</dd>
                          </>
                        )}
                        <dt className={`inline ${SPEC_KEY}`}>MARK</dt>
                        <dd className="inline m-0">{plateCaption(project.slug ?? project.id)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </a>
            );
          })}
      </div>

      {/* View all link */}
      <div className="pt-1">
        <a
          href="/projects"
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-200 inline-flex items-center min-h-[44px] font-mono text-mono-sm"
        >
          {/* The accessible name starts with the visible text (WCAG 2.5.3);
              the sr-only part says where the link goes. */}
          <T k="projects.viewAll" />
          <span className="sr-only">
            {" — "}
            <T k="projects.viewAllLabel" />
          </span>
        </a>
      </div>
    </section>
  );
}
