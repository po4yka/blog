import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Star, ChevronDown, ChevronUp } from "lucide-react";
import type { Project } from "@/admin/api";
import { useProjects, useSaveProject, useDeleteProject } from "@/admin/hooks/useAdminQueries";
import { ProjectEditor } from "@/admin/components/ProjectEditor";

function newProject(): Project {
  return {
    id: `proj-${Date.now()}`,
    name: "",
    description: "",
    platforms: [],
    tags: [],
    links: [],
    featured: false,
    sortOrder: 0,
  };
}

export function AdminProjects() {
  const { data: projects = [] } = useProjects();
  const saveProjectMutation = useSaveProject();
  const deleteProjectMutation = useDeleteProject();
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSave = () => {
    if (!editing || !editing.name.trim()) return;
    saveProjectMutation.mutate(editing, { onSuccess: () => setEditing(null) });
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteProjectMutation.mutate(id);
      setConfirmDelete(null);
      if (editing?.id === id) setEditing(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
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
            Projects
          </h1>
          <p className="font-mono text-muted-foreground/40 mt-0.5" style={{ fontSize: "0.625rem" }}>
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <button
          onClick={() => setEditing(newProject())}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer"
          style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "3px" }}
        >
          <Plus size={15} />
          Add project
        </button>
      </motion.div>

      {/* Editor modal */}
      {editing && (
        <ProjectEditor
          editing={editing}
          isExisting={!!projects.find((p) => p.id === editing.id)}
          isPending={saveProjectMutation.isPending}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          onChange={setEditing}
        />
      )}

      {/* Project list */}
      <motion.div
        className="border border-border/50 bg-card overflow-hidden"
        style={{ borderRadius: "4px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {projects.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground/40" style={{ fontSize: "0.8125rem" }}>No projects yet</p>
          </div>
        )}

        {projects.map((project, i) => (
          <div
            key={project.id}
            className="hover:bg-foreground/[0.015] transition-colors duration-200"
            style={{ borderBottom: i < projects.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <button
                onClick={() => setExpanded(expanded === project.id ? null : project.id ?? null)}
                className="shrink-0 text-muted-foreground/25 hover:text-foreground/50 transition-colors cursor-pointer p-0.5"
              >
                {expanded === project.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {project.featured && <Star size={12} className="text-accent fill-accent/20 shrink-0" />}

              <div className="flex-1 min-w-0">
                <h3 className="text-foreground truncate" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                  {project.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {project.platforms.map((p) => (
                    <span key={p} className="font-mono text-accent/40" style={{ fontSize: "0.5625rem" }}>{p}</span>
                  ))}
                  <span className="text-border/50">·</span>
                  <span className="font-mono text-muted-foreground/30" style={{ fontSize: "0.5625rem" }}>
                    {project.tags.length} tags
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditing({ ...project })}
                className="shrink-0 font-mono text-muted-foreground/30 hover:text-accent transition-colors cursor-pointer"
                style={{ fontSize: "0.625rem" }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(project.id!)}
                className={`shrink-0 p-1 transition-colors cursor-pointer ${
                  confirmDelete === project.id ? "text-destructive" : "text-muted-foreground/20 hover:text-destructive/60"
                }`}
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {expanded === project.id && (
                <motion.div
                  className="px-4 pb-4 pl-12"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-foreground/50 mb-2" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="font-mono px-2 py-0.5 bg-secondary/60 text-foreground/40 border border-border/40" style={{ fontSize: "0.5625rem", borderRadius: "2px" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {project.links.map((link) => (
                      <span key={link.type} className="font-mono text-accent/50" style={{ fontSize: "0.625rem" }}>
                        {link.type}: {link.href}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      {/* Inline styles for admin inputs */}
      <style>{`
        .admin-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--foreground);
          font-size: 0.8125rem;
          border-radius: 3px;
          outline: none;
          transition: border-color 0.2s;
          font-weight: 400;
          line-height: 1.5;
        }
        .admin-input::placeholder { color: var(--muted-foreground); opacity: 0.3; }
        .admin-input:focus { border-color: var(--accent); opacity: 0.4; }
      `}</style>
    </div>
  );
}
