import { motion } from "motion/react";
import { lazy, Suspense, useCallback, useLayoutEffect, useRef, useState } from "react";
import { BootBlock, Cmd, Accent, MacWindow } from "./Terminal";
import { useInView } from "@/hooks/useInView";

const NetworkGraph = lazy(() => import("./Decorations").then(m => ({ default: m.NetworkGraph })));
const CpuGraph = lazy(() => import("./Decorations").then(m => ({ default: m.CpuGraph })));
import { roles, skills, type Role, type SkillGroup } from "@/data/experienceData";
import { MotionProvider } from "./MotionProvider";
import { ease, spring } from "@/lib/motion";
import { useSettings } from "@/stores/settingsStore";
import { AnimatedNumber } from "./AnimatedNumber";
import { animateNumbers } from "./AnimatedNumber.utils";

const TAG_HIGHLIGHT_STYLE = {
  color: "var(--accent)",
  backgroundColor: "rgba(139, 124, 246, 0.08)",
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
      className="py-5 border-b border-border/40 last:border-b-0 -mx-2 px-2 group font-mono rounded-[6px]"
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.03, ease }}
      whileHover={{
        backgroundColor: "rgba(139, 124, 246, 0.03)",
        x: 2,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      }}
    >
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-accent/50 text-label">
            {role.period}
          </span>
          <h3 className="text-foreground/85 group-hover:text-foreground transition-colors duration-200 text-mono-lg font-medium">
            {role.title}
          </h3>
        </div>
        <span className="text-muted-foreground/35 text-mono-sm">
          {role.company}
          {role.location && (
            <span className="text-muted-foreground/25 ml-2">{role.location}</span>
          )}
        </span>
      </div>

      <p className="mt-2 text-foreground/50 group-hover:text-foreground/60 transition-colors duration-200 pl-0 text-mono" style={{ lineHeight: 1.75 }}>
        {role.description}
      </p>

      {/* Highlights */}
      {role.highlights && (
        <ul className="mt-2 space-y-1 pl-4">
          {role.highlights.map((h, i) => (
            <motion.li
              key={i}
              className="text-foreground/40 list-disc marker:text-accent/25 text-mono-sm"
              style={{ lineHeight: 1.7 }}
              whileHover={{ color: "var(--foreground)", opacity: 0.65 }}
              transition={{ duration: 0.15 }}
            >
              {animateNumbers(h)}
            </motion.li>
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
              <motion.span
                key={tag}
                data-tag={tagKey}
                className="px-2 py-0.5 text-muted-foreground/35 bg-muted-foreground/5 cursor-default text-xs rounded-[4px] transition-colors duration-150"
                style={isHighlighted ? TAG_HIGHLIGHT_STYLE : undefined}
                whileHover={{
                  scale: 1.08,
                  y: -1,
                  color: "var(--accent)",
                  backgroundColor: "rgba(139, 124, 246, 0.08)",
                  transition: spring.snappy,
                }}
                onMouseEnter={() => onTagHover(tagKey)}
                onMouseLeave={() => onTagHover(null)}
              >
                {tag}
              </motion.span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function SkillsSection({ group }: { group: SkillGroup }) {
  return (
    <motion.div
      className="flex gap-4 py-1 -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150 font-mono text-mono-sm rounded-[4px]"
    >
      <span className="text-muted-foreground/40 shrink-0" style={{ minWidth: "100px" }}>
        {group.label}
      </span>
      <span className="text-foreground/55">
        {group.items.map((item, i) => (
          <span key={item}>
            {i > 0 && <span className="text-muted-foreground/20"> · </span>}
            <motion.span
              className="cursor-default"
              whileHover={{ color: "var(--accent)" }}
              transition={{ duration: 0.15 }}
            >
              {item}
            </motion.span>
          </span>
        ))}
      </span>
    </motion.div>
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
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeOpacity="0.25"
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
      ))}
      <style>{`@keyframes draw-line { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

export function ExperiencePage() {
  const { ref: skillsRef, inView: skillsInView } = useInView(0.1);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const rolesContainerRef = useRef<HTMLDivElement>(null);

  const handleTagHover = useCallback((tag: string | null) => {
    setHoveredTag(tag);
  }, []);

  return (
    <MotionProvider>
    <div className="space-y-8">
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
          { status: "OK", text: <><AnimatedNumber value={roles.length} /> positions indexed</> },
          { status: "INFO", text: "Sorted by date, most recent first" },
        ]}
      />

      {/* Resume log */}
      <div className="space-y-4">
        <Cmd>
          cat <Accent>resume.log</Accent>
        </Cmd>
        <MacWindow title="resume.log" dimLights delay={0.05}>
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
        <MacWindow title="skills.conf" dimLights delay={0.05}>
          <motion.div
            ref={skillsRef}
            className="space-y-1"
            initial={{ opacity: 0, y: 8 }}
            animate={skillsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease }}
          >
            {skills.map((group) => (
              <SkillsSection key={group.label} group={group} />
            ))}
          </motion.div>
        </MacWindow>
      </div>

      {/* Download CV hint */}
      <motion.div
        className="font-mono text-mono-sm"
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <span className="text-muted-foreground/30 cursor-default">
          $ wget po4yka.dev/cv.pdf — <span className="text-muted-foreground/20">coming soon</span>
        </span>
      </motion.div>

      {/* Decorative system widgets */}
      <Suspense fallback={null}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NetworkGraph delay={0.05} />
          <CpuGraph delay={0.1} />
        </div>
      </Suspense>
    </div>
    </MotionProvider>
  );
}
