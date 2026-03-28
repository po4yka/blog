import { motion } from "motion/react";
import { useInView } from "../useInView";
import { useState, type ReactNode } from "react";
import { ease, duration, spring, stagger } from "@/lib/motion";

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
 * Interactive terminal prompt — type commands and get responses
 */
export function TerminalPrompt({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ cmd: string; output: string }[]>([]);
  const [focused, setFocused] = useState(false);

  const responses: Record<string, string> = {
    help: "Available: help, whoami, date, uptime, uname, pwd, echo, clear, ls",
    whoami: "po4yka",
    date: new Date().toString(),
    uptime: "47d 6h 23m — load average: 1.47 1.22 0.98",
    uname: "Darwin po4yka.local 24.2.0 arm64",
    pwd: "/Users/po4yka/dev/po4yka.dev",
    ls: "README.md  projects/  posts/  resume.log  links.toml",
    clear: "__CLEAR__",
    neofetch: `po4yka@ghostty\n--------------\nOS: macOS 15.2 arm64\nShell: zsh 5.9\nTerminal: Ghostty\nEditor: neovim`,
    "cat README.md": "Mobile Developer — Android, iOS, KMP, MobileOps",
    kotlin: "Kotlin 2.1.0 (JVM target 21)",
    swift: "Swift 6.0 (Xcode 16.2)",
    gradle: "Gradle 8.7 — Build cache: enabled",
    "adb devices": "emulator-5554  device  Pixel_8_API_35",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === "clear") {
      setHistory([]);
      setInput("");
      return;
    }

    const output = responses[cmd] || `zsh: command not found: ${cmd}`;
    setHistory((h) => [...h.slice(-4), { cmd: input.trim(), output }]);
    setInput("");
  };

  return (
    <motion.div
      ref={ref}
      className="space-y-1 font-mono text-mono"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: duration.base, delay }}
    >
      {/* Previous commands */}
      {history.map((h, i) => (
        <div key={i} className="space-y-0.5">
          <div className="flex items-center gap-1 text-muted-foreground/40">
            <span style={{ color: "var(--accent)" }}>po4yka</span>
            <span className="text-muted-foreground/35">@ghostty</span>
            <span className="text-foreground/40">:~$</span>
            <span className="ml-1 text-foreground/60">{h.cmd}</span>
          </div>
          <div className="text-muted-foreground/50 pl-2 whitespace-pre-line">{h.output}</div>
        </div>
      ))}

      {/* Active prompt */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <span style={{ color: "var(--accent)" }}>po4yka</span>
        <span className="text-muted-foreground/35">@ghostty</span>
        <span className="text-foreground/40">:~$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-foreground/70 ml-1 placeholder:text-muted-foreground/20 text-mono font-mono"
          style={{ caretColor: "var(--accent)" }}
          placeholder={focused ? "" : "type a command…"}
          autoComplete="off"
          spellCheck={false}
        />
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

/**
 * Accent-colored text helper
 */
export function Accent({ children }: { children: ReactNode }) {
  return <span style={{ color: "var(--accent)" }}>{children}</span>;
}

/**
 * Tag badge with hover scale
 */
export function Tag({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "highlight";
}) {
  return (
    <motion.span
      className={`inline-block px-2 py-0.5 cursor-default font-mono text-xs uppercase rounded-[4px] ${
        variant === "highlight"
          ? "text-accent bg-accent/10"
          : "text-muted-foreground/60 bg-muted-foreground/5"
      }`}
      style={{
        letterSpacing: "0.06em",
      }}
      whileHover={{
        scale: 1.08,
        y: -1,
        transition: spring.snappy,
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  );
}
