import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useLocale } from "@/stores/settingsStore";
import type { TranslationKey } from "@/lib/i18n";

const SHORTCUT_GROUPS: { labelKey: TranslationKey; shortcuts: { keys: string; descKey: TranslationKey }[] }[] = [
  {
    labelKey: "shortcuts.navigation",
    shortcuts: [
      { keys: "g h", descKey: "shortcuts.goHome" },
      { keys: "g p", descKey: "shortcuts.goProjects" },
      { keys: "g e", descKey: "shortcuts.goExperience" },
      { keys: "g b", descKey: "shortcuts.goBlog" },
      { keys: "g s", descKey: "shortcuts.goSettings" },
    ],
  },
  {
    labelKey: "shortcuts.sections",
    shortcuts: [
      { keys: "j", descKey: "shortcuts.nextSection" },
      { keys: "k", descKey: "shortcuts.prevSection" },
    ],
  },
  {
    labelKey: "shortcuts.utilities",
    shortcuts: [
      { keys: "t", descKey: "shortcuts.cycleTheme" },
      { keys: "/", descKey: "shortcuts.focusTerminal" },
      { keys: "?", descKey: "shortcuts.toggleHelp" },
      { keys: "Esc", descKey: "shortcuts.closeBlur" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 rounded-[4px] text-xs font-mono text-foreground/70 bg-muted-foreground/10 border border-border min-w-[24px] text-center">
      {children}
    </kbd>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShortcutsDialog({ open, onOpenChange }: Props) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="font-mono max-w-md"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
            {t("shortcuts.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.labelKey}>
              <div className="text-xs text-muted-foreground/55 uppercase tracking-wider mb-2">
                {t(group.labelKey)}
              </div>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground/60">{t(s.descKey)}</span>
                    <span className="flex gap-1">
                      {s.keys.split(" ").map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground/40 pt-2">
          {t("shortcuts.pressToClose")}
        </div>
      </DialogContent>
    </Dialog>
  );
}
