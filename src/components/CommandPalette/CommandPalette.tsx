import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import "@/components/Terminal/commands/index";
import { blogPostsMeta } from "@/data/blogMeta";
import { projects } from "@/data/projectsData";
import { CONTACT_EMAIL } from "@/lib/constants";
import { run, type CommandContext } from "@/lib/commands";
import { locales, type TranslationKey } from "@/lib/i18n";
import { filterItems, GROUP_ORDER, type PaletteGroup, type PaletteItem } from "@/lib/palette";
import { centerOf } from "@/lib/themeTransition";
import { getSectionIds } from "@/lib/sections";
import { useLocale, useSettingsStore } from "@/stores/settingsStore";

type Translate = (key: TranslationKey) => string;

const PAGES: { key: TranslationKey; target: string }[] = [
  { key: "nav.home", target: "home" },
  { key: "nav.projects", target: "projects" },
  { key: "nav.experience", target: "experience" },
  { key: "nav.blog", target: "blog" },
  { key: "nav.settings", target: "settings" },
];

const THEMES = ["dark", "light", "system"] as const;
const MAX_SECTIONS = 40;
const PAGE_TARGETS = new Set(PAGES.map((p) => p.target));

/** Every row is a real entry: a route, a generated post or project, a theme or locale, the email, or a heading on this page. */
function buildItems(t: Translate, locale: string): PaletteItem[] {
  const items: PaletteItem[] = [];
  for (const p of PAGES) {
    items.push({ id: `page-${p.target}`, group: "pages", title: t(p.key), command: `open ${p.target}`, keywords: [p.target] });
  }

  // One row per slug: the current locale's version, or the only version that exists.
  const bySlug = new Map<string, (typeof blogPostsMeta)[number]>();
  for (const post of blogPostsMeta) {
    const have = bySlug.get(post.slug);
    if (!have || (post.lang ?? "en") === locale) bySlug.set(post.slug, post);
  }
  for (const post of bySlug.values()) {
    items.push({
      id: `post-${post.slug}`,
      group: "posts",
      title: post.title,
      command: `open ${post.slug}`,
      meta: [post.date, post.wordCount != null && `${post.wordCount.toLocaleString(locale)} ${t("palette.words")}`]
        .filter(Boolean)
        .join(" · "),
      keywords: [post.slug, ...(post.tags ?? [])],
    });
  }

  for (const project of projects) {
    // `open` checks pages first, so a project that shares a page name would only reopen the page.
    if (!project.slug || PAGE_TARGETS.has(project.slug)) continue;
    items.push({
      id: `project-${project.slug}`,
      group: "projects",
      title: project.name,
      command: `open ${project.slug}`,
      meta: [project.year, project.platforms.join(" / ")].filter(Boolean).join(" · "),
      keywords: [project.slug, ...project.tags, ...project.platforms],
    });
  }

  for (const theme of THEMES) {
    items.push({ id: `theme-${theme}`, group: "actions", title: `${t("palette.theme")}: ${t(`settings.${theme}`)}`, command: `theme ${theme}` });
  }
  for (const l of locales) {
    items.push({ id: `lang-${l}`, group: "actions", title: `${t("palette.language")}: ${l.toUpperCase()}`, command: `lang ${l}` });
  }
  items.push({ id: "copy-email", group: "actions", title: t("palette.copyEmail"), command: "copy email", meta: CONTACT_EMAIL });

  for (const id of getSectionIds().slice(0, MAX_SECTIONS)) {
    const text = document.getElementById(id)?.textContent?.replace(/\s+/g, " ").trim();
    if (!text) continue;
    items.push({ id: `section-${id}`, group: "sections", title: text.slice(0, 80), command: `jump ${id}` });
  }
  return items;
}

const GROUP_KEYS: Record<PaletteGroup, TranslationKey> = {
  pages: "palette.pages",
  posts: "palette.posts",
  projects: "palette.projects",
  actions: "palette.actions",
  sections: "palette.sections",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Element that opened the palette: refocused on close, and the origin of a theme wipe. */
  opener: HTMLElement | null;
}

export default function CommandPalette({ open, onOpenChange, opener }: Props) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (id: string) => `${uid}-${id}`;
  const listRef = useRef<HTMLDivElement>(null);

  // Rebuilt on each open so the section rows match the page the visitor is on.
  // Built on open so the section rows match this page. The list stays after close, so the exit fade does not flash "No matches".
  const [items, setItems] = useState<PaletteItem[]>(() => (open ? buildItems(t, locale) : []));
  const results = useMemo(() => filterItems(items, query), [items, query]);
  const activeItem = results[Math.min(active, results.length - 1)];

  // Output of a typed command that stays open (copy, help, errors).
  const [output, setOutput] = useState<ReactNode>(null);
  const fromMouse = useRef(false);

  // Clear the query when the palette opens (adjusting state during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setItems(buildItems(t, locale));
      setQuery("");
      setActive(0);
      setOutput(null);
    }
  }

  useEffect(() => {
    if (fromMouse.current) fromMouse.current = false;
    else if (activeItem) listRef.current?.querySelector(`[id="${optionId(activeItem.id)}"]`)?.scrollIntoView({ block: "nearest" });
    // optionId is derived from uid, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.id]);

  function execute(line: string, keepOpen = false) {
    const ctx: CommandContext = {
      history: [],
      navigate: (path) => window.location.assign(path),
      getTheme: () => useSettingsStore.getState().theme,
      getLocale: () => useSettingsStore.getState().locale,
      origin: opener && opener !== document.body ? centerOf(opener) : undefined,
    };
    if (!keepOpen) onOpenChange(false);
    const result = run(line, ctx);
    if (keepOpen) setOutput(result === "__CLEAR__" ? null : result);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    const last = results.length - 1;
    const cur = Math.min(active, last);
    if (e.key === "ArrowDown") setActive(cur >= last ? 0 : cur + 1);
    else if (e.key === "ArrowUp") setActive(cur <= 0 ? last : cur - 1);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(Math.max(last, 0));
    else if (e.key === "Enter") {
      // A listed row wins; otherwise the typed line runs and its output (or the unknown-command error) shows in the palette.
      if (activeItem) execute(activeItem.command, activeItem.command.startsWith("copy "));
      else if (query.trim()) execute(query.trim(), true);
    } else return;
    e.preventDefault();
  }

  const groups = GROUP_ORDER.map((g) => ({ g, rows: results.filter((r) => r.group === g) })).filter((x) => x.rows.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            // Return focus to the opener without scrolling the page back (a `jump` may just have moved it).
            if (opener?.isConnected) {
              e.preventDefault();
              opener.focus({ preventScroll: true });
            }
          }}
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed top-0 left-1/2 sm:top-[12vh] z-50 w-full -translate-x-1/2 border border-border bg-card duration-150 sm:w-[calc(100%-2rem)] sm:max-w-[40rem] sm:rounded-[2px]"
          style={{ boxShadow: "var(--overlay-shadow)" }}
        >
          <DialogTitle className="sr-only">{t("nav.palette")}</DialogTitle>
          <input
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={results.length > 0 ? listId : undefined}
            aria-activedescendant={activeItem ? optionId(activeItem.id) : undefined}
            aria-autocomplete="list"
            aria-label={t("palette.inputLabel")}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t("palette.placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOutput(null);
            }}
            onKeyDown={onKeyDown}
            className="min-h-[44px] w-full border-b border-border bg-transparent px-4 font-mono text-base text-foreground outline-none focus:border-emphasis placeholder:text-muted-foreground-dim"
          />
          <div role="status" aria-live="polite" className="sr-only">
            {`${t("palette.results")}: ${results.length}`}
          </div>
          {output != null && (
            <div role="status" className="border-b border-border px-4 py-3 font-mono text-sm break-words whitespace-pre-wrap text-foreground">
              {output}
            </div>
          )}
          {results.length === 0 ? (
            <div className="px-4 py-6 font-mono text-sm text-muted-foreground">{t("palette.noMatches")}</div>
          ) : (
            <div ref={listRef} id={listId} onMouseDown={(e) => e.preventDefault()} role="listbox" aria-label={t("nav.palette")} className="max-h-[min(24rem,50dvh)] overflow-y-auto py-1">
              {groups.map(({ g, rows }) => (
                <div key={g} role="group" aria-labelledby={`${uid}-g-${g}`}>
                  <div id={`${uid}-g-${g}`} className="label-meta px-4 pt-3 pb-1 text-muted-foreground-dim">
                    {t(GROUP_KEYS[g])}
                  </div>
                  {rows.map((item) => {
                    const selected = item.id === activeItem?.id;
                    return (
                      <div
                        key={item.id}
                        id={optionId(item.id)}
                        role="option"
                        aria-selected={selected}
                        onClick={() => execute(item.command)}
                        onMouseMove={() => {
                          if (selected) return;
                          fromMouse.current = true;
                          setActive(results.indexOf(item));
                        }}
                        className={`flex min-h-[44px] cursor-pointer flex-col justify-center gap-0.5 px-4 py-1.5 ${
                          selected ? "border-l-2 border-emphasis bg-muted pl-[14px] text-emphasis" : "text-foreground/80"
                        }`}
                      >
                        <span className="truncate font-sans text-sm">{item.title}</span>
                        <span className="truncate font-mono text-xs text-muted-foreground">
                          {item.command}
                          {item.meta ? ` · ${item.meta}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
