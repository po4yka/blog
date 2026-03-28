import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Save, RotateCcw, AlertTriangle, Plus, Check } from "lucide-react";
import type { SiteSettings } from "../api";
import {
  useAdminSettings,
  useUpdateSettings,
  useCategories,
  useAddCategory,
  useRemoveCategory,
} from "../hooks/useAdminQueries";

const defaultSettings: SiteSettings = {
  name: "", handle: "", role: "", bio: "", github: "", email: "", telegram: "", linkedin: "",
};

export function AdminSettings() {
  const { data: settings } = useAdminSettings();
  const { data: categories = [] } = useCategories();
  const updateSettingsMutation = useUpdateSettings();
  const addCategoryMutation = useAddCategory();
  const removeCategoryMutation = useRemoveCategory();

  const [form, setForm] = useState<SiteSettings>(settings ?? defaultSettings);
  const [newCat, setNewCat] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (settings) setForm(settings);
  }, [settings]);

  const updateField = (key: keyof SiteSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(form, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const handleReset = () => {
    if (confirmReset) {
      setConfirmReset(false);
      window.location.reload();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    }
  };

  const handleAddCategory = () => {
    const cat = newCat.trim();
    if (cat && cat !== "All") {
      addCategoryMutation.mutate(cat);
      setNewCat("");
    }
  };

  const editableCategories = categories.filter((c) => c !== "All");

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[700px]">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600 }}>
          Settings
        </h1>
        <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: "0.8125rem" }}>
          Site profile and configuration
        </p>
      </motion.div>

      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Profile section */}
        <Section title="Profile">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Display Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="settings-input"
                />
              </Field>
              <Field label="Handle">
                <input
                  type="text"
                  value={form.handle}
                  onChange={(e) => updateField("handle", e.target.value)}
                  className="settings-input font-mono"
                />
              </Field>
            </div>

            <Field label="Role / Tagline">
              <input
                type="text"
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
                className="settings-input"
              />
            </Field>

            <Field label="Bio">
              <textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={3}
                className="settings-input resize-y"
                style={{ lineHeight: 1.6 }}
              />
            </Field>
          </div>
        </Section>

        {/* Links section */}
        <Section title="Social Links">
          <div className="space-y-4">
            <Field label="GitHub">
              <input
                type="text"
                value={form.github}
                onChange={(e) => updateField("github", e.target.value)}
                placeholder="https://github.com/..."
                className="settings-input font-mono"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="hello@example.dev"
                className="settings-input font-mono"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telegram">
                <input
                  type="text"
                  value={form.telegram}
                  onChange={(e) => updateField("telegram", e.target.value)}
                  placeholder="https://t.me/..."
                  className="settings-input font-mono"
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  type="text"
                  value={form.linkedin}
                  onChange={(e) => updateField("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="settings-input font-mono"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Blog categories */}
        <Section title="Blog Categories">
          <div className="flex flex-wrap gap-2 mb-3">
            {editableCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 font-mono px-2.5 py-1 bg-secondary/60 text-foreground/60 border border-border/40"
                style={{ fontSize: "0.6875rem", borderRadius: "2px" }}
              >
                {cat}
                <button
                  onClick={() => removeCategoryMutation.mutate(cat)}
                  className="text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer"
                  style={{ fontSize: "0.75rem", lineHeight: 1 }}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
              placeholder="New category"
              className="settings-input flex-1"
              style={{ maxWidth: "200px" }}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCat.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 border border-border/50 text-muted-foreground/50 hover:text-foreground hover:border-border transition-colors cursor-pointer disabled:opacity-30"
              style={{ fontSize: "0.75rem", borderRadius: "3px" }}
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border/40">
          <button
            onClick={handleReset}
            className={`inline-flex items-center gap-2 px-3 py-1.5 border transition-colors duration-200 cursor-pointer ${
              confirmReset
                ? "border-destructive/40 text-destructive bg-destructive/[0.04]"
                : "border-border/50 text-muted-foreground/40 hover:text-foreground hover:border-border"
            }`}
            style={{ fontSize: "0.75rem", borderRadius: "3px" }}
          >
            {confirmReset ? (
              <>
                <AlertTriangle size={13} />
                Click again to confirm reset
              </>
            ) : (
              <>
                <RotateCcw size={13} />
                Reset to defaults
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer"
            style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "3px" }}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved!" : "Save settings"}
          </button>
        </div>
      </motion.div>

      <style>{`
        .settings-input {
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
        .settings-input::placeholder { color: var(--muted-foreground); opacity: 0.3; }
        .settings-input:focus { border-color: var(--accent); opacity: 1; }
      `}</style>
    </div>
  );
}

// --- Sub-components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/50 p-5" style={{ borderRadius: "4px" }}>
      <h2 className="text-foreground mb-4" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-muted-foreground/60 mb-1.5" style={{ fontSize: "0.6875rem", letterSpacing: "0.02em", fontWeight: 400, lineHeight: 1.5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}