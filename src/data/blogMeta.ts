// Auto-generated from MDX content files. Do not edit manually.
// Run "npm run generate:blog" to regenerate.
// Metadata only (no post bodies) -- safe to import from client islands.
import type { BlogPostMeta } from "@/types";

export type { BlogPostMeta };

export const blogPostsMeta: BlogPostMeta[] = [
  {
    slug: "network-isnt-broken-just-here",
    lang: "en",
    title: "The Network Isn't Broken Everywhere, Just Here: Diagnosing One Connection at a Time",
    date: "Jun 2026",
    isoDate: "2026-06-19",
    isoDateModified: "2026-11-03",
    wordCount: 3220,
    outline: "p27 h2 p22 c9 f14 p3 c6 p20 f14 p22 f14 h2 p27 f14 p44 h2 p22 f14 h2 p48 h2 p6 f14 p21",
    summary:
      "A phone connects over Wi-Fi but not mobile data, and the same connections die every time. RIPDPI diagnoses the network path before it touches anything: a fat-header probe, a failure class, a verdict — then a fix, only if one exists.",
    tags: ["DPI", "Network Diagnostics", "Rust", "Android"],
    category: "Networking",
    featured: false,
  },
  {
    slug: "network-isnt-broken-just-here",
    lang: "ru",
    title: "Сброс конкретных соединений при исправной сети: точечная диагностика",
    date: "Jun 2026",
    isoDate: "2026-06-19",
    isoDateModified: "2026-11-03",
    wordCount: 2687,
    outline: "p23 h2 p19 c9 f14 p3 c6 p15 f14 p18 f14 h2 p21 f14 p39 h2 p18 f14 h2 p41 h2 p6 f14 p19",
    summary:
      "Телефон подключается по Wi-Fi, но не по мобильной сети, и отваливаются всегда одни и те же соединения. RIPDPI сначала диагностирует сетевой путь — проба, класс отказа, вердикт — и только потом что-то чинит, если есть чем.",
    tags: ["DPI", "Network Diagnostics", "Rust", "Android"],
    category: "Networking",
    featured: false,
  },
  {
    slug: "rag-breaks-earlier-than-people-think",
    lang: "en",
    title: "RAG breaks earlier than people think",
    date: "Apr 2026",
    isoDate: "2026-04-15",
    isoDateModified: "2026-11-03",
    wordCount: 4606,
    outline: "h2 p25 f14 p63 h2 p8 l8 f14 p43 f14 p13 h3 p12 h3 p11 h3 p8 h2 p5 h3 p5 h3 p5 h3 p8 h3 p8 f14 h2 p40 h2 p109 h2 p25",
    summary:
      "Plain RAG has a geometric ceiling most benchmarks never probe. An LLM Wiki compiles the corpus once instead of re-retrieving on every query — here is what breaks when you build one.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
  },
  {
    slug: "rag-breaks-earlier-than-people-think",
    lang: "ru",
    title: "RAG ломается раньше, чем кажется",
    date: "Apr 2026",
    isoDate: "2026-04-15",
    isoDateModified: "2026-11-03",
    wordCount: 4117,
    outline: "h2 p23 f14 p56 h2 p7 l8 f14 p27 f14 p24 h3 p11 h3 p10 h3 p8 h2 p4 h3 p5 h3 p5 h3 p8 h3 p11 f14 h2 p36 h2 p91 h2 p22",
    summary:
      "У обычного RAG есть геометрический потолок, до которого большинство бенчмарков не добираются. LLM Wiki компилирует корпус один раз вместо повторного поиска на каждый запрос — вот что ломается, когда её строишь.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
  },
];

export const categories = ["All", "Networking", "Architecture"];
