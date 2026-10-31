import { useState, useEffect, useRef, type ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowLeft } from "lucide-react";
import { Cmd, Em, LessViewer } from "@/components/Terminal";
import { ImageLightbox } from "@/components/ImageLightbox";
import { MotionProvider } from "@/components/MotionProvider";
import { useLocale, useSettings } from "@/stores/settingsStore";
import { useScrollState } from "@/hooks/useScrollState";
import { blogUrl, type Locale } from "@/lib/i18n";
import type { TocItem } from "@/lib/blog/toc";
import { countReadingMinutes } from "@/lib/blog/format";
import { CodeBlockCopy } from "./CodeBlockCopy";
import { MobileToc } from "./MobileToc";
import { PostFooter } from "./PostFooter";
import { PostHeader } from "./PostHeader";
import { PostPager } from "./PostPager";
import { Toc } from "./Toc";
import { useScrollSpy } from "./useScrollSpy";
import { useReadComplete } from "./useReadComplete";
import { useResumePosition } from "./useResumePosition";
import type { AdjacentPost, PostMeta, RelatedPost } from "./types";

interface BlogPostIslandProps {
  post: PostMeta;
  slug: string;
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
  related?: RelatedPost[];
  toc: TocItem[];
  children?: ReactNode;
  lang?: Locale;
}

// --- Pager status (LessViewer bottom bar) ---

// Mirrors what `less` itself reports at the bottom of the pane: filename
// plus percent-through-file, switching to "(END)" once fully scrolled.
function PagerStatus({ filename, percent }: { filename: string; percent: number }) {
  return (
    <>
      {filename} · {percent >= 100 ? "(END)" : `${percent}%`}
    </>
  );
}

// --- Main Component ---

export function BlogPostIsland({ post, slug, prev, next, related, toc, children, lang: langProp }: BlogPostIslandProps) {
  const { t } = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLElement>(null);
  const [readingTime, setReadingTime] = useState(post.readingTime ?? 0);

  const lang = langProp ?? "en";
  const listHref = blogUrl(lang);
  const { percent } = useScrollState();
  const { reduceMotion } = useSettings();
  const { saved: resumeAt, resume, dismiss: dismissResume } = useResumePosition(lang, slug, percent, reduceMotion);
  const activeId = useScrollSpy(toc, contentRef, tocRef);
  const tocLabel = t("blogPost.toc");

  useEffect(() => {
    if (!post.readingTime && contentRef.current) {
      setReadingTime(countReadingMinutes(contentRef.current.textContent || ""));
    }
  }, [post.readingTime]);

  useReadComplete(endRef, slug, lang);

  return (
    <MotionProvider>
      <div className="space-y-8">
        {/* Back */}
        {/* The link is the Reveal itself, so its line box (and the page layout)
            is unchanged; its transition list carries the opacity fade. */}
        <Reveal
          as="a"
          href={listHref}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-[color,text-decoration-color,opacity] duration-150 no-underline font-mono text-mono-sm"
        >
          <ArrowLeft size={12} />
          {t("blogPost.allPosts")}
        </Reveal>

        {/* Command */}
        <Cmd>
          less <Em>posts/{slug}.txt</Em>
        </Cmd>

        {resumeAt != null && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-mono-sm" role="status">
            <button
              type="button"
              onClick={resume}
              className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors duration-150 cursor-pointer min-h-[44px] sm:min-h-0 py-2 sm:py-0"
            >
              -- {t("blogPost.resumeAt")} {resumeAt}% --
            </button>
            <button
              type="button"
              onClick={dismissResume}
              aria-label={t("blogPost.resumeDismiss")}
              className="text-muted-foreground-dim hover:text-foreground transition-colors duration-150 cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}

        {/* File viewer */}
        <LessViewer
          filename={`posts/${slug}.txt`}
          meta={`${readingTime} ${t("blogPost.min")}`}
          delay={0.1}
          instant
          statusLine={<PagerStatus filename={`posts/${slug}.txt`} percent={percent} />}
        >
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-10">
          <article className="min-w-0">
            <PostHeader post={post} slug={slug} lang={lang} listHref={listHref} />

            {/* MDX Content rendered by Astro, passed as children */}
            <div
              ref={contentRef}
              className="prose-blog"
            >
              {children}
            </div>
            <ImageLightbox contentRef={contentRef} />
            <CodeBlockCopy contentRef={contentRef} />

            <PostFooter slug={slug} lang={lang} related={related} />
          </article>
          <Toc items={toc} activeId={activeId} label={tocLabel} progressRef={tocRef} />
          </div>
        </LessViewer>

        <div ref={endRef} aria-hidden="true" style={{ height: 1 }} />

        <PostPager prev={prev} next={next} lang={lang} listHref={listHref} />
      </div>
      {/* Outside the space-y-8 stack: as its last child, the hidden bar would give the pager a 2rem bottom margin. */}
      <MobileToc
        items={toc}
        activeId={activeId}
        label={tocLabel}
        openLabel={t("blogPost.tocOpen")}
        closeLabel={t("blogPost.tocClose")}
      />
    </MotionProvider>
  );
}
