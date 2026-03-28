import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, Suspense } from "react";
import { useAuthContext } from "@/admin/contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Briefcase,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

const sidebarLinks = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Blog Posts", path: "/admin/blog", icon: FileText },
  { label: "Projects", path: "/admin/projects", icon: FolderKanban },
  { label: "Experience", path: "/admin/experience", icon: Briefcase },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export function AdminLayout() {
  const { isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isAuthenticated) return null;

  return (
    <div
      className="min-h-screen bg-background text-foreground flex"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-card/50 border-r border-border/60 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-border/40">
          <a
            href="/"
            className="font-mono text-foreground/80 hover:text-accent transition-colors duration-300"
            style={{ fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.02em" }}
          >
            po4yka.dev
          </a>
          <div
            className="mt-1 font-mono text-muted-foreground/40"
            style={{ fontSize: "0.5625rem", letterSpacing: "0.1em" }}
          >
            ADMIN PANEL
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {sidebarLinks.map((link) => {
            const isActive =
              link.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 transition-all duration-200 cursor-pointer text-left ${
                  isActive
                    ? "bg-accent/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                }`}
                style={{ fontSize: "0.8125rem", borderRadius: "6px", fontWeight: isActive ? 500 : 400 }}
              >
                <Icon size={15} className={isActive ? "text-accent" : ""} />
                {link.label}
                {isActive && (
                  <ChevronRight size={11} className="ml-auto text-muted-foreground/30" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 mt-auto">
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-muted-foreground/60 hover:text-foreground/80 transition-colors duration-200 cursor-pointer"
            style={{ fontSize: "0.75rem", borderRadius: "4px" }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-3">
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
              style={{ fontSize: "0.5625rem" }}
            >
              ADMIN
            </span>
          </div>
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="text-muted-foreground/50 hover:text-foreground transition-colors p-1"
          >
            <LogOut size={16} />
          </button>
        </div>
        {/* Mobile nav tabs */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
          {sidebarLinks.map((link) => {
            const isActive =
              link.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(link.path);
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`shrink-0 px-2.5 py-1 font-mono transition-colors duration-200 ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontSize: "0.625rem", borderRadius: "2px" }}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:p-0 pt-[88px] md:pt-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32">
              <span className="font-mono text-muted-foreground/40 animate-pulse" style={{ fontSize: "0.75rem" }}>
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