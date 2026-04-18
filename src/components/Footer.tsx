import { TerminalPrompt } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { useClientValue } from "@/hooks/useClientValue";
import { useLocale } from "@/stores/settingsStore";

const getYear = () => String(new Date().getFullYear());

export function Footer() {
  const year = useClientValue(getYear, "");
  const { t } = useLocale();

  return (
    <MotionProvider>
    <footer aria-label="Site footer" className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-12 pb-12">
      <div className="space-y-6">
        {/* Interactive terminal */}
        <div
          className="p-4"
          style={{
            borderRadius: "2px",
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-3xs font-mono text-foreground/60 pb-2">
            {t("footer.shellHelp")}
          </div>
          <TerminalPrompt />
        </div>

        <div
          className="pt-5"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          <p className="text-center font-mono text-label text-muted-foreground">
            {year ? `© ${year}` : "©"} {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
    </MotionProvider>
  );
}
