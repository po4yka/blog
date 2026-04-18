import { useState, useEffect } from "react";
import { PanelShell } from "./_helpers";
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

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Split a semver-ish tag "v2.3.1" into muted prefix + foreground body. */
function TagDisplay({ tag }: { tag: string }) {
  const match = tag.match(/^(v)(.+)$/i);
  if (!match) return <span className="text-foreground/90">{tag}</span>;
  return (
    <>
      <span className="text-muted-foreground-dim">{match[1]}</span>
      <span className="text-foreground/90">{match[2]}</span>
    </>
  );
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

  return (
    <PanelShell
      label="RELEASES"
      labelRight={
        <time
          dateTime={release.publishedAt}
          title={formatAbsolute(release.publishedAt)}
          className="text-muted-foreground-dim"
        >
          {relativeTime(release.publishedAt)}
        </time>
      }
      delay={delay}
    >
      <a
        href={release.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group px-5 py-3 relative"
        aria-label={`Open release ${release.tagName} on GitHub`}
      >
        <span
          aria-hidden="true"
          className="absolute top-3 right-5 text-label text-muted-foreground-dim group-hover:text-foreground transition-colors duration-150 select-none"
        >
          OPEN →
        </span>

        <div className="space-y-1.5 pr-14">
          <div className="flex items-baseline justify-between gap-4 min-w-0">
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">repo</span>
            <span className="text-foreground/90 text-mono-sm text-right truncate min-w-0">
              {release.repo}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4 min-w-0">
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">tag</span>
            <span className="text-mono-sm text-right truncate min-w-0">
              <TagDisplay tag={release.tagName} />
            </span>
          </div>
          {release.name && (
            <div className="flex items-baseline justify-between gap-4 min-w-0">
              <span className="text-muted-foreground/80 text-mono-sm shrink-0">name</span>
              <span className="text-muted-foreground text-mono-sm text-right truncate min-w-0">
                {release.name}
              </span>
            </div>
          )}
        </div>
      </a>
    </PanelShell>
  );
}
