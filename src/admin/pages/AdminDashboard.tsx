import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { usePosts, useProjects, useRoles, useAdminSettings } from "@/admin/hooks/useAdminQueries";
import { AdminPageHeader } from "@/admin/components/AdminPageHeader";
import { blogPostsMeta } from "@/data/blogMeta";
import { projects as builtProjects } from "@/data/projectsData";
import { roles as builtRoles } from "@/data/experienceData";
import { buildMeta } from "@/data/buildMeta";

const meta = { fontSize: "max(11px, 0.6875rem)", letterSpacing: "0.04em" } as const;
const builtPosts = blogPostsMeta.filter((p) => p.lang === "en");

type Item = { id: string; name: string };
type SyncRow = { label: string; path: string; d1: Item[] | undefined; failed: boolean; build: Item[] };

/** Ids present on one side only. */
function diff(d1: Item[], build: Item[]) {
  const d1Ids = new Set(d1.map((i) => i.id));
  const buildIds = new Set(build.map((i) => i.id));
  return {
    onlyD1: d1.filter((i) => !buildIds.has(i.id)),
    onlyBuild: build.filter((i) => !d1Ids.has(i.id)),
  };
}

export function AdminDashboard() {
  const posts = usePosts();
  const projects = useProjects();
  const roles = useRoles();
  const { data: settings } = useAdminSettings();

  const rows: SyncRow[] = [
    {
      label: "Posts (en)",
      path: "/admin/blog",
      failed: posts.isError,
      d1: posts.data?.map((p) => ({ id: p.slug, name: p.title })),
      build: builtPosts.map((p) => ({ id: p.slug, name: p.title })),
    },
    {
      label: "Projects",
      path: "/admin/projects",
      failed: projects.isError,
      d1: projects.data?.map((p) => ({ id: p.id, name: p.name })),
      build: builtProjects.map((p) => ({ id: p.id, name: p.name })),
    },
    {
      label: "Roles",
      path: "/admin/experience",
      failed: roles.isError,
      d1: roles.data?.map((r) => ({ id: r.id, name: `${r.title}, ${r.company}` })),
      build: builtRoles.map((r) => ({ id: r.id, name: `${r.title}, ${r.company}` })),
    },
  ];
  const diffs = rows.map((r) => (r.d1 ? diff(r.d1, r.build) : null));
  const drifted = diffs.some((d) => d && (d.onlyD1.length > 0 || d.onlyBuild.length > 0));
  const recentPosts = (posts.data ?? []).slice(0, 5);

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[900px]">
      <AdminPageHeader
        number="01"
        label="DASHBOARD"
        meta={settings?.handle}
        title="Dashboard"
        description="Admin data in D1 compared with the deployed build of the site."
      />

      {/* Content sync */}
      <section aria-labelledby="sync-title" className="border border-border bg-card" style={{ borderRadius: 2 }}>
        <div className="flex items-baseline justify-between gap-4 px-4 py-2" style={{ borderBottom: "1px solid var(--rule)" }}>
          <h2 id="sync-title" className="label-meta">CONTENT SYNC</h2>
          <span className="font-mono text-muted-foreground-dim" style={meta}>
            build {buildMeta.commitHash}
          </span>
        </div>
        <table className="w-full font-mono" style={{ fontSize: "max(11px, 0.75rem)" }}>
          <thead>
            <tr className="text-left text-muted-foreground-dim" style={meta}>
              <th scope="col" className="px-4 py-2 font-normal">SOURCE</th>
              <th scope="col" className="px-4 py-2 font-normal text-right">D1</th>
              <th scope="col" className="px-4 py-2 font-normal text-right">BUILD</th>
              <th scope="col" className="px-4 py-2 font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const d = diffs[i];
              const status = row.failed ? "D1 unavailable" : !d ? "loading" : d.onlyD1.length + d.onlyBuild.length === 0 ? "in sync" : "drift";
              return (
                <tr key={row.label} style={{ borderTop: "1px dashed var(--rule)" }}>
                  <th scope="row" className="px-4 py-2.5 text-left font-normal">
                    <Link to={row.path} className="text-foreground hover:underline underline-offset-4">
                      {row.label}
                    </Link>
                  </th>
                  <td className="px-4 py-2.5 text-right text-foreground">{row.d1?.length ?? "…"}</td>
                  <td className="px-4 py-2.5 text-right text-foreground">{row.build.length}</td>
                  <td className={`px-4 py-2.5 ${status === "drift" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {status === "drift" ? `DRIFT · ${d!.onlyD1.length} only in D1 · ${d!.onlyBuild.length} only in build` : status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {drifted && (
          <div className="px-4 py-3 space-y-3" style={{ borderTop: "1px solid var(--rule)" }}>
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
              The public site is built from <code className="font-mono text-foreground">src/content/</code>. D1 holds the copy this admin edits; it is filled from <code className="font-mono text-foreground">db/seed.sql</code> by hand, so the two can differ.
            </p>
            {rows.map((row, i) => {
              const d = diffs[i];
              if (!d || d.onlyD1.length + d.onlyBuild.length === 0) return null;
              return (
                <details key={row.label} className="font-mono" style={{ fontSize: "max(11px, 0.75rem)" }}>
                  <summary className="cursor-pointer text-foreground">{row.label}: differing ids</summary>
                  <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {([["Only in D1", d.onlyD1], ["Only in build", d.onlyBuild]] as const).map(([title, items]) => (
                      <div key={title}>
                        <dt className="label-meta mb-1">{title.toUpperCase()} · {items.length}</dt>
                        {items.length === 0 ? (
                          <dd className="text-muted-foreground-dim">none</dd>
                        ) : (
                          items.map((item) => (
                            <dd key={item.id} className="text-muted-foreground truncate" title={item.name}>
                              {item.id}
                            </dd>
                          ))
                        )}
                      </div>
                    ))}
                  </dl>
                </details>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent posts */}
      <section aria-labelledby="recent-title" className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 id="recent-title" className="label-meta">RECENT POSTS IN D1</h2>
          <Link
            to="/admin/blog"
            className="font-mono text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
            style={meta}
          >
            View all <ArrowRight size={11} aria-hidden="true" />
          </Link>
        </div>
        <div className="border border-border bg-card" style={{ borderRadius: 2 }}>
          {posts.isLoading ? (
            <p className="px-4 py-6 font-mono text-muted-foreground-dim" style={meta}>Loading…</p>
          ) : posts.isError ? (
            <p className="px-4 py-6 font-mono text-muted-foreground" style={meta}>D1 unavailable: posts could not be loaded.</p>
          ) : recentPosts.length === 0 ? (
            <div className="px-4 py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                No posts in D1 yet. The build has {builtPosts.length} English {builtPosts.length === 1 ? "post" : "posts"}.
              </p>
              <Link
                to="/admin/blog/new"
                className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 border border-border text-foreground hover:bg-muted transition-colors duration-100"
                style={{ fontSize: "0.75rem", borderRadius: 2 }}
              >
                <Plus size={13} aria-hidden="true" /> New post
              </Link>
            </div>
          ) : (
            recentPosts.map((post, i) => (
              <Link
                key={post.slug}
                to={`/admin/blog/edit/${post.slug}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors duration-100"
                style={{ borderTop: i > 0 ? "1px dashed var(--rule)" : undefined }}
              >
                <span className="font-mono text-muted-foreground-dim shrink-0" style={meta}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 min-w-0 truncate text-foreground" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                  {post.title}
                </span>
                {post.featured && <span className="label-meta shrink-0">FEATURED</span>}
                <span className="font-mono text-muted-foreground shrink-0" style={meta}>
                  {post.date}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/admin/blog/new"
          className="group flex items-center justify-between gap-3 p-4 border border-border hover:bg-muted transition-colors duration-100"
          style={{ borderRadius: 2 }}
        >
          <span className="text-foreground" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>New blog post</span>
          <kbd className="font-mono text-muted-foreground-dim" style={meta}>n</kbd>
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-4 border border-border hover:bg-muted transition-colors duration-100"
          style={{ borderRadius: 2 }}
        >
          <span className="text-foreground" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Open live site</span>
          <ArrowUpRight size={14} className="text-muted-foreground" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
