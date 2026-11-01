import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { useEffect, Suspense } from "react";
import { useAuthContext } from "@/admin/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { AdminShortcuts } from "@/admin/components/AdminShortcuts";
import { adminNav as sidebarLinks } from "@/admin/nav";
import { buildMeta } from "@/data/buildMeta";

export function AdminLayout() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login", { replace: true, state: { from: location.pathname + location.search } });
    }
  }, [isAuthenticated, navigate, location.pathname, location.search]);

  // Navigate first so an unsaved-changes prompt can cancel; the login page ends the session.
  const signOut = () => navigate("/admin/login", { state: { signOut: true } });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isAuthenticated) return null;

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col md:flex-row"
    >
      {/* Skip link */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:rounded-[2px] focus:outline-none"
      >
        Skip to main content
      </a>
      {/* Sidebar */}
      <aside aria-label="Admin sidebar" className="hidden md:flex flex-col w-[220px] min-h-screen bg-card/50 border-r border-border/60 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-border/40">
          <a
            href="/"
            className="font-mono text-foreground/80 hover:text-foreground transition-colors duration-200"
            style={{ fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.02em" }}
          >
            po4yka.dev
          </a>
          <div className="mt-1 label-meta">
            <span className="text-foreground">00</span>
            <span className="text-muted-foreground-dim"> / </span>
            ADMIN
          </div>
        </div>

        {/* Nav */}
        <nav aria-label="Admin navigation" className="flex-1 px-3 py-4 space-y-0.5">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/admin"}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-3 py-2 transition-all duration-200 text-left ${
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
                style={({ isActive }) => ({
                  fontSize: "0.8125rem",
                  borderRadius: "2px",
                  fontWeight: isActive ? 500 : 400,
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="sr-only">(current page)</span>}
                    <Icon size={15} className={isActive ? "text-foreground" : ""} aria-hidden="true" />
                    {link.label}
                    <span
                      className={`ml-auto font-mono ${isActive ? "text-foreground" : "text-muted-foreground-dim"}`}
                      style={{ fontSize: 11 }}
                      title={`Shortcut: g ${link.key}`}
                      aria-hidden="true"
                    >
                      {link.number}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 mt-auto space-y-1">
          <dl
            className="mx-3 mb-3 pt-3 font-mono text-muted-foreground-dim space-y-0.5"
            style={{ fontSize: 11, letterSpacing: "0.04em", borderTop: "1px solid var(--rule)" }}
          >
            <div className="flex justify-between gap-2">
              <dt>BUILD</dt>
              <dd className="text-muted-foreground">{buildMeta.commitHash}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>DEPLOYED</dt>
              <dd className="text-muted-foreground">
                <time dateTime={buildMeta.deployDate}>{buildMeta.deployDate.slice(0, 10)}</time>
              </dd>
            </div>
          </dl>
          <AdminShortcuts />
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
            style={{ fontSize: "0.75rem", borderRadius: "2px" }}
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden sticky top-0 z-50 backdrop-blur-sm border-b border-border/40 px-4 py-3"
        style={{ background: "var(--nav-glass)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span
              className="font-mono text-foreground/80"
              style={{ fontSize: "0.75rem", fontWeight: 500 }}
            >
              po4yka.dev
            </span>
            <span
              className="ml-2 font-mono text-muted-foreground/40"
              style={{ fontSize: "max(11px, 0.6875rem)" }}
            >
              ADMIN
            </span>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
        {/* Mobile nav tabs */}
        <nav aria-label="Admin navigation" className="flex gap-1 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/admin"}
              className={({ isActive }) =>
                `shrink-0 min-h-11 flex items-center px-2.5 font-mono transition-colors duration-200 ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
              style={{ fontSize: "max(11px, 0.6875rem)", borderRadius: "2px" }}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="sr-only">(current page)</span>}
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main id="admin-main" className="flex-1 min-w-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32">
              <span className="font-mono text-muted-foreground/40" style={{ fontSize: "0.75rem" }}>
                Loading…
              </span>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
