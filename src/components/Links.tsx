import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { Cmd, Accent } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { SectionHeader } from "./SectionHeader";
import { GITHUB_USERNAME } from "@/lib/constants";
import { useLocale } from "@/stores/settingsStore";
import { ease } from "@/lib/motion";

const links = [
  { icon: "✉", label: "email", href: "mailto:hello@po4yka.dev" },
  { icon: "⊞", label: "google play", href: undefined },
  { icon: "◎", label: "app store", href: undefined },
  { icon: "◉", label: "linkedin", href: "https://linkedin.com/in/pochaev-nikita/" },
  { icon: "⌘", label: "github", href: `https://github.com/${GITHUB_USERNAME}` },
  { icon: "✈", label: "telegram", href: "https://t.me/po4yka" },
];

export function Links() {
  const { ref, inView } = useInView(0.1);
  const { t } = useLocale();

  return (
    <MotionProvider>
    <section aria-labelledby="links-heading" className="space-y-5">
      <SectionHeader
        number="03"
        label="CONTACT"
        heading={t("links.heading")}
        id="links-heading"
      />
      <Cmd>
        cat <Accent>~/.config/links.toml</Accent>
      </Cmd>

      <motion.div
        ref={ref}
        className="flex flex-wrap gap-2 pl-4 md:pl-6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, ease }}
      >
        {links.map((link, i) =>
          link.href === undefined ? (
            <span
              key={link.label}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-muted-foreground font-mono text-mono rounded-[2px] opacity-30 cursor-default pointer-events-none"
              style={{
                border: "1px solid var(--border)",
              }}
              aria-label={`${link.label} (${t("links.comingSoon")})`}
            >
              <span className="text-muted-foreground-dim text-mono-sm">
                {link.icon}
              </span>
              {link.label}
            </span>
          ) : (
            <motion.a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={link.href.startsWith("http") ? `${link.label} (${t("links.opensNewWindow")})` : link.label}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 font-mono text-mono rounded-[2px]"
              style={{
                border: "1px solid var(--border)",
              }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.04, ease }}
            >
              <span className="text-muted-foreground-dim text-mono-sm">
                {link.icon}
              </span>
              {link.label}
            </motion.a>
          )
        )}
      </motion.div>
    </section>
    </MotionProvider>
  );
}
