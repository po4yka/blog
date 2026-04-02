import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, X, Save, GripVertical } from "lucide-react";
import type { Role } from "@/admin/api";
import { useRoles, useSaveRole, useDeleteRole } from "@/admin/hooks/useAdminQueries";
import { FieldBlock as Field, TagsInput } from "@/admin/components/FormPrimitives";
import { useConfirmDelete } from "@/admin/hooks/useConfirmDelete";

function newRole(): Role {
  return {
    id: `role-${Date.now()}`,
    period: "",
    company: "",
    title: "",
    description: "",
    tags: [],
    sortOrder: 0,
  };
}

export function AdminExperience() {
  const { data: roles = [] } = useRoles();
  const saveRoleMutation = useSaveRole();
  const deleteRoleMutation = useDeleteRole();
  const [editing, setEditing] = useState<Role | null>(null);
  const { confirmingId: confirmDelete, requestDelete } = useConfirmDelete();

  const handleSave = () => {
    if (!editing || !editing.title.trim()) return;
    saveRoleMutation.mutate(editing, { onSuccess: () => setEditing(null) });
  };

  const handleDelete = (id: string) => {
    requestDelete(id, () => {
      deleteRoleMutation.mutate(id);
      if (editing?.id === id) setEditing(null);
    });
  };

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[900px]">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600 }}>
            Experience
          </h1>
          <p className="font-mono text-muted-foreground/40 mt-0.5" style={{ fontSize: "0.625rem" }}>
            {roles.length} {roles.length === 1 ? "role" : "roles"}
          </p>
        </div>
        <button
          onClick={() => setEditing(newRole())}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer"
          style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "3px" }}
        >
          <Plus size={15} />
          Add role
        </button>
      </motion.div>

      {/* Editor */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="mb-6 border border-accent/20 bg-card p-5"
            style={{ borderRadius: "4px" }}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-foreground" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
                {roles.find((r) => r.id === editing.id) ? "Edit Role" : "New Role"}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-muted-foreground/30 hover:text-foreground transition-colors cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Title" required>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="e.g. Senior Android Developer"
                    className="w-full px-3 py-2 bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors"
                    style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
                  />
                </Field>
                <Field label="Company" required>
                  <input
                    type="text"
                    value={editing.company}
                    onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                    placeholder="e.g. Tech Company"
                    className="w-full px-3 py-2 bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors"
                    style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
                  />
                </Field>
              </div>

              <Field label="Period">
                <input
                  type="text"
                  value={editing.period}
                  onChange={(e) => setEditing({ ...editing, period: e.target.value })}
                  placeholder="2021 — 2023"
                  className="w-full px-3 py-2 bg-card border border-border/50 text-foreground font-mono placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors"
                  style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Brief description of the role"
                  rows={2}
                  className="w-full px-3 py-2 bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors resize-y"
                  style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.6 }}
                />
              </Field>

              <Field label="Tags">
                <TagsInput
                  tags={editing.tags || []}
                  onChange={(tags) => setEditing({ ...editing, tags })}
                  placeholder="Android, Compose, Gradle..."
                />
              </Field>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/30">
                <button
                  onClick={() => setEditing(null)}
                  className="font-mono text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontSize: "0.75rem" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editing.title.trim() || saveRoleMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer disabled:opacity-30"
                  style={{ fontSize: "0.75rem", fontWeight: 500, borderRadius: "3px" }}
                >
                  <Save size={13} />
                  {saveRoleMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roles list */}
      <motion.div
        className="border border-border/50 bg-card overflow-hidden"
        style={{ borderRadius: "4px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {roles.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground/40" style={{ fontSize: "0.8125rem" }}>No experience entries yet</p>
          </div>
        )}

        {roles.map((role, i) => (
          <div
            key={role.id}
            className="flex items-start gap-3 px-4 py-4 hover:bg-foreground/[0.015] transition-colors duration-200 group"
            style={{ borderBottom: i < roles.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <GripVertical size={14} className="shrink-0 text-muted-foreground/15 mt-0.5" />

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <h3 className="text-foreground truncate" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                  {role.title}
                </h3>
                <span className="text-muted-foreground/40" style={{ fontSize: "0.75rem" }}>
                  {role.company}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-muted-foreground/35" style={{ fontSize: "0.625rem" }}>
                  {role.period}
                </span>
                {role.tags && role.tags.length > 0 && (
                  <>
                    <span className="text-border/50">·</span>
                    {role.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="font-mono text-accent/35" style={{ fontSize: "0.5625rem" }}>
                        {tag}
                      </span>
                    ))}
                  </>
                )}
              </div>
              <p className="mt-1 text-foreground/35 line-clamp-1" style={{ fontSize: "0.75rem" }}>
                {role.description}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditing({ ...role })}
                className="shrink-0 font-mono text-muted-foreground/30 hover:text-accent transition-colors cursor-pointer px-2 py-1"
                style={{ fontSize: "0.625rem" }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(role.id!)}
                className={`shrink-0 p-1 transition-colors cursor-pointer ${
                  confirmDelete === role.id ? "text-destructive" : "text-muted-foreground/20 hover:text-destructive/60"
                }`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

