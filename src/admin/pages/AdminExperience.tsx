import { m } from "motion/react";
import { useRoles } from "@/admin/hooks/useAdminQueries";
import { AdminPageHeader } from "@/admin/components/AdminPageHeader";

export function AdminExperience() {
  const { data: roles = [] } = useRoles();

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[900px]">
      <AdminPageHeader
        number="04"
        label="EXPERIENCE"
        meta={<>{roles.length} {roles.length === 1 ? "role" : "roles"} in D1</>}
        title="Experience"
        description="Roles stored in D1, in display order."
      />

      {/* Roles list */}
      <m.div
        className="border border-border/50 bg-card overflow-hidden"
        style={{ borderRadius: "2px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {roles.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>No experience entries yet</p>
          </div>
        )}

        {roles.map((role, i) => (
          <div
            key={role.id}
            className="flex items-start gap-3 px-4 py-4 hover:bg-foreground/[0.015] transition-colors duration-200 group"
            style={{ borderBottom: i < roles.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <h3 className="text-foreground truncate" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                  {role.title}
                </h3>
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  {role.company}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>
                  {role.period}
                </span>
                {role.tags && role.tags.length > 0 && (
                  <>
                    <span className="text-border/50">·</span>
                    {role.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>
                        {tag}
                      </span>
                    ))}
                  </>
                )}
              </div>
              <p className="mt-1 text-foreground/80 line-clamp-1" style={{ fontSize: "0.75rem" }}>
                {role.description}
              </p>
            </div>
          </div>
        ))}
      </m.div>
    </div>
  );
}
