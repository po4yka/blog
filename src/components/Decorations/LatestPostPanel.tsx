import { blogPosts } from "@/data/blogData";
import { PanelShell } from "./_helpers";

export function LatestPostPanel({ delay = 0 }: { delay?: number }) {
  const latest = blogPosts[0];
  if (!latest) return null;

  return (
    <PanelShell label="LATEST POST" labelRight={latest.category} delay={delay}>
      <a
        href={`/blog/${latest.slug}`}
        className="block space-y-1 group px-5 py-3"
      >
        <p className="text-foreground/75 text-mono-sm group-hover:text-accent transition-colors duration-200 line-clamp-2">
          {latest.title}
        </p>
        <p className="text-muted-foreground/40 text-label">
          {latest.date}
        </p>
      </a>
    </PanelShell>
  );
}
