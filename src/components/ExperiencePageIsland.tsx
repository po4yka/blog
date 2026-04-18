import { motion } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { BootBlock, Cmd, Accent, MacWindow } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { useInView } from "@/hooks/useInView";
import { StackHeatmap } from "./Decorations";
import { roles, skills, type Role, type SkillGroup } from "@/data/experienceData";
import { MotionProvider } from "./MotionProvider";
import { ease } from "@/lib/motion";
import { useSettings, useLocale } from "@/stores/settingsStore";
import { AnimatedNumber } from "./AnimatedNumber";
import { animateNumbers } from "./_animatedNumber.utils";

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
  const { ref, inView } = useInView(0.08);

  return (
    <motion.div
      ref={ref}
      className="py-5 border-b border-border last:border-b-0 group"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.03, ease }}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-muted-foreground text-label font-mono">
            {role.period}
          </span>
          <h3 className="text-foreground/85 group-hover:text-foreground transition-colors duration-150 font-mono text-mono-lg font-medium">
            {role.title}
          </h3>
        </div>
        <span className="text-muted-foreground font-mono text-mono-sm">
          {role.company}
          {role.location && (
            <span className="text-muted-foreground ml-2">{role.location}</span>
          )}
        </span>
      </div>

      <p className="mt-2 text-foreground/60 group-hover:text-foreground/75 transition-colors duration-150 font-mono text-mono" style={{ lineHeight: 1.75 }}>
        {role.description}
      </p>

      {/* Highlights */}
      {role.highlights && (
        <ul className="mt-2 space-y-1 pl-4">
          {role.highlights.map((h, i) => (
            <li
              key={i}
              className="text-foreground/80 list-disc font-mono text-mono-sm"
              style={{ lineHeight: 1.7 }}
            >
              {animateNumbers(h)}
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
    </motion.div>
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

  useLayoutEffect(() => {
    setPaths(computePaths(containerRef.current, hoveredTag));
  }, [hoveredTag, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg
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
                    animation: `draw-line 300ms ease forwards`,
                    animationDelay: `${i * 50}ms`,
                  }
            }
          />
        </g>
      ))}
      <style>{`@keyframes draw-line { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

export function ExperiencePage() {
  const { ref: skillsRef, inView: skillsInView } = useInView(0.1);
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
        number="05"
        label="EXPERIENCE"
        heading="Experience"
        meta={`${roles.length} ${t("experiencePage.positionsIndexed") ?? "POSITIONS"}`}
      />

      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Loaded <Accent>po4yka.dev/experience</Accent>
              </>
            ),
          },
          { status: "OK", text: <><AnimatedNumber value={roles.length} /> {t("experiencePage.positionsIndexed")}</> },
          { status: "INFO", text: t("experiencePage.sortedByDate") },
        ]}
      />

      {/* Resume log */}
      <div className="space-y-4">
        <Cmd>
          cat <Accent>resume.log</Accent>
        </Cmd>
        <MacWindow label="resume.log" sectionNumber="05" delay={0.05}>
          <div ref={rolesContainerRef} className="relative">
            <TagConnections containerRef={rolesContainerRef} hoveredTag={hoveredTag} />
            {roles.map((role) => (
              <RoleEntry key={role.period} role={role} hoveredTag={hoveredTag} onTagHover={handleTagHover} />
            ))}
          </div>
        </MacWindow>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <Cmd>
          cat <Accent>/etc/skills.conf</Accent>
        </Cmd>
        <MacWindow label="skills.conf" sectionNumber="05" delay={0.05}>
          <motion.div
            ref={skillsRef}
            className="space-y-1"
            initial={{ opacity: 0 }}
            animate={skillsInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, ease }}
          >
            {skills.map((group) => (
              <SkillsSection key={group.label} group={group} />
            ))}
          </motion.div>
        </MacWindow>
      </div>

      {/* Download CV hint */}
      <div className="font-mono text-mono-sm">
        <span className="text-muted-foreground cursor-default">
          $ wget po4yka.dev/cv.pdf — <span className="text-muted-foreground-dim">{t("experiencePage.comingSoon")}</span>
        </span>
      </div>

      {/* Career stack heatmap — real data derived from experience roles */}
      <StackHeatmap delay={0.05} />
    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}
