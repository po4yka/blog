import { useState, useEffect } from "react";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
import { InfoTable } from "@/components/Terminal";
import { deferIdle } from "./_utils";
import type { GitHubLatestRelease } from "@/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function LatestReleasePanel({ delay = 0 }: { delay?: number }) {
  const [release, setRelease] = useState<GitHubLatestRelease | null | undefined>(
    undefined,
  );

  useEffect(() => {
    // Defer decorative fetch off the critical path so it does not race LCP.
    return deferIdle(() => {
      fetch("/api/github/latest-release")
        .then((r) => r.json())
        .then((d: GitHubLatestRelease | null) => setRelease(d))
        .catch(() => setRelease(null));
    });
  }, []);

  if (!release?.url) return null;

  const rows = [
    { label: "repo", value: <span className="text-foreground">{release.repo}</span> },
    {
      label: "tag",
      value: <span className="text-foreground">{release.tagName}</span>,
    },
    ...(release.name
      ? [{ label: "name", value: <span className="text-muted-foreground">{release.name}</span> }]
      : []),
    {
      label: "url",
      value: (
        <a
          href={release.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-2 block break-all transition-colors duration-150"
          title={release.url.replace("https://github.com/", "")}
        >
          {release.url.replace("https://github.com/", "")}
        </a>
      ),
    },
  ];

  return (
    <MotionProvider>
      <PanelShell
        label="releases"
        labelRight={relativeTime(release.publishedAt)}
        delay={delay}
      >
        <div className="px-5 py-3.5">
          <InfoTable rows={rows} delay={delay + 0.08} />
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
