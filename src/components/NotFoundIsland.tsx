import { useSyncExternalStore } from "react";
import { SectionHeader } from "./SectionHeader";
import { Panel } from "./ui/Panel";
import { Reveal } from "./ui/Reveal";
import { useLocale } from "@/stores/settingsStore";
import { closestRoutes, type KnownRoute } from "@/lib/routeMatch";

// The path never changes while the page is open.
const noSubscribe = () => () => {};

const LINK ="text-foreground/80 hover:text-foreground hover:underline underline-offset-4 transition-colors duration-150";

function RouteList({ routes }: { routes: KnownRoute[] }) {
  return (
    <ul className="list-none m-0 p-0 space-y-1.5">
      {routes.map((r) => (
        <li key={r.href} className="min-w-0">
          <a
            href={r.href}
            lang={r.lang}
            className={`${LINK} ${r.kind === "page" ? "font-mono text-mono-sm" : "font-sans text-sm"} break-words`}
          >
            {r.label}
          </a>
          {r.kind === "post" && r.lang && (
            <span className="ml-2 label-meta text-muted-foreground-dim" aria-hidden="true">{r.lang}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * The 404 page. Every known route is in the static HTML; once the island runs
 * it reads the requested path and lists the closest real routes first.
 */
export function NotFound({ routes }: { routes: KnownRoute[] }) {
  const { t } = useLocale();
  // The requested path exists only in the browser: the server snapshot is null,
  // so hydration matches the static HTML and the match appears right after.
  const path = useSyncExternalStore(noSubscribe, () => window.location.pathname, () => null);
  const closest = path ? closestRoutes(path, routes) : [];

  const groups = [
    { key: "notFound.pages", kind: "page" },
    { key: "notFound.posts", kind: "post" },
    { key: "notFound.projects", kind: "project" },
  ] as const;

  return (
    <div className="pt-16">
      <Reveal as={Panel} clip="visible" speed="slow">
        {/* Operator-console header row */}
        <div className="px-4 py-[10px] border-b border-border">
          <SectionHeader
            level={1}
            number="!!"
            label="NOT FOUND"
            heading={t("notFound.windowTitle")}
            className="pb-0"
            marks={false}
          />
        </div>

        <div className="p-6 space-y-6">
          <Reveal className="font-mono text-mono space-y-1" style={{ lineHeight: 1.7 }} delay={0.1}>
            <p className="m-0">
              <span className="text-muted-foreground label-meta">ERROR ·</span>{" "}
              <span className="text-foreground/80">{t("notFound.error")}</span>
            </p>
            <p className="m-0 min-h-[1.7em] break-all" aria-live="polite">
              {path && (
                <>
                  <span className="text-muted-foreground label-meta">{t("notFound.requested")} ·</span>{" "}
                  <span className="text-foreground/70">{path}</span>
                </>
              )}
            </p>
          </Reveal>

          <Reveal delay={0.2} speed="slow">
            <p className="m-0 flex flex-wrap items-baseline gap-x-3">
              <span className="text-foreground/80 text-[2.5rem] leading-none">404</span>
              <span className="text-muted-foreground text-2xl" aria-hidden="true">—</span>
              <span className="text-foreground/60 text-base">{t("notFound.pageNotFound")}</span>
            </p>
          </Reveal>

          {closest.length > 0 && (
            <section aria-labelledby="nf-closest" className="space-y-2">
              <h2 id="nf-closest" className="m-0 label-meta text-muted-foreground">{t("notFound.closest")}</h2>
              <RouteList routes={closest} />
            </section>
          )}

          <Reveal delay={0.3} className="grid gap-6 sm:grid-cols-3 pt-2 border-t border-border">
            {groups.map(({ key, kind }) => {
              const list = routes.filter((r) => r.kind === kind);
              return list.length === 0 ? null : (
                <section key={kind} aria-labelledby={`nf-${kind}`} className="space-y-2 pt-4 min-w-0">
                  <h2 id={`nf-${kind}`} className="m-0 label-meta text-muted-foreground">{t(key)}</h2>
                  <RouteList routes={list} />
                </section>
              );
            })}
          </Reveal>

          <p className="m-0 text-foreground/70 font-mono text-mono-sm">{t("notFound.info")}</p>

          {/* The link keeps its own colour transition, so the fade sits on a wrapper. */}
          <Reveal className="flex" delay={0.4}>
            <a
              href="/"
              aria-label={t("notFound.goHome")}
              title={t("notFound.goHome")}
              className="text-foreground/80 hover:text-foreground hover:underline transition-colors cursor-pointer inline-flex items-center gap-2 text-mono"
            >
              {t("notFound.goBack")}
            </a>
          </Reveal>
        </div>
      </Reveal>
    </div>
  );
}
