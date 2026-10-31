import type { ReactNode } from "react";
import type { WipeOrigin } from "@/lib/themeTransition";

export interface CommandContext {
  /** All command strings entered this session */
  history: string[];
  /** Navigate to a path (full page load for Astro SSG) */
  navigate: (path: string) => void;
  /** Get the current theme (commands change it through switchTheme) */
  getTheme: () => string;
  /** Get the current locale ("en" or "ru") */
  getLocale: () => string;
  /** Where a theme wipe starts (default: viewport centre) */
  origin?: WipeOrigin;
}

export interface Command {
  name: string;
  description: string;
  /** Return valid completions for a partial argument string */
  completions?: (partial: string, args: string[]) => string[];
  /** Execute the command. Return ReactNode for output, or "__CLEAR__" to wipe history. */
  execute: (args: string[], ctx: CommandContext) => ReactNode | "__CLEAR__";
}

const commands = new Map<string, Command>();

export function registerCommand(cmd: Command) {
  commands.set(cmd.name, cmd);
}

export function getCommand(name: string): Command | undefined {
  return commands.get(name);
}

export function getAllCommands(): Command[] {
  return Array.from(commands.values());
}

export function getCommandNames(): string[] {
  return Array.from(commands.keys());
}

/** Split a command line into a lower-cased name and its arguments. Empty input gives an empty name. */
export function parseLine(line: string): { name: string; args: string[] } {
  const [name = "", ...args] = line.trim().split(/\s+/);
  return { name: name.toLowerCase(), args };
}

/** Run a command line. Returns null for a blank line and a text message for an unknown command. */
export function run(line: string, ctx: CommandContext): ReactNode | "__CLEAR__" | null {
  const { name, args } = parseLine(line);
  if (!name) return null;
  const cmd = getCommand(name);
  return cmd ? cmd.execute(args, ctx) : `shell: command not found: ${name}`;
}
