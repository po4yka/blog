import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Link2, Check, ChevronUp } from "lucide-react";
import { blogPosts } from "../components/blogData";
import { Cmd, Accent, LessViewer } from "../components/Terminal";

const mono = "'JetBrains Mono', monospace";
const ease = [0.25, 0.46, 0.45, 0.94] as const;

// --- Helpers ---

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

function getAdjacentPosts(slug: string) {
  const idx = blogPosts.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? blogPosts[idx - 1] : null,
    next: idx < blogPosts.length - 1 ? blogPosts[idx + 1] : null,
  };
}

// --- Markdown-like content renderer ---

function renderInlineFormatting(text: string): string {
  return text
    .replace(
      /`([^`]+)`/g,
      '<code style="font-size: 0.85em; background: rgba(139,124,246,0.1); padding: 0.15em 0.4em; border-radius: 4px; color: #b4a6f6;">$1</code>'
    )
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong style="color: var(--foreground); font-weight: 500;">$1</strong>'
    )
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

interface ContentBlockData {
  type: "heading" | "paragraph" | "list-unordered" | "list-ordered" | "code" | "blockquote" | "separator";
  content: string;
  items?: string[];
  id?: string;
}

function parseContentBlocks(content: string): ContentBlockData[] {
  const blocks: ContentBlockData[] = [];
  const sections = content.split("\n\n");

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      const text = trimmed.replace("## ", "");
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      blocks.push({ type: "heading", content: text, id });
      continue;
    }
    if (trimmed === "---" || trimmed === "***") {
      blocks.push({ type: "separator", content: "" });
      continue;
    }
    if (trimmed.startsWith("```")) {
      const code = trimmed.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      blocks.push({ type: "code", content: code });
      continue;
    }
    if (trimmed.startsWith("- ")) {
      const items = trimmed.split("\n").filter((l) => l.trimStart().startsWith("- ")).map((l) => l.replace(/^\s*-\s/, ""));
      blocks.push({ type: "list-unordered", content: "", items });
      continue;
    }
    if (/^\d+\./.test(trimmed)) {
      const items = trimmed.split("\n").filter((l) => /^\s*\d+\./.test(l)).map((l) => l.replace(/^\s*\d+\.\s*/, ""));
      blocks.push({ type: "list-ordered", content: "", items });
      continue;
    }
    if (trimmed.startsWith("> ")) {
      const text = trimmed.split("\n").map((l) => l.replace(/^>\s?/, "")).join(" ");
      blocks.push({ type: "blockquote", content: text });
      continue;
    }
    blocks.push({ type: "paragraph", content: trimmed });
  }
  return blocks;
}

function ContentBlock({ block, index }: { block: ContentBlockData; index: number }) {
  switch (block.type) {
    case "heading":
      return (
        <motion.h2
          id={block.id}
          className="mt-10 mb-4 text-foreground/90 scroll-mt-20 cursor-default"
          style={{ fontSize: "1rem", fontWeight: 500 }}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 * index }}
          whileHover={{ x: 4, color: "var(--accent)" }}
        >
          {block.content}
        </motion.h2>
      );
    case "paragraph":
      return (
        <motion.p
          className="mb-4 text-foreground/65"
          style={{ fontSize: "0.875rem", lineHeight: 1.85 }}
          dangerouslySetInnerHTML={{ __html: renderInlineFormatting(block.content) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.03 * index }}
        />
      );
    case "list-unordered":
      return (
        <ul className="mb-4 space-y-1.5 pl-4">
          {block.items?.map((item, j) => (
            <motion.li
              key={j}
              className="text-foreground/60 list-disc marker:text-accent/40"
              style={{ fontSize: "0.875rem", lineHeight: 1.75 }}
              dangerouslySetInnerHTML={{ __html: renderInlineFormatting(item) }}
              whileHover={{ x: 3, color: "var(--foreground)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          ))}
        </ul>
      );
    case "list-ordered":
      return (
        <ol className="mb-4 space-y-1.5 pl-4">
          {block.items?.map((item, j) => (
            <motion.li
              key={j}
              className="text-foreground/60 list-decimal marker:text-muted-foreground/40"
              style={{ fontSize: "0.875rem", lineHeight: 1.75 }}
              dangerouslySetInnerHTML={{ __html: renderInlineFormatting(item) }}
              whileHover={{ x: 3, color: "var(--foreground)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          ))}
        </ol>
      );
    case "code":
      return (
        <motion.div
          className="mb-5 overflow-x-auto"
          style={{ background: "var(--secondary)", borderRadius: "8px", border: "1px solid var(--border)" }}
          whileHover={{ boxShadow: "var(--window-shadow-sm)" }}
          transition={{ duration: 0.2 }}
        >
          <pre className="p-4">
            <code className="text-foreground/70" style={{ fontSize: "0.8125rem", lineHeight: 1.65 }}>
              {block.content}
            </code>
          </pre>
        </motion.div>
      );
    case "blockquote":
      return (
        <motion.blockquote
          className="mb-4 pl-4"
          style={{ borderLeft: "2px solid var(--accent)", borderRadius: 0, opacity: 0.85 }}
          whileHover={{ borderLeftWidth: "3px", x: 2 }}
          transition={{ duration: 0.2 }}
        >
          <p
            className="text-foreground/50 italic"
            style={{ fontSize: "0.875rem", lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: renderInlineFormatting(block.content) }}
          />
        </motion.blockquote>
      );
    case "separator":
      return <hr className="my-8 border-t border-border/30" />;
    default:
      return null;
  }
}

function ArticleContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseContentBlocks(content), [content]);
  return (
    <div>
      {blocks.map((block, i) => (
        <ContentBlock key={i} block={block} index={i} />
      ))}
    </div>
  );
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
      className="inline-flex items-center gap-1.5 text-muted-foreground/40 hover:text-accent transition-colors duration-200 cursor-pointer"
      style={{ fontFamily: mono, fontSize: "0.6875rem" }}
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
      className="fixed bottom-8 right-8 z-50 p-2 bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors duration-200 cursor-pointer"
      style={{ borderRadius: "8px", boxShadow: "var(--window-shadow-sm)" }}
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

export function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="space-y-6 pt-10">
        <p className="text-destructive" style={{ fontFamily: mono, fontSize: "0.8125rem" }}>
          [ ERROR ] Post not found: {slug}
        </p>
        <motion.button
          onClick={() => navigate("/blog")}
          className="text-accent hover:text-accent/80 transition-colors cursor-pointer"
          style={{ fontFamily: mono, fontSize: "0.8125rem" }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          ← Back to blog
        </motion.button>
      </div>
    );
  }

  const readingTime = post.readingTime || estimateReadingTime(post.content);
  const { prev, next } = getAdjacentPosts(post.slug);

  return (
    <>
      <ReadingProgress />
      <ScrollToTop />

      <div className="space-y-8">
        {/* Back */}
        <motion.button
          onClick={() => navigate("/blog")}
          className="inline-flex items-center gap-1.5 text-muted-foreground/50 hover:text-accent transition-colors duration-200 cursor-pointer"
          style={{ fontFamily: mono, fontSize: "0.75rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft size={12} />
          All posts
        </motion.button>

        {/* Command */}
        <Cmd>
          less <Accent>posts/{post.slug}.txt</Accent>
        </Cmd>

        {/* File viewer */}
        <LessViewer
          filename={`posts/${post.slug}.txt`}
          meta={`${readingTime} min`}
          delay={0.1}
        >
          {/* Article header */}
          <div className="mb-8">
            <h1
              className="text-foreground"
              style={{
                fontFamily: mono,
                fontSize: "1.25rem",
                fontWeight: 500,
                lineHeight: 1.35,
              }}
            >
              {post.title}
            </h1>
            <div
              className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground/50"
              style={{ fontFamily: mono, fontSize: "0.75rem" }}
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

          {/* Content */}
          <ArticleContent content={post.content} />

          {/* Tags */}
          <div className="mt-8 pt-4 border-t border-border/30 flex flex-wrap items-center gap-3">
            {post.tags.map((tag) => (
              <motion.span
                key={tag}
                className="text-muted-foreground/40 cursor-default"
                style={{ fontFamily: mono, fontSize: "0.6875rem" }}
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
        <div className="flex items-center justify-between pt-4" style={{ fontFamily: mono, fontSize: "0.75rem" }}>
          {prev ? (
            <motion.button
              onClick={() => navigate(`/blog/${prev.slug}`)}
              className="inline-flex items-center gap-1.5 text-muted-foreground/40 hover:text-accent transition-colors duration-200 cursor-pointer"
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowLeft size={12} />
              {prev.title}
            </motion.button>
          ) : <span />}
          {next ? (
            <motion.button
              onClick={() => navigate(`/blog/${next.slug}`)}
              className="inline-flex items-center gap-1.5 text-muted-foreground/40 hover:text-accent transition-colors duration-200 cursor-pointer"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
            >
              {next.title}
              <ArrowRight size={12} />
            </motion.button>
          ) : <span />}
        </div>
      </div>
    </>
  );
}
