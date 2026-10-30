import { Mail, Play, Apple, Briefcase, FolderGit2, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { GITHUB_USERNAME } from "@/lib/constants";
import { useLocale } from "@/stores/settingsStore";

const links: { Icon: LucideIcon; label: string; href: string | undefined }[] = [
  { Icon: Mail, label: "email", href: "mailto:hello@po4yka.dev" },
  { Icon: Play, label: "google play", href: undefined },
  { Icon: Apple, label: "app store", href: undefined },
  { Icon: Briefcase, label: "linkedin", href: "https://linkedin.com/in/pochaev-nikita/" },
  { Icon: FolderGit2, label: "github", href: `https://github.com/${GITHUB_USERNAME}` },
  { Icon: Send, label: "telegram", href: "https://t.me/po4yka" },
];

export function Links() {
  const { t } = useLocale();

  return (
    <section aria-labelledby="links-heading" className="space-y-5">
      <SectionHeader
        number="03"
        label="CONTACT"
        heading={t("links.heading")}
        meta={`${links.filter((l) => l.href).length}/${links.length} ACTIVE`}
        id="links-heading"
      />
      <Reveal className="flex flex-wrap gap-2" speed="slow">
        {links.map((link, i) =>
          link.href === undefined ? (
            <span
              key={link.label}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 min-h-[44px] border border-border text-muted-foreground font-mono text-mono rounded-[2px] opacity-30 cursor-default pointer-events-none"
              aria-label={`${link.label} (${t("links.comingSoon")})`}
            >
              <link.Icon size={13} strokeWidth={1.8} aria-hidden="true" className="text-muted-foreground-dim shrink-0" />
              {link.label}
            </span>
          ) : (
            // The chip keeps its own colour transition, so the fade sits on a wrapper.
            <Reveal key={link.label} className="flex" delay={0.05 + i * 0.04}>
            <a
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={link.href.startsWith("http") ? `${link.label} (${t("links.opensNewWindow")})` : link.label}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 min-h-[44px] border border-border text-muted-foreground hover:text-foreground hover:bg-muted hover:border-rule transition-colors duration-200 font-mono text-mono rounded-[2px]"
            >
              <link.Icon size={13} strokeWidth={1.8} aria-hidden="true" className="text-muted-foreground-dim shrink-0" />
              {link.label}
            </a>
            </Reveal>
          )
        )}
      </Reveal>
    </section>
  );
}
