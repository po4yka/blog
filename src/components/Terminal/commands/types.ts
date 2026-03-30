import type { ReactNode } from "react";

export interface CommandContext {
  /** All command strings entered this session */
  history: string[];
  /** Navigate to a path (full page load for Astro SSG) */
  navigate: (path: string) => void;
  /** Set the site theme */
  setTheme: (theme: "light" | "dark" | "system") => void;
  /** Get the current theme */
  getTheme: () => string;
}

export interface Command {
  name: string;
  description: string;
  /** Return valid completions for a partial argument string */
  completions?: (partial: string, args: string[]) => string[];
  /** Execute the command. Return ReactNode for output, or "__CLEAR__" to wipe history. */
  execute: (args: string[], ctx: CommandContext) => ReactNode | "__CLEAR__";
}
