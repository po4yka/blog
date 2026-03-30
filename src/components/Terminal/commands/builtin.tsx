import { registerCommand, getAllCommands } from "./registry";
import type { Command } from "./types";

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
            <span className="text-accent/70 shrink-0" style={{ minWidth: 100 }}>
              {c.name}
            </span>
            <span className="text-muted-foreground/50">{c.description}</span>
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

const uptime: Command = {
  name: "uptime",
  description: "Show system uptime",
  execute: () => "47d 6h 23m -- load average: 1.47 1.22 0.98",
};

const uname: Command = {
  name: "uname",
  description: "Print system information",
  execute: () => "Darwin po4yka.local 24.2.0 arm64",
};

const pwd: Command = {
  name: "pwd",
  description: "Print working directory",
  execute: () => "/Users/po4yka/dev/po4yka.dev",
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

const kotlin: Command = {
  name: "kotlin",
  description: "Show Kotlin version",
  execute: () => "Kotlin 2.1.0 (JVM target 21)",
};

const swift: Command = {
  name: "swift",
  description: "Show Swift version",
  execute: () => "Swift 6.0 (Xcode 16.2)",
};

const gradle: Command = {
  name: "gradle",
  description: "Show Gradle version",
  execute: () => "Gradle 8.7 -- Build cache: enabled",
};

const adb: Command = {
  name: "adb",
  description: "Android Debug Bridge",
  execute: (args) => {
    if (args[0] === "devices") {
      return "emulator-5554  device  Pixel_8_API_35";
    }
    return "adb: usage: adb devices";
  },
};

// Register all builtin commands
[help, whoami, date, uptime, uname, pwd, echo, clear, kotlin, swift, gradle, adb].forEach(
  registerCommand,
);
