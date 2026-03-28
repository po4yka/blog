import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Link2, Check, ChevronUp } from "lucide-react";
import { Cmd, Accent, LessViewer } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

interface PostMeta {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  readingTime?: number;
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
      <motion.div className="h-full bg-accent/60" style={{ width: `${progress}%` }} />
    </div>
  );
}

// --- Copy link ---

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <motion.button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-muted-foreground/40 hover:text-accent transition-colors duration-200 cursor-pointer font-mono text-label"
      title="Copy link"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {copied ? <><Check size={11} /> Copied</> : <><Link2 size={11} /> Copy link</>}
    </motion.button>
  );
}

// --- Scroll to top ---

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const lastCheck = useRef(0);

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
      className="fixed bottom-8 right-8 z-50 p-2 bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors duration-200 cursor-pointer rounded-lg"
      style={{ boxShadow: "var(--window-shadow-sm)" }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      title="Scroll to top"
    >
      <ChevronUp size={14} />
    </motion.button>
  );
}

// --- Main Component ---

export function BlogPostIsland({ post, slug, prev, next, children }: BlogPostIslandProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [readingTime, setReadingTime] = useState(post.readingTime ?? 0);

  useEffect(() => {
    if (!post.readingTime && contentRef.current) {
      setReadingTime(estimateReadingTime(contentRef.current));
    }
  }, [post.readingTime]);

  return (
    <MotionProvider>
      <ReadingProgress />
      <ScrollToTop />

      <div className="space-y-8">
        {/* Back */}
        <motion.a
          href="/blog"
          className="inline-flex items-center gap-1.5 text-muted-foreground/50 hover:text-accent transition-colors duration-200 no-underline font-mono text-mono-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft size={12} />
          All posts
        </motion.a>

        {/* Command */}
        <Cmd>
          less <Accent>posts/{slug}.txt</Accent>
        </Cmd>

        {/* File viewer */}
        <LessViewer
          filename={`posts/${slug}.txt`}
          meta={`${readingTime} min`}
          delay={0.1}
        >
          {/* Article header */}
          <div className="mb-8">
            <h1
              className="text-foreground font-mono font-medium"
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.35,
              }}
            >
              {post.title}
            </h1>
            <div
              className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground/50 font-mono text-mono-sm"
            >
              <span>
                author <span className="text-accent/70">Nikita Pochaev</span>
              </span>
              <span>
                date <span className="text-foreground/60">{post.date}</span>
              </span>
              <span>
                category <span className="text-foreground/60">{post.category}</span>
              </span>
            </div>
          </div>

          {/* MDX Content rendered by Astro, passed as children */}
          <div
            ref={contentRef}
            className="prose-blog"
          >
            {children}
          </div>

          {/* Tags */}
          <div className="mt-8 pt-4 border-t border-border/30 flex flex-wrap items-center gap-3">
            {post.tags.map((tag) => (
              <motion.span
                key={tag}
                className="text-muted-foreground/40 cursor-default font-mono text-label"
                whileHover={{ color: "var(--accent)", scale: 1.05 }}
                transition={{ duration: 0.15 }}
              >
                #{tag}
              </motion.span>
            ))}
            <span className="flex-1" />
            <CopyLinkButton />
          </div>
        </LessViewer>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 font-mono text-mono-sm">
          {prev ? (
            <motion.a
              href={`/blog/${prev.slug}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground/40 hover:text-accent transition-colors duration-200 no-underline"
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowLeft size={12} />
              {prev.title}
            </motion.a>
          ) : <span />}
          {next ? (
            <motion.a
              href={`/blog/${next.slug}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground/40 hover:text-accent transition-colors duration-200 no-underline"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
            >
              {next.title}
              <ArrowRight size={12} />
            </motion.a>
          ) : <span />}
        </div>
      </div>
    </MotionProvider>
  );
}
