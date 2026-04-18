import { motion } from "motion/react";
import { useMemo } from "react";
import { useInView } from "@/hooks/useInView";
import { Shell } from "@/components/MobileTerminal/Shell";
import { Accent } from "@/components/Terminal";
import { projects } from "@/data/projectsData";
import { collectPlatforms } from "@/lib/homeStats";

// All statuses rendered in foreground/muted-foreground — no chromatic signal colors
const STATUS_OPACITY: Record<string, number> = {
  Active: 0.85,
  Maintained: 0.6,
  Stable: 0.5,
};

export function ProjectPlatformMatrix({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const platforms = useMemo(() => collectPlatforms(projects), []);

  return (
    <Shell
      delay={delay}
      command={
        <>
          ls -la ~/projects <Accent>|</Accent> awk <Accent>{"'{platforms}'"}</Accent>
        </>
      }
      windowTitle="projects — matrix"
    >
      {() => (
        <div ref={ref} className="px-5 py-3.5 overflow-x-auto">
          {/* Desktop: matrix table */}
          <table className="hidden sm:table w-full text-label font-mono border-collapse">
            <thead>
              <tr>
                <th
                  className="text-left text-muted-foreground uppercase pb-2 pr-4 font-normal"
                  style={{ minWidth: "160px", letterSpacing: "0.1em" }}
                >
                  project
                </th>
                {platforms.map((p) => (
                  <th
                    key={p}
                    className="text-center text-muted-foreground uppercase pb-2 px-2 font-normal whitespace-nowrap"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {p}
                  </th>
                ))}
                <th
                  className="text-center text-muted-foreground uppercase pb-2 pl-3 font-normal"
                  style={{ letterSpacing: "0.1em" }}
                >
                  status
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, i) => (
                <motion.tr
                  key={project.id}
                  className="hover:bg-muted transition-colors duration-150"
                  initial={{ opacity: 0, x: -4 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.25, delay: delay + 0.1 + i * 0.04 }}
                >
                  <td
                    className="text-foreground/75 pr-4 py-[3px] truncate"
                    style={{ maxWidth: "180px" }}
                    title={project.name}
                  >
                    {project.name}
                  </td>
                  {platforms.map((p) => (
                    <td key={p} className="text-center px-2 py-[3px]">
                      {project.platforms.includes(p) ? (
                        <span style={{ color: "var(--foreground)", opacity: 0.7 }}>●</span>
                      ) : (
                        <span className="text-muted-foreground-dim">·</span>
                      )}
                    </td>
                  ))}
                  <td className="text-center pl-3 py-[3px]">
                    <span
                      className="text-label text-muted-foreground"
                      style={{ opacity: STATUS_OPACITY[project.status ?? ""] ?? 0.5 }}
                    >
                      {project.status ?? "—"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: stacked list */}
          <div className="sm:hidden space-y-2.5">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                className="space-y-0.5"
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.25, delay: delay + 0.1 + i * 0.04 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-foreground/75 text-mono-sm font-mono">{project.name}</span>
                  {project.status && (
                    <span
                      className="text-label text-muted-foreground"
                      style={{ opacity: STATUS_OPACITY[project.status] ?? 0.5 }}
                    >
                      · {project.status}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-label font-mono">
                  {project.platforms.join(", ")}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
