import { registerCommand, getAllCommands } from "@/lib/commands";
import type { Command } from "@/lib/commands";
import { buildMeta } from "@/data/buildMeta";

const DAY_MS = 86_400_000;

const help: Command = {
  name: "help",
  description: "List available commands",
  execute: () => {
    const cmds = getAllCommands();
    return (
      <div className="space-y-0.5">
        <div className="text-foreground/60">Available commands:</div>
        {cmds.map((c) => (
          <div key={c.name} className="flex gap-4">
            <span className="text-foreground font-medium shrink-0" style={{ minWidth: 100 }}>
              {c.name}
            </span>
            <span className="text-muted-foreground">{c.description}</span>
          </div>
        ))}
      </div>
    );
  },
};

const whoami: Command = {
  name: "whoami",
  description: "Print current user",
  execute: () => "po4yka",
};

const date: Command = {
  name: "date",
  description: "Print current date and time",
  execute: () => new Date().toString(),
};

// Terminal output is real data only (DESIGN.md): the build metadata and the current URL.
const uptime: Command = {
  name: "uptime",
  description: "Time since the last deploy",
  execute: () => {
    const days = Math.max(0, Math.floor((Date.now() - Date.parse(buildMeta.deployDate)) / DAY_MS));
    return `up ${days}d -- deployed ${buildMeta.deployDate.slice(0, 10)} (${buildMeta.commitHash})`;
  },
};

const uname: Command = {
  name: "uname",
  description: "Print system information",
  execute: () => `Astro ${buildMeta.astroVersion} on Cloudflare Workers`,
};

const pwd: Command = {
  name: "pwd",
  description: "Print working directory",
  execute: () => (typeof location === "undefined" ? "/" : location.pathname),
};

const echo: Command = {
  name: "echo",
  description: "Print arguments",
  execute: (args) => args.join(" ") || "",
};

const clear: Command = {
  name: "clear",
  description: "Clear terminal history",
  execute: () => "__CLEAR__",
};

// Register all builtin commands
[help, whoami, date, uptime, uname, pwd, echo, clear].forEach(
  registerCommand,
);
