import { useNavigate } from "react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Star, StarOff, Search, FileText } from "lucide-react";
import { useAdmin } from "../../stores/adminStore";

export function AdminBlogList() {
  const { blogPosts, deleteBlogPost, saveBlogPost } = useAdmin();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = search
    ? blogPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : blogPosts;

  const handleToggleFeatured = (slug: string) => {
    const post = blogPosts.find((p) => p.slug === slug);
    if (!post) return;
    // Un-feature all others, toggle this one
    blogPosts.forEach((p) => {
      if (p.slug !== slug && p.featured) {
        saveBlogPost({ ...p, featured: false });
      }
    });
    saveBlogPost({ ...post, featured: !post.featured });
  };

  const handleDelete = (slug: string) => {
    if (confirmDelete === slug) {
      deleteBlogPost(slug);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(slug);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[900px]">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600 }}>
            Blog Posts
          </h1>
          <p className="font-mono text-muted-foreground/40 mt-0.5" style={{ fontSize: "0.625rem" }}>
            {blogPosts.length} {blogPosts.length === 1 ? "post" : "posts"} total
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/blog/new")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer shrink-0"
          style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "3px" }}
        >
          <Plus size={15} />
          New post
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        className="mt-6 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/25 outline-none focus:border-accent/30 transition-colors duration-200"
          style={{ fontSize: "0.8125rem", borderRadius: "3px", fontWeight: 400, lineHeight: 1.5 }}
        />
      </motion.div>

      {/* List */}
      <motion.div
        className="mt-5 border border-border/50 bg-card overflow-hidden"
        style={{ borderRadius: "4px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <FileText size={24} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground/40" style={{ fontSize: "0.8125rem" }}>
              {search ? "No posts match your search" : "No blog posts yet"}
            </p>
          </div>
        )}

        {filtered.map((post, i) => (
          <div
            key={post.slug}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/[0.015] transition-colors duration-200 group"
            style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            {/* Featured toggle */}
            <button
              onClick={() => handleToggleFeatured(post.slug)}
              className="shrink-0 text-muted-foreground/25 hover:text-accent transition-colors duration-200 cursor-pointer p-0.5"
              title={post.featured ? "Remove from featured" : "Set as featured"}
            >
              {post.featured ? (
                <Star size={14} className="text-accent fill-accent/20" />
              ) : (
                <StarOff size={14} />
              )}
            </button>

            {/* Content - clickable */}
            <button
              onClick={() => navigate(`/admin/blog/edit/${post.slug}`)}
              className="flex-1 min-w-0 text-left cursor-pointer"
            >
              <h3
                className="text-foreground truncate group-hover:text-accent transition-colors duration-200"
                style={{ fontSize: "0.8125rem", fontWeight: 500 }}
              >
                {post.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="font-mono text-muted-foreground/35" style={{ fontSize: "0.625rem" }}>
                  {post.date}
                </span>
                <span className="text-border/50">·</span>
                <span className="font-mono text-accent/40" style={{ fontSize: "0.625rem" }}>
                  {post.category}
                </span>
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="font-mono text-muted-foreground/25" style={{ fontSize: "0.5625rem" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDelete(post.slug)}
              className={`shrink-0 p-1.5 transition-colors duration-200 cursor-pointer ${
                confirmDelete === post.slug
                  ? "text-destructive"
                  : "text-muted-foreground/20 hover:text-destructive/60"
              }`}
              title={confirmDelete === post.slug ? "Click again to confirm" : "Delete post"}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </motion.div>
    </div>
  );
}