import { m } from "motion/react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { stagger } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";
import { getCommand, getCommandNames, run, type CommandContext } from "@/lib/commands";
import { useSettingsStore, useLocale } from "@/stores/settingsStore";
// Re-export shared UI primitives (defined in ui.tsx to avoid import cycles)
export { Em, Tag } from "./ui";

/**
 * Key/value data rows. `fieldCodes` renders IBM 3270-style operator labels
 * `[01] FIELD …………: value` — signature of the operator-console layer.
 */
export function InfoTable({
  rows,
  delay = 0,
  fieldCodes = false,
  instant = false,
}: {
  rows: { label: string; value: ReactNode }[];
  delay?: number;
  fieldCodes?: boolean;
  /** Skip the entrance fade. Use for above-the-fold LCP content. */
  instant?: boolean;
}) {
  const maxLabelLen = fieldCodes
    ? Math.max(...rows.map((r) => r.label.length))
    : 0;

  return (
    <Reveal className="space-y-0" delay={delay} instant={instant}>
      {rows.map((row, i) => (
        <Reveal
          key={row.label}
          className="flex items-baseline py-1.5 -mx-2 px-2"
          style={{
            lineHeight: 1.6,
            gap: fieldCodes ? "0.5rem" : "1.5rem",
            borderBottom:
              i < rows.length - 1
                ? fieldCodes
                  ? "1px dashed var(--rule)"
                  : "1px solid var(--border)"
                : undefined,
          }}
          delay={delay + stagger.fast + i * stagger.fast}
          instant={instant}
        >
          {fieldCodes ? (
            <>
              <span
                className="shrink-0 select-none font-mono text-mono-sm"
                style={{ color: "var(--muted-foreground-dim)" }}
                aria-hidden="true"
              >
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span
                className="shrink-0 font-mono text-mono-sm"
                style={{ color: "var(--muted-foreground)", letterSpacing: "0.04em" }}
              >
                {row.label.toUpperCase()}
                <span
                  aria-hidden="true"
                  style={{ color: "var(--muted-foreground-dim)" }}
                >
                  {"".padEnd(Math.max(0, maxLabelLen - row.label.length + 3), ".")}
                </span>
                {":"}
              </span>
            </>
          ) : (
            <span
              className="shrink-0 font-mono text-sm"
              style={{ minWidth: "80px", color: "var(--muted-foreground)" }}
            >
              {row.label}
            </span>
          )}
          <span className="font-sans text-foreground text-sm min-w-0 flex-1" style={{ opacity: 0.92 }}>
            {row.value}
          </span>
        </Reveal>
      ))}
    </Reveal>
  );
}

/** Compute ghost-text suggestion from current input */
function getSuggestion(input: string): string | null {
  if (!input) return null;

  const parts = input.split(/\s+/);
  const first = parts[0];
  if (!first) return null;
  const cmdName = first.toLowerCase();

  if (parts.length === 1) {
    const match = getCommandNames().find(
      (n) => n.startsWith(cmdName) && n !== cmdName,
    );
    return match ? match.slice(cmdName.length) : null;
  }

  const cmd = getCommand(cmdName);
  if (!cmd?.completions) return null;

  const partial = parts[parts.length - 1] ?? "";
  const completions = cmd.completions(partial, parts.slice(1, -1));
  const match = completions.find((c) => c.startsWith(partial) && c !== partial);
  return match ? match.slice(partial.length) : null;
}

/**
 * Interactive shell. Minimal `~$` prompt — no hostname theatre.
 */
export function TerminalPrompt({ delay = 0 }: { delay?: number }) {
  const [input, setInput] = useState("");
  const [displayHistory, setDisplayHistory] = useState<{ cmd: string; output: ReactNode }[]>([]);
  const [focused, setFocused] = useState(false);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [savedInput, setSavedInput] = useState("");

  const suggestion = useMemo(() => getSuggestion(input), [input]);

  const theme = useSettingsStore((s) => s.theme);
  const { t, locale } = useLocale();

  const ctx: CommandContext = useMemo(
    () => ({
      history: commandHistory,
      navigate: (path: string) => {
        window.location.assign(path);
      },
      getTheme: () => theme,
      getLocale: () => locale,
    }),
    [commandHistory, theme, locale],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const raw = input.trim();
      if (!raw) return;

      setCommandHistory((h) => [...h, raw]);
      setHistoryIndex(null);
      setSavedInput("");

      const output = run(raw, ctx);

      if (output === "__CLEAR__") {
        setDisplayHistory([]);
        setInput("");
        return;
      }

      setDisplayHistory((h) => [...h.slice(-19), { cmd: raw, output }]);
      setInput("");
    },
    [input, ctx],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Without a suggestion (or with Shift) Tab must move focus, or the input is a keyboard trap.
      if (e.key === "Tab" && suggestion && !e.shiftKey) {
        e.preventDefault();
        setInput((prev) => prev + suggestion);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (commandHistory.length === 0) return;

        if (historyIndex === null) {
          setSavedInput(input);
          const idx = commandHistory.length - 1;
          setHistoryIndex(idx);
          setInput(commandHistory[idx] ?? "");
        } else if (historyIndex > 0) {
          const idx = historyIndex - 1;
          setHistoryIndex(idx);
          setInput(commandHistory[idx] ?? "");
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex === null) return;

        if (historyIndex >= commandHistory.length - 1) {
          setHistoryIndex(null);
          setInput(savedInput);
        } else {
          const idx = historyIndex + 1;
          setHistoryIndex(idx);
          setInput(commandHistory[idx] ?? "");
        }
        return;
      }
    },
    [suggestion, commandHistory, historyIndex, input, savedInput],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setHistoryIndex(null);
  }, []);

  return (
    <Reveal className="space-y-1 font-mono text-mono" delay={delay}>
      <div aria-live="polite">
        {displayHistory.map((h, i) => (
          <m.div
            key={i}
            className="space-y-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--emphasis)", fontWeight: 500 }}>~$</span>
              <span className="text-foreground" style={{ opacity: 0.92 }}>{h.cmd}</span>
            </div>
            <div className="text-muted-foreground pl-5">{h.output}</div>
          </m.div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <span aria-hidden="true" style={{ color: "var(--emphasis)", fontWeight: 500 }}>~$</span>
        <div className="relative flex-1">
          <input
            id="terminal-input"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label={t("footer.terminalInputLabel")}
            className="w-full bg-transparent outline-none text-foreground text-mono font-mono"
            style={{ caretColor: "var(--emphasis)" }}
            placeholder={focused ? "" : t("footer.terminalPlaceholder")}
            autoComplete="off"
            spellCheck={false}
          />
          {suggestion && input && (
            <span
              className="pointer-events-none absolute top-0 left-0 text-mono font-mono whitespace-pre"
              style={{ color: "var(--muted-foreground-dim)" }}
              aria-hidden="true"
            >
              <span className="invisible">{input}</span>
              {suggestion}
            </span>
          )}
          {focused && !input && (
            <span
              className="pointer-events-none absolute top-0 left-0"
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "0.5rem",
                height: "1em",
                backgroundColor: "var(--emphasis)",
                opacity: 0.8,
                animation: "blink 1s step-end infinite",
              }}
            />
          )}
        </div>
      </form>
    </Reveal>
  );
}
