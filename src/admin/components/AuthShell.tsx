import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { OperatorPanel } from "@/components/Terminal/windows";

/**
 * Frame for the signed-out admin pages (login, passkey setup): the site link
 * above one operator panel. `status` is the panel's bottom line and must show
 * real state only.
 */
export function AuthShell({
  label,
  status,
  children,
}: {
  label: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <a
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-muted-foreground hover:text-foreground transition-opacity duration-100"
          style={{ fontSize: "max(11px, 0.75rem)", letterSpacing: "0.02em" }}
        >
          <ArrowLeft size={12} aria-hidden="true" />
          po4yka.dev
        </a>
        <h1 className="sr-only">Admin {label.toLowerCase()}</h1>
        <OperatorPanel sectionNumber="00" label={`ADMIN / ${label}`} titleExt={window.location.host} statusLine={status}>
          <div className="font-sans">{children}</div>
        </OperatorPanel>
      </div>
    </main>
  );
}
