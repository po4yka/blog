import { Outlet, useLocation } from "react-router";
import { useEffect, Suspense } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { SettingsProvider } from "./settingsStore";

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <span
        className="text-muted-foreground/40"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.8125rem",
          animation: "pulse-opacity 1.5s ease-in-out infinite",
        }}
      >
        loading...
      </span>
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <SettingsProvider>
      <div
        className="min-h-screen bg-background text-foreground transition-colors duration-300"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <Nav />
        <main className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-12 pt-16 pb-20">
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </SettingsProvider>
  );
}