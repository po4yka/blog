import { registerCommand } from "./registry";
import { projects } from "@/components/projectsData";
import { blogPosts } from "@/components/blogData";
import { roles, skills } from "@/components/experienceData";
import { Accent } from "../primitives";
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

function InfoRow({ label, value }: { label: string; value: string }) {
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
        <pre className="text-accent/50 leading-tight shrink-0 hidden sm:block">
          {ASCII_ART.join("\n")}
        </pre>
        <div className="space-y-0.5">
          <div className="text-foreground/70">
            <Accent>po4yka</Accent>
            <span className="text-muted-foreground/30">@ghostty</span>
          </div>
          <div className="text-muted-foreground/20">--------------</div>
          <InfoRow label="OS" value="macOS 15.2 arm64" />
          <InfoRow label="Shell" value="zsh 5.9" />
          <InfoRow label="Terminal" value="Ghostty" />
          <InfoRow label="Editor" value="neovim" />
          <InfoRow label="Theme" value={ctx.getTheme()} />
          <InfoRow label="Projects" value={String(projects.length)} />
          <InfoRow label="Posts" value={String(blogPosts.length)} />
          <InfoRow label="Roles" value={String(roles.length)} />
          <InfoRow label="Languages" value={String(languageCount)} />
        </div>
      </div>
    );
  },
};

registerCommand(neofetch);
