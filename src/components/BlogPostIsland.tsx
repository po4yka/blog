import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Link2, ChevronUp, ArrowUp, FileCode2 } from "lucide-react";
import { Cmd, Accent, LessViewer, AnimatedCheck } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { duration } from "@/lib/motion";
import { useLocale } from "@/stores/settingsStore";
import { blogUrl, type Locale } from "@/lib/i18n";

interface PostMeta {
  title: string;
  date: string;
  isoDate?: string;
  isoDateModified?: string;
  summary: string;
  tags: string[];
  category: string;
  readingTime?: number;
}

interface AdjacentPost {
  slug: string;
  title: string;
  date: string;
}

interface RelatedPost {
  slug: string;
  title: string;
  date: string;
  isoDate?: string;
  category: string;
  summary: string;
}

interface BlogPostIslandProps {
  post: PostMeta;
  slug: string;
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
  related?: RelatedPost[];
  children?: ReactNode;
  lang?: Locale;
}

function estimateReadingTime(el: HTMLElement): number {
  const text = el.textContent || "";
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

// Format "2026-04-01" -> "Apr 2026".
function formatIsoDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 2) return iso;
  const year = parts[0];
  const monthNum = parseInt(parts[1] ?? "", 10);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return iso;
  return `${monthNames[monthNum - 1]} ${year}`;
}

// --- Reading progress ---

function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
        rafId.current = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <motion.div
        className="h-full"
        style={{ width: `${progress}%`, background: "var(--foreground)", opacity: 0.4 }}
      />
    </div>
  );
}

// --- Copy link ---

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard unavailable */ });
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 cursor-pointer font-mono text-label"
      title={t("blogPost.copyLink")}
      aria-label={t("blogPost.copyLink")}
    >
      {copied ? <><AnimatedCheck size={11} /> {t("blogPost.copied")}</> : <><Link2 size={11} /> {t("blogPost.copyLink")}</>}
    </button>
  );
}

// --- Copy as Markdown ---

function CopyMarkdownButton({ slug, lang }: { slug: string; lang: Locale }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const { t } = useLocale();

  const mdUrl = lang === "ru" ? `/blog/ru/${slug}.md` : `/blog/${slug}.md`;

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
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 cursor-pointer font-mono text-label"
      title={label}
      aria-label={label}
    >
      {state === "copied" ? <><AnimatedCheck size={11} /> {t("blogPost.copied")}</> : <><FileCode2 size={11} /> {label}</>}
    </button>
  );
}

// --- Scroll to top ---

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const lastCheck = useRef(0);
  const { t } = useLocale();

  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      if (now - lastCheck.current < 200) return;
      lastCheck.current = now;
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.button
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-2.5 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
      style={{
        borderRadius: "2px",
        marginBottom: "env(safe-area-inset-bottom)",
        marginRight: "env(safe-area-inset-right)",
      }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      title={t("blogPost.scrollToTop")}
      aria-label={t("blogPost.scrollToTop")}
    >
      <ChevronUp size={18} />
    </motion.button>
  );
}

// --- Main Component ---

export function BlogPostIsland({ post, slug, prev, next, related, children, lang: langProp }: BlogPostIslandProps) {
  const { t } = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const [readingTime, setReadingTime] = useState(post.readingTime ?? 0);

  const lang = langProp ?? "en";
  const listHref = blogUrl(lang);
  const tagsLabel = t("blogPost.tags");
  const relatedPosts = related ?? [];

  useEffect(() => {
    if (!post.readingTime && contentRef.current) {
      setReadingTime(estimateReadingTime(contentRef.current));
    }
  }, [post.readingTime]);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (firedRef.current) return;
        if (entries[0]?.isIntersecting) {
          firedRef.current = true;
          window.umami?.track("blog-read-complete", { slug, lang });
          observer.disconnect();
        }
      },
      { threshold: 1.0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [slug, lang]);

  const showUpdated =
    !!post.isoDateModified && post.isoDateModified !== post.isoDate;

  return (
    <MotionProvider>
      <ReadingProgress />
      <ScrollToTop />

      <div className="space-y-8">
        {/* Back */}
        <motion.a
          href={listHref}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline font-mono text-mono-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.base }}
        >
          <ArrowLeft size={12} />
          {t("blogPost.allPosts")}
        </motion.a>

        {/* Command */}
        <Cmd>
          less <Accent>posts/{slug}.txt</Accent>
        </Cmd>

        {/* File viewer */}
        <LessViewer
          filename={`posts/${slug}.txt`}
          meta={`${readingTime} ${t("blogPost.min")}`}
          delay={0.1}
        >
          <article>
            {/* Article header */}
            <header className="mb-10" style={{ maxWidth: "40rem" }}>
              <h1 className="display-2 text-foreground">
                {post.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 label-meta">
                <span>
                  {t("blogPost.author")} <span className="text-foreground font-medium">Nikita Pochaev</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {t("blogPost.date")}{" "}
                  <time
                    {...(post.isoDate ? { dateTime: post.isoDate } : {})}
                    className="text-foreground/80"
                  >
                    {post.date}
                  </time>
                </span>
                {showUpdated && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t("blogPost.updated")}{" "}
                      <time dateTime={post.isoDateModified} className="text-foreground/80">
                        {formatIsoDate(post.isoDateModified!)}
                      </time>
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>
                  {t("blogPost.category")} <span className="text-foreground/80">{post.category}</span>
                </span>
              </div>
              {/* Tag list in header — clickable, routes to list with ?tag= filter */}
              <ul
                role="list"
                aria-label={tagsLabel}
                className="mt-4 flex flex-wrap items-center gap-3 list-none m-0 p-0"
              >
                {post.tags.map((tag) => (
                  <li key={tag} role="listitem">
                    <a
                      href={`${listHref}?tag=${encodeURIComponent(tag)}`}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline font-mono text-label"
                    >
                      #{tag}
                    </a>
                  </li>
                ))}
              </ul>
            </header>

            {/* MDX Content rendered by Astro, passed as children */}
            <div
              ref={contentRef}
              className="prose-blog"
              style={{ maxWidth: "40rem" }}
            >
              {children}
            </div>

            {/* Footer — author micro-block + related posts */}
            <div className="mt-8 pt-4 border-t border-border space-y-6" style={{ maxWidth: "40rem" }}>
              {/* Author row */}
              <div className="space-y-2">
                <div className="font-sans text-[15px] leading-snug">
                  <span className="text-foreground font-medium">Nikita Pochaev</span>
                  <span className="text-muted-foreground"> — {t("blogPost.authorRole")}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-label">
                  <a
                    href="https://github.com/po4yka"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline"
                  >
                    github.com/po4yka
                  </a>
                  <a
                    href="https://linkedin.com/in/pochaev-nikita/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline"
                  >
                    linkedin.com/in/pochaev-nikita
                  </a>
                  <CopyLinkButton />
                  <CopyMarkdownButton slug={slug} lang={lang} />
                </div>
              </div>

              {/* Related posts */}
              {relatedPosts.length >= 2 && (
                <div className="space-y-3">
                  <div className="label-meta">{t("blogPost.related")}</div>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none m-0 p-0">
                    {relatedPosts.slice(0, 3).map((rp) => (
                      <li key={rp.slug}>
                        <a
                          href={blogUrl(lang, rp.slug)}
                          className="group block no-underline"
                        >
                          <div className="label-meta text-muted-foreground-dim">
                            {rp.category}
                          </div>
                          <div className="mt-1 font-sans text-[17px] leading-snug font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-150">
                            {rp.title}
                          </div>
                          <div className="mt-1 label-meta opacity-70">
                            {rp.isoDate ? (
                              <time dateTime={rp.isoDate}>{rp.date}</time>
                            ) : (
                              <span>{rp.date}</span>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        </LessViewer>

        <div ref={endRef} aria-hidden="true" style={{ height: 1 }} />

        {/* Navigation — three-slot: prev | back-to-index | next */}
        <div className="pt-4 font-mono text-mono-sm grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:items-start">
          {prev ? (
            <a
              href={blogUrl(lang, prev.slug)}
              title={prev.title}
              className="inline-flex flex-col gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline min-w-0 sm:justify-self-start"
            >
              <span className="label-meta inline-flex items-center gap-1">
                <ArrowLeft size={10} />
                {t("blogPost.previous")}
              </span>
              <span
                className="text-foreground/80 hover:text-foreground"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "14rem",
                }}
              >
                {prev.title}
              </span>
              <span className="label-meta opacity-70">{prev.date}</span>
            </a>
          ) : (
            <span />
          )}
          <a
            href={listHref}
            className="inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline sm:justify-self-center sm:self-center"
          >
            <ArrowUp size={12} />
            {t("blogPost.allPosts")}
          </a>
          {next ? (
            <a
              href={blogUrl(lang, next.slug)}
              title={next.title}
              className="inline-flex flex-col gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline min-w-0 sm:justify-self-end sm:text-right"
            >
              <span className="label-meta inline-flex items-center gap-1 sm:justify-end">
                {t("blogPost.next")}
                <ArrowRight size={10} />
              </span>
              <span
                className="text-foreground/80 hover:text-foreground"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "14rem",
                }}
              >
                {next.title}
              </span>
              <span className="label-meta opacity-70">{next.date}</span>
            </a>
          ) : (
            <span />
          )}
        </div>
      </div>
    </MotionProvider>
  );
}
