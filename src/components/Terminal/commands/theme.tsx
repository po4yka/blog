import { registerCommand } from "./registry";
import { Accent } from "../primitives";
import type { Command } from "./types";

const validThemes = ["dark", "light", "system"] as const;
type ValidTheme = (typeof validThemes)[number];

function isValidTheme(value: string): value is ValidTheme {
  return (validThemes as readonly string[]).includes(value);
}

const theme: Command = {
  name: "theme",
  description: "View or change the site theme",
  completions: (partial) =>
    validThemes.filter((t) => t.startsWith(partial)),
  execute: (args, ctx) => {
    if (args.length === 0) {
      return (
        <span>
          Current theme: <Accent>{ctx.getTheme()}</Accent>
        </span>
      );
    }

    const value = args[0] ?? "";
    if (!isValidTheme(value)) {
      return `theme: invalid value "${value}". Use: dark, light, system`;
    }

    ctx.setTheme(value);
    return (
      <span>
        Theme set to <Accent>{value}</Accent>
      </span>
    );
  },
};

registerCommand(theme);
