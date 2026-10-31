import { buildMeta } from "@/data/buildMeta";
import { PanelShell } from "./_helpers";
import { T, TCount } from "@/components/ui/T";

const GH_REPO = "po4yka/blog";

const DATE_LOCALES = { en: "en-US", ru: "ru-RU" } as const;
const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };

/** The date in both languages; html[data-locale] shows one. */
function LocalDate({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <>
      <span data-l="en">{d.toLocaleDateString(DATE_LOCALES.en, DATE_FORMAT)}</span>{" "}
      <span data-l="ru" lang="ru">{d.toLocaleDateString(DATE_LOCALES.ru, DATE_FORMAT)}</span>
    </>
  );
}


/** Server-only: the static HTML carries both languages (T). */
export function BuildStats({ delay = 0 }: { delay?: number }) {
  const rows: Array<{ label: React.ReactNode; value: React.ReactNode }> = [
    {
      label: <T k="hero.buildDeploy" />,
      value: (
        <time dateTime={buildMeta.deployDate}>
          <LocalDate iso={buildMeta.deployDate} />
        </time>
      ),
    },
    {
      label: <T k="hero.buildCommit" />,
      value: (
        <a
          href={`https://github.com/${GH_REPO}/commit/${buildMeta.commitHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/90 hover:text-foreground hover:underline decoration-dotted underline-offset-2 transition-colors duration-150"
        >
          {buildMeta.commitHash}
          <span className="sr-only">
            {" ("}
            <T k="links.opensNewWindow" />)
          </span>
        </a>
      ),
    },
    { label: "Astro", value: `v${buildMeta.astroVersion}` },
    {
      label: <T k="hero.buildContent" />,
      value: (
        <>
          <TCount n={buildMeta.postCount} forms={{ en: ["post", "posts"], ru: ["пост", "поста", "постов"] }} />
          {" · "}
          <TCount n={buildMeta.projectCount} forms={{ en: ["project", "projects"], ru: ["проект", "проекта", "проектов"] }} />
          {" · "}
          <TCount n={buildMeta.roleCount} forms={{ en: ["role", "roles"], ru: ["роль", "роли", "ролей"] }} />
        </>
      ),
    },
  ];

  return (
    <PanelShell
      label={<T k="hero.buildLabel" />}
      labelRight={
        <a href="/changelog" className="hover:text-foreground transition-colors duration-150">
          <T k="hero.buildChangelog" />
        </a>
      }
      delay={delay}
    >
      <div className="px-5 py-3 space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 min-w-0">
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">
              {row.label}
            </span>
            <span className="text-foreground/90 text-mono-sm text-right min-w-0 break-words">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
