import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ease, duration, stagger } from "@/lib/motion";
import { getCommand, getCommandNames } from "./commands/registry";
import type { CommandContext } from "./commands/types";
import { useSettingsStore } from "@/stores/settingsStore";
// Re-export shared UI primitives (defined in ui.tsx to avoid import cycles)
export { Accent, Tag } from "./ui";

/**
 * Key/value data rows. `fieldCodes` renders IBM 3270-style operator labels
 * `[01] FIELD …………: value` — signature of the operator-console layer.
 */
export function InfoTable({
  rows,
  delay = 0,
  fieldCodes = false,
}: {
  rows: { label: string; value: ReactNode }[];
  delay?: number;
  fieldCodes?: boolean;
}) {
  const { ref, inView } = useInView(0.1);
  const maxLabelLen = fieldCodes
    ? Math.max(...rows.map((r) => r.label.length))
    : 0;

  return (
    <motion.div
      ref={ref}
      className="space-y-0 font-mono"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: duration.base, delay, ease }}
    >
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="flex items-baseline py-1.5 -mx-2 px-2 transition-colors duration-150"
          style={{
            lineHeight: 1.6,
            gap: fieldCodes ? "0.5rem" : "1.5rem",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : undefined,
          }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.25, delay: delay + stagger.fast + i * stagger.fast }}
        >
          {fieldCodes ? (
            <>
              <span
                className="shrink-0 select-none text-mono-sm"
                style={{ color: "var(--muted-foreground-dim)" }}
                aria-hidden="true"
              >
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span
                className="shrink-0 text-mono-sm"
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
              className="shrink-0 text-sm"
              style={{ minWidth: "80px", color: "var(--muted-foreground)" }}
            >
              {row.label}
            </span>
          )}
          <span className="text-foreground text-sm min-w-0 flex-1" style={{ opacity: 0.92 }}>
            {row.value}
          </span>
        </motion.div>
      ))}
    </motion.div>
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
  const { ref, inView } = useInView(0.1);
  const [input, setInput] = useState("");
  const [displayHistory, setDisplayHistory] = useState<{ cmd: string; output: ReactNode }[]>([]);
  const [focused, setFocused] = useState(false);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [savedInput, setSavedInput] = useState("");

  const suggestion = useMemo(() => getSuggestion(input), [input]);

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const ctx: CommandContext = useMemo(
    () => ({
      history: commandHistory,
      navigate: (path: string) => {
        window.location.assign(path);
      },
      setTheme,
      getTheme: () => theme,
    }),
    [commandHistory, setTheme, theme],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const raw = input.trim();
      if (!raw) return;

      const parts = raw.split(/\s+/);
      const cmdName = (parts[0] ?? "").toLowerCase();
      const args = parts.slice(1);

      setCommandHistory((h) => [...h, raw]);
      setHistoryIndex(null);
      setSavedInput("");

      if (cmdName === "clear") {
        setDisplayHistory([]);
        setInput("");
        return;
      }

      const cmd = getCommand(cmdName);
      const output = cmd
        ? cmd.execute(args, ctx)
        : <span>shell: command not found: {cmdName}</span>;

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
      if (e.key === "Tab") {
        e.preventDefault();
        if (suggestion) {
          setInput((prev) => prev + suggestion);
        }
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
    <motion.div
      ref={ref}
      className="space-y-1 font-mono text-mono"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: duration.base, delay }}
    >
      {displayHistory.map((h, i) => (
        <motion.div
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
        </motion.div>
      ))}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <span style={{ color: "var(--emphasis)", fontWeight: 500 }}>~$</span>
        <div className="relative flex-1">
          <input
            id="terminal-input"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent outline-none text-foreground text-mono font-mono"
            style={{ caretColor: "var(--emphasis)" }}
            placeholder={focused ? "" : "type a command"}
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
        {!focused && !input && (
          <span
            className="inline-block w-2 h-4"
            style={{
              backgroundColor: "var(--emphasis)",
              opacity: 0.7,
              animation: "blink 1s steps(2, start) infinite",
            }}
          />
        )}
      </form>
    </motion.div>
  );
}
