import { useState, useCallback } from "react";
import { Link2, FileCode2 } from "lucide-react";
import { AnimatedCheck } from "@/components/Terminal";
import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";
import { markdownUrl } from "@/lib/blog/format";

const COPY_BTN_CLASS =
  "inline-flex items-center gap-1.5 py-3 -my-3 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 cursor-pointer font-mono text-label";

// --- Copy link ---

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard unavailable */ });
  }, []);

  return (
    <>
      <button onClick={handleCopy} className={COPY_BTN_CLASS}>
        {copied ? <><AnimatedCheck size={11} /> {t("blogPost.copied")}</> : <><Link2 size={11} /> {t("blogPost.copyLink")}</>}
      </button>
      <span role="status" className="sr-only">{copied ? t("blogPost.copied") : ""}</span>
    </>
  );
}

// --- Copy as Markdown ---

export function CopyMarkdownButton({ slug, lang }: { slug: string; lang: Locale }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const { t } = useLocale();

  const mdUrl = markdownUrl(slug, lang);

  const handleCopy = useCallback(async () => {
    try {
      const res = await fetch(mdUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const markdown = await res.text();
      await navigator.clipboard.writeText(markdown);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [mdUrl]);

  const label = state === "error" ? t("blogPost.copyMarkdownFail") : t("blogPost.copyMarkdown");

  return (
    <>
      <button onClick={handleCopy} className={COPY_BTN_CLASS}>
        {state === "copied" ? <><AnimatedCheck size={11} /> {t("blogPost.copied")}</> : <><FileCode2 size={11} /> {label}</>}
      </button>
      <span role="status" className="sr-only">
        {state === "copied" ? t("blogPost.copied") : state === "error" ? t("blogPost.copyMarkdownFail") : ""}
      </span>
    </>
  );
}
