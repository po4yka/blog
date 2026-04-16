import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { blogPosts } from "@/data/blogData";
import { Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { useLocale } from "@/stores/settingsStore";
import { ease } from "@/lib/motion";

export function BlogPreview() {
  const { ref, inView } = useInView(0.1);
  const { t } = useLocale();
  const previewPosts = blogPosts.slice(0, 3);

  if (previewPosts.length === 0) return null;

  return (
    <MotionProvider>
    <section id="blog-preview" aria-labelledby="blog-heading" className="space-y-5">
      <h2 id="blog-heading" className="sr-only">{t("blogPreview.heading")}</h2>
      <Cmd>
        find <Accent>./posts/</Accent> -name "*.md" -mtime -30 | head -3
      </Cmd>

      <MacWindow title="recent posts" dimLights delay={0.05}>
        <div ref={ref} className="space-y-0">
          {previewPosts.map((post, i) => (
            <motion.a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex items-start gap-0 py-2.5 border-b border-border/50 last:border-b-0 -mx-2 px-2 font-mono rounded-[6px]"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.06, ease }}
              whileHover={{
                x: 4,
                backgroundColor: "var(--accent-4)",
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex-1 min-w-0">
                {/* Rank line: 001 │ date │ [tag] │ title */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    className="text-muted-foreground/35 shrink-0 text-mono-sm tabular-nums select-none"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span className="text-muted-foreground/25 shrink-0 text-mono-sm select-none" aria-hidden="true">│</span>
                  <span className="text-muted-foreground/40 shrink-0 text-label">{post.date}</span>
                  {post.featured && (
                    <>
                      <span className="text-muted-foreground/25 shrink-0 text-mono-sm select-none" aria-hidden="true">│</span>
                      <Tag variant="highlight">{t("blogPreview.new")}</Tag>
                    </>
                  )}
                  <span className="text-muted-foreground/25 shrink-0 text-mono-sm select-none" aria-hidden="true">│</span>
                  {/* Title — underline draw on hover */}
                  <div className="relative min-w-0">
                    <span className="text-foreground/70 group-hover:text-foreground transition-colors duration-200 text-mono">
                      {post.title}
                    </span>
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[1px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                      style={{ backgroundColor: "var(--accent)", opacity: 0.3 }}
                    />
                  </div>
                </div>
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
          aria-label={t("blogPreview.viewAllLabel")}
          className="text-muted-foreground/55 hover:text-accent transition-colors duration-200 inline-block font-mono text-mono-sm"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97, x: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {t("blogPreview.viewAll")}
        </motion.a>
      </motion.div>
    </section>
    </MotionProvider>
  );
}
