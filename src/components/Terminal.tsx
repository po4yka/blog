import { motion } from "motion/react";
import { useInView } from "./useInView";
import { useState, useCallback, type ReactNode } from "react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/**
 * macOS traffic-light dots — hover to reveal close / minimize / maximize icons
 */
function TrafficLights({ dim = false }: { dim?: boolean }) {
  const [hovered, setHovered] = useState(false);

  const dots = [
    { color: "var(--signal-red)", icon: "×" },
    { color: "var(--signal-yellow)", icon: "−" },
    { color: "var(--signal-green)", icon: "＋" },
  ];

  return (
    <div
      className="flex items-center gap-[6px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {dots.map((dot, i) => (
        <span
          key={i}
          className="w-[11px] h-[11px] rounded-full flex items-center justify-center select-none text-2xs font-bold"
          style={{
            backgroundColor: dim && !hovered
              ? "var(--dot-dim)"
              : dot.color,
            opacity: dim && !hovered ? 1 : 0.85,
            transition: "all 0.2s ease",
            cursor: hovered ? "pointer" : "default",
            lineHeight: 1,
            color: hovered ? "rgba(0,0,0,0.6)" : "transparent",
          }}
        >
          {hovered ? dot.icon : ""}
        </span>
      ))}
    </div>
  );
}

/**
 * macOS window wrapper — hover elevation, traffic lights, title bar
 */
export function MacWindow({
  title,
  subtitle,
  children,
  delay = 0,
  className = "",
  dimLights = false,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
  className?: string;
  dimLights?: boolean;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden rounded-[10px] ${className}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--window-shadow-sm)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      whileHover={{
        boxShadow: "var(--window-shadow)",
        y: -1,
        transition: { duration: 0.25, ease: "easeOut" },
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-3 px-4 py-[10px]"
        style={{
          background: "var(--titlebar)",
          borderBottom: "1px solid var(--titlebar-border)",
        }}
      >
        <TrafficLights dim={dimLights} />
        {title && (
          <span
            className="flex-1 text-center text-muted-foreground/50 select-none font-mono text-label"
          >
            {title}
          </span>
        )}
        {!title && <span className="flex-1" />}
        {subtitle && (
          <span
            className="text-muted-foreground/25 select-none font-mono text-3xs"
          >
            {subtitle}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-5 md:p-6 font-mono">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Boot status block — [ OK ] / [ INFO ] messages with hover highlight
 */
export function BootBlock({
  lines,
  delay = 0,
}: {
  lines: { status: "OK" | "INFO" | "WARN"; text: ReactNode }[];
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden rounded-[10px] font-mono"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--window-shadow-sm)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease }}
      whileHover={{
        boxShadow: "var(--window-shadow)",
        y: -1,
        transition: { duration: 0.25 },
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-3 px-4 py-[10px]"
        style={{
          background: "var(--titlebar)",
          borderBottom: "1px solid var(--titlebar-border)",
        }}
      >
        <TrafficLights dim />
        <span
          className="flex-1 text-center text-muted-foreground/30 select-none text-xs"
        >
          system output
        </span>
        <span style={{ width: 54 }} />
      </div>
      {/* Lines */}
      <div className="px-5 py-4">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            className="flex gap-2 items-start py-[1px] -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150 text-mono rounded-[4px]"
            style={{ lineHeight: 1.7 }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.08 + i * 0.06 }}
          >
            <span
              className="shrink-0 font-medium"
              style={{
                color:
                  line.status === "OK"
                    ? "var(--ok)"
                    : line.status === "WARN"
                    ? "var(--signal-amber)"
                    : "var(--info)",
              }}
            >
              [ {line.status} ]
            </span>
            <span className="text-foreground/70">{line.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Command prompt — click to copy command text
 */
export function Cmd({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Extract text content without the $ prefix
    const textParts = el.querySelectorAll("[data-cmd-text]");
    const text = Array.from(textParts)
      .map((p) => p.textContent)
      .join("")
      .trim();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    }
  }, [ref]);

  return (
    <motion.div
      ref={ref}
      className="flex items-baseline gap-2 group cursor-pointer font-mono text-mono-lg"
      initial={{ opacity: 0, y: 6 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay, ease }}
      onClick={handleCopy}
      title="Click to copy command"
    >
      <span className="text-accent/60 select-none group-hover:text-accent transition-colors duration-200">
        $
      </span>
      <span data-cmd-text className="text-foreground/90 group-hover:text-foreground transition-colors duration-200">
        {children}
      </span>
      {/* Copy indicator */}
      <motion.span
        className="text-accent/60 select-none text-xs"
        initial={{ opacity: 0, x: -4 }}
        animate={copied ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
        transition={{ duration: 0.2 }}
      >
        {copied ? "copied!" : ""}
      </motion.span>
      {/* Copy icon hint on hover */}
      {!copied && (
        <span
          className="text-muted-foreground/0 group-hover:text-muted-foreground/30 transition-colors duration-200 select-none text-xs"
        >
          ⌘C
        </span>
      )}
    </motion.div>
  );
}

/**
 * Styled output block
 */
export function OutputBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      className={`border-l-2 border-accent/15 pl-6 md:pl-8 hover:border-accent/30 transition-colors duration-300 font-mono ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/**
 * "less" file viewer — macOS-style window with traffic lights
 */
export function LessViewer({
  filename,
  meta,
  children,
  delay = 0,
}: {
  filename: string;
  meta?: string;
  children: ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden rounded-[10px]"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--window-shadow)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      whileHover={{
        y: -1,
        transition: { duration: 0.25 },
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-3 px-4 py-[10px]"
        style={{
          background: "var(--titlebar)",
          borderBottom: "1px solid var(--titlebar-border)",
        }}
      >
        <TrafficLights />
        <span
          className="flex-1 text-center text-muted-foreground/45 select-none font-mono text-label"
        >
          {filename}
        </span>
        {meta && (
          <span
            className="text-muted-foreground/25 select-none font-mono text-3xs"
          >
            {meta}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-5 md:p-7 font-mono">
        {children}
      </div>
    </motion.div>
  );
}

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
      transition={{ duration: 0.4, delay, ease }}
    >
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="flex gap-6 py-1.5 -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150 text-sm rounded-[4px]"
          style={{ lineHeight: 1.6 }}
          initial={{ opacity: 0, x: -4 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.3, delay: delay + 0.04 + i * 0.04 }}
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
      transition={{ duration: 0.35, delay }}
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
        transition: { type: "spring", stiffness: 400, damping: 15 },
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  );
}