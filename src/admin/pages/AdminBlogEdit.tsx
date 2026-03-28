import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Save, Eye, EyeOff, Star, StarOff } from "lucide-react";
import type { BlogPost } from "../../components/blogData";
import { usePosts, useSavePost, useCategories, useAddCategory } from "../hooks/useAdminQueries";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function currentDateLabel(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function AdminBlogEdit() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: blogPosts = [] } = usePosts();
  const { data: categories = [] } = useCategories();
  const savePostMutation = useSavePost();
  const addCategoryMutation = useAddCategory();
  const isNew = !slug || slug === "new";

  const existing = isNew ? null : blogPosts.find((p) => p.slug === slug);

  const [form, setForm] = useState<BlogPost>({
    slug: "",
    title: "",
    date: currentDateLabel(),
    summary: "",
    tags: [],
    category: categories[1] || "Architecture",
    content: "",
    featured: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);

  // Sync form when existing post loads from server (external data source)
  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(existing);
    }
  }, [existing]);

  const updateField = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "title" && isNew) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", form.tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    // Ensure category exists
    if (!categories.includes(form.category)) {
      addCategoryMutation.mutate(form.category);
    }
    savePostMutation.mutate(form, {
      onSuccess: () => {
        if (isNew) {
          navigate(`/admin/blog/edit/${form.slug}`, { replace: true });
        }
      },
    });
  };

  const availableCategories = categories.filter((c) => c !== "All");

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 220));

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[800px]">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/blog")}
            className="text-muted-foreground/40 hover:text-foreground transition-colors duration-200 cursor-pointer p-1"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-foreground" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
              {isNew ? "New Post" : "Edit Post"}
            </h1>
            {!isNew && (
              <span className="font-mono text-muted-foreground/30" style={{ fontSize: "0.5625rem" }}>
                /{form.slug}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border transition-colors duration-200 cursor-pointer"
            style={{ fontSize: "0.75rem", borderRadius: "3px" }}
          >
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || savePostMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontSize: "0.75rem", fontWeight: 500, borderRadius: "3px" }}
          >
            <Save size={13} />
            {savePostMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {preview ? (
          /* Preview mode */
          <div className="border border-border/50 bg-card p-6 md:p-8" style={{ borderRadius: "4px" }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="font-mono text-muted-foreground" style={{ fontSize: "0.6875rem" }}>{form.date}</span>
              <span className="text-border">·</span>
              <span className="font-mono text-accent/60" style={{ fontSize: "0.6875rem" }}>{form.category}</span>
              <span className="text-border">·</span>
              <span className="font-mono text-muted-foreground/40" style={{ fontSize: "0.6875rem" }}>{readingTime} min read</span>
            </div>
            <h2 className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.25 }}>
              {form.title || "Untitled"}
            </h2>
            <p className="mt-3 text-foreground/50" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
              {form.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono px-2 py-0.5 bg-secondary/60 text-foreground/50 border border-border/50"
                  style={{ fontSize: "0.625rem", borderRadius: "2px" }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 border-t border-border/40 pt-6">
              {form.content.split("\n\n").map((para, i) => {
                const trimmed = para.trim();
                if (trimmed.startsWith("## "))
                  return (
                    <h3 key={i} className="mt-6 mb-3 text-foreground" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                      {trimmed.replace("## ", "")}
                    </h3>
                  );
                if (trimmed.startsWith("- "))
                  return (
                    <ul key={i} className="mb-3 ml-4 space-y-1">
                      {trimmed.split("\n").filter((l) => l.startsWith("- ")).map((l, j) => (
                        <li key={j} className="text-foreground/60 list-disc" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                          {l.replace("- ", "")}
                        </li>
                      ))}
                    </ul>
                  );
                return (
                  <p key={i} className="mb-3 text-foreground/60" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-5">
            {/* Title */}
            <Field label="Title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Post title"
                className="w-full px-3.5 py-2.5 bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors duration-200"
                style={{ fontSize: "0.875rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
              />
            </Field>

            {/* Slug */}
            <Field label="Slug">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value.replace(/[^a-z0-9-]/g, ""))}
                placeholder="post-slug"
                className="w-full px-3.5 py-2.5 bg-card border border-border/50 text-foreground font-mono placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors duration-200"
                style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
              />
            </Field>

            {/* Date + Category row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date">
                <input
                  type="text"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  placeholder="Mar 2026"
                  className="w-full px-3.5 py-2.5 bg-card border border-border/50 text-foreground font-mono placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors duration-200"
                  style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-card border border-border/50 text-foreground outline-none focus:border-accent/30 transition-colors duration-200 cursor-pointer"
                  style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateField("featured", !form.featured)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 border transition-all duration-200 cursor-pointer ${
                  form.featured
                    ? "border-accent/30 text-accent bg-accent/[0.04]"
                    : "border-border/50 text-muted-foreground/50 hover:border-border"
                }`}
                style={{ fontSize: "0.75rem", borderRadius: "3px" }}
              >
                {form.featured ? <Star size={13} className="fill-accent/20" /> : <StarOff size={13} />}
                {form.featured ? "Featured" : "Not featured"}
              </button>
            </div>

            {/* Summary */}
            <Field label="Summary">
              <textarea
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                placeholder="Brief description of the post"
                rows={2}
                className="w-full px-3.5 py-2.5 bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors duration-200 resize-y"
                style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.6 }}
              />
            </Field>

            {/* Tags */}
            <Field label="Tags">
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-card border border-border/50 min-h-[42px]" style={{ borderRadius: "3px" }}>
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 font-mono px-2 py-0.5 bg-secondary/80 text-foreground/60 border border-border/40"
                    style={{ fontSize: "0.6875rem", borderRadius: "2px" }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer ml-0.5"
                      style={{ fontSize: "0.75rem", lineHeight: 1 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={form.tags.length === 0 ? "Add tags (Enter to add)" : ""}
                  className="flex-1 min-w-[100px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/20 font-mono"
                  style={{ fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.5 }}
                />
              </div>
            </Field>

            {/* Content */}
            <Field label={`Content`}>
              <div className="relative">
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Write your post content here. Use ## for headings, - for lists, **bold** for emphasis..."
                  rows={18}
                  className="w-full px-3.5 py-3 bg-card border border-border/50 text-foreground font-mono placeholder:text-muted-foreground/20 outline-none focus:border-accent/30 transition-colors duration-200 resize-y"
                  style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.7 }}
                />
                <div className="absolute bottom-2.5 right-3 flex items-center gap-3">
                  <span className="font-mono text-muted-foreground/20" style={{ fontSize: "0.5625rem" }}>
                    {wordCount} words
                  </span>
                  <span className="font-mono text-muted-foreground/20" style={{ fontSize: "0.5625rem" }}>
                    ~{readingTime} min
                  </span>
                </div>
              </div>
            </Field>

            {/* Save */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => navigate("/admin/blog")}
                className="font-mono text-muted-foreground/40 hover:text-foreground transition-colors duration-200 cursor-pointer"
                style={{ fontSize: "0.75rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || savePostMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer disabled:opacity-30"
                style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "3px" }}
              >
                <Save size={14} />
                {savePostMutation.isPending ? "Saving..." : "Save post"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// --- Field wrapper ---

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block font-mono text-muted-foreground/60 mb-1.5"
        style={{ fontSize: "0.6875rem", letterSpacing: "0.02em", fontWeight: 400, lineHeight: 1.5 }}
      >
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}