import { useState } from "react";
import { m } from "motion/react";
import { Star, Search, FileText } from "lucide-react";
import { usePosts } from "@/admin/hooks/useAdminQueries";

export function AdminBlogList() {
  const { data: blogPosts = [] } = usePosts();
  const [search, setSearch] = useState("");

  const filtered = search
    ? blogPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : blogPosts;

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[900px]">
      {/* Header */}
      <m.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600 }}>
            Blog Posts
          </h1>
          <p className="font-mono text-muted-foreground-dim mt-0.5" style={{ fontSize: "max(11px, 0.6875rem)" }}>
            {blogPosts.length} {blogPosts.length === 1 ? "post" : "posts"} total
          </p>
        </div>
      </m.div>

      {/* Search */}
      <m.div
        className="mt-6 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground-dim" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          aria-label="Search posts"
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/25 focus-visible:outline-2 focus-visible:outline-emphasis focus-visible:outline-offset-2 outline-none focus:border-border transition-colors duration-200"
          style={{ fontSize: "0.8125rem", borderRadius: "2px", fontWeight: 400, lineHeight: 1.5 }}
        />
      </m.div>

      {/* List */}
      <m.div
        className="mt-5 border border-border/50 bg-card overflow-hidden"
        style={{ borderRadius: "2px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <FileText size={24} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
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
            {post.featured && (
              <Star size={14} className="shrink-0 fill-foreground/20" aria-label="Featured" />
            )}

            <div className="flex-1 min-w-0 text-left">
              <h3
                className="text-foreground truncate group-hover:text-foreground transition-colors duration-200"
                style={{ fontSize: "0.8125rem", fontWeight: 500 }}
              >
                {post.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>
                  {post.date}
                </span>
                <span className="text-border/50">·</span>
                <span className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>
                  {post.category}
                </span>
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </m.div>
    </div>
  );
}
