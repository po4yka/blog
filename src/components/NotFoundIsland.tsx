import { SectionHeader } from "./SectionHeader";
import { Panel } from "./ui/Panel";
import { Reveal } from "./ui/Reveal";
import { useLocale } from "@/stores/settingsStore";

export function NotFound() {
  const { t } = useLocale();

  return (
    <div className="pt-16">
      <Reveal as={Panel} clip="visible" speed="slow">
        {/* Operator-console header row */}
        <div
          className="px-4 py-[10px]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <SectionHeader
            level={1}
            number="!!"
            label="NOT FOUND"
            heading={t("notFound.windowTitle")}
            className="pb-0"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <Reveal className="font-mono text-mono" style={{ lineHeight: 1.7 }} delay={0.1}>
            <span className="text-muted-foreground label-meta">ERROR ·</span>{" "}
            <span className="text-foreground/80">
              {t("notFound.error")}
            </span>
          </Reveal>
          <Reveal className="font-mono text-mono" style={{ lineHeight: 1.7 }} delay={0.2}>
            <span className="text-muted-foreground label-meta">INFO ·</span>{" "}
            <span className="text-foreground/70">
              {t("notFound.info")}
            </span>
          </Reveal>

          <Reveal style={{ fontSize: "2.5rem" }} delay={0.3} speed="slow">
            <span className="text-foreground/80 inline-block">404</span>
            <span className="text-muted-foreground mx-3" style={{ fontSize: "1.5rem" }}>—</span>
            <span className="text-foreground/60" style={{ fontSize: "1rem" }}>{t("notFound.pageNotFound")}</span>
          </Reveal>

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
