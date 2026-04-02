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
 * Table-style rows with hover highlight
 */
export function InfoTable({
  rows,
  delay = 0,
}: {
  rows: { label: string; value: ReactNode }[];
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);

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
          className="flex gap-6 py-1.5 -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150 text-sm rounded-[4px]"
          style={{ lineHeight: 1.6 }}
          initial={{ opacity: 0, x: -4 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.3, delay: delay + stagger.fast + i * stagger.fast }}
        >
          <span
            className="text-muted-foreground/50 shrink-0"
            style={{ minWidth: "80px" }}
          >
            {row.label}
          </span>
          <span className="text-foreground/80">{row.value}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Compute ghost-text suggestion from current input
 */
function getSuggestion(input: string): string | null {
  if (!input) return null;

  const parts = input.split(/\s+/);
  const first = parts[0];
  if (!first) return null;
  const cmdName = first.toLowerCase();

  // No space yet: complete command name
  if (parts.length === 1) {
    const match = getCommandNames().find(
      (n) => n.startsWith(cmdName) && n !== cmdName,
    );
    return match ? match.slice(cmdName.length) : null;
  }

  // Has command + partial arg: ask the command for completions
  const cmd = getCommand(cmdName);
  if (!cmd?.completions) return null;

  const partial = parts[parts.length - 1] ?? "";
  const completions = cmd.completions(partial, parts.slice(1, -1));
  const match = completions.find((c) => c.startsWith(partial) && c !== partial);
  return match ? match.slice(partial.length) : null;
}

/**
 * Interactive terminal prompt with command registry, history navigation, and tab completion
 */
export function TerminalPrompt({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [input, setInput] = useState("");
  const [displayHistory, setDisplayHistory] = useState<{ cmd: string; output: ReactNode }[]>([]);
  const [focused, setFocused] = useState(false);

  // Arrow-key history state
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [savedInput, setSavedInput] = useState("");

  // Ghost text
  const suggestion = useMemo(() => getSuggestion(input), [input]);

  // Theme access
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

      // Update command history for arrow navigation
      setCommandHistory((h) => [...h, raw]);
      setHistoryIndex(null);
      setSavedInput("");

      // Clear command
      if (cmdName === "clear") {
        setDisplayHistory([]);
        setInput("");
        return;
      }

      // Look up and execute
      const cmd = getCommand(cmdName);
      const output = cmd
        ? cmd.execute(args, ctx)
        : <span>zsh: command not found: {cmdName}</span>;

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
      // Tab completion
      if (e.key === "Tab") {
        e.preventDefault();
        if (suggestion) {
          setInput((prev) => prev + suggestion);
        }
        return;
      }

      // Arrow-key history navigation
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
      {/* Previous commands */}
      {displayHistory.map((h, i) => (
        <div key={i} className="space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground/40">
            <span style={{ color: "var(--accent)" }}>po4yka</span>
            <span className="text-muted-foreground/35">@ghostty</span>
            <span className="text-foreground/40">:~$</span>
            <span className="ml-1 text-foreground/60">{h.cmd}</span>
          </div>
          <div className="text-muted-foreground/50 pl-2">{h.output}</div>
        </div>
      ))}

      {/* Active prompt */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <span style={{ color: "var(--accent)" }}>po4yka</span>
        <span className="text-muted-foreground/35">@ghostty</span>
        <span className="text-foreground/40">:~$</span>
        <div className="relative flex-1 ml-1">
          <input
            id="terminal-input"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent outline-none text-foreground/70 placeholder:text-muted-foreground/20 text-mono font-mono"
            style={{ caretColor: "var(--accent)" }}
            placeholder={focused ? "" : "type a command..."}
            autoComplete="off"
            spellCheck={false}
          />
          {/* Ghost text suggestion */}
          {suggestion && input && (
            <span
              className="pointer-events-none absolute top-0 left-0 text-mono font-mono text-muted-foreground/15 whitespace-pre"
              aria-hidden="true"
            >
              <span className="invisible">{input}</span>
              {suggestion}
            </span>
          )}
        </div>
        {!focused && !input && (
          <span
            className="inline-block w-2 h-4"
            style={{
              backgroundColor: "var(--accent)",
              opacity: 0.6,
              borderRadius: "1px",
              animation: "blink 1s steps(2, start) infinite",
            }}
          />
        )}
      </form>
    </motion.div>
  );
}

