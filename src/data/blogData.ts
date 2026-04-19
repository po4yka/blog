// Auto-generated from MDX content files. Do not edit manually.
// Run "npm run generate:blog" to regenerate.
import type { BlogPost } from "@/types";

export type { BlogPost };

export const blogPosts: BlogPost[] = [
  {
    slug: "rag-breaks-earlier-than-people-think",
    lang: "en",
    title: "RAG breaks earlier than people think",
    date: "Apr 2026",
    isoDate: "2026-04-01",
    isoDateModified: "2026-04-01",
    wordCount: 4291,
    summary:
      "Plain RAG has a geometric ceiling most benchmarks never probe. An LLM Wiki compiles the corpus once instead of re-retrieving on every query -- here is what breaks when you build one.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
    content: `## 1. RAG breaks earlier than people think

You can feel the ceiling before you can measure it. At a few hundred thousand documents, a well-tuned vector index starts returning near-misses on queries it answered perfectly at a few thousand. You add a reranker and the top-1 moves back. You add hybrid search and the long tail gets better. Then you keep growing and the failures come back. Same kind, just harder to reproduce. Most teams read this as tuning work. Weller et al. (ICLR 2026) offer a different explanation: a single-vector retriever has a representational ceiling, and past it no amount of downstream cleverness compensates.

My own stack hit that ceiling before I could read the explanation for it, and the wiki that replaced it started as a reaction rather than a plan.

Part 1 walks the places plain RAG breaks, with citations. Part 2 is the architectural alternative -- Karpathy's LLM Wiki -- and why it reframes the pipeline around compilation rather than retrieval. Part 3 is other systems doing the same move in different shapes (memory agents, graph RAG, HippoRAG). Part 4 is where the wiki is the wrong answer. Part 5 is what breaks first when you actually build one, from shipping a vault for an AI infrastructure team.

Weller et al. ([arXiv:2508.21038](https://arxiv.org/abs/2508.21038), ICLR 2026) state the ceiling as an inequality. For a corpus of $n$ documents with top-$k$ queries and score margin $\\gamma$, the embedding dimension $d$ must satisfy $d \\geq \\frac{\\log \\binom{n}{k}}{\\log(1 + 1/\\gamma)}$. Below that bound, some top-$k$ combinations are representationally unreachable in the vector space. The bound works in one direction only: if the embedding dimension sits below the threshold for a given corpus size, no reranker, hybrid search, or prompt engineering recovers the missing combinations. The geometry is already wrong.

The failures that follow cluster into three layers. Geometry (the ceiling above) is structural: no tuning moves it. Chunking and context utilisation are budget problems: careful preprocessing helps, but the budgets themselves are shrinking. Attention and hard negatives are generator failures: better prompts help, until the prompts stop mattering. Geometry can't be tuned away. The other two layers respond to engineering effort.

<picture>
  <source srcset="/images/blog/rag-breaks-earlier-than-people-think/01-rag-failure-layers.en.dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/images/blog/rag-breaks-earlier-than-people-think/01-rag-failure-layers.en.light.png" alt="Log-log chart plotting usable corpus size against embedding dimension. Weller et al. empirical fit (coral line) passes through two labeled anchor points: d=768 with n≈1.7M documents (open-weights default) and d=4096 with n≈250M (current frontier). Shaded unreachable region above the line. Formula at top: d ≥ log C(n,k) / log(1+1/γ). Benchmark strip reports LIMIT (50K docs, 1K queries) with E5-Mistral, GritLM, Qwen3 below 20% Recall@100 at d=4096 while BM25 hits 97.8% Recall@2; GTE-ModernColBERT (vector-per-token) recovers 54.8% on the same set." />
</picture>

*Figure 1. Weller et al.'s empirical fit across seven single-vector retrievers. The two anchor points -- d=768 and d=4096 -- trace the usable-corpus frontier. Above the curve, some top-k rankings cannot be represented at that dimension; reranking and hybrid search do not move it.*

The empirical fit across seven models puts the usable corpus ceiling around 250 million documents at 4096 dimensions, and around 1.7 million at 768, still the common open-weights default. Above those sizes, some top-$k$ sets sit outside the span of any vector the retriever can produce.

Most benchmarks live inside those budgets and never probe the edge. LIMIT does. Fifty thousand documents, one thousand queries, sentences like "Jon likes apples". E5-Mistral, GritLM, Qwen3 (the 2025 state of the art) land below 20% Recall@100 at 4096 dimensions on that set. BM25 hits 97.8% Recall@2. GTE-ModernColBERT, which keeps a vector per token rather than one per document, hits 54.8%. The failure sits in the single-vector geometry. A training-time embedding represents only a finite number of distinct top-$k$ sets, and when a query lands outside that set, nothing further in the pipeline compensates.

Chunking matters about as much as the model choice. Vectara's 2025 study ([arXiv:2410.13070](https://arxiv.org/abs/2410.13070)) asks whether semantic chunking justifies its cost and finds that in most settings it doesn't beat fixed-size chunking on F1@5 -- the retrieval wins on recall, the generator loses on local context, and the two cancel. The failure is the common one: chunks small enough to retrieve precisely are too small for the generator to answer from.

Over half the retrieved snippets can be dropped without harming answer quality ([arXiv:2511.17908](https://arxiv.org/abs/2511.17908)). Prior work the paper builds on -- RULER and the Context Rot studies -- pegs the useful slice of a 128k-token context at 10-20% of what's nominally there. The model skims.

Position bias is architectural. The MIT analysis in [arXiv:2502.01951](https://arxiv.org/abs/2502.01951) sketches the mechanism: causal masking accumulates attention on early tokens through every layer, and rotary positional embeddings add a long-term decay to the score. Independent empirical work on long contexts (RULER, Context Rot) confirms the shape in practice -- middle-of-context evidence is under-weighted, and longer windows don't buy more attention; the extra tokens land in the zone the model already skips.

Hard-negative documents (the near-miss cases a good retriever is designed to surface) degrade end-to-end accuracy; [arXiv:2401.14887](https://arxiv.org/abs/2401.14887) shows the mirror-image result, that random unrelated documents improve accuracy by up to 35%. The U-curve of answer quality against retrieved chunk count is OP-RAG's core finding ([arXiv:2409.01666](https://arxiv.org/abs/2409.01666)). Fixing one failure mode surfaces the next.

Contextual Retrieval rewrites chunks with surrounding context before embedding: 35% failure reduction for embeddings alone, 49% when paired with BM25, 67% with a reranker on top. GraphRAG prioritises query-focused summarisation at indexing costs high enough that Microsoft itself shipped LazyGraphRAG as a cheaper follow-up, matching quality at roughly 1/700 the per-query cost. Self-RAG and CRAG move retrieval policy into the model itself. None of them change the basic loop: embed, search, read, generate, repeat. Once per question, paying the full cost again.

RAG is the correct first answer to "how do I ground an LLM in my data." For a prototype, a proof of concept, a first integration, it works cheaply and buys you the shape of the problem. It breaks once you try to run a product on it. The embed-search-read-generate loop pays the full retrieval cost on every question and caps out where the geometry does, so scaling the loop scales the bill without moving the ceiling.

Two branches. One keeps optimising the query-time loop: better rerankers, late interaction, hybrid search, learned retrieval policies. Most public work is there. The other compiles the corpus once into something the model can read directly. Pay the work upfront, when the source comes in.

All of these failures share one assumption: the corpus stays raw, and the model re-derives its understanding of it on every query. The alternative is to compile the corpus once, into an artefact the model can read directly, and pay the cost at ingest instead of at query time. Karpathy posted a gist in April 2026 calling this second branch an **LLM Wiki**. What follows is what that means architecturally, and three very different systems that have already shipped it.

## 2. The wiki reframes the loop

> The wiki is a persistent, compounding artifact. Instead of just retrieving from raw documents at query time, the LLM incrementally builds and maintains a persistent wiki.

I read this the first time on a Sunday and reread it twice looking for where the hard part was. The mechanics fit on one page.

The wiki has three layers.

- **Raw sources** at the bottom: PDFs, transcripts, pasted notes, web clips. Immutable once saved.
- **The wiki** in the middle: markdown pages the LLM writes, one per concept or decision, linked with wikilinks.
- **The schema** on top: CLAUDE.md, AGENTS.md, whatever file states what the wiki is for. The LLM reads it before every action.

<picture>
  <source srcset="/images/blog/rag-breaks-earlier-than-people-think/02-wiki-three-layers.en.dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/images/blog/rag-breaks-earlier-than-people-think/02-wiki-three-layers.en.light.png" alt="Architecture diagram. Central three-layer wiki stack: L3 Schema (CLAUDE.md, AGENTS.md, frontmatter spec; human-authored, read before every action), L2 Wiki pages (coral focal; LLM-written markdown, wikilinks, compiled; ~10-15 pages edited per ingest), L1 Raw sources (PDFs, transcripts, clips; content-hashed, immutable). Four operations orbit the stack: Source drop on the left feeds L1 (labeled DROP), Ingest on top writes L2 (WRITES), Query on the right reads L2 (READS) with a dashed return arrow APPENDS, Lint at the bottom audits L2 (AUDITS)." />
</picture>

*Figure 2. The wiki with its four operations. Ingest writes the middle layer; Query reads it; Lint audits it. Source drops feed L1; Schema directs every action from above. The focal L2 is the only layer every operation touches.*

**Ingest** does the actual rewriting. A source comes in, the LLM reads it against the schema and the index, and edits whichever pages the source touches, often ten or fifteen at once.

Query looks lighter on paper: read the index, drill into a few pages, answer with citations. In practice query also writes back, because an answer worth keeping turns into a new page, and a query can kick off a small secondary ingest to save it.

**Lint** is the background pass and the unresolved design question. It walks the wiki for contradictions, stale claims, orphan pages, and missing cross-references. Nobody agrees on when it runs, how aggressive it should be, or what it does when it finds something. Every shipped implementation picks its own answers; mine (frontmatter schema validation at commit time, a linter that only flags values in inline code, append-only logs) are in Part 5.

Retrieval is incidental in this model. \`index.md\`, a plain markdown catalogue maintained by the LLM itself, works at the scale most projects actually live at (hundreds of sources, a few hundred pages) and removes the need for an embedding stack entirely. You can add vectors later if the catalogue stops scaling. You start without them.

**Compilation** is the analogy. Each ingest is an incremental build over the previous artefact rather than a fresh pass. A single source typically touches several pages, and a page integrates evidence from several sources. At query time the generator reads compiled pages instead of raw text. Two lines in the gist carry most of the argument: "The human's job is to curate sources, direct the analysis, ask good questions, and think about what it all means. The LLM's job is everything else," and "Most people abandon wikis because maintenance burden grows faster than value. LLMs don't get bored."

The first operation I tried to think through was lint, because I knew the first wiki I'd write would be wrong in ways I wouldn't notice. Karpathy's version is informal: run it periodically, read the report. He cites Vannevar Bush's Memex (1945) as prior art for the whole pattern: a private, curated knowledge store with associative trails between documents, maintained by the person who used it.

The original spec ignores time. It treats every piece of content as equally true forever.

A lifecycle extension bolts onto the wiki. Facts carry a confidence score that decays over time unless refreshed (roughly the shape of Ebbinghaus's forgetting curve) and resets on access, so claims nobody revisits grow less trusted automatically. When a claim changes, the new version supersedes the old one and carries a pointer back. The old version stays in place. Edges between pages are typed: uses, depends on, contradicts, supersedes.

It's shipped at least three times, on very different substrates.

### The shoestring version

Bash scripts against an Obsidian vault. A handful of agents, a set of skills, no build system except a contract around what tools each agent can touch. Every agent declares its primitives from a fixed set -- one might be allowed to read pages and write the index, but forbidden to touch the schema file. Anything off the list fails before the skill ever runs. This design moves almost nothing to ingest time. The agents integrate on demand, and query-time work stays close to what you'd pay without the wiki. What breaks first is cross-platform skew: the same vault driving several LLM CLIs only stays coherent because the contract is narrow enough to hide their differences.

### The heavy version

Tauri runtime, React front end, installable binaries. This version packs the whole thing into a desktop application and moves the most work to ingest. A source arrives, the pipeline runs a two-step chain-of-thought pass: analysis against the current purpose file and index, then generation of typed FILE blocks for everything the source touches. Ingest is keyed by content hash. Re-ingest is a no-op. Jobs run through a persistent crash-recoverable queue with retry so an interrupted ingest resumes instead of being lost. Optional vector search bolts onto the catalogue at the end. The ingest cost buys one thing: the wiki is already compiled by the time you open the app.

### The portable version

A plugin: one Agent Skills definition, every major LLM CLI, no build step. A single small markdown file -- the hot cache -- holds it together, a few hundred words of the recent context of work in progress. Session start reads it. Session end updates it. The gap between those two reads is where continuity lives. Without it, every new session opens with amnesia. The cache goes stale if work shifts between contexts without a session-end update. Nothing detects the staleness.

## 3. Other shapes of the same move

The three systems in Part 2 all commit to the wiki shape: compile the corpus into markdown, let the human read the artefact. Others solve the same problem from different angles, and what they keep as the artefact says as much as their mechanics. Four families keep coming up.

### Memory agents: Letta and Mem0

Letta (formerly MemGPT, [arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) pages between main context, recall, and archival tiers by function call. Mem0 extracts entity-and-relation facts from every message, resolves conflicts, and writes to a hybrid vector-plus-graph backend; on LOCOMO it reports 66.9% accuracy against OpenAI memory's 52.9% (Mem0 paper, [arXiv:2504.19413](https://arxiv.org/abs/2504.19413)), closing the gap to a full-context baseline to about six points.

### Temporal graphs: Zep

Zep does the most interesting thing in this group. Its graph layer, Graphiti ([arXiv:2501.13956](https://arxiv.org/abs/2501.13956)), timestamps every edge with \`valid_at\` and \`invalid_at\`. Old beliefs stay in the store with an explicit expiry. A query can ask what the system thought last Tuesday. That's the same problem the wiki's lifecycle extension tries to solve, from the database side.

### Graph RAG: Microsoft's line

Graph-RAG starts expensive. Microsoft's GraphRAG ([arXiv:2404.16130](https://arxiv.org/abs/2404.16130)) extracts an entity graph, runs Leiden clustering, and pre-writes community summaries at every level -- indexing cost that becomes prohibitive on anything larger than a single book. Microsoft's own follow-up, LazyGraphRAG (Microsoft Research blog, November 2024), drops the pre-summarisation and matches quality at more than 700 times lower per-query cost. That's Microsoft Research admitting its own indexing pipeline was wasteful. LightRAG ([arXiv:2410.05779](https://arxiv.org/abs/2410.05779)) arrives nearby: entity-and-relation extraction at ingest, dual-level retrieval, lightweight per-query profile by design.

### Concept graphs: HippoRAG

HippoRAG ([arXiv:2405.14831](https://arxiv.org/abs/2405.14831)) is the strangest. It turns the corpus into a concept graph of noun phrases and answers queries by running Personalized PageRank. Single-step multi-hop reasoning. The v1 failure was entity-centric indexing: the concept graph stripped surrounding context at both ingest and inference, which hurt plain factual recall. HippoRAG 2 ([arXiv:2502.14802](https://arxiv.org/abs/2502.14802)) targets that gap.

Letta, Mem0, Zep, and every graph system above store their artefact in a database or index the reader never opens. The wiki is just markdown files.

<picture>
  <source srcset="/images/blog/rag-breaks-earlier-than-people-think/03-compute-shift-quadrant.en.dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/images/blog/rag-breaks-earlier-than-people-think/03-compute-shift-quadrant.en.light.png" alt="Quadrant positioning eight systems on two axes: query-time to ingest-time compute (horizontal), opaque store to human-readable artifact (vertical). Plain RAG, Letta / MemGPT, Mem0, LazyGraphRAG, HippoRAG, Zep / Graphiti, and GraphRAG cluster in the bottom half (opaque stores). LLM Wiki sits alone in the top-right quadrant (heavy ingest, markdown artifact)." />
</picture>

*Figure 3. Where each system pays its compute. Seven shipped systems keep the artefact in an opaque store; only the wiki corner keeps the compiled output in files a reader can open.*

## 4. When the wiki doesn't fit

A wiki isn't always the right answer. Four places it loses: three concrete, one still a suspicion.

**Scale.** In my experience, below roughly 50,000 tokens (a soft threshold that depends on which model's window you're paying for) the corpus fits inside a modern context window and the wiki loses to full-context. The wiki starts being worth building around the point where the context stops holding the whole corpus, which is also the point where you have to start maintaining the compression. The upper bound is hundreds of sources and a few hundred pages, above which the plain markdown index stops scaling as a catalogue, and the pattern has to grow its own hierarchy or an embedding layer to keep working.

**Error accumulation.** Ingest feeds back into the wiki. Karpathy is explicit about this: partial-context updates miss dependencies, compression drops nuance you can't recover. The feedback works through the ingest input. A pass reads existing wiki pages alongside the new source, so a slightly wrong summary already in the corpus becomes the authority the next ingest integrates against, and the error is inside the corpus by the time lint runs.

Lint is the prescribed fix. It catches contradictions and orphan pages cheaply. What it can't see is a quietly wrong summary that nothing downstream notices. Two shipped systems have already corrected for this in public. HippoRAG 2 ([arXiv:2502.14802](https://arxiv.org/abs/2502.14802)) explicitly rewrites v1's entity-centric indexing because it lost context during both ingest and inference. LazyGraphRAG is Microsoft Research admitting, in a product blog, that GraphRAG's upfront summarisation was prohibitive and wasted compute on documents the queries never touched.

**Specific wording and multi-author corpora.** Regulated content that relies on specific wording loses when the wiki paraphrases it. Plain vector RAG over the originals preserves the phrase the wiki dropped. Multi-author coordination breaks things differently. Collaborative Memory ([arXiv:2505.18279](https://arxiv.org/abs/2505.18279)) layers typed read/write permissions over shared memory to keep per-user views isolated, machinery a single-author wiki doesn't need.

**Silent rot (suspicion, not diagnosis).** Without a \`last_verified\` timestamp on each fact, the wiki can't tell which claims still hold and which have quietly gone stale. Zep's bi-temporal edges handle supersession cleanly -- a new fact replaces an old one and the edge carries the expiry -- but the harder case is the fact nothing in the system actively rechecks. No general answer exists for that. A wiki that stops being maintained doesn't fail loudly. It starts lying, and you find out the next time you read the page.

## 5. What breaks first when you build a wiki

When you build a wiki-shaped knowledge base it fails in a specific order. I learned the rules for each failure by shipping the wrong fix first.

Free-form decision pages don't survive being queried across. Writing decisions without a template feels fine, right up until you ask a question like "what decisions depend on the choice to stay on Python" and you realise \`depends_on\` is in some pages and not others, sometimes as a list and sometimes as prose. Templates matter for one reason: they turn a pile of pages into a corpus you can query across. A frontmatter schema has to be enforced at commit time, because voluntary schemas decay.

Wikilinks break next. You can write perfectly readable prose that names a decision and never links to it. You can do that for weeks. Then you try to walk the graph. The graph is half there: body prose names concepts the frontmatter doesn't, frontmatter names pages the body doesn't, and the link structure is whatever an author happened to remember that morning. Retroactive relinking is cheap in wall time if you have a graph walker and expensive in attention if you don't. The rule I ended up with is that references and links go into the page in the same edit. A page body that mentions a named concept without linking to it fails the commit. That removes the whole category of "I'll relink later" work.

My first instinct with decision pages was the ADR tradition: write once, supersede with a new document when the underlying call changes. That works when decisions are rare and the record is legal. In a live wiki it turns the corpus into a thicket. You end up with two files, and a reader has to know which one is live. The better shape is one file per topic, current state at the top, and the audit trail moved out of the wiki entirely, into an append-only log that records every change as a timestamped line, plus whatever version control already gives you. This is uncomfortable for anyone who learned decision-writing from compliance culture. It works anyway.

Some rules are right and enforced in the wrong place. The first version of my inbox-policing hook blocked any commit that left unprocessed raw files in a staging folder. The rule is sound, because staging should not turn into a graveyard. Enforcing it at commit time was the wrong move: a session that drops a transcript into the staging folder and then does real work will have an unprocessed raw file for the whole session, which means no commits at all. Moving enforcement from commit time to the merge gate fixed it. Commit-time, push-time, and merge-time aren't the same tool.

The first schema linter I wrote was too trusting with prose. It scanned every token in page bodies and flagged anything that looked like an enum value from the frontmatter schema. It caught invented values correctly. It also flagged the word "active" in a sentence, and "draft" in the phrase "first draft", and blocked commits that were completely fine. The rewrite only scans inline code spans. Values wrapped in backticks are machine-readable, and prose is left alone. Making the linter narrow is what kept it from being turned off.

Single-agent assumptions break early. An agent rulebook that grew up against one platform's permission model, tool surface, and skill invocation style won't port when a second agent arrives. Shimming one agent's interface onto the other's rulebook papers over a structural change that has already happened. The shape that survives is two peer rulebooks and a hook that refuses commits when the mirrors drift. Every skill gets written against both rulebooks in the same edit. Cost per skill is higher. The payoff: either agent can pick up the vault cold. That matters more than expected once the work has to outlast a particular CLI's session.

During the hardening phase, metadata iterates faster than content. The rule files, the schema documents, the audit log: those are the most-edited artefacts. At first this looks like a smell. Governance churning more than the corpus it governs is counter-intuitive. Then it stops looking like a smell. Content accumulates quietly. The rules around content evolve fast, because real requirements surface only once real content exists. The day the metadata files stop churning is the day the vault either hardened or died.

The uncomfortable part of this approach is that it sounds like overhead. The maintenance cost is paid upfront in templates, schema, hook chains, and the shape of the append-only log, and the per-commit cost afterwards is close to zero. A long meeting becomes a dozen pre-linked decision pages in the time it takes to run the ingest pass, because the graph walkers and the schema do the work the author would otherwise do by hand. Not every edit, though. Irreversible ones still require a timestamped log entry that names me. The \`decided_by\` field in a decision's frontmatter is always a human name; the agents never fill it. Contested claims stay in place with counter-evidence added below them, never silently overwritten.

I don't have a good way to tell whether the wiki is improving. Add-rate is easy to measure and doesn't mean what I'd like it to mean. The public benchmarks ask a different question than I want answered: LongMemEval ([arXiv:2410.10813](https://arxiv.org/abs/2410.10813)) covers five memory abilities across long chat histories, LOCOMO ([arXiv:2402.17753](https://arxiv.org/abs/2402.17753)) tests multi-session conversational memory, and DMR from MemGPT ([arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) scores multi-session recall. None of them asks the question I care about -- whether the same query asked six months apart on the same evolving corpus returns a consistent answer -- and Zep's paper reporting on DMR ([arXiv:2501.13956](https://arxiv.org/abs/2501.13956)) admits the questions are ambiguous enough that a high score can reflect LLM inference skill rather than memory fidelity.

No published benchmark measures time-travel consistency: the same question asked at different points as the corpus evolves. Summarisation-fidelity metrics like FaithEval exist. No memory system paper reports using them.

What the commit hooks catch is mechanical: schema violations, broken wikilinks, contradictions flagged by the narrative-schema linter. Silent regression, a quietly wrong summary that nothing in the system notices, shows up the next time I open the page. Or it doesn't.

## 6. What to build, and when

The choice between RAG and a wiki is a choice about where to pay. RAG stands up fast, costs little per token, and caps out when the corpus gets large enough that the retrieval geometry runs out of room. A wiki costs more at ingest and less at query, holds up better under repeated questions on the same material, and rewards the human who maintains it. Real systems tend to ship both layers: vector search over immutable sources for precise recall, a compiled wiki for synthesis across a specific project.

What the failure modes in this piece share is where compute gets paid. The move from query time to ingest time is the underlying bet. Whether the output lands as markdown pages, typed edges in a temporal graph, or pre-computed community summaries depends on what the artefact is for. A wiki is read by humans; a graph is queried by systems. Both sit downstream of the same decision: compile once, read many.

I don't have a neat ending. The wiki I built will rot in places I stop re-reading, and the commit hooks will keep catching schema violations while silent summaries drift. That's the trade the pattern makes: no durability guarantee, just a failure mode that lives in a file a person can open. The measure I'd want -- same query, same corpus, six months apart, do the answers agree -- isn't something any benchmark reports on yet, so for now the signal is the next time I open a page and flinch at what it says.`,
  },
  {
    slug: "rag-breaks-earlier-than-people-think",
    lang: "ru",
    title: "RAG ломается раньше, чем кажется",
    date: "Apr 2026",
    isoDate: "2026-04-01",
    isoDateModified: "2026-04-01",
    wordCount: 389,
    summary:
      "У обычного RAG есть геометрический потолок, до которого большинство бенчмарков не добираются. LLM Wiki компилирует корпус один раз вместо повторного поиска на каждый запрос -- вот что ломается, когда её строишь.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
    content: `## 1. RAG ломается раньше, чем кажется

Потолок начинаешь чувствовать раньше, чем его получается измерить. На нескольких сотнях тысяч документов хорошо настроенный векторный индекс начинает промахиваться на запросах, на которые отлично отвечал при нескольких тысячах. Добавляешь реранкер -- top-1 возвращается. Добавляешь гибридный поиск -- длинный хвост выравнивается. Растёшь дальше -- и отказы возвращаются, те же по сути, только воспроизвести их сложнее. Большинство команд читает это как задачу тюнинга. Weller и соавторы (ICLR 2026) объясняют иначе: у одновекторного ретривера есть репрезентативный потолок, и выше него никакие ухищрения в конце пайплайна уже не помогают.

Мой собственный стек упёрся в этот потолок раньше, чем я прочитал его объяснение, и вики, которая его заменила, выросла из реакции, а не из плана.

Часть 1 проходит по местам, где плоский RAG ломается, со ссылками на исследования. Часть 2 -- архитектурная альтернатива, LLM Wiki Karpathy, и почему она переформулирует пайплайн как компиляцию, а не как поиск. Часть 3 -- другие системы, делающие тот же манёвр в разных формах: системы агентной памяти, граф-RAG, HippoRAG. Часть 4 -- где вики оказывается неправильным ответом. Часть 5 -- что ломается первым, когда её действительно строишь, из опыта сборки хранилища для команды AI-инфраструктуры.

Weller и соавторы (ICLR 2026) записывают потолок как неравенство. Для корпуса из $n$ документов, top-$k$ запросов и зазора score $\\gamma$ размерность эмбеддинга $d$ должна удовлетворять условию $d \\geq \\frac{\\log \\binom{n}{k}}{\\log(1 + 1/\\gamma)}$. Ниже этой границы часть top-$k$ комбинаций просто нельзя представить в векторном пространстве. Граница работает в одну сторону: если размерность эмбеддинга ниже порога для этого размера корпуса, ни реранкер, ни гибридный поиск, ни промпт-инжиниринг не вытащат пропущенные комбинации. Геометрия уже неправильная.

Дальнейшие режимы сбоя ложатся в три слоя. Геометрия (потолок выше): структура, её тюнингом не сдвинуть. Чанкинг и утилизация контекста: вопрос бюджета -- аккуратная предобработка лечит, но сами бюджеты усыхают. Внимание и hard-negatives: провалы на стороне генератора, лучшими промптами лечатся, пока промпты вообще работают. Геометрию тюнингом не сдвинуть. Остальные два слоя поддаются инженерной работе.

<picture>
  <source srcset="/images/blog/rag-breaks-earlier-than-people-think/01-rag-failure-layers.ru.dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/images/blog/rag-breaks-earlier-than-people-think/01-rag-failure-layers.ru.light.png" alt="Лог-лог график: размер полезного корпуса против размерности эмбеддинга. Эмпирический подгон Weller et al. (коралловая линия) проходит через две отмеченные точки: d=768 с n≈1,7M документов (стандарт открытых моделей) и d=4096 с n≈250M (текущий фронтир). Над линией затенённая зона недостижимости. Формула сверху: d ≥ log C(n,k) / log(1+1/γ). Бенчмарк: LIMIT (50K документов, 1K запросов), E5-Mistral, GritLM, Qwen3 падают ниже 20% Recall@100 при d=4096, BM25 даёт 97,8% Recall@2; GTE-ModernColBERT (вектор на токен) восстанавливает 54,8% на том же наборе." />
</picture>

*Рисунок 1. Эмпирический подгон Weller et al. на семи single-vector ретриверах. Две опорные точки -- d=768 и d=4096 -- задают границу полезного корпуса. Выше кривой часть top-k рангов невозможно представить при этой размерности; реранкер и гибридный поиск эту границу не сдвигают.*

На практике разрыв между теоремой и реальностью оказывается меньше, чем хотелось бы. Потолок полезного корпуса -- в районе 250 миллионов документов при 4096 измерениях и около 1,7 миллиона при 768 (до сих пор стандарт для открытых моделей). Выше этих объёмов часть top-$k$-комбинаций уже вне досягаемости любого вектора, построенного ретривером.

Большинство бенчмарков на эту границу не выходят. LIMIT -- выходит. Пятьдесят тысяч документов, тысяча запросов, предложения типа «Jon likes apples». Лучшие эмбеддинг-модели падают ниже 20% Recall@100 при 4096 измерениях. BM25 выдаёт 97,8% Recall@2. Проблема в геометрии одного вектора: обученный эмбеддинг представляет конечное число top-$k$ наборов, и когда запрос выпадает из этого набора, ничего дальше по цепочке ситуацию не исправляет.

Следующим ломается чанкинг, и весит он столько же, сколько выбор модели. Исследование Vectara ([arXiv:2410.13070](https://arxiv.org/abs/2410.13070)) ставит вопрос, окупается ли семантический чанкинг, и на F1@5 отвечает: в большинстве сценариев не окупается -- ретривер выигрывает на recall, генератор проигрывает на локальном контексте, и два эффекта гасят друг друга. Провал обычный: чанки достаточно мелкие для точного поиска оказываются слишком мелкими, чтобы по ним ответить.

Аттеншн обычно недооценивают. Больше половины сниппетов можно выкинуть без ущерба для ответа ([arXiv:2511.17908](https://arxiv.org/abs/2511.17908)). Работы, на которые эта статья опирается -- RULER и исследования Context Rot -- оценивают полезный срез 128k-токенового контекста в 10–20% от номинала. Модель скользит по поверхности. Смещение по позиции зашито в архитектуру. Разбор MIT ([arXiv:2502.01951](https://arxiv.org/abs/2502.01951)) даёт механизм: каузальная маска копит внимание на первых токенах, а rotary embeddings добавляют долгосрочное затухание в score. Независимая эмпирика на длинных контекстах (RULER, Context Rot) подтверждает эту форму на практике -- середина контекста недоучитывается, и длинное окно не прибавляет внимания; лишние токены попадают в зону, которую модель и так пропускает.

Ошибки складываются. Hard-negative документы -- похожие-но-не-те, которые хороший ретривер и должен находить -- ухудшают итоговую точность. А случайные несвязанные документы её улучшают, примерно на 35%. Починка одной проблемы обычно вскрывает следующую.

Улучшения есть, и все настоящие. Contextual Retrieval переписывает чанки с учётом окружающего контекста перед эмбеддингом: –35% провалов на одних эмбеддингах, –49% с BM25, –67% с реранкером сверху. GraphRAG ставит в приоритет саммари сообществ и платит за это индексацией, достаточно дорогой, что Microsoft сам выпустил LazyGraphRAG как дешёвое продолжение, совпадающее по качеству примерно за 1/700 стоимости запроса. Self-RAG и CRAG переносят политику извлечения внутрь самой модели. Ни одно из этих улучшений не меняет базовый цикл: эмбеддинг, поиск, чтение, генерация. Каждый запрос проходит цикл заново, платя полную цену.

RAG -- правильный первый ответ на вопрос «как прицепить LLM к своим данным». Для прототипа, PoC, первой интеграции он работает, стоит недорого и даёт форму задачи. Ломается, когда на нём пытаются держать продукт. Цикл эмбеддинг-поиск-чтение-генерация платит полную стоимость извлечения на каждый вопрос и упирается в тот же потолок, где упирается геометрия; масштабирование цикла масштабирует счёт, а не потолок.

Отсюда две ветки. Одна продолжает улучшать цикл в момент запроса: реранкеры, late interaction (ColBERT и наследники), гибридный поиск, обучаемые политики извлечения. Ветка продуктивна, и публичной работы там больше. Другая ветка устроена иначе. Вместо того чтобы платить за извлечение, чанкинг и внимание на каждом вопросе, корпус один раз компилируется во что-то, чем модель может пользоваться сразу. Вся работа делается заранее, в момент поступления источника.

Все эти режимы стоят на одном допущении: корпус остаётся сырым, и модель каждый раз заново выводит, что с ним делать. Альтернатива -- скомпилировать корпус один раз в артефакт, который модель читает напрямую, и заплатить за работу при загрузке, а не при каждом запросе. Karpathy в апреле 2026 года опубликовал гист, где назвал эту вторую ветку **LLM Wiki**. Дальше -- что это значит архитектурно и три очень разные системы, которые уже её отгрузили.

## 2. Вики переносит работу на другой конец цикла

> The wiki is a persistent, compounding artifact. Instead of just retrieving from raw documents at query time, the LLM incrementally builds and maintains a persistent wiki.

Я прочитал этот гист в воскресенье и перечитал дважды, пытаясь понять, где подвох. Записка короткая. Вся механика помещается на одну страницу.

У вики три слоя.

- **Сырые источники** внизу: PDF, расшифровки, заметки, клиппинги с веба. После сохранения не меняются.
- **Сама вики** в середине: markdown-страницы, которые LLM пишет, по одной на концепцию или решение, связанные вики-ссылками.
- **Схема** сверху: CLAUDE.md, AGENTS.md, любой файл с описанием того, зачем эта вики. LLM читает его перед каждым действием.

<picture>
  <source srcset="/images/blog/rag-breaks-earlier-than-people-think/02-wiki-three-layers.ru.dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/images/blog/rag-breaks-earlier-than-people-think/02-wiki-three-layers.ru.light.png" alt="Архитектурная схема. В центре трёхслойный стек вики: L3 Схема (CLAUDE.md, AGENTS.md, frontmatter spec; пишется человеком, читается перед каждым действием), L2 Страницы вики (коралловый фокус; markdown от LLM, вики-ссылки, скомпилировано; ~10-15 страниц за ингест), L1 Сырые источники (PDF, расшифровки, клиппинги; content-hashed, неизменяемы). Вокруг стека четыре операции: Источник слева стрелкой DROP в L1, Ингест сверху стрелкой WRITES в L2, Запрос справа стрелкой READS из L2 с пунктирным возвратом APPENDS, Линт снизу стрелкой AUDITS в L2." />
</picture>

*Рисунок 2. Вики со своими четырьмя операциями. Ингест пишет средний слой; Запрос его читает; Линт его проверяет. Источники попадают в L1; Схема управляет каждым действием сверху. Фокальный L2 -- единственный слой, который трогает каждая операция.*

Основную работу делает **ингест**. Приходит источник, LLM читает его вместе со схемой и индексом и правит страницы, которых источник касается, часто десять-пятнадцать за раз. Формально запрос проще: прочитать индекс, нырнуть в несколько страниц, ответить с цитатами. На деле запрос тоже пишет обратно: если ответ стоит того, чтобы его сохранить, он становится новой страницей, и запрос запускает маленький вторичный ингест.

Поиск тут вторичен. Karpathy прямо пишет, что \`index.md\`, простой markdown-каталог, который LLM ведёт сама, для большинства проектов хватает (сотни источников, несколько сотен страниц) и снимает потребность в эмбеддинг-стеке. Векторы можно добавить, когда каталог перестанет справляться. До тех пор они не нужны.

Гист строится на аналогии с **компиляцией**. Источники на входе, вики на выходе, каждый ингест -- инкрементальная сборка поверх предыдущего артефакта. Один источник обычно затрагивает несколько страниц. Через несколько ингестов каждая страница вбирает данные из разных источников, и результат перестаёт быть похожим на пересказ отдельного документа. Генератор работает по скомпилированным страницам, а не по сырому тексту. Главная мысль гиста в двух строчках: «The human's job is to curate sources, direct the analysis, ask good questions, and think about what it all means. The LLM's job is everything else» и «Most people abandon wikis because maintenance burden grows faster than value. LLMs don't get bored.»

Первая операция, которую я попытался продумать, был **линт** -- обход вики в поисках противоречий, устаревших утверждений, сирот и сломанных ссылок. Я знал, что первая написанная мной вики окажется неправильной в местах, которые я сам не замечу. У Karpathy линт описан неформально: запускай периодически, читай отчёт. На деле интересный вопрос в том, когда его запускать и что он делает, когда что-то находит. Гист оставляет это на читателя. Каждая реальная реализация выбирает свои ответы; мои (валидация фронтматтер-схемы на коммите, линтер, флагующий только значения в бэктиках, append-only-лог) -- в Части 5.

Karpathy ссылается на «Мемекс» Вэнивара Буша (1945) как на предшественника. «Мемекс» был задуман как личное курируемое хранилище знаний с ассоциативными связями между документами. Одна система, один человек, свои источники.

Исходная спецификация игнорирует время. Она считает любой контент одинаково верным навсегда, а реальные знания так не работают. Очевидное расширение -- прикрутить жизненный цикл. Факты получают оценку уверенности, и она убывает без обращений: утверждение, к которому никто не возвращается, теряет доверие само. При замене старая версия остаётся с обратным указателем. Рёбра между страницами типизированы (зависит от, противоречит, замещает), и по ним можно строить структурные запросы. Можно узнать, что вики считала верным в любой момент в прошлом. Файл схемы тут главный. Без него LLM не знает, как себя вести.

Всё это ничего не стоит, пока идея существует только в гисте. Она уже запущена как минимум три раза, на разных платформах, и интересно не то, что они все работают, а то, куда каждая перекладывает работу.

### Бюджетная версия

Bash-скрипты поверх Obsidian-волта. Горстка агентов, набор навыков и никакой билд-системы, кроме контракта на то, какие инструменты каждый агент может использовать. Каждый агент объявляет свои примитивы из фиксированного набора -- одному, например, разрешено читать страницы и писать индекс, но запрещено трогать файл схемы. Запросит что-то за пределами списка -- сборка упадёт. Эта конструкция почти ничего не перекладывает на ингест: агенты собирают по запросу, и работы примерно столько же, сколько без вики вообще. Первым ломается кросс-платформенный рассинхрон. Одно хранилище на несколько LLM CLI держится только потому, что контракт достаточно узкий, чтобы не наступать на различия в интерфейсах.

### Тяжёлый подход

Упаковывает всё в десктопное приложение. Tauri-рантайм с React-фронтендом, установочные бинарники для трёх основных платформ. Сюда на ингест перекладывается больше всего работы. Приходит источник, и конвейер ингеста прогоняет двухшаговый chain-of-thought: сначала аналитическое чтение источника на фоне текущего файла целей и индекса, затем генерация типизированных FILE-блоков для всего, что источник затрагивает. Ингест привязан к хешу содержимого, так что повторный ингест ничего не делает, а задания проходят через персистентную очередь с перезапуском. Опциональный векторный поиск прикручен в конце. Весь этот ингест нужен ради одного: вики уже скомпилирована к моменту, когда ты открываешь приложение. Архитектура заточена под один сценарий: очередь не должна терять состояние при сбое.

### Портативная версия

Плагин. Одно Agent Skills определение, которое запускается на любом крупном LLM CLI без этапа сборки. Всё держится на одном маленьком markdown-файле -- горячем кэше в несколько сотен слов, хранящем свежий контекст текущей работы. В начале сессии он читается, в конце обновляется, и непрерывность держится именно на этом промежутке. Без него каждая новая сессия начинается с амнезии. Кэш протухает, если работа переключается между контекстами без обновления в конце сессии, и ничто в системе этого не замечает.

## 3. Другие формы того же манёвра

Три системы из Части 2 делают один шаг -- компилируют корпус в markdown и отдают артефакт человеку. Остальные решают ту же задачу с другой стороны, и то, что они сохраняют как артефакт, говорит столько же, сколько их механика. Четыре семейства стоит назвать.

### Агентные системы памяти: Letta и Mem0

Letta (бывший MemGPT, [arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) переключает данные между основным контекстом, recall-хранилищем и архивом через function call. Mem0 извлекает факты entity-and-relation из каждого сообщения, разрешает конфликты и пишет в гибридное хранилище (вектор + граф); на LOCOMO он показывает 66,9% точности против 52,9% у памяти OpenAI (статья Mem0, [arXiv:2504.19413](https://arxiv.org/abs/2504.19413)), сокращая разрыв до full-context-бейзлайна примерно до шести пунктов.

### Временны́е графы: Zep

Zep делает самое интересное в этой группе. Его графовый слой, Graphiti ([arXiv:2501.13956](https://arxiv.org/abs/2501.13956)), ставит временны́е метки \`valid_at\` и \`invalid_at\` на каждое ребро. Старые убеждения остаются в хранилище с явным сроком годности. Запрос может спросить, что система считала верным в прошлый вторник. Тот же вопрос, на который отвечает расширение жизненного цикла в вики, только со стороны базы данных.

### Граф-RAG: линия Microsoft

Граф-RAG-системы стартуют дорого. GraphRAG от Microsoft ([arXiv:2404.16130](https://arxiv.org/abs/2404.16130)) извлекает граф сущностей, запускает Leiden-кластеризацию и заранее пишет саммари сообществ на каждом уровне -- стоимость индексации становится запретительной на чём-то большем одной книги. Собственный follow-up Microsoft, LazyGraphRAG (блог Microsoft Research, ноябрь 2024), выкидывает предварительную суммаризацию и даёт то же качество более чем в 700 раз дешевле на запрос. Это Microsoft Research признаёт, что их собственный индексационный пайплайн был расточительным. LightRAG ([arXiv:2410.05779](https://arxiv.org/abs/2410.05779)) рядом: извлечение сущностей и отношений на ингесте, двухуровневый поиск, небольшой расход на один запрос по дизайну.

### Концептные графы: HippoRAG

HippoRAG ([arXiv:2405.14831](https://arxiv.org/abs/2405.14831)) -- самый странный из всех. Он превращает корпус в концептный граф из именных групп и отвечает на запросы, прогоняя Personalized PageRank. Multi-hop-рассуждение за один шаг. Провал v1 -- entity-centric-индексация: концептный граф срезал окружающий контекст и на ингесте, и на инференсе, что било по обычному факт-поиску. HippoRAG 2 ([arXiv:2502.14802](https://arxiv.org/abs/2502.14802)) целится именно в этот провал.

Вики отличается тем, что результат компиляции -- обычный markdown. Файлы, которые человек может открыть, отредактировать и прочитать. Системы памяти прячут артефакт в базу данных, граф-системы -- в кластерное дерево или PageRank-скор. Когда что-то идёт не так, вики ломается у тебя на виду. Остальные ломаются за стеной абстракции, и ты узнаёшь об этом по качеству ответов, а не по состоянию хранилища.

<picture>
  <source srcset="/images/blog/rag-breaks-earlier-than-people-think/03-compute-shift-quadrant.ru.dark.png" media="(prefers-color-scheme: dark)" />
  <img src="/images/blog/rag-breaks-earlier-than-people-think/03-compute-shift-quadrant.ru.light.png" alt="Квадрант, располагающий восемь систем по двум осям: вычисление на запросе ↔ на ингесте (горизонталь), непрозрачное хранилище ↔ читаемый человеком артефакт (вертикаль). Plain RAG, Letta / MemGPT, Mem0, LazyGraphRAG, HippoRAG, Zep / Graphiti и GraphRAG кучкуются в нижней половине (непрозрачные хранилища). LLM Wiki стоит одна в верхнем правом углу (тяжёлый ингест, markdown-артефакт)." />
</picture>

*Рисунок 3. Где каждая система платит за вычисления. Семь выпущенных систем держат артефакт в непрозрачном хранилище; только вики-угол держит его в файлах, которые человек может открыть.*

## 4. Когда вики не подходит

Вики не всегда правильный ответ. Четыре места, где она проигрывает: три конкретных, одно пока подозрение.

**Масштаб.** По моему опыту, ниже примерно 50 000 токенов (граница мягкая и зависит от того, чьё окно контекста оплачиваешь) корпус целиком помещается в контекстное окно, и вики проигрывает полному контексту. Запускать компрессию раньше -- значит платить за то, что модель и так может обработать целиком. Верхняя граница тоже описана в гисте: Karpathy оценивает рабочий диапазон в сотни источников и несколько сотен страниц, выше чего плоский markdown-индекс перестаёт работать как каталог и паттерну приходится отращивать иерархию или эмбеддинг-слой.

**Накопление ошибок.** Karpathy называет этот режим в оригинальном гисте: ингест возвращает результаты обратно в вики, обновления на частичном контексте упускают зависимости, а компрессия теряет нюансы, и восстановить их нельзя. Петля замыкается через вход ингеста. Проход читает существующие страницы вики вместе с новым источником, поэтому слегка ошибочный саммари, уже попавший в корпус, становится авторитетом для следующего ингеста, и ошибка оказывается внутри корпуса к моменту, когда линт добирается до неё. Самое неприятное: такая ошибка выглядит как нормальный текст. Линт тут штатное лекарство. Он ловит противоречия и сирот-страницы дёшево, но тихо ошибочный саммари ему не виден, если ничто ниже по потоку не замечает расхождения. Это уже ломалось публично. HippoRAG переписал свою индексацию во второй версии, потому что первая теряла контекст и при ингесте, и при инференсе. LazyGraphRAG -- признание, что предварительная суммаризация GraphRAG тратила вычисления на документы, до которых запросы так и не добрались.

**Точные формулировки и несколько авторов.** Регулируемый контент, завязанный на конкретные формулировки, проигрывает, когда вики их перефразирует, -- а обычный векторный RAG по оригиналам сохраняет ту фразу, которую вики потеряла. Многоавторская координация давит с другой стороны: Collaborative Memory ([arXiv:2505.18279](https://arxiv.org/abs/2505.18279)) накручивает над общей памятью типизированные read/write-разрешения, чтобы у каждого пользователя был свой срез -- механика, без которой одноавторская вики спокойно обходится.

**Тихое гниение (подозрение, не диагноз).** Без временно́й метки \`last_verified\` на каждом факте вики не может определить, какие из её утверждений ещё верны, а какие тихо устарели. Битемпоральные рёбра Zep чисто закрывают замещение -- новый факт заменяет старый, ребро несёт срок годности -- но тяжёлый случай другой: факт, который ничто в системе активно не перепроверяет. Для него общего ответа нет. Вики, за которой перестали следить, не падает с грохотом. Она начинает врать, и понимаешь это, когда в следующий раз открываешь страницу.

## 5. Что ломается первым, когда строишь вики

Вики-хранилище ломается в определённой последовательности. Правила для каждой поломки я узнал, сначала выкатив неправильный фикс.

Первая поломка: свободноформатные страницы решений не выживают, когда по ним начинают делать запросы. Писать решения без шаблона удобно ровно до момента, когда задаёшь вопрос типа «какие решения зависят от выбора остаться на Python» и обнаруживаешь, что \`depends_on\` есть в одних страницах, а в других нет, где-то списком, где-то прозой. Шаблоны нужны ровно для одного: они превращают кучу страниц в корпус, по которому можно строить запросы. Фронтматтер-схема должна проверяться на коммите, потому что добровольные схемы деградируют.

Вики-ссылки ломаются следующими. Можно неделями писать читаемые тексты, в которых решение упоминается по имени, но ни разу не линкуется. Потом пытаешься обойти граф. Граф готов наполовину: тело текста называет концепции, которых нет во фронтматтере, фронтматтер перечисляет страницы без обратных ссылок в теле, а структура ссылок определяется тем, что автор вспомнил в то утро. Перелинковать задним числом недолго, если есть обходчик графа. Без него дорого по вниманию. Правило, к которому я пришёл: ссылки и упоминания пишутся в одной правке. Страница, в теле которой упомянут концепт без ссылки, не проходит коммит. Так исчезает целый класс работы «потом перелинкую», потому что правило делает «потом» невозможным.

Мой первый инстинкт с решениями: ADR-традиция. Написал один раз, при изменении создаёшь новый документ, замещающий старый. Работает, когда решения редки, а запись имеет юридическую силу. В живой вики получается чаща. Два файла, и читатель должен знать, какой из них актуален. Лучше один файл на тему, текущее состояние наверху, а аудит-трейл вынесен из вики целиком, в append-only лог, где каждое изменение записывается строкой с таймстэмпом, плюс всё, что и так даёт version control. Для тех, кто учился писать решения в культуре комплаенса, это неудобно. Работает тем не менее.

Некоторые правила верны, но применены не в том месте. Первая версия моего inbox-хука блокировала любой коммит, если в staging-папке оставались необработанные сырые файлы. Правило здравое: staging не должен превращаться в кладбище. Но на коммите оно работало против меня: сессия, которая начинается с того, что ты кидаешь расшифровку в staging, а потом делаешь реальную работу, всю сессию будет содержать необработанный файл, и ни одного коммита сделать не получится. Перенос проверки с коммита на мёрдж-гейт решил проблему. Коммит, пуш и мёрдж -- разные инструменты, и их смешение создаёт помехи.

Первый схема-линтер, который я написал, слишком доверял прозе. Он сканировал каждый токен в теле страницы и помечал всё, что выглядело как значение enum из фронтматтер-схемы. Придуманные значения он ловил правильно. Но он также ловил слово «active» посреди предложения и «draft» во фразе «первый черновик», и блокировал коммиты, с которыми всё было в порядке. Переписанная версия сканирует только код в бэктиках. Значения в бэктиках машиночитаемы, проза остаётся нетронутой. Линтер выжил потому, что стал узким.

Допущения под одного агента ломаются рано. Свод правил, выросший на модели прав, наборе инструментов и стиле вызова навыков одной платформы, не переносится, когда появляется второй агент. Натягивание интерфейса одного на свод правил другого маскирует структурные изменения, которые уже произошли. Выжившая форма: два равноправных свода правил и хук, отклоняющий коммиты при расхождении зеркал. Каждый навык пишется под оба свода в одной правке. Цена на навык выше. Зато любой из агентов может подхватить хранилище с нуля и работать с ним, и это оказывается важнее, чем ожидалось, когда работа должна пережить конкретную CLI-сессию.

На этапе закалки хранилища метаданные итерируются быстрее контента. Файлы правил, документы схемы, лог аудита: это самые редактируемые артефакты, а отдельные страницы решений нет. Поначалу это выглядит как антипаттерн -- управление, меняющееся быстрее управляемого корпуса, противоречит интуиции, -- а потом перестаёт. Контент накапливается тихо. Правила вокруг контента эволюционируют быстро, потому что реальные требования проявляются только тогда, когда реальный контент уже есть. Когда метаданные перестают меняться, хранилище либо закалилось, либо умерло.

Хорошего способа определить, становится ли вики лучше, у меня нет. Скорость добавления легко измерить, но она говорит не о том, о чём хотелось бы. Публичные бенчмарки задают другой вопрос: LongMemEval ([arXiv:2410.10813](https://arxiv.org/abs/2410.10813)) покрывает пять способностей памяти на длинных чатах, LOCOMO ([arXiv:2402.17753](https://arxiv.org/abs/2402.17753)) тестирует multi-session-память в диалогах, DMR из MemGPT ([arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) оценивает multi-session-recall. Ни один не спрашивает того, что меня интересует -- возвращает ли один и тот же запрос через полгода на том же эволюционирующем корпусе согласованный ответ -- и статья Zep по DMR ([arXiv:2501.13956](https://arxiv.org/abs/2501.13956)) признаёт, что вопросы там достаточно неоднозначны, чтобы высокий счёт отражал навыки инференса LLM, а не точность памяти.

Ни один не измеряет консистентность во времени -- один и тот же вопрос, заданный в разные моменты эволюции корпуса. Метрики достоверности суммаризации существуют, и ни один отчёт по системам памяти их не использует. Коммит-хуки ловят механическое: нарушения схемы, битые ссылки, противоречия. Тихая регрессия обнаруживается в следующий раз, когда открываешь страницу. Или не обнаруживается.

Неудобная часть этого подхода в том, что он звучит как оверхед. Стоимость поддержания заплачена заранее в шаблонах, схеме, цепочках хуков и форме append-only лога, а стоимость каждого коммита после этого близка к нулю. Длинная встреча превращается в дюжину пре-линкованных страниц решений за время одного ингест-прохода, потому что обходчики графа и схема делают ту работу, которую автор делал бы руками. Снаружи не видно, что всё в хранилище уже прошло через валидацию к моменту, когда читатель до него добирается. Но это верно не для каждой правки. Необратимые правки по-прежнему требуют записи в логе с моим именем. Поле \`decided_by\` во фронтматтере решения всегда заполняется человеком; агенты его не трогают. Спорные утверждения остаются на месте, контраргументы добавляются ниже, молчаливая перезапись исключена.

## 6. Что строить и когда

Выбор между RAG и вики -- выбор, где платить. RAG быстро разворачивается, стоит копейки на запрос и упирается в стену, когда корпус вырастает настолько, что геометрия извлечения перестаёт помещаться. Вики требует больше на ингесте и меньше на запросе, лучше держит повторяющиеся вопросы к тому же материалу и вознаграждает того, кто её ведёт. Реальные системы обычно держат оба слоя: векторный поиск по неизменяемым источникам для точного recall, скомпилированную вики для синтеза по конкретному проекту.

Общее у режимов сбоя из этой статьи -- где платят за вычисления. Перенос с момента запроса на момент ингеста и есть та самая ставка. Во что превратится артефакт -- markdown-страницы, типизированные рёбра темпорального графа, заранее посчитанные саммари сообществ -- зависит от того, для чего он нужен. Вики читает человек; граф запрашивает система. Оба ниже по течению от одного решения: компилировать один раз, читать много.

Аккуратного финала у меня нет. Вики, которую я построил, частично сгниёт в местах, куда я перестану возвращаться, а хуки продолжат ловить нарушения схемы, пока тихие саммари будут дрейфовать. Вот компромисс, на который идёт паттерн: никакой гарантии долговечности, только форма сбоя, которая лежит в файле, открываемом человеком. Метрика, которую хотелось бы иметь -- один и тот же запрос, тот же корпус, через полгода, совпадают ли ответы -- ни в одном бенчмарке пока не измеряется, так что до тех пор сигнал прежний: следующий раз, когда я открою страницу и поморщусь от того, что там написано.`,
  },
];

export const categories = ["All", "Architecture"];
