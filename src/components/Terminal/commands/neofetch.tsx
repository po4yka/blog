import { registerCommand } from "@/lib/commands";
import { projects } from "@/data/projectsData";
import { blogPostsMeta as blogPosts } from "@/data/blogMeta";
import { roles, skills } from "@/data/experienceData";
import { buildMeta } from "@/data/buildMeta";
import { Em } from "../ui";
import type { Command } from "@/lib/commands";

const ASCII_ART = [
  "┌──────────────┐",
  "│  ■  po4yka   │",
  "│  po4yka.dev  │",
  "└──────────────┘",
];

function renderInfoRow(label: string, value: string) {
  return (
    <div className="flex gap-1">
      <Em>{label}:</Em>
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
            <Em>po4yka</Em>
            <span className="text-muted-foreground-dim">@po4yka.dev</span>
          </div>
          <div className="text-muted-foreground-dim">--------------</div>
          {/* Every row comes from the build or the generated data, never a made-up machine. */}
          {renderInfoRow("Host", "Cloudflare Workers")}
          {renderInfoRow("Framework", `Astro ${buildMeta.astroVersion}`)}
          {renderInfoRow("Build", buildMeta.commitHash)}
          {renderInfoRow("Theme", ctx.getTheme())}
          {renderInfoRow("Projects", String(projects.length))}
          {/* One entry per language in the generated list: count slugs. */}
          {renderInfoRow("Posts", String(new Set(blogPosts.map((p) => p.slug)).size))}
          {renderInfoRow("Roles", String(roles.length))}
          {renderInfoRow("Languages", String(languageCount))}
        </div>
      </div>
    );
  },
};

registerCommand(neofetch);
