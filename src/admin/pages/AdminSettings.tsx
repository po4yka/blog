import { m } from "motion/react";
import { useAdminSettings, useCategories } from "@/admin/hooks/useAdminQueries";

export function AdminSettings() {
  const { data: settings } = useAdminSettings();
  const { data: categories = [] } = useCategories();

  const profile: [string, string | undefined][] = [
    ["Display Name", settings?.name],
    ["Handle", settings?.handle],
    ["Role / Tagline", settings?.role],
    ["Bio", settings?.bio],
  ];
  const links: [string, string | undefined][] = [
    ["GitHub", settings?.github],
    ["Email", settings?.email],
    ["Telegram", settings?.telegram],
    ["LinkedIn", settings?.linkedin],
  ];

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[700px]">
      <m.div
        className="mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600 }}>
          Settings
        </h1>
        <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>
          Site profile as deployed. Edit it in the repository.
        </p>
      </m.div>

      <m.div
        className="space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Section title="Profile">
          <Fields rows={profile} />
        </Section>

        <Section title="Social Links">
          <Fields rows={links} mono />
        </Section>

        <Section title="Blog Categories">
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c !== "All")
              .map((cat) => (
                <span
                  key={cat}
                  className="font-mono px-2.5 py-1 bg-secondary/60 text-foreground/80 border border-border/40"
                  style={{ fontSize: "max(11px, 0.6875rem)", borderRadius: "2px" }}
                >
                  {cat}
                </span>
              ))}
          </div>
        </Section>
      </m.div>
    </div>
  );
}

function Fields({ rows, mono }: { rows: [string, string | undefined][]; mono?: boolean }) {
  return (
    <dl className="space-y-4">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>
            {label}
          </dt>
          <dd
            className={`text-foreground mt-0.5 ${mono ? "font-mono break-all" : ""}`}
            style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}
          >
            {value || "-"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/50 p-5" style={{ borderRadius: "2px" }}>
      <h2 className="text-foreground mb-4" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
