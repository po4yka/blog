import type { BlogPost } from "@/components/blogData";

interface BlogPreviewPaneProps {
  form: BlogPost;
  readingTime: number;
}

export function BlogPreviewPane({ form, readingTime }: BlogPreviewPaneProps) {
  return (
    <div className="border border-border/50 bg-card p-6 md:p-8" style={{ borderRadius: "4px" }}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="font-mono text-muted-foreground" style={{ fontSize: "0.6875rem" }}>{form.date}</span>
        <span className="text-border">·</span>
        <span className="font-mono text-accent/60" style={{ fontSize: "0.6875rem" }}>{form.category}</span>
        <span className="text-border">·</span>
        <span className="font-mono text-muted-foreground/40" style={{ fontSize: "0.6875rem" }}>{readingTime} min read</span>
      </div>
      <h2 className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.25 }}>
        {form.title || "Untitled"}
      </h2>
      <p className="mt-3 text-foreground/50" style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>
        {form.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {form.tags.map((tag) => (
          <span
            key={tag}
            className="font-mono px-2 py-0.5 bg-secondary/60 text-foreground/50 border border-border/50"
            style={{ fontSize: "0.625rem", borderRadius: "2px" }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-6 border-t border-border/40 pt-6">
        {form.content.split("\n\n").map((para, i) => {
          const trimmed = para.trim();
          if (trimmed.startsWith("## "))
            return (
              <h3 key={i} className="mt-6 mb-3 text-foreground" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                {trimmed.replace("## ", "")}
              </h3>
            );
          if (trimmed.startsWith("- "))
            return (
              <ul key={i} className="mb-3 ml-4 space-y-1">
                {trimmed.split("\n").filter((l) => l.startsWith("- ")).map((l, j) => (
                  <li key={j} className="text-foreground/60 list-disc" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                    {l.replace("- ", "")}
                  </li>
                ))}
              </ul>
            );
          return (
            <p key={i} className="mb-3 text-foreground/60" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
}
