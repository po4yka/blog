import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useThrottledCallback } from "@/hooks/useThrottle";
import { useSettings, useLocale, type ThemeMode } from "@/stores/settingsStore";
import { MotionProvider } from "./MotionProvider";
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
  const [mounted, setMounted] = useState(false);
  const [currentPathname, setCurrentPathname] = useState(initialPathname ?? "/");
  const { theme, setTheme, reduceMotion } = useSettings();
  const { t } = useLocale();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-mount flag; no external state involved
  useEffect(() => setMounted(true), []);

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
  const themeLabel = theme;

  const cycleTheme = (e: React.MouseEvent) => {
    const newTheme: ThemeMode =
      theme === "system" ? "dark" :
      theme === "dark"   ? "light" :
                            "system";
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (!reduceMotion && doc.startViewTransition) {
      const { clientX: x, clientY: y } = e;
      document.documentElement.style.setProperty("--tx", `${x}px`);
      document.documentElement.style.setProperty("--ty", `${y}px`);
      doc.startViewTransition(() => { setTheme(newTheme); });
    } else {
      setTheme(newTheme);
    }
  };

  const ThemeIcon = theme === "light" ? Sun : Moon;

  return (
    <MotionProvider>
    <motion.nav
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Scroll progress — 24 discrete segments, lit sequentially. CSS scroll-driven, no JS. */}
      {mounted && !reduceMotion && (
        <div
          aria-hidden="true"
          className="nav-led-meter absolute top-0 left-0 right-0 flex gap-[1px] pointer-events-none"
          style={{ height: "1px", zIndex: 10 }}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className="flex-1 nav-led-seg"
              style={{
                background: "var(--foreground)",
                ['--i' as string]: i,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-12 flex items-center justify-between h-11">
        {/* Left group: wordmark + divider + desktop tabs */}
        <div className="flex items-center gap-0 min-w-0 shrink">
          {/* Logo / prefix */}
          <a
            href="/"
            className="flex items-center gap-2 font-mono text-mono text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0 whitespace-nowrap"
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
                  className={`relative px-3 py-1.5 font-mono text-mono-sm transition-colors duration-200 group whitespace-nowrap ${
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="inline-block w-1 h-1 bg-foreground mr-1.5 align-middle"
                      style={{ borderRadius: 1 }}
                    />
                  )}
                  {t(link.labelKey)}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right group: lang switch + theme toggle + status (desktop) + mobile controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop right controls */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher translationUrl={translationUrl} activeLang={translationSlug ? lang : undefined} />

            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] text-3xs text-muted-foreground hover:text-foreground active:opacity-70 transition-colors duration-200 cursor-pointer"
              aria-label={switchThemeLabel}
              data-umami-event="theme-toggle"
              data-umami-event-next={nextThemeFor(theme)}
            >
              <ThemeIcon size={13} strokeWidth={1.8} />
              <span className="hidden lg:inline">{themeLabel}</span>
            </button>

            {/* Online dot */}
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="w-[5px] h-[5px]"
                style={{ backgroundColor: "var(--foreground)", opacity: 0.5, borderRadius: 1 }}
              />
              <span className="font-mono text-3xs text-muted-foreground">
                {t("nav.online")}
              </span>
            </span>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={cycleTheme}
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
          <motion.div
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
              <div className="max-w-[1080px] mx-auto px-6 py-3 flex flex-col gap-0.5">
                {navLinks.map((link, i) => {
                  const active = isActive(link);
                  return (
                    <motion.a
                      key={link.labelKey}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`py-3 px-3 font-mono text-mono transition-colors duration-200 whitespace-nowrap ${
                        active
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setMenuOpen(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                    >
                      {t(link.labelKey)}
                    </motion.a>
                  );
                })}
                <div className="py-3 px-3">
                  <LanguageSwitcher translationUrl={translationUrl} activeLang={translationSlug ? lang : undefined} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
    </MotionProvider>
  );
}
