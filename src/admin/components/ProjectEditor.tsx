import { motion, AnimatePresence } from "motion/react";
import { X, Save, Star, StarOff } from "lucide-react";
import type { Project } from "@/admin/api";
import { FieldBlock, TagsInput, LinksEditor } from "@/admin/components/FormPrimitives";

interface ProjectEditorProps {
  editing: Project;
  isExisting: boolean;
  isPending: boolean;
  onSave: () => void;
  onClose: () => void;
  onChange: (project: Project) => void;
}

export function ProjectEditor({ editing, isExisting, isPending, onSave, onClose, onChange }: ProjectEditorProps) {
  return (
    <AnimatePresence>
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
            {isExisting ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={onClose}
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
                onChange={(e) => onChange({ ...editing, name: e.target.value })}
                placeholder="Project name"
                className="w-full px-3 py-2 bg-card border border-border text-foreground outline-none focus:border-accent/40 transition-colors duration-200 placeholder:text-muted-foreground/30"
                style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
              />
            </FieldBlock>
            <FieldBlock label="Platforms">
              <TagsInput
                tags={editing.platforms}
                onChange={(platforms) => onChange({ ...editing, platforms })}
                placeholder="Android, iOS..."
              />
            </FieldBlock>
          </div>

          <FieldBlock label="Description">
            <textarea
              value={editing.description}
              onChange={(e) => onChange({ ...editing, description: e.target.value })}
              placeholder="Short project description"
              rows={2}
              className="w-full px-3 py-2 bg-card border border-border text-foreground outline-none focus:border-accent/40 transition-colors duration-200 placeholder:text-muted-foreground/30 resize-y"
              style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.6 }}
            />
          </FieldBlock>

          <FieldBlock label="Tags">
            <TagsInput
              tags={editing.tags}
              onChange={(tags) => onChange({ ...editing, tags })}
              placeholder="KMP, Compose..."
            />
          </FieldBlock>

          <FieldBlock label="Links">
            <LinksEditor
              links={editing.links}
              onChange={(links) => onChange({ ...editing, links })}
            />
          </FieldBlock>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onChange({ ...editing, featured: !editing.featured })}
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
              onClick={onClose}
              className="font-mono text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
              style={{ fontSize: "0.75rem" }}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!editing.name.trim() || isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer disabled:opacity-30"
              style={{ fontSize: "0.75rem", fontWeight: 500, borderRadius: "3px" }}
            >
              <Save size={13} />
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
