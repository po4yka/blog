import { useState, useEffect, useRef, type MouseEvent } from "react";
import { m, AnimatePresence } from "motion/react";
import { Menu, X, Sun, Moon, Command } from "lucide-react";
import { useThrottledCallback } from "@/hooks/useThrottle";
import { useSettings, useLocale, type ThemeMode } from "@/stores/settingsStore";
import { stagger } from "@/lib/motion";
import { openPalette } from "@/lib/palette";
import { switchTheme, centerOf, targetTheme } from "@/lib/themeTransition";
import { MotionProvider } from "./MotionProvider";
import { Reveal } from "./ui/Reveal";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { blogUrl, type Locale, type TranslationKey } from "@/lib/i18n";

const navLinks: { labelKey: TranslationKey; href: string; exact?: boolean }[] = [
  { labelKey: "nav.home", href: "/", exact: true },
  { labelKey: "nav.projects", href: "/projects" },
  { labelKey: "nav.experience", href: "/experience" },
  { labelKey: "nav.blog", href: "/blog" },
  { labelKey: "nav.settings", href: "/settings" },
];

interface NavProps {
  pathname?: string;
  lang?: Locale;
  translationSlug?: string;
}

export function Nav({ pathname: initialPathname, lang, translationSlug }: NavProps) {
  const otherLang: Locale = lang === "ru" ? "en" : "ru";
  const translationUrl = translationSlug ? blogUrl(otherLang, translationSlug) : undefined;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPathname, setCurrentPathname] = useState(initialPathname ?? "/");
  const { theme } = useSettings();
  const { t } = useLocale();

  // Update pathname on View Transition navigation (Nav is persisted)
  useEffect(() => {
    const onSwap = () => {
      setCurrentPathname(window.location.pathname);
      setMenuOpen(false);
    };
    document.addEventListener("astro:after-swap", onSwap);
    return () => document.removeEventListener("astro:after-swap", onSwap);
  }, []);

  const onScroll = useThrottledCallback(
    () => setScrolled(window.scrollY > 20),
    100
  );

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Escape key closes mobile menu and returns focus to hamburger
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const isActive = (link: (typeof navLinks)[number]) => {
    if (link.exact) return currentPathname === link.href;
    return currentPathname.startsWith(link.href);
  };

  const nextThemeFor = (m: ThemeMode): ThemeMode =>
    m === "system" ? "dark" : m === "dark" ? "light" : "system";
  const switchThemeLabel = `${t("nav.switchTheme")} (${nextThemeFor(theme)})`;
  const themeLabel = t(`settings.${theme}` as TranslationKey);

  // On blog surfaces the content language is fixed by the route; reflect the
  // page language in the switcher instead of the stored UI locale.
  const blogPageLang: Locale | undefined = currentPathname.startsWith("/blog")
    ? currentPathname.startsWith("/blog/ru") ? "ru" : "en"
    : undefined;

  const cycleTheme = (e: MouseEvent<HTMLButtonElement>) => {
    // targetTheme(), not the render's `theme`: a second click during a wipe must cycle from the pending theme.
    switchTheme(nextThemeFor(targetTheme()), centerOf(e.currentTarget));
  };

  const ThemeIcon = theme === "light" ? Sun : Moon;

  return (
    <MotionProvider>
    {/* The nav's own transition-all (for the scroll-state background) also
        carries the Reveal opacity fade, at its 300ms. */}
    <Reveal
      as="nav"
      aria-label={t("nav.primary")}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-sm" : ""
      }`}
      style={{
        background: scrolled
          ? "var(--nav-glass)"
          : "var(--nav-glass-subtle)",
        borderBottom: "1px solid var(--rule)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="max-w-(--grid-max) mx-auto px-(--grid-pad) flex items-center justify-between h-11">
        {/* Left group: wordmark + divider + desktop tabs */}
        <div className="flex items-center gap-0 min-w-0 shrink">
          {/* Logo / prefix */}
          <a
            href="/"
            className="flex items-center gap-2 font-sans text-mono text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0 whitespace-nowrap"
          >
            <span
              className="inline-block w-[8px] h-[8px] rounded-[1px]"
              style={{ backgroundColor: "var(--foreground)", opacity: 0.5 }}
            />
            po4yka
          </a>

          {/* Hairline divider between wordmark and tabs */}
          <span aria-hidden="true" className="hidden md:inline-block w-px h-4 bg-rule mx-3" />

          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link);
              return (
                <a
                  key={link.labelKey}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-1.5 font-sans text-mono-sm transition-colors duration-200 group whitespace-nowrap ${
                    active
                      ? "text-emphasis font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="relative inline-block">
                    {t(link.labelKey)}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="rule-draw absolute left-0 right-0 -bottom-1 block"
                        style={{ height: 1, background: "var(--emphasis)" }}
                      />
                    )}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Right group: lang switch + theme toggle + status (desktop) + mobile controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop right controls */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={(e) => openPalette(e.currentTarget)}
              className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] font-mono text-label text-muted-foreground hover:text-foreground active:opacity-70 transition-colors duration-200 cursor-pointer"
              aria-label={t("nav.palette")}
              aria-haspopup="dialog"
            >
              <Command size={14} strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden lg:inline">{t("nav.paletteShort")}</span>
            </button>

            <LanguageSwitcher translationUrl={translationUrl} activeLang={translationSlug ? lang : blogPageLang} />

            {/* Hairline divider, mirrors the one after the wordmark */}
            <span aria-hidden="true" className="inline-block w-px h-4 bg-rule" />

            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              data-theme-toggle
              className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] font-mono text-label text-muted-foreground hover:text-foreground active:opacity-70 transition-colors duration-200 cursor-pointer"
              aria-label={switchThemeLabel}
              data-umami-event="theme-toggle"
              data-umami-event-next={nextThemeFor(theme)}
            >
              <ThemeIcon size={14} strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden lg:inline">{themeLabel}</span>
            </button>

          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={cycleTheme}
              data-theme-toggle
              className="flex items-center justify-center text-foreground/60 hover:text-foreground active:opacity-70 min-h-[44px] min-w-[44px] transition-colors duration-200 cursor-pointer"
              aria-label={switchThemeLabel}
              data-umami-event="theme-toggle"
              data-umami-event-next={nextThemeFor(theme)}
            >
              <ThemeIcon size={18} strokeWidth={1.8} />
            </button>
            <button
              ref={hamburgerRef}
              className="flex items-center justify-center text-muted-foreground/60 hover:text-foreground active:opacity-70 min-h-[44px] min-w-[44px] transition-colors duration-200 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t("nav.toggleMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <m.div
            id="mobile-menu"
            className="md:hidden grid overflow-hidden"
            style={{
              background: "var(--mobile-menu-bg)",
              borderTop: "1px solid var(--rule)",
            }}
            initial={{ opacity: 0, gridTemplateRows: "0fr" }}
            animate={{ opacity: 1, gridTemplateRows: "1fr" }}
            exit={{ opacity: 0, gridTemplateRows: "0fr" }}
            transition={{ duration: 0.2 }}
          >
            <div className="min-h-0">
              <div className="max-w-(--grid-max) mx-auto px-(--grid-pad) py-3 flex flex-col gap-0.5">
                {navLinks.map((link, i) => {
                  const active = isActive(link);
                  return (
                    <m.a
                      key={link.labelKey}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`py-3 px-3 font-sans text-mono transition-colors duration-200 whitespace-nowrap ${
                        active
                          ? "text-emphasis font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setMenuOpen(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * stagger.fast }}
                    >
                      <span className="relative inline-block">
                        {t(link.labelKey)}
                        {active && (
                          <span
                            aria-hidden="true"
                            className="rule-draw absolute left-0 right-0 -bottom-1 block"
                            style={{ height: 1, background: "var(--emphasis)" }}
                          />
                        )}
                      </span>
                    </m.a>
                  );
                })}
                <button
                  className="flex items-center gap-2 min-h-[44px] py-3 px-3 font-sans text-mono text-muted-foreground hover:text-foreground active:opacity-70 transition-colors duration-200 cursor-pointer"
                  aria-haspopup="dialog"
                  onClick={() => {
                    setMenuOpen(false);
                    // The menu button unmounts on close, so the hamburger takes focus back.
                    openPalette(hamburgerRef.current);
                  }}
                >
                  <Command size={16} strokeWidth={1.8} aria-hidden="true" />
                  {t("nav.palette")}
                </button>
                <div className="py-3 px-3">
                  <LanguageSwitcher translationUrl={translationUrl} activeLang={translationSlug ? lang : blogPageLang} />
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </Reveal>
    </MotionProvider>
  );
}
