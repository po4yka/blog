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
    isoDate: "2026-06-01",
    isoDateModified: "2026-06-01",
    wordCount: 2706,
    summary:
      "A phone connects over Wi-Fi but not mobile data, and the same connections die every time. RIPDPI diagnoses the network path before it touches anything: a fat-header probe, a failure class, a verdict -- then a fix, only if one exists.",
    tags: ["DPI", "Network Diagnostics", "Rust", "Android"],
    category: "Networking",
    featured: false,
  },
  {
    slug: "network-isnt-broken-just-here",
    lang: "ru",
    title: "Сброс конкретных соединений при исправной сети: точечная диагностика",
    date: "Jun 2026",
    isoDate: "2026-06-01",
    isoDateModified: "2026-06-01",
    wordCount: 270,
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
    isoDate: "2026-04-01",
    isoDateModified: "2026-04-01",
    wordCount: 4281,
    summary:
      "Plain RAG has a geometric ceiling most benchmarks never probe. An LLM Wiki compiles the corpus once instead of re-retrieving on every query -- here is what breaks when you build one.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
  },
  {
    slug: "rag-breaks-earlier-than-people-think",
    lang: "ru",
    title: "RAG ломается раньше, чем кажется",
    date: "Apr 2026",
    isoDate: "2026-04-01",
    isoDateModified: "2026-04-01",
    wordCount: 382,
    summary:
      "У обычного RAG есть геометрический потолок, до которого большинство бенчмарков не добираются. LLM Wiki компилирует корпус один раз вместо повторного поиска на каждый запрос -- вот что ломается, когда её строишь.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
  },
];

export const categories = ["All", "Networking", "Architecture"];
