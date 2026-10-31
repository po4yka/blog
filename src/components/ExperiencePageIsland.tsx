import { Reveal } from "./ui/Reveal";
import { useCallback, useEffect, useRef, useState } from "react";
import { BootBlock, Cmd, Em, OperatorPanel } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { T } from "./ui/T";
import { ErrorBoundary } from "./ErrorBoundary";
import { roles, skills, type Role, type SkillGroup } from "@/data/experienceData";
import { MotionProvider } from "./MotionProvider";
import { stagger } from "@/lib/motion";
import { useSettings, useLocale } from "@/stores/settingsStore";

const TAG_HIGHLIGHT_STYLE = {
  color: "var(--foreground)",
  backgroundColor: "var(--muted)",
};

function RoleEntry({
  role,
  hoveredTag,
  onTagHover,
}: {
  role: Role;
  hoveredTag: string | null;
  onTagHover: (tag: string | null) => void;
}) {
  const [start, end] = role.period.split(" — ");
  const current = end === "Present";
  return (
    <div className="relative py-5 pl-7 sm:pl-0 sm:grid sm:grid-cols-[9rem_1fr] sm:gap-x-8 group">
      {/* Rail node: filled for a role that is still running. */}
      <span
        aria-hidden="true"
        className={`absolute top-[1.6rem] left-0 sm:left-[calc(9rem+0.75rem)] size-[9px] border border-foreground/70 ${current ? "bg-foreground" : "bg-background"}`}
      />
      <div className="font-mono text-label text-muted-foreground sm:pt-0.5">
        <p className="m-0 whitespace-nowrap">{start}</p>
        {end && <p className="m-0 whitespace-nowrap">{end}</p>}
        <p className="m-0 mt-1 hidden sm:block text-muted-foreground-dim">{role.location}</p>
      </div>
      <div className="min-w-0">
      <div className="mt-1 sm:mt-0 flex items-baseline justify-between gap-x-4 gap-y-1 flex-wrap">
        <h2 className="m-0 text-foreground/85 group-hover:text-foreground transition-colors duration-150 font-sans text-mono-lg font-medium">
          {role.title}
        </h2>
        <span className="text-muted-foreground font-mono text-mono-sm">
          {role.company}
          {role.location && (
            <span className="text-muted-foreground ml-2 sm:hidden">{role.location}</span>
          )}
        </span>
      </div>

      <p className="mt-2 text-foreground/60 group-hover:text-foreground/75 transition-colors duration-150 font-sans text-mono" style={{ lineHeight: 1.75 }}>
        {role.description}
      </p>

      {/* Highlights */}
      {role.highlights && (
        <ul className="mt-2 space-y-1 pl-4">
          {role.highlights.map((h, i) => (
            <li
              key={i}
              className="text-foreground/80 list-disc font-sans text-mono-sm"
              style={{ lineHeight: 1.7 }}
            >
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Tags */}
      {role.tags && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {role.tags.map((tag) => {
            const tagKey = tag.toLowerCase();
            const isHighlighted = hoveredTag === tagKey;
            return (
              <span
                key={tag}
                data-tag={tagKey}
                className="px-2 py-0.5 text-muted-foreground bg-muted cursor-default text-xs transition-colors duration-150"
                style={{
                  borderRadius: "2px",
                  ...(isHighlighted ? TAG_HIGHLIGHT_STYLE : undefined),
                }}
                onMouseEnter={() => onTagHover(tagKey)}
                onMouseLeave={() => onTagHover(null)}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

function SkillsSection({ group }: { group: SkillGroup }) {
  return (
    <div className="flex gap-4 py-1 font-mono text-mono-sm hover:bg-muted transition-colors duration-150">
      <span className="text-muted-foreground shrink-0" style={{ minWidth: "100px" }}>
        {group.label}
      </span>
      <span className="text-foreground/80">
        {group.items.map((item, i) => (
          <span key={item}>
            {i > 0 && <span className="text-muted-foreground-dim" aria-hidden="true"> · </span>}
            <span className="cursor-default">{item}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

function computePaths(
  container: HTMLElement | null,
  hoveredTag: string | null,
): { d: string; length: number }[] {
  if (!hoveredTag || !container) return [];

  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  const tags = container.querySelectorAll<HTMLElement>(`[data-tag="${hoveredTag}"]`);
  if (tags.length < 2) return [];

  const rects = Array.from(tags).map((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - containerRect.left,
      y: r.top + r.height / 2 - containerRect.top + scrollTop,
    };
  });

  const source = rects[0]!;
  return rects.slice(1).map((target) => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const cpOffset = Math.min(60, Math.abs(dy) * 0.3);
    const d = `M ${source.x} ${source.y} C ${source.x + cpOffset} ${(source.y + target.y) / 2}, ${target.x - cpOffset} ${(source.y + target.y) / 2}, ${target.x} ${target.y}`;
    const length = Math.sqrt(dx * dx + dy * dy) * 1.3;
    return { d, length };
  });
}

function TagConnections({
  containerRef,
  hoveredTag,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  hoveredTag: string | null;
}) {
  const { reduceMotion } = useSettings();
  const [paths, setPaths] = useState<{ d: string; length: number }[]>([]);

  useEffect(() => {
    setPaths(computePaths(containerRef.current, hoveredTag));
  }, [hoveredTag, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ zIndex: 10 }}
    >
      {paths.map((p, i) => (
        <g key={i}>
          <path
            d={p.d}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="1.5"
            strokeOpacity="0.2"
            strokeLinecap="round"
            strokeDasharray={p.length}
            strokeDashoffset={reduceMotion ? 0 : p.length}
            style={
              reduceMotion
                ? undefined
                : {
                    animation: "draw-line var(--dur-base) var(--ease-out) forwards",
                    animationDelay: `${i * Math.round(stagger.base * 1000)}ms`,
                  }
            }
          />
        </g>
      ))}
    </svg>
  );
}

export function ExperiencePage() {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const rolesContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const handleTagHover = useCallback((tag: string | null) => {
    setHoveredTag(tag);
  }, []);

  return (
    <ErrorBoundary>
    <MotionProvider>
    <div className="space-y-8">
      <SectionHeader
        level={1}
        number="05"
        label="EXPERIENCE"
        heading={<T k="experience.heading" />}
        meta={`${roles.length} ${t("experiencePage.positionsIndexed")}`}
      />

      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Loaded <Em>po4yka.dev/experience</Em>
              </>
            ),
          },
          { status: "OK", text: <>{roles.length} {t("experiencePage.positionsIndexed")}</> },
          { status: "INFO", text: t("experiencePage.sortedByDate") },
        ]}
      />

      {/* Resume log */}
      <div className="space-y-4">
        <Cmd>
          cat <Em>resume.log</Em>
        </Cmd>
        <OperatorPanel label="resume.log" titleExt="~/experience | main" sectionNumber="05" delay={0.05} statusLine>
          <div ref={rolesContainerRef} className="relative">
            <TagConnections containerRef={rolesContainerRef} hoveredTag={hoveredTag} />
            {/* Timeline rail: one hairline through every role's node. */}
            <span
              aria-hidden="true"
              className="absolute top-8 bottom-8 left-[4px] sm:left-[calc(9rem+0.75rem+4px)] w-px bg-border"
            />
            <ol className="list-none m-0 p-0">
              {roles.map((role) => (
                <li key={role.period} className="border-b border-border/50 last:border-b-0">
                  <RoleEntry role={role} hoveredTag={hoveredTag} onTagHover={handleTagHover} />
                </li>
              ))}
            </ol>
          </div>
        </OperatorPanel>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <Cmd>
          cat <Em>/etc/skills.conf</Em>
        </Cmd>
        <OperatorPanel label="skills.conf" titleExt="~/experience | main" sectionNumber="05" delay={0.05} statusLine>
          <Reveal className="space-y-1" speed="slow">
            {skills.map((group) => (
              <SkillsSection key={group.label} group={group} />
            ))}
          </Reveal>
        </OperatorPanel>
      </div>

    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}
