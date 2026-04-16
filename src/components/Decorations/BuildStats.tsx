import { buildMeta } from "@/data/buildMeta";
import { PanelShell } from "./_helpers";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function BuildStats({ delay = 0 }: { delay?: number }) {
  const rows = [
    { label: "Deploy", value: formatDate(buildMeta.deployDate) },
    { label: "Commit", value: buildMeta.commitHash },
    { label: "Astro", value: `v${buildMeta.astroVersion}` },
    { label: "Content", value: `${buildMeta.postCount} posts · ${buildMeta.projectCount} projects · ${buildMeta.roleCount} roles` },
  ];

  return (
    <PanelShell label="BUILD" labelRight="po4yka.dev" delay={delay}>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <span className="text-muted-foreground/50 text-mono-sm shrink-0">
              {row.label}
            </span>
            <span className="text-foreground/70 text-mono-sm text-right truncate">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
