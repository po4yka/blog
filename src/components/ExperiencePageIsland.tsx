import { motion } from "motion/react";
import { BootBlock, Cmd, Accent, MacWindow } from "./Terminal";
import { NetworkGraph, CpuGraph } from "./Decorations";
import { useInView } from "./useInView";
import { roles, skills, type Role, type SkillGroup } from "./experienceData";
import { MotionProvider } from "./MotionProvider";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

function RoleEntry({ role }: { role: Role }) {
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
              {h}
            </motion.li>
          ))}
        </ul>
      )}

      {/* Tags */}
      {role.tags && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {role.tags.map((tag) => (
            <motion.span
              key={tag}
              className="px-2 py-0.5 text-muted-foreground/35 bg-muted-foreground/5 cursor-default text-xs rounded-[4px]"
              whileHover={{
                scale: 1.08,
                color: "var(--accent)",
                backgroundColor: "rgba(139, 124, 246, 0.08)",
                transition: { type: "spring", stiffness: 400, damping: 15 },
              }}
            >
              {tag}
            </motion.span>
          ))}
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

export function ExperiencePage() {
  const { ref: skillsRef, inView: skillsInView } = useInView(0.1);

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
          { status: "OK", text: `${roles.length} positions indexed` },
          { status: "INFO", text: "Sorted by date, most recent first" },
        ]}
      />

      {/* Resume log */}
      <div className="space-y-4">
        <Cmd>
          cat <Accent>resume.log</Accent>
        </Cmd>
        <MacWindow title="resume.log" dimLights delay={0.05}>
          {roles.map((role) => (
            <RoleEntry key={role.period} role={role} />
          ))}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NetworkGraph delay={0.05} />
        <CpuGraph delay={0.1} />
      </div>
    </div>
    </MotionProvider>
  );
}
