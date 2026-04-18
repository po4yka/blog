import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Link2, ChevronUp } from "lucide-react";
import { Cmd, Accent, LessViewer, AnimatedCheck } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { duration } from "@/lib/motion";
import { useLocale } from "@/stores/settingsStore";
import { blogUrl, type Locale } from "@/lib/i18n";

interface PostMeta {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  readingTime?: number;
  isoDate?: string;
}

interface AdjacentPost {
  slug: string;
  title: string;
}

interface BlogPostIslandProps {
  post: PostMeta;
  slug: string;
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
  children?: ReactNode;
  lang?: Locale;
}

function estimateReadingTime(el: HTMLElement): number {
  const text = el.textContent || "";
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
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
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent">
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
    >
      {copied ? <><AnimatedCheck size={11} /> {t("blogPost.copied")}</> : <><Link2 size={11} /> {t("blogPost.copyLink")}</>}
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
    >
      <ChevronUp size={18} />
    </motion.button>
  );
}

// --- Main Component ---

export function BlogPostIsland({ post, slug, prev, next, children, lang: langProp }: BlogPostIslandProps) {
  const { t } = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const [readingTime, setReadingTime] = useState(post.readingTime ?? 0);

  const lang = langProp ?? "en";

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

  return (
    <MotionProvider>
      <ReadingProgress />
      <ScrollToTop />

      <div className="space-y-8">
        {/* Back */}
        <motion.a
          href={blogUrl(lang)}
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
                  <time dateTime={post.isoDate ?? post.date} className="text-foreground/80">
                    {post.date}
                  </time>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {t("blogPost.category")} <span className="text-foreground/80">{post.category}</span>
                </span>
              </div>
              {/* Tag list in header — semantic metadata placement */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-muted-foreground cursor-default font-mono text-label"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            {/* MDX Content rendered by Astro, passed as children */}
            <div
              ref={contentRef}
              className="prose-blog"
              style={{ maxWidth: "40rem" }}
            >
              {children}
            </div>

            {/* Footer — copy-link action */}
            <div
              className="mt-8 pt-4 border-t border-border flex flex-wrap items-center gap-3"
              style={{ maxWidth: "40rem" }}
            >
              <span className="flex-1" />
              <CopyLinkButton />
            </div>
          </article>
        </LessViewer>

        <div ref={endRef} aria-hidden />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 font-mono text-mono-sm">
          {prev ? (
            <a
              href={blogUrl(lang, prev.slug)}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline"
            >
              <ArrowLeft size={12} />
              {prev.title}
            </a>
          ) : <span />}
          {next ? (
            <a
              href={blogUrl(lang, next.slug)}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline"
            >
              {next.title}
              <ArrowRight size={12} />
            </a>
          ) : <span />}
        </div>
      </div>
    </MotionProvider>
  );
}
