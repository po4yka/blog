import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Keyboard } from "lucide-react";
import { adminNav } from "@/admin/nav";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const otherShortcuts = [
  { keys: ["/"], label: "Focus search" },
  { keys: ["?"], label: "Show this list" },
];

/** True when a key press belongs to a text control, not to the shortcut layer. */
function isTyping(target: EventTarget | null): boolean {
  const el = target;
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) ||
      /^(combobox|textbox|searchbox|listbox|menu)$/.test(el.getAttribute("role") ?? ""))
  );
}

/**
 * Global admin keys: `g` then a section key navigates, `/` focuses the page's
 * search field, `?` opens the list. Keys typed into a field are ignored.
 * Renders the sidebar "Shortcuts" button; the listener works while the
 * sidebar is hidden on mobile, since the component stays mounted.
 */
export function AdminShortcuts() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pendingG = useRef(0);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The open dialog owns the keyboard (Escape, Tab); nothing should navigate behind it.
      if (openRef.current || e.defaultPrevented || e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      // Some layouts and synthetic events report Shift+/ as "/" with shiftKey.
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (Date.now() - pendingG.current < 1000) {
        pendingG.current = 0;
        const item = adminNav.find((n) => n.key === e.key);
        if (item) {
          e.preventDefault();
          navigate(item.path);
          return;
        }
        // Not a section key: handle it as a fresh key, so `g g` re-arms.
      }
      if (e.key === "g") {
        pendingG.current = Date.now();
      } else if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>("#admin-main input[type=search]");
        if (search) {
          e.preventDefault();
          search.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const rows = [
    ...adminNav.map((n) => ({ keys: ["g", n.key], label: `Go to ${n.label}` })),
    ...otherShortcuts,
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
        style={{ fontSize: "0.75rem", borderRadius: "2px" }}
      >
        <Keyboard size={14} aria-hidden="true" />
        Shortcuts
        <kbd className="ml-auto font-mono text-muted-foreground-dim" style={{ fontSize: 11 }}>?</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="label-meta" style={{ fontSize: 11 }}>
            <span className="text-foreground">??</span>
            <span className="text-muted-foreground-dim"> / </span>
            KEYBOARD
          </DialogTitle>
          <DialogDescription className="sr-only">Admin keyboard shortcuts</DialogDescription>
          <dl style={{ fontSize: "0.8125rem" }}>
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-1.5" style={{ borderBottom: "1px dashed var(--rule)" }}>
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="flex gap-1">
                  {row.keys.map((k) => (
                    <kbd key={k} className="min-w-6 px-1.5 py-0.5 text-center font-mono text-foreground border border-border" style={{ borderRadius: 2 }}>
                      {k}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
