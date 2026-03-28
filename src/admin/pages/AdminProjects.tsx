import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, X, Save, Star, StarOff, ChevronDown, ChevronUp } from "lucide-react";
import type { Project } from "../api";
import { useProjects, useSaveProject, useDeleteProject } from "../hooks/useAdminQueries";

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
                {projects.find((p) => p.id === editing.id) ? "Edit Project" : "New Project"}
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
                <FieldBlock label="Name" required>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Project name"
                    className="admin-input"
                  />
                </FieldBlock>
                <FieldBlock label="Platforms">
                  <TagsInput
                    tags={editing.platforms}
                    onChange={(platforms) => setEditing({ ...editing, platforms })}
                    placeholder="Android, iOS..."
                  />
                </FieldBlock>
              </div>

              <FieldBlock label="Description">
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Short project description"
                  rows={2}
                  className="admin-input resize-y"
                  style={{ lineHeight: 1.6 }}
                />
              </FieldBlock>

              <FieldBlock label="Tags">
                <TagsInput
                  tags={editing.tags}
                  onChange={(tags) => setEditing({ ...editing, tags })}
                  placeholder="KMP, Compose..."
                />
              </FieldBlock>

              <FieldBlock label="Links">
                <LinksEditor
                  links={editing.links}
                  onChange={(links) => setEditing({ ...editing, links })}
                />
              </FieldBlock>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setEditing({ ...editing, featured: !editing.featured })}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 border transition-all duration-200 cursor-pointer ${
                    editing.featured
                      ? "border-accent/30 text-accent bg-accent/[0.04]"
                      : "border-border/50 text-muted-foreground/50 hover:border-border"
                  }`}
                  style={{ fontSize: "0.75rem", borderRadius: "3px" }}
                >
                  {editing.featured ? <Star size={13} className="fill-accent/20" /> : <StarOff size={13} />}
                  Featured
                </button>
              </div>

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
                  disabled={!editing.name.trim() || saveProjectMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer disabled:opacity-30"
                  style={{ fontSize: "0.75rem", fontWeight: 500, borderRadius: "3px" }}
                >
                  <Save size={13} />
                  {saveProjectMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                onClick={() => setExpanded(expanded === project.id ? null : project.id)}
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
                onClick={() => handleDelete(project.id)}
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

// --- Sub-components ---

function FieldBlock({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-muted-foreground/60 mb-1.5" style={{ fontSize: "0.6875rem", letterSpacing: "0.02em", fontWeight: 400, lineHeight: 1.5 }}>
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TagsInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-card border border-border/50 min-h-[38px]" style={{ borderRadius: "3px" }}>
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 font-mono px-2 py-0.5 bg-secondary/80 text-foreground/60 border border-border/40" style={{ fontSize: "0.625rem", borderRadius: "2px" }}>
          {tag}
          <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer ml-0.5" style={{ fontSize: "0.6875rem", lineHeight: 1 }}>
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/20 font-mono"
        style={{ fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.5 }}
      />
    </div>
  );
}

function LinksEditor({ links, onChange }: { links: { type: string; href: string }[]; onChange: (links: { type: string; href: string }[]) => void }) {
  const addLink = () => onChange([...links, { type: "GitHub", href: "#" }]);
  const updateLink = (i: number, field: "type" | "href", value: string) => {
    const updated = [...links];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };
  const removeLink = (i: number) => onChange(links.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={link.type}
            onChange={(e) => updateLink(i, "type", e.target.value)}
            className="admin-input shrink-0"
            style={{ width: "130px", cursor: "pointer" }}
          >
            <option>GitHub</option>
            <option>Google Play</option>
            <option>App Store</option>
            <option>Website</option>
          </select>
          <input
            type="text"
            value={link.href}
            onChange={(e) => updateLink(i, "href", e.target.value)}
            placeholder="URL"
            className="admin-input flex-1"
          />
          <button onClick={() => removeLink(i)} className="text-muted-foreground/20 hover:text-destructive transition-colors cursor-pointer p-1">
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addLink}
        className="inline-flex items-center gap-1 font-mono text-muted-foreground/30 hover:text-accent transition-colors cursor-pointer"
        style={{ fontSize: "0.625rem" }}
      >
        <Plus size={11} />
        Add link
      </button>
    </div>
  );
}