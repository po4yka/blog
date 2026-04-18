import { registerCommand } from "./registry";
import { projects } from "@/data/projectsData";
import { blogPosts } from "@/data/blogData";
import { roles, skills } from "@/data/experienceData";
import { Accent } from "../ui";
import type { Command } from "./types";

const ASCII_ART = [
  "    .~.    ",
  "   /V V\\   ",
  "  // _ \\\\  ",
  " /.| |.\\ \\ ",
  " \\\\| |//  ",
  "  \\_/\\_/  ",
  "   {   }  ",
  "   `~'~'  ",
];

function renderInfoRow(label: string, value: string) {
  return (
    <div className="flex gap-1">
      <Accent>{label}:</Accent>
      <span className="text-foreground/60">{value}</span>
    </div>
  );
}

const neofetch: Command = {
  name: "neofetch",
  description: "System info with ASCII art",
  execute: (_args, ctx) => {
    const languageCount = skills.find((s) => s.label === "Languages")?.items.length ?? 0;

    return (
      <div className="flex gap-4 items-start">
        <pre className="text-muted-foreground-dim leading-tight shrink-0 hidden sm:block">
          {ASCII_ART.join("\n")}
        </pre>
        <div className="space-y-0.5">
          <div className="text-foreground/90">
            <Accent>po4yka</Accent>
            <span className="text-muted-foreground-dim">@po4yka.dev</span>
          </div>
          <div className="text-muted-foreground-dim">--------------</div>
          {renderInfoRow("OS", "macOS 15.2 arm64")}
          {renderInfoRow("Shell", "zsh 5.9")}
          {renderInfoRow("Terminal", "operator-console")}
          {renderInfoRow("Editor", "neovim")}
          {renderInfoRow("Theme", ctx.getTheme())}
          {renderInfoRow("Projects", String(projects.length))}
          {renderInfoRow("Posts", String(blogPosts.length))}
          {renderInfoRow("Roles", String(roles.length))}
          {renderInfoRow("Languages", String(languageCount))}
        </div>
      </div>
    );
  },
};

registerCommand(neofetch);
