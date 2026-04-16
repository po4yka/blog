// Lightweight i18n system for EN/RU site-wide translation.
// No framework needed -- just typed dictionaries and a lookup function.

export type Locale = "en" | "ru";
export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "ru"];

// --- Blog URL helpers ---

export function parsePostId(id: string): { lang: Locale; baseSlug: string } {
  const slash = id.indexOf("/");
  if (slash === -1) return { lang: "en", baseSlug: id };
  const prefix = id.slice(0, slash);
  const slug = id.slice(slash + 1);
  if (prefix === "en" || prefix === "ru") return { lang: prefix, baseSlug: slug };
  return { lang: "en", baseSlug: id };
}

export function blogUrl(locale: Locale, slug?: string): string {
  const base = locale === "ru" ? "/blog/ru" : "/blog";
  return slug ? `${base}/${slug}` : base;
}

// --- Translation dictionaries ---

const en = {
  // nav
  "nav.home": "home",
  "nav.projects": "projects",
  "nav.experience": "experience",
  "nav.blog": "blog",
  "nav.settings": "settings",
  "nav.online": "online",
  "nav.toggleMenu": "Toggle menu",
  "nav.switchTheme": "Switch theme",
  "nav.themeLabel": "Theme",

  // hero
  "hero.heading": "Nikita Pochaev -- AI Engineer & Senior Mobile Developer",
  "hero.name": "Nikita Pochaev",
  "hero.subtitle": "AI Engineer | Senior Mobile Developer — Android, Kotlin Multiplatform Mobile (KMM)",
  "hero.startingSession": "Starting session",
  "hero.detected": "detected",
  "hero.toolchainReady": "toolchain ready",
  "hero.initialized": "initialized",
  "hero.lastLogin": "Last login",
  "hero.infoName": "name",
  "hero.infoRole": "role",
  "hero.role": "AI Engineer & Senior Mobile Developer",
  "hero.infoHandle": "handle",
  "hero.infoFocus": "focus",
  "hero.focusValue": "AI/ML integration, Android, Kotlin Multiplatform Mobile,\nMobileOps, CI/CD, Release Automation",
  "hero.infoStatus": "status",
  "hero.statusValue": "open to collaboration \u00b7 building tools & apps",

  // about
  "about.heading": "About",
  "about.p1": "I'm a mobile engineer who cares equally about the code inside the app and the systems around it \u2014 build pipelines, release automation, developer tooling, and the invisible infrastructure that lets a team ship with confidence.",
  "about.p2prefix": "Most of my work is in Kotlin and Swift, with growing investment in",
  "about.p2kmp": "Kotlin Multiplatform",
  "about.p2suffix": "for sharing logic across platforms without sacrificing native feel. I like apps that are fast, reliable, and well-structured. I like teams that deploy often and debug rarely.",
  "about.p3": "Outside of code, I spend time reading about distributed systems, tinkering with build tooling, and occasionally writing about the things I learn along the way.",

  // projects (home section)
  "projects.heading": "Selected Projects",
  "projects.featured": "featured",
  "projects.viewAll": "$ ls ./projects/ \u2014 view all \u2192",
  "projects.viewAllLabel": "View all projects",

  // experience (home section)
  "experience.heading": "Experience",
  "experience.viewAll": "$ git log --author=po4yka \u2014 full history \u2192",

  // blog preview (home section)
  "blogPreview.heading": "Latest Posts",
  "blogPreview.new": "new",
  "blogPreview.viewAll": "$ find ./posts/ -name \"*.md\" \u2014 view all \u2192",
  "blogPreview.viewAllLabel": "View all blog posts",

  // links
  "links.comingSoon": "coming soon",
  "links.opensNewWindow": "opens in new window",

  // blog list
  "blog.all": "All",
  "blog.publishedPosts": "published posts \u2014 more queued",
  "blog.reading": "Reading",
  "blog.browseAll": "Browse all posts below",
  "blog.noPosts": "no posts found",
  "blog.postsTitle": "posts",

  // blog post
  "blogPost.allPosts": "All posts",
  "blogPost.min": "min",
  "blogPost.author": "author",
  "blogPost.date": "date",
  "blogPost.category": "category",
  "blogPost.copyLink": "Copy link",
  "blogPost.copied": "Copied",
  "blogPost.scrollToTop": "Scroll to top",

  // settings
  "settings.heading": "Settings",
  "settings.storedLocally": "Visitor preferences \u2014 stored locally",
  "settings.theme": "theme",
  "settings.dark": "dark",
  "settings.light": "light",
  "settings.system": "system",
  "settings.motion": "motion",
  "settings.motionFull": "full",
  "settings.motionReduced": "reduced",
  "settings.themeDesc": "controls color scheme. system follows your OS preference",
  "settings.motionDesc": "reduces animations and transitions across the site",
  "settings.fontSizeDesc": "adjusts base text size for readability",
  "settings.languageDesc": "sets the interface and content language",
  "settings.fontSize": "font_size",
  "settings.compact": "compact",
  "settings.default": "default",
  "settings.large": "large",
  "settings.language": "language",
  "settings.resetDefaults": "$ reset --defaults",
  "settings.defaultsRestored": "defaults restored",

  // 404
  "notFound.goHome": "Go home",
  "notFound.windowTitle": "error \u2014 404",
  "notFound.error": "Route not found \u2014 no matching endpoint for this path",
  "notFound.info": "Try navigating to a known route or return home",
  "notFound.pageNotFound": "Page not found",
  "notFound.goBack": "\u2190 cd ~",

  // keyboard shortcuts
  "shortcuts.title": "Keyboard Shortcuts",
  "shortcuts.navigation": "Navigation",
  "shortcuts.goHome": "Go to home",
  "shortcuts.goProjects": "Go to projects",
  "shortcuts.goExperience": "Go to experience",
  "shortcuts.goBlog": "Go to blog",
  "shortcuts.goSettings": "Go to settings",
  "shortcuts.sections": "Sections",
  "shortcuts.nextSection": "Next section",
  "shortcuts.prevSection": "Previous section",
  "shortcuts.utilities": "Utilities",
  "shortcuts.cycleTheme": "Cycle theme",
  "shortcuts.focusTerminal": "Focus terminal",
  "shortcuts.toggleHelp": "Toggle this help",
  "shortcuts.closeBlur": "Close / blur",
  "shortcuts.pressToClose": "Press ? to close",

  // footer
  "footer.shellHelp": "interactive shell -- try: help, ls posts/, cat meridian, open blog, neofetch",
  "footer.copyright": "Nikita Pochaev \u00b7 built with ghostty vibes",

  // experience page
  "experiencePage.positionsIndexed": "positions indexed",
  "experiencePage.sortedByDate": "Sorted by date, most recent first",
  "experiencePage.cvComingSoon": "$ wget po4yka.dev/cv.pdf \u2014 coming soon",
  "experiencePage.comingSoon": "coming soon",

  // projects page
  "projectsPage.entriesFound": "entries found",
  "projectsPage.clickToExpand": "Click any entry to expand details & links",
  "projectsPage.entries": "entries",

  // language switcher
  "lang.switchTo": "Switch language",
  "lang.en": "EN",
  "lang.ru": "RU",
  "lang.noTranslation": "This post is not yet available in Russian",
  "lang.viewOriginal": "View original",

  // meta
  "meta.title": "Nikita Pochaev \u2014 AI Engineer & Senior Mobile Developer",
  "meta.description": "AI Engineer and Senior Mobile Developer \u2014 Android, Kotlin Multiplatform Mobile (KMM). Shipping native mobile apps and integrating ML-powered features into production products.",

  // layout
  "layout.skipToContent": "Skip to main content",
} as const;

type TranslationKeys = Record<keyof typeof en, string>;

const ru: TranslationKeys = {
  // nav
  "nav.home": "\u0433\u043b\u0430\u0432\u043d\u0430\u044f",
  "nav.projects": "\u043f\u0440\u043e\u0435\u043a\u0442\u044b",
  "nav.experience": "\u043e\u043f\u044b\u0442",
  "nav.blog": "\u0431\u043b\u043e\u0433",
  "nav.settings": "\u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",
  "nav.online": "\u043e\u043d\u043b\u0430\u0439\u043d",
  "nav.toggleMenu": "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e",
  "nav.switchTheme": "\u0421\u043c\u0435\u043d\u0438\u0442\u044c \u0442\u0435\u043c\u0443",
  "nav.themeLabel": "\u0422\u0435\u043c\u0430",

  // hero
  "hero.heading": "\u041d\u0438\u043a\u0438\u0442\u0430 \u041f\u043e\u0447\u0430\u0435\u0432 -- AI-\u0438\u043d\u0436\u0435\u043d\u0435\u0440 \u0438 Senior Mobile Developer",
  "hero.name": "\u041d\u0438\u043a\u0438\u0442\u0430 \u041f\u043e\u0447\u0430\u0435\u0432",
  "hero.subtitle": "AI-\u0438\u043d\u0436\u0435\u043d\u0435\u0440 | Senior Mobile Developer \u2014 Android, Kotlin Multiplatform Mobile (KMM)",
  "hero.startingSession": "\u0417\u0430\u043f\u0443\u0441\u043a \u0441\u0435\u0441\u0441\u0438\u0438",
  "hero.detected": "\u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d",
  "hero.toolchainReady": "\u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u0433\u043e\u0442\u043e\u0432\u044b",
  "hero.initialized": "\u0438\u043d\u0438\u0446\u0438\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043e",
  "hero.lastLogin": "\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u0432\u0445\u043e\u0434",
  "hero.infoName": "\u0438\u043c\u044f",
  "hero.infoRole": "\u0440\u043e\u043b\u044c",
  "hero.role": "AI-\u0438\u043d\u0436\u0435\u043d\u0435\u0440 \u0438 Senior Mobile Developer",
  "hero.infoHandle": "\u043d\u0438\u043a",
  "hero.infoFocus": "\u0444\u043e\u043a\u0443\u0441",
  "hero.focusValue": "AI/ML-\u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438, Android, Kotlin Multiplatform Mobile,\nMobileOps, CI/CD, Release Automation",
  "hero.infoStatus": "\u0441\u0442\u0430\u0442\u0443\u0441",
  "hero.statusValue": "\u043e\u0442\u043a\u0440\u044b\u0442 \u043a \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u0447\u0435\u0441\u0442\u0432\u0443 \u00b7 \u0441\u043e\u0437\u0434\u0430\u044e \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u0438 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f",

  // about
  "about.heading": "\u041e\u0431\u043e \u043c\u043d\u0435",
  "about.p1": "\u042f \u043c\u043e\u0431\u0438\u043b\u044c\u043d\u044b\u0439 \u0438\u043d\u0436\u0435\u043d\u0435\u0440, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u043e\u0434\u0438\u043d\u0430\u043a\u043e\u0432\u043e \u0437\u0430\u0431\u043e\u0442\u0438\u0442\u0441\u044f \u043e \u043a\u043e\u0434\u0435 \u0432\u043d\u0443\u0442\u0440\u0438 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0438 \u043e \u0441\u0438\u0441\u0442\u0435\u043c\u0430\u0445 \u0432\u043e\u043a\u0440\u0443\u0433 \u043d\u0435\u0433\u043e \u2014 \u0441\u0431\u043e\u0440\u043a\u0430, \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u044f \u0440\u0435\u043b\u0438\u0437\u043e\u0432, \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0438 \u0438 \u043d\u0435\u0432\u0438\u0434\u0438\u043c\u0430\u044f \u0438\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430, \u043a\u043e\u0442\u043e\u0440\u0430\u044f \u043f\u043e\u0437\u0432\u043e\u043b\u044f\u0435\u0442 \u043a\u043e\u043c\u0430\u043d\u0434\u0435 \u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0442\u044c \u043f\u0440\u043e\u0434\u0443\u043a\u0442 \u0443\u0432\u0435\u0440\u0435\u043d\u043d\u043e.",
  "about.p2prefix": "\u0411\u043e\u043b\u044c\u0448\u0430\u044f \u0447\u0430\u0441\u0442\u044c \u043c\u043e\u0435\u0439 \u0440\u0430\u0431\u043e\u0442\u044b \u043d\u0430 Kotlin \u0438 Swift, \u0441 \u0440\u0430\u0441\u0442\u0443\u0449\u0438\u043c \u0432\u043b\u043e\u0436\u0435\u043d\u0438\u0435\u043c \u0432",
  "about.p2kmp": "Kotlin Multiplatform",
  "about.p2suffix": "\u0434\u043b\u044f \u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u044f \u043b\u043e\u0433\u0438\u043a\u0438 \u043c\u0435\u0436\u0434\u0443 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430\u043c\u0438 \u0431\u0435\u0437 \u043f\u043e\u0442\u0435\u0440\u0438 \u043d\u0430\u0442\u0438\u0432\u043d\u043e\u0433\u043e \u043e\u0449\u0443\u0449\u0435\u043d\u0438\u044f. \u041c\u043d\u0435 \u043d\u0440\u0430\u0432\u044f\u0442\u0441\u044f \u0431\u044b\u0441\u0442\u0440\u044b\u0435, \u043d\u0430\u0434\u0435\u0436\u043d\u044b\u0435 \u0438 \u0445\u043e\u0440\u043e\u0448\u043e \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f. \u041c\u043d\u0435 \u043d\u0440\u0430\u0432\u044f\u0442\u0441\u044f \u043a\u043e\u043c\u0430\u043d\u0434\u044b, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0434\u0435\u043f\u043b\u043e\u044f\u0442 \u0447\u0430\u0441\u0442\u043e \u0438 \u0434\u0435\u0431\u0430\u0436\u0430\u0442 \u0440\u0435\u0434\u043a\u043e.",
  "about.p3": "\u0412\u043d\u0435 \u043a\u043e\u0434\u0430 \u044f \u0447\u0438\u0442\u0430\u044e \u043f\u0440\u043e \u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u043d\u044b\u0435 \u0441\u0438\u0441\u0442\u0435\u043c\u044b, \u044d\u043a\u0441\u043f\u0435\u0440\u0438\u043c\u0435\u043d\u0442\u0438\u0440\u0443\u044e \u0441 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438 \u0441\u0431\u043e\u0440\u043a\u0438 \u0438 \u0438\u043d\u043e\u0433\u0434\u0430 \u043f\u0438\u0448\u0443 \u043e \u0442\u043e\u043c, \u0447\u0442\u043e \u0443\u0437\u043d\u0430\u044e \u043f\u043e \u043f\u0443\u0442\u0438.",

  // projects (home section)
  "projects.heading": "\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u043f\u0440\u043e\u0435\u043a\u0442\u044b",
  "projects.featured": "\u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435",
  "projects.viewAll": "$ ls ./projects/ \u2014 \u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0432\u0441\u0435 \u2192",
  "projects.viewAllLabel": "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0432\u0441\u0435 \u043f\u0440\u043e\u0435\u043a\u0442\u044b",

  // experience (home section)
  "experience.heading": "\u041e\u043f\u044b\u0442",
  "experience.viewAll": "$ git log --author=po4yka \u2014 \u043f\u043e\u043b\u043d\u0430\u044f \u0438\u0441\u0442\u043e\u0440\u0438\u044f \u2192",

  // blog preview (home section)
  "blogPreview.heading": "\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u043f\u043e\u0441\u0442\u044b",
  "blogPreview.new": "\u043d\u043e\u0432\u043e\u0435",
  "blogPreview.viewAll": "$ find ./posts/ -name \"*.md\" \u2014 \u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0432\u0441\u0435 \u2192",
  "blogPreview.viewAllLabel": "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0432\u0441\u0435 \u043f\u043e\u0441\u0442\u044b",

  // links
  "links.comingSoon": "\u0441\u043a\u043e\u0440\u043e",
  "links.opensNewWindow": "\u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0441\u044f \u0432 \u043d\u043e\u0432\u043e\u043c \u043e\u043a\u043d\u0435",

  // blog list
  "blog.all": "\u0412\u0441\u0435",
  "blog.publishedPosts": "\u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u043f\u043e\u0441\u0442\u043e\u0432 \u2014 \u0435\u0449\u0435 \u0432 \u043e\u0447\u0435\u0440\u0435\u0434\u0438",
  "blog.reading": "\u0427\u0442\u0435\u043d\u0438\u0435",
  "blog.browseAll": "\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0432\u0441\u0435 \u043f\u043e\u0441\u0442\u044b \u043d\u0438\u0436\u0435",
  "blog.noPosts": "\u043f\u043e\u0441\u0442\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b",
  "blog.postsTitle": "\u043f\u043e\u0441\u0442\u044b",

  // blog post
  "blogPost.allPosts": "\u0412\u0441\u0435 \u043f\u043e\u0441\u0442\u044b",
  "blogPost.min": "\u043c\u0438\u043d",
  "blogPost.author": "\u0430\u0432\u0442\u043e\u0440",
  "blogPost.date": "\u0434\u0430\u0442\u0430",
  "blogPost.category": "\u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f",
  "blogPost.copyLink": "\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443",
  "blogPost.copied": "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e",
  "blogPost.scrollToTop": "\u041d\u0430\u0432\u0435\u0440\u0445",

  // settings
  "settings.heading": "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",
  "settings.storedLocally": "\u041f\u0440\u0435\u0434\u043f\u043e\u0447\u0442\u0435\u043d\u0438\u044f \u043f\u043e\u0441\u0435\u0442\u0438\u0442\u0435\u043b\u044f \u2014 \u0445\u0440\u0430\u043d\u044f\u0442\u0441\u044f \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e",
  "settings.theme": "\u0442\u0435\u043c\u0430",
  "settings.dark": "\u0442\u0435\u043c\u043d\u0430\u044f",
  "settings.light": "\u0441\u0432\u0435\u0442\u043b\u0430\u044f",
  "settings.system": "\u0441\u0438\u0441\u0442\u0435\u043c\u043d\u0430\u044f",
  "settings.motion": "\u0430\u043d\u0438\u043c\u0430\u0446\u0438\u044f",
  "settings.motionFull": "\u043f\u043e\u043b\u043d\u0430\u044f",
  "settings.motionReduced": "\u0443\u043c\u0435\u043d\u044c\u0448\u0435\u043d\u043d\u0430\u044f",
  "settings.themeDesc": "\u0443\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u0442 \u0446\u0432\u0435\u0442\u043e\u0432\u043e\u0439 \u0441\u0445\u0435\u043c\u043e\u0439. \u0441\u0438\u0441\u0442\u0435\u043c\u043d\u0430\u044f \u0441\u043b\u0435\u0434\u0443\u0435\u0442 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430\u043c \u041e\u0421",
  "settings.motionDesc": "\u0443\u043c\u0435\u043d\u044c\u0448\u0430\u0435\u0442 \u0430\u043d\u0438\u043c\u0430\u0446\u0438\u0438 \u0438 \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u044b \u043d\u0430 \u0441\u0430\u0439\u0442\u0435",
  "settings.fontSizeDesc": "\u0440\u0435\u0433\u0443\u043b\u0438\u0440\u0443\u0435\u0442 \u0431\u0430\u0437\u043e\u0432\u044b\u0439 \u0440\u0430\u0437\u043c\u0435\u0440 \u0442\u0435\u043a\u0441\u0442\u0430 \u0434\u043b\u044f \u0443\u0434\u043e\u0431\u0441\u0442\u0432\u0430 \u0447\u0442\u0435\u043d\u0438\u044f",
  "settings.languageDesc": "\u0443\u0441\u0442\u0430\u043d\u0430\u0432\u043b\u0438\u0432\u0430\u0435\u0442 \u044f\u0437\u044b\u043a \u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u0438 \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430",
  "settings.fontSize": "\u0440\u0430\u0437\u043c\u0435\u0440_\u0448\u0440\u0438\u0444\u0442\u0430",
  "settings.compact": "\u043a\u043e\u043c\u043f\u0430\u043a\u0442\u043d\u044b\u0439",
  "settings.default": "\u043e\u0431\u044b\u0447\u043d\u044b\u0439",
  "settings.large": "\u043a\u0440\u0443\u043f\u043d\u044b\u0439",
  "settings.language": "\u044f\u0437\u044b\u043a",
  "settings.resetDefaults": "$ reset --defaults",
  "settings.defaultsRestored": "\u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0441\u0431\u0440\u043e\u0448\u0435\u043d\u044b",

  // 404
  "notFound.goHome": "\u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e",
  "notFound.windowTitle": "\u043e\u0448\u0438\u0431\u043a\u0430 \u2014 404",
  "notFound.error": "\u041c\u0430\u0440\u0448\u0440\u0443\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d \u2014 \u043d\u0435\u0442 \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u0433\u043e \u044d\u043d\u0434\u043f\u043e\u0438\u043d\u0442\u0430 \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u043f\u0443\u0442\u0438",
  "notFound.info": "\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u0435\u0440\u0435\u0439\u0442\u0438 \u043d\u0430 \u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u0438\u043b\u0438 \u0432\u0435\u0440\u043d\u0438\u0442\u0435\u0441\u044c \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e",
  "notFound.pageNotFound": "\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430",
  "notFound.goBack": "\u2190 cd ~",

  // keyboard shortcuts
  "shortcuts.title": "\u0413\u043e\u0440\u044f\u0447\u0438\u0435 \u043a\u043b\u0430\u0432\u0438\u0448\u0438",
  "shortcuts.navigation": "\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f",
  "shortcuts.goHome": "\u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e",
  "shortcuts.goProjects": "\u041a \u043f\u0440\u043e\u0435\u043a\u0442\u0430\u043c",
  "shortcuts.goExperience": "\u041a \u043e\u043f\u044b\u0442\u0443",
  "shortcuts.goBlog": "\u041a \u0431\u043b\u043e\u0433\u0443",
  "shortcuts.goSettings": "\u041a \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430\u043c",
  "shortcuts.sections": "\u0420\u0430\u0437\u0434\u0435\u043b\u044b",
  "shortcuts.nextSection": "\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0440\u0430\u0437\u0434\u0435\u043b",
  "shortcuts.prevSection": "\u041f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0438\u0439 \u0440\u0430\u0437\u0434\u0435\u043b",
  "shortcuts.utilities": "\u0423\u0442\u0438\u043b\u0438\u0442\u044b",
  "shortcuts.cycleTheme": "\u0421\u043c\u0435\u043d\u0438\u0442\u044c \u0442\u0435\u043c\u0443",
  "shortcuts.focusTerminal": "\u0424\u043e\u043a\u0443\u0441 \u043d\u0430 \u0442\u0435\u0440\u043c\u0438\u043d\u0430\u043b",
  "shortcuts.toggleHelp": "\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c/\u0441\u043a\u0440\u044b\u0442\u044c \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0443",
  "shortcuts.closeBlur": "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
  "shortcuts.pressToClose": "\u041d\u0430\u0436\u043c\u0438\u0442\u0435 ? \u0447\u0442\u043e\u0431\u044b \u0437\u0430\u043a\u0440\u044b\u0442\u044c",

  // footer
  "footer.shellHelp": "\u0438\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0439 \u0442\u0435\u0440\u043c\u0438\u043d\u0430\u043b -- \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435: help, ls posts/, cat meridian, open blog, neofetch",
  "footer.copyright": "\u041d\u0438\u043a\u0438\u0442\u0430 \u041f\u043e\u0447\u0430\u0435\u0432 \u00b7 \u0441\u0434\u0435\u043b\u0430\u043d\u043e \u0441 ghostty vibes",

  // experience page
  "experiencePage.positionsIndexed": "\u043f\u043e\u0437\u0438\u0446\u0438\u0439 \u043f\u0440\u043e\u0438\u043d\u0434\u0435\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043e",
  "experiencePage.sortedByDate": "\u041e\u0442\u0441\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u043e \u043f\u043e \u0434\u0430\u0442\u0435, \u043d\u043e\u0432\u044b\u0435 \u0441\u043d\u0430\u0447\u0430\u043b\u0430",
  "experiencePage.cvComingSoon": "$ wget po4yka.dev/cv.pdf \u2014 \u0441\u043a\u043e\u0440\u043e",
  "experiencePage.comingSoon": "\u0441\u043a\u043e\u0440\u043e",

  // projects page
  "projectsPage.entriesFound": "\u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043d\u0430\u0439\u0434\u0435\u043d\u043e",
  "projectsPage.clickToExpand": "\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043d\u0430 \u0437\u0430\u043f\u0438\u0441\u044c \u0434\u043b\u044f \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u043e\u0441\u0442\u0435\u0439 \u0438 \u0441\u0441\u044b\u043b\u043e\u043a",
  "projectsPage.entries": "\u0437\u0430\u043f\u0438\u0441\u0435\u0439",

  // language switcher
  "lang.switchTo": "\u0421\u043c\u0435\u043d\u0438\u0442\u044c \u044f\u0437\u044b\u043a",
  "lang.en": "EN",
  "lang.ru": "RU",
  "lang.noTranslation": "\u042d\u0442\u043e\u0442 \u043f\u043e\u0441\u0442 \u043f\u043e\u043a\u0430 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u043d\u0430 \u0440\u0443\u0441\u0441\u043a\u043e\u043c",
  "lang.viewOriginal": "\u0427\u0438\u0442\u0430\u0442\u044c \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b",

  // meta
  "meta.title": "\u041d\u0438\u043a\u0438\u0442\u0430 \u041f\u043e\u0447\u0430\u0435\u0432 \u2014 AI-\u0438\u043d\u0436\u0435\u043d\u0435\u0440 \u0438 Senior Mobile Developer",
  "meta.description": "AI-\u0438\u043d\u0436\u0435\u043d\u0435\u0440 \u0438 Senior Mobile Developer \u2014 Android, Kotlin Multiplatform Mobile (KMM). \u041d\u0430\u0442\u0438\u0432\u043d\u044b\u0435 \u043c\u043e\u0431\u0438\u043b\u044c\u043d\u044b\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0438 ML-\u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438 \u0432 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0430\u0445.",

  // layout
  "layout.skipToContent": "\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043a \u043e\u0441\u043d\u043e\u0432\u043d\u043e\u043c\u0443 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u043c\u043e\u043c\u0443",
};

const dictionaries: Record<Locale, TranslationKeys> = { en, ru };

export type TranslationKey = keyof typeof en;

export function t(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale]?.[key] ?? en[key];
}
