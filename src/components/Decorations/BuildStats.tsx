import { buildMeta } from "@/data/buildMeta";
import { PanelShell } from "./_helpers";

const GH_REPO = "po4yka/blog";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function BuildStats({ delay = 0 }: { delay?: number }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: "Deploy",
      value: (
        <time dateTime={buildMeta.deployDate}>
          {formatDate(buildMeta.deployDate)}
        </time>
      ),
    },
    {
      label: "Commit",
      value: (
        <a
          href={`https://github.com/${GH_REPO}/commit/${buildMeta.commitHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/90 hover:text-foreground hover:underline decoration-dotted underline-offset-2 transition-colors duration-150"
          title={`View commit ${buildMeta.commitHash} on GitHub`}
        >
          {buildMeta.commitHash}
        </a>
      ),
    },
    { label: "Astro", value: `v${buildMeta.astroVersion}` },
    {
      label: "Content",
      value: [
        pluralize(buildMeta.postCount, "post", "posts"),
        pluralize(buildMeta.projectCount, "project", "projects"),
        pluralize(buildMeta.roleCount, "role", "roles"),
      ].join(" · "),
    },
  ];

  return (
    <PanelShell label="BUILD" labelRight="po4yka.dev" delay={delay}>
      <div className="px-5 py-3 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 min-w-0">
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">
              {row.label}
            </span>
            <span className="text-foreground/90 text-mono-sm text-right truncate min-w-0">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
