import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { Menu, X, Sun, Moon, Monitor } from "lucide-react";
import { useThrottledCallback } from "./useThrottle";
import { useSettings } from "./settingsStore";

const mono = "'JetBrains Mono', monospace";

const navLinks = [
  { label: "home", href: "/", exact: true },
  { label: "projects", href: "/projects" },
  { label: "experience", href: "/experience" },
  { label: "blog", href: "/blog" },
  { label: "settings", href: "/settings" },
];

interface NavProps {
  pathname?: string;
}

export function Nav({ pathname: initialPathname }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = initialPathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const { theme, setTheme } = useSettings();

  // Scroll progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  const onScroll = useThrottledCallback(
    () => setScrolled(window.scrollY > 20),
    0
  );

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const isActive = (link: (typeof navLinks)[number]) => {
    if (link.exact) return pathname === link.href;
    return pathname.startsWith(link.href);
  };

  // Cycle: dark → light → system → dark
  const cycleTheme = () => {
    const order = ["dark", "light", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <motion.nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl" : ""
      }`}
      style={{
        fontFamily: mono,
        background: scrolled
          ? "var(--nav-glass)"
          : "var(--nav-glass-subtle)",
        borderBottom: "1px solid var(--titlebar-border)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Scroll progress bar */}
      <motion.div
        style={{
          scaleX,
          transformOrigin: "left",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "var(--accent)",
          opacity: 0.6,
          zIndex: 10,
        }}
      />

      <div className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-12 flex items-center justify-between h-11">
        {/* Logo / prefix */}
        <motion.a
          href="/"
          className="flex items-center gap-2 text-foreground/70 hover:text-accent transition-colors duration-300 shrink-0"
          style={{ fontSize: "0.8125rem" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            className="inline-block w-[10px] h-[10px] rounded-full"
            style={{ backgroundColor: "var(--accent)", opacity: 0.7 }}
            whileHover={{
              scale: 1.3,
              opacity: 1,
              transition: { type: "spring", stiffness: 400, damping: 12 },
            }}
          />
          po4yka
        </motion.a>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = isActive(link);
            return (
              <a
                key={link.label}
                href={link.href}
                className={`relative px-3 py-1.5 transition-colors duration-200 group ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground/50 hover:text-foreground/70"
                }`}
                style={{
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  backgroundColor: active ? "rgba(139, 124, 246, 0.08)" : "transparent",
                }}
              >
                {link.label}
                {/* Animated underline */}
                <span
                  className="absolute bottom-0.5 left-3 right-3 h-[1px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                  style={{
                    backgroundColor: active ? "var(--accent)" : "var(--muted-foreground)",
                    opacity: active ? 0.5 : 0.25,
                  }}
                />
              </a>
            );
          })}
        </div>

        {/* Desktop right: theme toggle + status */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <motion.button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground/40 hover:text-accent transition-colors duration-200 cursor-pointer"
            style={{ fontSize: "0.5625rem", borderRadius: "5px" }}
            title={`Theme: ${theme}`}
            aria-label={`Switch theme (current: ${theme})`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92, rotate: theme === "dark" ? 180 : -180 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <ThemeIcon size={13} strokeWidth={1.8} />
            <span className="hidden lg:inline">{theme}</span>
          </motion.button>

          {/* Online dot */}
          <span className="flex items-center gap-1.5">
            <span
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: "var(--signal-green)", animation: "pulse-scale 3s ease-in-out infinite" }}
            />
            <span className="text-muted-foreground/25" style={{ fontSize: "0.5625rem" }}>
              online
            </span>
          </span>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-1">
          <motion.button
            onClick={cycleTheme}
            className="text-muted-foreground/50 p-2 cursor-pointer"
            aria-label={`Switch theme (current: ${theme})`}
            whileTap={{ scale: 0.85, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <ThemeIcon size={16} strokeWidth={1.8} />
          </motion.button>
          <motion.button
            className="text-muted-foreground/60 p-2 -mr-2 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden"
            style={{
              background: "var(--mobile-menu-bg)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid var(--titlebar-border)",
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
                    key={link.label}
                    href={link.href}
                    className={`py-2 px-3 transition-colors duration-200 ${
                      active
                        ? "text-foreground"
                        : "text-muted-foreground/50 hover:text-foreground/70"
                    }`}
                    style={{
                      fontSize: "0.8125rem",
                      borderRadius: "6px",
                      backgroundColor: active ? "rgba(139, 124, 246, 0.08)" : "transparent",
                    }}
                    onClick={() => setMenuOpen(false)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    whileTap={{ scale: 0.97, x: 4 }}
                  >
                    {link.label}
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
