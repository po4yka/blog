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
    summary:
      "Plain RAG has a geometric ceiling most benchmarks never probe. An LLM Wiki compiles the corpus once instead of re-retrieving on every query -- here is what breaks when you build one.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
    content: `## 1. RAG breaks earlier than people think

Most RAG systems fail at a smaller corpus than their authors expect, and the failure is structural. There is a ceiling baked into single-vector retrieval, and above it no amount of rerankers, hybrid search, or larger context saves the query. The stack I had been shipping before rebuilding my knowledge base hit exactly that ceiling, and the 197-commit wiki that replaced it started as a reaction.

Weller et al. ([arXiv:2508.21038](https://arxiv.org/abs/2508.21038), ICLR 2026) state the ceiling as an inequality. For a corpus of $n$ documents with top-$k$ queries and score margin $\\gamma$, the embedding dimension $d$ must satisfy $d \\geq \\frac{\\log \\binom{n}{k}}{\\log(1 + 1/\\gamma)}$. Below that bound, some top-$k$ combinations are representationally unreachable in the vector space.

The empirical fit across seven models puts the usable corpus ceiling around 250 million documents at 4096 dimensions, and around 1.7 million at 768, still the common open-weights default. Above those sizes, some top-$k$ sets sit outside the span of any vector the retriever can produce.

Most benchmarks live inside those budgets and never probe the edge. LIMIT does. Fifty thousand documents, one thousand queries, sentences like "Jon likes apples". E5-Mistral, GritLM, Qwen3 -- the 2025 state of the art -- land below 20% Recall@100 at 4096 dimensions on that set. BM25 hits 97.8% Recall@2. ColBERT, which keeps a vector per token rather than one per document, hits 83.5%. The failure sits in the single-vector geometry. A training-time embedding represents only a finite number of distinct top-$k$ sets, and when a query lands outside that set, nothing further in the pipeline compensates.

Chunking matters about as much as the model choice. Vectara's 2025 study ([arXiv:2410.13070](https://arxiv.org/abs/2410.13070)) logged semantic chunking at 91.9% retrieval recall and 54% end-to-end accuracy. The chunks averaged 43 tokens. The generator didn't have enough local context to answer from the evidence the retriever returned.

Over half the retrieved snippets can be dropped without harming answer quality ([arXiv:2511.17908](https://arxiv.org/abs/2511.17908)). The useful slice of a 128k-token context is 10-20% of what's nominally there. The model skims.

Position bias is architectural. One mechanistic sketch: causal masking accumulates attention on early tokens through every layer, and rotary positional embeddings add a long-term decay to the score (consistent with the MIT analysis in [arXiv:2502.01951](https://arxiv.org/abs/2502.01951)). Move important evidence from the start of a 32k context to the middle and accuracy drops ~20%. Going from 32k to a million doesn't reduce the bias. It increases the amount of context the model is already ignoring.

Hard-negative documents -- the near-miss cases a good retriever is designed to surface -- degrade end-to-end accuracy; [arXiv:2401.14887](https://arxiv.org/abs/2401.14887) shows the mirror-image result, that random unrelated documents improve accuracy by up to 35%. The U-curve of answer quality against retrieved chunk count is OP-RAG's core finding ([arXiv:2409.01666](https://arxiv.org/abs/2409.01666)). Fixing one failure mode surfaces the next.

Contextual Retrieval rewrites chunks with surrounding context before embedding: 35% failure reduction for embeddings alone, 49% when paired with BM25, 67% with a reranker on top. GraphRAG pushes multi-hop accuracy from 23% to 87% at indexing costs one to two orders of magnitude higher, and LazyGraphRAG recovers most of the quality at a fraction of the cost. Self-RAG and CRAG move retrieval policy into the model itself. None of them change the basic loop: embed, search, read, generate, repeat. Once per question, paying the full cost again.

RAG is the correct first answer to "how do I ground an LLM in my data." The problem is treating the embed-search-read-generate loop as an architecture when it's a first prototype.

Two branches. One keeps optimising the query-time loop: better rerankers, late interaction, hybrid search, learned retrieval policies. Most public work is there. The other compiles the corpus once into something the model can read directly. Pay the work upfront, when the source comes in.

Karpathy posted a gist in April 2026 calling this second branch an LLM Wiki.

## 2. The wiki reframes the loop

> The wiki is a persistent, compounding artifact. Instead of just retrieving from raw documents at query time, the LLM incrementally builds and maintains a persistent wiki.

I read this the first time on a Sunday and reread it twice looking for where the hard part was. The mechanics fit on one page.

Raw sources live at the bottom (PDFs, transcripts, pasted notes, web clips) and are immutable once saved. The wiki itself sits in the middle as a set of markdown pages the LLM writes, one page per concept or decision, linked into each other with wikilinks. On top sits a schema document: CLAUDE.md, AGENTS.md, whatever file states what the wiki is for. The LLM reads it every time it does anything else.

Ingest does the actual rewriting. A source comes in, the LLM reads it against the schema and the index, and edits whichever pages the source touches, often ten or fifteen at once.

Query looks lighter on paper: read the index, drill into a few pages, answer with citations. In practice query also writes back, because an answer worth keeping turns into a new page, and a query can kick off a small secondary ingest to save it.

Lint is the background pass and the unresolved design question. It walks the wiki for contradictions, stale claims, orphan pages, and missing cross-references. Nobody agrees on when it runs, how aggressive it should be, or what it does when it finds something.

Retrieval is incidental in this model. \`index.md\`, a plain markdown catalogue maintained by the LLM itself, works at the scale most projects actually live at (hundreds of sources, a few hundred pages) and removes the need for an embedding stack entirely. You can add vectors later if the catalogue stops scaling. You start without them.

Compilation is the analogy. Each ingest is an incremental build over the previous artefact rather than a fresh pass. A single source typically touches several pages, and a page integrates evidence from several sources. At query time the generator reads compiled pages instead of raw text. Two lines in the gist carry most of the argument: "The human's job is curate sources, direct analysis, ask good questions. The LLM's job is everything else," and "Most people abandon wikis because maintenance burden grows faster than value. LLMs don't get bored."

The first operation I tried to think through was lint, because I knew the first wiki I'd write would be wrong in ways I wouldn't notice. Karpathy's version is informal: run it periodically, read the report. He cites Vannevar Bush's Memex (1945) as prior art for the whole pattern: a private, curated knowledge store with associative trails between documents, maintained by the person who used it.

The original spec ignores time. It treats every piece of content as equally true forever.

A lifecycle extension bolts onto the wiki. Facts carry a confidence score that decays over time unless refreshed -- the shape of Ebbinghaus's forgetting curve -- and resets on access, so claims nobody revisits grow less trusted automatically. When a claim changes, the new version supersedes the old one and carries a pointer back. The old version stays in place. Edges between pages are typed: uses, depends on, contradicts, supersedes.

It's shipped at least three times, on very different substrates.

The shoestring version is Bash scripts against an Obsidian vault. A handful of agents, a set of skills, no build system except a contract around what tools each agent can touch. Every agent declares its primitives from a fixed set -- one might be allowed to read pages and write the index, but forbidden to touch the schema file. Anything off the list fails at build time. This design moves almost nothing to ingest time. The agents integrate on demand, and query-time work stays close to what you'd pay without the wiki. What breaks first is cross-platform skew: the same vault driving several LLM CLIs only stays coherent because the contract is narrow enough to hide their differences.

Tauri runtime, React front end, installable binaries. The heaviest version packs the whole thing into a desktop application and moves the most work to ingest. A source arrives, the pipeline runs a two-step chain-of-thought pass: analysis against the current purpose file and index, then generation of typed FILE blocks for everything the source touches. Ingest is keyed by content hash. Re-ingest is a no-op. Jobs run through a persistent crash-recoverable queue with retry so an interrupted ingest resumes instead of being lost. Optional vector search bolts onto the catalogue at the end. The ingest cost buys one thing: the wiki is already compiled by the time you open the app.

The most portable version is a plugin: one Agent Skills definition, every major LLM CLI, no build step. A single small markdown file -- the hot cache -- holds it together, a few hundred words of the recent context of work in progress. Session start reads it. Session end updates it. The gap between those two reads is where continuity lives. Without it, every new session opens with amnesia. The cache goes stale if work shifts between contexts without a session-end update. Nothing detects the staleness.

## 3. Other shapes of the same move

Before I settled on the wiki shape I'd been watching adjacent systems.

Letta (formerly MemGPT, [arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) pages between main context, recall, and archival tiers by function call. Mem0 extracts entity-and-relation facts from every message, resolves conflicts, and writes to a hybrid vector-plus-graph backend; on LOCOMO ([arXiv:2504.19413](https://arxiv.org/abs/2504.19413)) it reports 66.9% accuracy against OpenAI memory's 52%, with a six-point gap against a full-context baseline at 2,000 turns.

Zep does the most interesting thing in this group. Its graph layer, Graphiti ([arXiv:2501.13956](https://arxiv.org/abs/2501.13956)), timestamps every edge with \`valid_at\` and \`invalid_at\`. Old beliefs stay in the store with an explicit expiry. A query can ask what the system thought last Tuesday. That's the same problem the wiki's lifecycle extension tries to solve, from the database side.

Graph-RAG starts expensive. Microsoft's GraphRAG ([arXiv:2404.16130](https://arxiv.org/abs/2404.16130)) extracts an entity graph, runs Leiden clustering, pre-writes community summaries at every level. Community estimates put indexing at roughly $20-$50 per million tokens, and global-search queries can easily top half a million tokens each. Then Microsoft published LazyGraphRAG (November 2024), which drops the pre-summarisation and matches quality at roughly 1/700 the per-query cost. That's Microsoft Research admitting its own indexing pipeline was wasteful. LightRAG ([arXiv:2410.05779](https://arxiv.org/abs/2410.05779)) arrives nearby: lazy entity extraction at ingest, dual-level retrieval, lightweight per-query profile by design.

HippoRAG ([arXiv:2405.14831](https://arxiv.org/abs/2405.14831)) is the strangest. It turns the corpus into a concept graph of noun phrases and answers queries by running Personalized PageRank. Single-step multi-hop reasoning. The v1 failure was sparsity: the concept graph missed too many noun phrases for plain factual recall. HippoRAG 2 ([arXiv:2502.14802](https://arxiv.org/abs/2502.14802)) targets that gap.

Letta, Mem0, Zep, and every graph system above store their artefact in a database or index the reader never opens. The wiki is just markdown files.

## 4. When the wiki doesn't fit

In my experience, below roughly 50,000 tokens -- a soft, context-window-dependent threshold -- the corpus fits inside a modern context window and the wiki loses to full-context. The wiki starts being worth building around the point where the context stops holding the whole corpus, which is also the point where you have to start maintaining the compression. The upper bound is hundreds of sources and a few hundred pages, above which the plain markdown index stops scaling as a catalogue, and the pattern has to grow its own hierarchy or an embedding layer to keep working.

Ingest feeds back into the wiki. Karpathy is explicit about this: partial-context updates miss dependencies, compression drops nuance you can't recover. The feedback works through the ingest input. A pass reads existing wiki pages alongside the new source, so a slightly wrong summary already in the corpus becomes the authority the next ingest integrates against, and the error is inside the corpus by the time lint runs.

Lint is the prescribed fix. It catches contradictions and orphan pages cheaply. What it can't see is a quietly wrong summary that nothing downstream notices. Two shipped systems have already corrected for this in public. HippoRAG 2 ([arXiv:2502.14802](https://arxiv.org/abs/2502.14802)) explicitly rewrites v1's entity-centric indexing because it lost context during both ingest and inference. LazyGraphRAG is Microsoft Research admitting, in a product blog, that GraphRAG's upfront summarisation was prohibitive and wasted compute on documents the queries never touched.

Regulated content that relies on specific wording loses when the wiki paraphrases it. Plain vector RAG over the originals preserves the phrase the wiki dropped. Multi-author coordination breaks things differently. Collaborative Memory ([arXiv:2505.18279](https://arxiv.org/abs/2505.18279)) layers typed read/write permissions and provenance tracking over shared memory to keep per-user views isolated -- machinery a single-author wiki doesn't need.

Silent rot. Without a \`last_verified\` timestamp on each fact, the wiki can't tell which claims still hold and which have quietly gone stale. Zep's bi-temporal edges partly solve it for supersession, but nobody has a general answer for facts that nothing in the system is actively rechecking. A wiki that stops being maintained doesn't fail loudly. It starts lying, and you find out the next time you read the page.

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

I don't have a good way to tell whether the wiki is improving. Add-rate is easy to measure and doesn't mean what I'd like it to mean. The public benchmarks (LongMemEval [arXiv:2410.10813](https://arxiv.org/abs/2410.10813), LOCOMO [arXiv:2504.19413](https://arxiv.org/abs/2504.19413), DMR from MemGPT [arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) test single-turn factual retrieval and little else, and Zep's paper reporting on DMR ([arXiv:2501.13956](https://arxiv.org/abs/2501.13956)) admits the questions are ambiguous enough that a high score can reflect LLM inference skill rather than memory fidelity. No published benchmark measures time-travel consistency: the same question asked at different points as the corpus evolves. Summarisation-fidelity metrics like F-Fidelity and FaithEval exist. No memory system paper reports using them.

What the commit hooks catch is mechanical: schema violations, broken wikilinks, contradictions flagged by the narrative-schema linter. Silent regression, a quietly wrong summary that nothing in the system notices, shows up the next time I open the page. Or it doesn't.`,
  },
  {
    slug: "rag-breaks-earlier-than-people-think",
    lang: "ru",
    title: "RAG ломается раньше, чем кажется",
    date: "Apr 2026",
    summary:
      "У обычного RAG есть геометрический потолок, до которого большинство бенчмарков не добираются. LLM Wiki компилирует корпус один раз вместо повторного поиска на каждый запрос -- вот что ломается, когда её строишь.",
    tags: ["RAG", "LLM", "Knowledge Management", "Architecture"],
    category: "Architecture",
    featured: true,
    content: `## 1. RAG ломается раньше, чем кажется

Плоский RAG перестаёт работать раньше, чем предполагает большинство авторов, и ломается он структурно, а не от недостатка тюнинга. У векторного поиска с одним эмбеддингом есть потолок, и выше него ни реранкеры, ни гибридный поиск, ни большее окно контекста не спасают. Стек, который я использовал до того, как пересобрать хранилище, упёрся в этот потолок -- и база знаний из 197 коммитов, которая его заменила, началась как реакция на него.

Weller и соавторы (ICLR 2026) записывают потолок как неравенство. Для корпуса из $n$ документов, top-$k$ запросов и зазора score $\\gamma$ размерность эмбеддинга $d$ должна удовлетворять условию $d \\geq \\frac{\\log \\binom{n}{k}}{\\log(1 + 1/\\gamma)}$. Ниже этой границы часть top-$k$ комбинаций просто нельзя представить в векторном пространстве.

На практике разрыв между теоремой и реальностью оказывается меньше, чем хотелось бы. Потолок полезного корпуса -- в районе 250 миллионов документов при 4096 измерениях и около 1,7 миллиона при 768 (до сих пор стандарт для открытых моделей). Выше этих объёмов часть top-$k$-комбинаций уже вне досягаемости любого вектора, построенного ретривером.

Большинство бенчмарков на эту границу не выходят. LIMIT -- выходит. Пятьдесят тысяч документов, тысяча запросов, предложения типа «Jon likes apples». Лучшие эмбеддинг-модели падают ниже 20% Recall@100 при 4096 измерениях. BM25 выдаёт 97,8% Recall@2. Проблема в геометрии одного вектора: обученный эмбеддинг представляет конечное число top-$k$ наборов, и когда запрос выпадает из этого набора, ничего дальше по цепочке ситуацию не исправляет.

Следующим ломается чанкинг, и весит он столько же, сколько выбор модели. Исследование Vectara зафиксировало: у семантического чанкинга 91,9% recall и 54% итоговой точности. В среднем 43 токена на чанк -- полтора предложения. Генератору не хватает локального контекста, чтобы ответить по тому, что вернул ретривер.

Аттеншн обычно недооценивают. Полезная часть 128k-токенового контекста укладывается в 10–20% от номинального объёма: больше половины сниппетов можно выкинуть без ущерба для ответа. Модель скользит по поверхности. Смещение по позиции зашито в архитектуру. Один из возможных механизмов: каузальная маска копит внимание на первых токенах, а rotary embeddings добавляют долгосрочное затухание в score (это согласуется с разбором MIT в [arXiv:2502.01951](https://arxiv.org/abs/2502.01951)). Сдвиньте важное свидетельство с начала 32k-контекста в середину -- точность просядет примерно на 20%. Переход от 32k к миллиону смещение не снижает. Он увеличивает объём контекста, который модель и так игнорирует.

Ошибки складываются. Hard-negative документы -- похожие-но-не-те, которые хороший ретривер и должен находить -- ухудшают итоговую точность. А случайные несвязанные документы её улучшают, примерно на 35%. Починка одной проблемы обычно вскрывает следующую.

Улучшения есть, и все настоящие. Contextual Retrieval переписывает чанки с учётом окружающего контекста перед эмбеддингом: –35% провалов на одних эмбеддингах, –49% с BM25, –67% с реранкером сверху. GraphRAG поднимает точность на multi-hop-запросах с 23% до 87% ценой индексации на один-два порядка дороже, а LazyGraphRAG возвращает почти всё качество за малую долю этой суммы. Self-RAG и CRAG переносят политику извлечения внутрь самой модели. Ни одно из этих улучшений не меняет базовый цикл: эмбеддинг, поиск, чтение, генерация. Каждый запрос проходит цикл заново, платя полную цену.

От RAG отказываться не надо. RAG действительно правильный первый ответ на вопрос «как прицепить LLM к своим данным». Проблема в другом: к циклу эмбеддинг-поиск-чтение-генерация относятся как к архитектуре, хотя это прототип, разваливающийся на реальных размерах корпусов и реальной структуре релевантности.

Отсюда две ветки. Одна продолжает улучшать цикл в момент запроса: реранкеры, late interaction (ColBERT и наследники), гибридный поиск, обучаемые политики извлечения. Ветка продуктивна, и публичной работы там больше. Другая ветка устроена иначе. Вместо того чтобы платить за извлечение, чанкинг и внимание на каждом вопросе, корпус один раз компилируется во что-то, чем модель может пользоваться сразу. Вся работа делается заранее, в момент поступления источника.

Karpathy в апреле 2026 года опубликовал гист, где назвал вторую ветку LLM Wiki.

## 2. Вики переносит работу на другой конец цикла

> The wiki is a persistent, compounding artifact. Instead of just retrieving from raw documents at query time, the LLM incrementally builds and maintains a persistent wiki.

Я прочитал этот гист в воскресенье и перечитал дважды, пытаясь понять, где подвох. Записка короткая. Вся механика помещается на одну страницу.

Внизу лежат сырые источники (PDF, расшифровки, заметки, клиппинги с веба), и после сохранения они не меняются. В середине сама вики: набор markdown-страниц, которые LLM пишет и переписывает, по одной на концепцию или решение, связанных друг с другом вики-ссылками. Наверху файл схемы: CLAUDE.md, AGENTS.md, любой файл с описанием того, зачем эта вики и как её поддерживать. LLM читает его перед каждым действием.

Основную работу делает ингест. Приходит источник, LLM читает его вместе со схемой и индексом и правит страницы, которых источник касается, часто десять-пятнадцать за раз. Формально запрос проще: прочитать индекс, нырнуть в несколько страниц, ответить с цитатами. На деле запрос тоже пишет обратно: если ответ стоит того, чтобы его сохранить, он становится новой страницей, и запрос запускает маленький вторичный ингест.

Поиск тут вторичен. Karpathy прямо пишет, что \`index.md\`, простой markdown-каталог, который LLM ведёт сама, для большинства проектов хватает (сотни источников, несколько сотен страниц) и снимает потребность в эмбеддинг-стеке. Векторы можно добавить, когда каталог перестанет справляться. До тех пор они не нужны.

Гист строится на аналогии с компиляцией. Источники на входе, вики на выходе, каждый ингест -- инкрементальная сборка поверх предыдущего артефакта. Один источник обычно затрагивает несколько страниц. Через несколько ингестов каждая страница вбирает данные из разных источников, и результат перестаёт быть похожим на пересказ отдельного документа. Генератор работает по скомпилированным страницам, а не по сырому тексту. Главная мысль гиста в двух строчках: «The human's job is curate sources, direct analysis, ask good questions. The LLM's job is everything else» и «Most people abandon wikis because maintenance burden grows faster than value. LLMs don't get bored.»

Первая операция, которую я попытался продумать, был линт -- обход вики в поисках противоречий, устаревших утверждений, сирот и сломанных ссылок. Я знал, что первая написанная мной вики окажется неправильной в местах, которые я сам не замечу. У Karpathy линт описан неформально: запускай периодически, читай отчёт. На деле интересный вопрос в том, когда его запускать и что он делает, когда что-то находит. Гист оставляет это на читателя.

Karpathy ссылается на «Мемекс» Вэнивара Буша (1945) как на предшественника. «Мемекс» был задуман как личное курируемое хранилище знаний с ассоциативными связями между документами. Одна система, один человек, свои источники.

Исходная спецификация игнорирует время. Она считает любой контент одинаково верным навсегда, а реальные знания так не работают. Очевидное расширение -- прикрутить жизненный цикл. Факты получают оценку уверенности, и она убывает без обращений: утверждение, к которому никто не возвращается, теряет доверие само. При замене старая версия остаётся с обратным указателем. Рёбра между страницами типизированы (зависит от, противоречит, замещает), и по ним можно строить структурные запросы. Можно узнать, что вики считала верным в любой момент в прошлом. Файл схемы тут главный. Без него LLM не знает, как себя вести.

Всё это ничего не стоит, пока идея существует только в гисте. Она уже запущена как минимум три раза, на разных платформах, и интересно не то, что они все работают, а то, куда каждая перекладывает работу.

Бюджетная версия: bash-скрипты поверх Obsidian-волта. Горстка агентов, набор навыков и никакой билд-системы, кроме контракта на то, какие инструменты каждый агент может использовать. Каждый агент объявляет свои примитивы из фиксированного набора -- одному, например, разрешено читать страницы и писать индекс, но запрещено трогать файл схемы. Запросит что-то за пределами списка -- сборка упадёт. Эта конструкция почти ничего не перекладывает на ингест: агенты собирают по запросу, и работы примерно столько же, сколько без вики вообще. Первым ломается кросс-платформенный рассинхрон. Один волт на несколько LLM CLI остаётся консистентным только потому, что контракт достаточно узкий, чтобы не наступать на различия в интерфейсах.

Более тяжёлый подход упаковывает всё в десктопное приложение. Tauri-рантайм с React-фронтендом, установочные бинарники для трёх основных платформ. Сюда на ингест перекладывается больше всего работы. Приходит источник, и конвейер ингеста прогоняет двухшаговый chain-of-thought: сначала аналитическое чтение источника на фоне текущего файла целей и индекса, затем генерация типизированных FILE-блоков для всего, что источник затрагивает. Ингест привязан к хешу содержимого, так что повторный ингест ничего не делает, а задания проходят через персистентную очередь с перезапуском. Опциональный векторный поиск прикручен в конце. Весь этот ингест нужен ради одного: вики уже скомпилирована к моменту, когда вы открываете приложение. Архитектура заточена под один сценарий: очередь не должна терять состояние при крэше.

Самая портативная версия: плагин. Одно Agent Skills определение, которое запускается на любом крупном LLM CLI без этапа сборки. Всё держится на одном маленьком markdown-файле -- горячем кэше в несколько сотен слов, хранящем свежий контекст текущей работы. В начале сессии он читается, в конце обновляется, и непрерывность держится именно на этом промежутке. Без него каждая новая сессия начинается с амнезии. Кэш протухает, если работа переключается между контекстами без обновления в конце сессии, и ничто в системе этого не замечает.

## 3. Другие формы того же манёвра

Прежде чем остановиться на вики, я перебирал соседние системы. Все переносили работу на ингест, и все по-разному отвечали на вопрос, что после ингеста остаётся и кому с этим потом разбираться.

Letta (бывший MemGPT, [arXiv:2310.08560](https://arxiv.org/abs/2310.08560)) переключает данные между основным контекстом, recall-хранилищем и архивом через function call. Mem0 извлекает факты entity-and-relation из каждого сообщения, разрешает конфликты и пишет в гибридное хранилище (вектор + граф); на бенчмарке LOCOMO ([arXiv:2504.19413](https://arxiv.org/abs/2504.19413)) он показывает 66,9% точности против 52% у памяти OpenAI, с отставанием в шесть пунктов от full-context-бейзлайна на 2000 ходов.

Zep делает самое интересное в этой группе. Его графовый слой, Graphiti ([arXiv:2501.13956](https://arxiv.org/abs/2501.13956)), ставит временны́е метки \`valid_at\` и \`invalid_at\` на каждое ребро. Старые убеждения остаются в хранилище с явным сроком годности. Запрос может спросить, что система считала верным в прошлый вторник. Это тот же вопрос, который пытается решить lifecycle-расширение вики, только со стороны базы данных.

Граф-RAG-системы стартуют дорого. GraphRAG от Microsoft ([arXiv:2404.16130](https://arxiv.org/abs/2404.16130)) извлекает граф сущностей, запускает Leiden-кластеризацию и заранее пишет саммари сообществ на каждом уровне. По оценкам сообщества, индексация стоит $20-$50 за миллион токенов, а global-search-запросы легко переваливают за полмиллиона токенов. Потом Microsoft опубликовал LazyGraphRAG (ноябрь 2024), где выкинули предварительную суммаризацию и получили то же качество примерно за 1/700 стоимости запроса. Это Microsoft Research признаёт, что их собственный индексационный пайплайн был расточительным. LightRAG ([arXiv:2410.05779](https://arxiv.org/abs/2410.05779)) стоит рядом: ленивое извлечение сущностей на ингесте, двухуровневый поиск, принципиально лёгкий per-query-профиль.

HippoRAG ([arXiv:2405.14831](https://arxiv.org/abs/2405.14831)) -- самый странный из всех. Он превращает корпус в концептный граф из именных групп и отвечает на запросы, прогоняя Personalized PageRank. Multi-hop-рассуждение за один шаг. Провал v1 -- разреженность: концептный граф упускал слишком много именных групп для обычного факт-поиска. HippoRAG 2 ([arXiv:2502.14802](https://arxiv.org/abs/2502.14802)) целится именно в этот провал.

Вики отличается тем, что результат компиляции -- обычный markdown. Файлы, которые человек может открыть, отредактировать и прочитать. Системы памяти прячут артефакт в базу данных, граф-системы -- в кластерное дерево или PageRank-скор. Когда что-то идёт не так, вики ломается у тебя на виду. Остальные ломаются за стеной абстракции, и ты узнаёшь об этом по качеству ответов, а не по состоянию хранилища.

## 4. Когда вики не подходит

Вики-паттерн работает не на любом масштабе и не в любой предметной области. Я насчитал три режима сбоя, которые можно описать конкретно. Четвёртый скорее подозрение, чем диагноз.

По моему опыту, ниже примерно 50 000 токенов -- граница здесь мягкая и зависит от окна контекста модели -- корпус помещается в контекстное окно современной модели, и вики проигрывает полному контексту. Запускать компрессию раньше -- значит платить за то, что модель и так может обработать целиком. Верхняя граница тоже описана в гисте: Karpathy оценивает рабочий диапазон в сотни источников и несколько сотен страниц, выше чего плоский markdown-индекс перестаёт работать как каталог и паттерну приходится отращивать иерархию или эмбеддинг-слой.

Второй режим сбоя: накопление ошибок. Karpathy называет его в оригинальном гисте: ингест возвращает результаты обратно в вики, обновления на частичном контексте упускают зависимости, а компрессия теряет нюансы без возможности восстановления. Петля замыкается через вход ингеста. Проход читает существующие страницы вики вместе с новым источником, поэтому слегка ошибочный саммари, уже попавший в корпус, становится авторитетом для следующего ингеста, и ошибка оказывается внутри корпуса к моменту, когда линт добирается до неё. Самое неприятное: такая ошибка выглядит как нормальный текст. Линт тут штатное лекарство. Он ловит противоречия и сирот-страницы дёшево, но тихо ошибочный саммари ему не виден, если ничто ниже по потоку не замечает расхождения. Это уже ломалось публично. HippoRAG переписал свою индексацию во второй версии, потому что первая теряла контекст и при ингесте, и при инференсе. LazyGraphRAG -- признание, что предварительная суммаризация GraphRAG тратила вычисления на документы, до которых запросы так и не добрались.

Паттерн также не работает в областях, где важна точная формулировка, и в корпусах с несколькими авторами. Регулируемый контент, завязанный на конкретные формулировки, проигрывает, когда вики их перефразирует, а обычный векторный RAG по оригиналам сохраняет ту фразу, которую вики потеряла. Многоавторская координация давит с другой стороны: Collaborative Memory ([arXiv:2505.18279](https://arxiv.org/abs/2505.18279)) накручивает над общей памятью типизированные read/write-разрешения и отслеживание происхождения, чтобы per-user-взгляды не смешивались -- механика, без которой одноавторская вики спокойно обходится.

Четвёртый режим сбоя: тихое гниение. Без временно́й метки \`last_verified\` на каждом факте вики не может определить, какие из её утверждений ещё верны, а какие тихо устарели. Bi-temporal рёбра Zep частично решают проблему для случая замещения, но общего ответа для фактов, которые ничто в системе активно не перепроверяет, ни у кого нет. Вики, за которой перестали следить, не падает с грохотом. Она начинает врать, и обнаруживаешь это в следующий раз, когда откроешь страницу.

## 5. Что ломается первым, когда строишь вики

Вики-хранилище ломается в определённой последовательности. Правила для каждой поломки я узнал, сначала выкатив неправильный фикс.

Первая поломка: свободноформатные страницы решений не выживают, когда по ним начинают делать запросы. Писать решения без шаблона удобно ровно до момента, когда задаёшь вопрос типа «какие решения зависят от выбора остаться на Python» и обнаруживаешь, что \`depends_on\` есть в одних страницах, а в других нет, где-то списком, где-то прозой. Шаблоны нужны ровно для одного: они превращают кучу страниц в корпус, по которому можно строить запросы. Фронтматтер-схема должна проверяться на коммите, потому что добровольные схемы деградируют.

Вики-ссылки ломаются следующими. Можно неделями писать читаемые тексты, в которых решение упоминается по имени, но ни разу не линкуется. Потом пытаешься обойти граф. Граф готов наполовину: тело текста называет концепции, которых нет во фронтматтере, фронтматтер перечисляет страницы без обратных ссылок в теле, а структура ссылок определяется тем, что автор вспомнил в то утро. Перелинковать задним числом недолго, если есть обходчик графа. Без него дорого по вниманию. Правило, к которому я пришёл: ссылки и упоминания пишутся в одной правке. Страница, в теле которой упомянут концепт без ссылки, не проходит коммит. Так исчезает целый класс работы «потом перелинкую», потому что правило делает «потом» невозможным.

Мой первый инстинкт с решениями: ADR-традиция. Написал один раз, при изменении создаёшь новый документ, замещающий старый. Работает, когда решения редки, а запись имеет юридическую силу. В живой вики получается чаща. Два файла, и читатель должен знать, какой из них актуален. Лучше один файл на тему, текущее состояние наверху, а аудит-трейл вынесен из вики целиком, в append-only лог, где каждое изменение записывается строкой с таймстэмпом, плюс всё, что и так даёт version control. Для тех, кто учился писать решения в культуре комплаенса, это неудобно. Работает тем не менее.

Некоторые правила верны, но применены не в том месте. Первая версия моего inbox-хука блокировала любой коммит, если в staging-папке оставались необработанные сырые файлы. Правило здравое: staging не должен превращаться в кладбище. Но на коммите оно работало против меня: сессия, которая начинается с того, что ты кидаешь расшифровку в staging, а потом делаешь реальную работу, всю сессию будет содержать необработанный файл, и ни одного коммита сделать не получится. Перенос проверки с коммита на мёрдж-гейт решил проблему. Коммит, пуш и мёрдж -- разные инструменты, и их смешение создаёт помехи.

Первый схема-линтер, который я написал, слишком доверял прозе. Он сканировал каждый токен в теле страницы и помечал всё, что выглядело как значение enum из фронтматтер-схемы. Придуманные значения он ловил правильно. Но он также ловил слово «active» посреди предложения и «draft» во фразе «первый черновик», и блокировал коммиты, с которыми всё было в порядке. Переписанная версия сканирует только код в бэктиках. Значения в бэктиках машиночитаемы, проза остаётся нетронутой. Линтер выжил потому, что стал узким.

Допущения под одного агента ломаются рано. Рулбук, выросший на модели прав, наборе инструментов и стиле вызова навыков одной платформы, не переносится, когда появляется второй агент. Натягивание интерфейса одного на рулбук другого маскирует структурные изменения, которые уже произошли. Выжившая форма: два равноправных рулбука и хук, отклоняющий коммиты при расхождении зеркал. Каждый навык пишется под оба рулбука в одной правке. Цена на навык выше. Зато любой из агентов может подхватить хранилище с нуля и работать с ним, и это оказывается важнее, чем ожидалось, когда работа должна пережить конкретную CLI-сессию.

На этапе закалки хранилища метаданные итерируются быстрее контента. Файлы правил, документы схемы, лог аудита: это самые редактируемые артефакты, а отдельные страницы решений нет. Поначалу это выглядит как запах, потому что управление, меняющееся быстрее управляемого корпуса, противоречит интуиции, а потом перестаёт. Контент накапливается тихо. Правила вокруг контента эволюционируют быстро, потому что реальные требования проявляются только тогда, когда реальный контент уже есть. Когда метаданные перестают меняться, хранилище либо закалилось, либо умерло.

Хорошего способа определить, становится ли вики лучше, у меня нет. Скорость добавления легко измерить, но она говорит не о том, о чём хотелось бы. Публичные бенчмарки тестируют однократное фактическое извлечение: один вопрос, один ответ, зачёт. Ни один не измеряет консистентность во времени -- один и тот же вопрос, заданный в разные моменты эволюции корпуса. Метрики достоверности суммаризации существуют, и ни один отчёт по системам памяти их не использует. Коммит-хуки ловят механическое: нарушения схемы, битые ссылки, противоречия. Тихая регрессия обнаруживается в следующий раз, когда открываешь страницу. Или не обнаруживается.

Неудобная часть этого подхода в том, что он звучит как оверхед. Стоимость поддержания заплачена заранее в шаблонах, схеме, цепочках хуков и форме append-only лога, а стоимость каждого коммита после этого близка к нулю. Длинная встреча превращается в дюжину пре-линкованных страниц решений за время одного ингест-прохода, потому что обходчики графа и схема делают ту работу, которую автор делал бы руками. Снаружи не видно, что всё в хранилище уже прошло через валидацию к моменту, когда читатель до него добирается. Но это верно не для каждой правки. Необратимые правки по-прежнему требуют записи в логе с моим именем. Поле \`decided_by\` во фронтматтере решения всегда заполняется человеком; агенты его не трогают. Спорные утверждения остаются на месте, контраргументы добавляются ниже, молчаливая перезапись исключена.`,
  },
];

export const categories = ["All", "Architecture"];
