import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { FileText, FolderKanban, Briefcase, Clock, ArrowRight, ArrowUpRight } from "lucide-react";
import { usePosts, useProjects, useRoles, useAdminSettings } from "@/admin/hooks/useAdminQueries";

export function AdminDashboard() {
  const { data: blogPosts = [] } = usePosts();
  const { data: projects = [] } = useProjects();
  const { data: roles = [] } = useRoles();
  const { data: settings } = useAdminSettings();
  const navigate = useNavigate();

  const stats = [
    { label: "Blog Posts", value: blogPosts.length, icon: FileText, path: "/admin/blog", accent: true },
    { label: "Projects", value: projects.length, icon: FolderKanban, path: "/admin/projects", accent: false },
    { label: "Experience", value: roles.length, icon: Briefcase, path: "/admin/experience", accent: false },
  ];

  const recentPosts = blogPosts.slice(0, 4);
  const featuredCount = blogPosts.filter((p) => p.featured).length;
  const totalTags = [...new Set(blogPosts.flatMap((p) => p.tags))].length;

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[900px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600, lineHeight: 1.2 }}>
            Dashboard
          </h1>
          <span
            className="font-mono text-muted-foreground/30"
            style={{ fontSize: "0.625rem" }}
          >
            {settings?.handle}
          </span>
        </div>
        <p className="text-muted-foreground/50" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
          Manage your website content
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="group flex items-center gap-4 p-4 bg-card border border-border/50 hover:border-accent/25 transition-all duration-300 text-left cursor-pointer"
              style={{ borderRadius: "6px" }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center border border-border/40 group-hover:border-accent/30 transition-colors duration-300"
                style={{ borderRadius: "5px" }}
              >
                <Icon size={16} className={stat.accent ? "text-accent" : "text-muted-foreground/60"} />
              </div>
              <div>
                <div className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600, lineHeight: 1.1 }}>
                  {stat.value}
                </div>
                <div className="font-mono text-muted-foreground/50" style={{ fontSize: "0.625rem", letterSpacing: "0.04em" }}>
                  {stat.label}
                </div>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* Quick metrics row */}
      <motion.div
        className="flex flex-wrap gap-x-8 gap-y-2 mt-6 px-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-accent" style={{ borderRadius: "1px" }} />
          <span className="font-mono text-muted-foreground/40" style={{ fontSize: "0.625rem" }}>
            {featuredCount} featured
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-foreground/20" style={{ borderRadius: "1px" }} />
          <span className="font-mono text-muted-foreground/40" style={{ fontSize: "0.625rem" }}>
            {totalTags} unique tags
          </span>
        </div>
      </motion.div>

      {/* Recent posts */}
      <motion.div
        className="mt-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
            Recent posts
          </h2>
          <button
            onClick={() => navigate("/admin/blog")}
            className="font-mono text-muted-foreground/40 hover:text-accent transition-colors duration-300 flex items-center gap-1"
            style={{ fontSize: "0.6875rem" }}
          >
            View all <ArrowRight size={11} />
          </button>
        </div>

        <div className="border border-border/50 bg-card overflow-hidden" style={{ borderRadius: "6px" }}>
          {recentPosts.map((post, i) => (
            <button
              key={post.slug}
              onClick={() => navigate(`/admin/blog/edit/${post.slug}`)}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-foreground/[0.02] transition-colors duration-200 cursor-pointer"
              style={{ borderBottom: i < recentPosts.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className="text-foreground truncate"
                    style={{ fontSize: "0.8125rem", fontWeight: 500 }}
                  >
                    {post.title}
                  </h3>
                  {post.featured && (
                    <span
                      className="shrink-0 font-mono text-accent/60 px-1.5 py-0.5 bg-accent/[0.06] border border-accent/10"
                      style={{ fontSize: "0.5rem", borderRadius: "2px", letterSpacing: "0.05em" }}
                    >
                      FEATURED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock size={10} className="text-muted-foreground/30" />
                  <span className="font-mono text-muted-foreground/40" style={{ fontSize: "0.625rem" }}>
                    {post.date}
                  </span>
                  <span className="text-border/50">·</span>
                  <span className="font-mono text-muted-foreground/30" style={{ fontSize: "0.625rem" }}>
                    {post.category}
                  </span>
                </div>
              </div>
              <ArrowRight size={13} className="text-muted-foreground/20 shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button
          onClick={() => navigate("/admin/blog/new")}
          className="group flex items-center gap-3 p-4 border border-dashed border-border/60 hover:border-accent/30 transition-all duration-300 cursor-pointer text-left"
          style={{ borderRadius: "6px" }}
        >
          <FileText size={16} className="text-muted-foreground/40 group-hover:text-accent transition-colors duration-300" />
          <div>
            <span className="text-foreground/80 group-hover:text-foreground transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
              New blog post
            </span>
            <p className="font-mono text-muted-foreground/30" style={{ fontSize: "0.5625rem" }}>
              Write a new article
            </p>
          </div>
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 p-4 border border-dashed border-border/60 hover:border-accent/30 transition-all duration-300 text-left"
          style={{ borderRadius: "6px" }}
        >
          <ArrowUpRight size={16} className="text-muted-foreground/40 group-hover:text-accent transition-colors duration-300" />
          <div>
            <span className="text-foreground/80 group-hover:text-foreground transition-colors" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
              View live site
            </span>
            <p className="font-mono text-muted-foreground/30" style={{ fontSize: "0.5625rem" }}>
              Open public website
            </p>
          </div>
        </a>
      </motion.div>
    </div>
  );
}