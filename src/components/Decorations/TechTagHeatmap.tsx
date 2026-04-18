import { useMemo } from "react";
import { PanelShell, UsageBar } from "./_helpers";
import { projects } from "@/data/projectsData";
import { aggregateProjectTags } from "@/lib/homeStats";

export function TechTagHeatmap({ delay = 0 }: { delay?: number }) {
  const tags = useMemo(() => aggregateProjectTags(projects, 10), []);

  return (
    <PanelShell label="tags" labelRight="top 10" delay={delay}>
      <div className="px-5 py-3.5 space-y-1.5">
        {tags.map((tag) => (
          <div
            key={tag.label}
            className="flex items-center gap-3 -mx-1 px-1 py-[1px] text-label"
          >
            <span
              className="text-muted-foreground shrink-0"
              style={{ minWidth: "110px" }}
            >
              {tag.label}
            </span>
            <UsageBar pct={tag.pct} />
            <span className="text-muted-foreground-dim w-[20px] text-right shrink-0">
              {tag.count}
            </span>
          </div>
        ))}
      </div>
      <div
        className="flex items-center px-5 py-2 text-muted-foreground text-xs"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span>across {projects.length} projects</span>
      </div>
    </PanelShell>
  );
}
