import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useThrottledCallback } from "@/hooks/useThrottle";
import { useSettings, useLocale } from "@/stores/settingsStore";
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Scroll progress — hooks are safe to call (motion handles SSR),
  // but we only render the progress bar after mount to avoid hydration mismatch
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  const onScroll = useThrottledCallback(
    () => setScrolled(window.scrollY > 20),
    100
  );

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const isActive = (link: (typeof navLinks)[number]) => {
    if (link.exact) return currentPathname === link.href;
    return currentPathname.startsWith(link.href);
  };

  const switchThemeLabel = `${t("nav.switchTheme")} (${theme})`;
  const themeLabel = theme;

  const cycleTheme = (e: React.MouseEvent) => {
    const newTheme = theme === "dark" ? "light" : "dark";
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (!reduceMotion && doc.startViewTransition) {
      const { clientX: x, clientY: y } = e;
      document.documentElement.style.setProperty("--tx", `${x}px`);
      document.documentElement.style.setProperty("--ty", `${y}px`);
      doc.startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      setTheme(newTheme);
    }
  };

  const ThemeIcon = theme === "light" ? Sun : Moon;

  return (
    <MotionProvider>
    <motion.nav
      className={`sticky top-0 z-50 font-mono transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl" : ""
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
      {/* Scroll progress bar — only render after mount to avoid SSR mismatch */}
      {mounted && (
        <motion.div
          style={{
            scaleX,
            transformOrigin: "left",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "var(--foreground)",
            opacity: 0.2,
            zIndex: 10,
          }}
        />
      )}

      <div className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-12 flex items-center justify-between h-11">
        {/* Logo / prefix */}
        <a
          href="/"
          className="flex items-center gap-2 text-mono text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0"
        >
          <span
            className="inline-block w-[8px] h-[8px] rounded-[1px]"
            style={{ backgroundColor: "var(--foreground)", opacity: 0.5 }}
          />
          po4yka
        </a>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = isActive(link);
            return (
              <a
                key={link.labelKey}
                href={link.href}
                className={`relative px-3 py-1.5 text-mono-sm transition-colors duration-200 group ${
                  active
                    ? "text-foreground font-medium border-b border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(link.labelKey)}
              </a>
            );
          })}
        </div>

        {/* Desktop right: lang switch + theme toggle + status */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher translationUrl={translationUrl} activeLang={translationSlug ? lang : undefined} />

          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] text-3xs text-muted-foreground hover:text-foreground active:opacity-70 transition-colors duration-200 cursor-pointer"
            title={switchThemeLabel}
            aria-label={switchThemeLabel}
            data-umami-event="theme-toggle"
            data-umami-event-next={theme === "dark" ? "light" : "dark"}
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
            <span className="text-3xs text-muted-foreground">
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
            data-umami-event-next={theme === "dark" ? "light" : "dark"}
          >
            <ThemeIcon size={18} strokeWidth={1.8} />
          </button>
          <button
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

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="md:hidden"
            style={{
              background: "var(--mobile-menu-bg)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid var(--rule)",
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="max-w-[1080px] mx-auto px-6 py-3 flex flex-col gap-0.5">
              {navLinks.map((link, i) => {
                const active = isActive(link);
                return (
                  <motion.a
                    key={link.labelKey}
                    href={link.href}
                    className={`py-3 px-3 text-mono transition-colors duration-200 ${
                      active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMenuOpen(false)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
    </MotionProvider>
  );
}
