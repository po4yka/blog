import { useState } from "react";
import { m } from "motion/react";
import { useAuthContext } from "@/admin/contexts/AuthContext";
import { ApiError } from "@/admin/api";
import { AdminPageHeader } from "@/admin/components/AdminPageHeader";
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
      <AdminPageHeader
        number="06"
        label="SETTINGS"
        meta="IN D1"
        title="Settings"
        description="Site profile, social links and blog categories. Content is edited in the repository."
      />

      <m.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Section title="Profile">
          <Fields rows={profile} />
        </Section>

        <Section title="Social Links">
          <Fields rows={links} mono />
        </Section>

        <Sessions />

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

function Sessions() {
  const { logoutEverywhere } = useAuthContext();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoke = async () => {
    setBusy(true);
    setError(null);
    try {
      // On success the auth state drops and AdminLayout returns to the sign-in page.
      await logoutEverywhere();
    } catch (e) {
      // A 401 already returned the user to sign-in (see adminFetch); 403 is a scoped session.
      setError(
        e instanceof ApiError && e.status === 403
          ? "This session has limited access and cannot revoke the others."
          : "Could not revoke the sessions. Try again.",
      );
      setBusy(false);
    }
  };

  return (
    <Section title="Sessions">
      <p className="text-muted-foreground mb-4" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
        Sign out on every device, this one included. Use it when a device is lost or a session may be stolen.
      </p>
      <button
        type="button"
        onClick={() => void revoke()}
        disabled={busy}
        className="px-4 py-2 border border-border/60 text-foreground/80 hover:bg-secondary/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
        style={{ fontSize: "0.75rem", borderRadius: "2px" }}
      >
        {busy ? "Signing out..." : "Sign out everywhere"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-muted-foreground" style={{ fontSize: "0.75rem" }}>
          {error}
        </p>
      )}
    </Section>
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
