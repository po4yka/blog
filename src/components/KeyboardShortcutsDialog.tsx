import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const SHORTCUT_GROUPS = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: "g h", desc: "Go to home" },
      { keys: "g p", desc: "Go to projects" },
      { keys: "g e", desc: "Go to experience" },
      { keys: "g b", desc: "Go to blog" },
      { keys: "g s", desc: "Go to settings" },
    ],
  },
  {
    label: "Sections",
    shortcuts: [
      { keys: "j", desc: "Next section" },
      { keys: "k", desc: "Previous section" },
    ],
  },
  {
    label: "Utilities",
    shortcuts: [
      { keys: "t", desc: "Cycle theme" },
      { keys: "/", desc: "Focus terminal" },
      { keys: "?", desc: "Toggle this help" },
      { keys: "Esc", desc: "Close / blur" },
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="font-mono max-w-md"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-xs text-muted-foreground/55 uppercase tracking-wider mb-2">
                {group.label}
              </div>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground/60">{s.desc}</span>
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
          Press <Kbd>?</Kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
