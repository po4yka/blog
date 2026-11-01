import { TerminalPrompt } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { Panel } from "./ui/Panel";
import { useClientValue } from "@/hooks/useClientValue";
import { useLocale } from "@/stores/settingsStore";

const getYear = () => String(new Date().getFullYear());

export function Footer() {
  const year = useClientValue(getYear, "");
  const { t } = useLocale();

  return (
    <MotionProvider>
    <footer aria-label={t("footer.label")} className="max-w-(--grid-max) mx-auto px-(--grid-pad) pb-12">
      <div className="space-y-6">
        {/* Interactive terminal */}
        <Panel clip="visible" className="p-4">
          <div className="label-meta text-foreground/60 pb-2">
            {t("footer.shellHelp")}
          </div>
          <TerminalPrompt />
        </Panel>

        <div
          className="pt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          <p className="label-meta text-muted-foreground">
            {year ? `© ${year}` : "©"} {t("footer.copyright")}
          </p>
          <div className="flex flex-wrap items-center gap-x-4">
            <a
              href="/changelog"
              className="label-meta text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-11 sm:min-h-0"
            >
              {t("footer.changelog")}
            </a>
            <a
              href="/privacy"
              className="label-meta text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-11 sm:min-h-0"
            >
              {t("footer.privacy")}
            </a>
          </div>
        </div>
      </div>
    </footer>
    </MotionProvider>
  );
}
