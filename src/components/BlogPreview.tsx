import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { blogPosts } from "@/data/blogData";
import { Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function BlogPreview() {
  const { ref, inView } = useInView(0.1);
  const previewPosts = blogPosts.slice(0, 3);

  return (
    <MotionProvider>
    <section id="blog-preview" className="space-y-5">
      <Cmd>
        find <Accent>./posts/</Accent> -name "*.md" -mtime -30 | head -3
      </Cmd>

      <MacWindow title="recent posts" dimLights delay={0.05}>
        <div ref={ref} className="space-y-0">
          {previewPosts.map((post, i) => (
            <motion.a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0 -mx-2 px-2 font-mono rounded-[6px]"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.06, ease }}
              whileHover={{
                x: 4,
                backgroundColor: "rgba(139, 124, 246, 0.04)",
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }}
              whileTap={{ scale: 0.995 }}
            >
              {/* Date */}
              <span
                className="text-muted-foreground/30 shrink-0 pt-0.5 text-label"
                style={{ minWidth: "65px" }}
              >
                {post.date}
              </span>

              {/* Featured tag */}
              {post.featured && (
                <span className="shrink-0">
                  <Tag variant="highlight">new</Tag>
                </span>
              )}

              {/* Title — underline draw on hover */}
              <div className="flex-1 min-w-0 relative">
                <span
                  className="text-foreground/70 group-hover:text-foreground transition-colors duration-200 text-mono"
                >
                  {post.title}
                </span>
                {/* Animated underline */}
                <span
                  className="absolute bottom-0 left-0 right-0 h-[1px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                  style={{ backgroundColor: "var(--accent)", opacity: 0.3 }}
                />
              </div>
            </motion.a>
          ))}
        </div>
      </MacWindow>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <motion.a
          href="/blog"
          className="text-muted-foreground/40 hover:text-accent transition-colors duration-200 inline-block font-mono text-mono-sm"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97, x: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          $ find ./posts/ -name "*.md" — view all →
        </motion.a>
      </motion.div>
    </section>
    </MotionProvider>
  );
}
