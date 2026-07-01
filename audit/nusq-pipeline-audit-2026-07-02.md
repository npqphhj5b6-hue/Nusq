# Nusq AI Pipeline Audit — Sourcing & Quality

**Date:** 2026-07-02
**Scope:** `src/app/api/pipeline/route.ts` (1,791 lines) and `src/lib/source-credibility.ts` — the full ingestion → triage → selection → enrichment → drafting → quality-pass chain that produces each daily briefing.
**Brief:** Evaluate whether Firecrawl or other tooling can improve freshness, quality, jargon-free human writing, and MENA relevance.

**Bottom line up front:** the prompt engineering is already very strong — the voice rules, the four-layer story structure, the anti-hallucination constraints, the jargon-explaining instructions are all well built and don't need rework. The actual bottleneck is upstream: **the model drafting a 150–250 word story is working from roughly 250 characters of RSS snippet text, not the article itself.** That's the single highest-leverage thing to fix, and it's exactly the kind of gap Firecrawl is built to close.

---

## 1. How the pipeline actually works today

1. **Ingestion** (`fetchNewsWithSources`) — 20 Google News RSS queries (English + Arabic), 8 items each, deduped, Tier-3 (unrecognized) publishers dropped, filtered to a 72h window (falls back to 7 days if too few remain).
2. **Relevance filter** — Haiku scores every remaining item 0–10 against the "Gulf capital filter"; anything under 5 is dropped.
3. **Triage** — Haiku ranks the survivors by materiality, returns 5 candidates with a two-country diversity requirement.
4. **Selection** — Haiku picks exactly 2 of those 5 (anchor + supporting thread, different countries).
5. **Enrichment** (`enrichStory`) — Sonnet + up to 3 web searches *per selected story*, asked to find "the single most relevant supporting data point" (1–3 sentences).
6. **Drafting** (`runPipelineCore`, stage 4) — Sonnet writes the full briefing from: the 2 selected seeds' 250-char snippets, the 1–3 sentence enrichment note, and the numbered source list (also 250-char snippets each).
7. **Quality pass** — a second Sonnet call rewrites bodies to strip blacklisted phrases, fix sentence rhythm, and enforce citation traceability.
8. **Images/charts/counter-evidence** run in parallel, then the draft is inserted with `status: "draft"` and an email goes to you for review.

This is a genuinely well-designed editorial pipeline — the Gulf capital filter, two-country diversity rule, counter-evidence detection, and Arabic-source-surfacing instructions are all doing real work. The weak point is what stage 4 actually has to work with.

## 2. Root cause: drafting from snippets, not articles

Look at `RawSourceItem.snippet`:

```ts
const snippet = (item.contentSnippet ?? item.content ?? title).substring(0, 250).trim();
```

That's the *only* article content that ever reaches the model. `numberSources()` (line 448) builds the entire source list for the drafting prompt out of `title | publisher | date | url` plus that 250-character snippet — nothing more. The enrichment stage adds one extra fact per story via a targeted web search, but it explicitly asks for "the SINGLE most relevant supporting data point," not the article's content.

So the model is asked to write ~200 words of specific, numbered, four-layer analysis — fact, Gulf context, capital implication, a falsifiable watch signal — from source material that's shorter than this paragraph. Two things follow directly from that mismatch, and both map onto your stated priorities:

- **Quality/humanity suffers** because there isn't enough real detail to be specific about. The prompt's anti-hallucination rules ("if a value isn't in the sources, say it wasn't disclosed") are fighting against genuine information starvation — the likely failure mode isn't wild hallucination, it's the writing defaulting to safe, generic phrasing because the concrete details it needs (the second number, the named quote, the precise mechanism) simply aren't in the 250 characters it has.
- **The Arabic-source edge is undercut.** The prompt's best differentiator — "first reported by Al Eqtisadiah, ahead of any English coverage" — requires the model to actually know what the Arabic article said. A 250-character snippet can't carry that.

This is not a prompt problem. It's a "the model never gets to read the article" problem.

## 3. Secondary issues

**Discovery is bottlenecked entirely through Google News RSS.** All 20 queries hit `news.google.com/rss/search`. That means:
- Coverage of GCC official sources (SAMA, PIF, Tadawul, the UAE Central Bank) is entirely incidental — the pipeline never queries these institutions directly, only picks them up if a wire story happens to mention them and Google News happens to index it fast enough. A same-day SAMA rate decision could be missed if no wire picks it up within the freshness window.
- Google News' Arabic-language indexing is patchier than its English indexing, which works against the exact differentiator (Arabic-first sourcing) the product is built around.
- Google News RSS is an undocumented, scraped endpoint — it can silently degrade or break with no warning.

**Feed failures are silent.** `catch { // skip failed feeds silently }` (line 399) means if 15 of 20 feeds fail on a given run — rate limiting, a markup change, anything — the pipeline still "succeeds," just with a smaller, less diverse candidate pool, and nothing logs or alerts on it. This directly threatens freshness and relevance without ever surfacing as an error.

**These are real but secondary.** Fixing snippet-starvation (§2) is the change that most directly moves quality, jargon-free writing, and human tone. The discovery-layer issues mostly affect freshness/relevance at the margins.

## 4. Firecrawl — what it actually offers, and where it fits

Checked against Firecrawl's current docs and pricing (not assumed from training data):

- **Scrape endpoint**: 1 credit/page, turns any URL into clean, LLM-ready markdown, handles JS rendering, paywalls-adjacent anti-bot detection, and strips boilerplate — i.e., exactly "give me the actual article text" for a URL you already have. ([Firecrawl pricing](https://www.firecrawl.dev/pricing), [scrape endpoint guide](https://www.firecrawl.dev/blog/mastering-firecrawl-scrape-endpoint))
- **Search endpoint with `sources: ["news"]` + `scrapeOptions`**: combines discovery and full-content extraction in one call — returns title, URL, and full markdown per result, not just a link. ([search endpoint guide](https://www.firecrawl.dev/blog/mastering-firecrawl-search-endpoint), [docs](https://docs.firecrawl.dev/api-reference/endpoint/search))
- **Cost**: Growth-tier pricing is roughly $0.0006–0.0008 per page scraped; a free tier ships with 1,000 credits/month. For a daily pipeline that only needs to scrape 2 articles (anchor + supporting, post-selection) that's fractions of a cent per day. ([pricing breakdown](https://www.eesel.ai/blog/firecrawl-pricing))

**Where it fits your pipeline specifically**: not as a replacement for the RSS discovery layer, but as a new step inserted **after Selection (stage 2), before Enrichment (stage 3)** — scrape the full text of the two already-selected seed URLs (using the redirect-resolved, non-Google-News URL you already compute in `resolveRedirect`), and feed that full text into the drafting prompt in place of the 250-char snippet. This is additive, low-risk, and targets the actual bottleneck: you're only ever scraping 2 URLs/day, not rearchitecting ingestion.

A secondary, larger option is using Firecrawl's `/search` with `sources: ["news"]` to widen discovery beyond what Google News RSS chooses to index — genuinely useful for the "Arabic edge" and for catching Tier-1 official releases faster, but it's a bigger change that touches the whole ingestion layer and would need its own testing pass. I'd treat this as a phase-2 item, not part of the first fix.

## 5. Alternatives considered

- **Direct RSS from the actual outlets** (Argaam, Zawya, Al Arabiya, Asharq Business, etc. mostly have their own RSS feeds) instead of routing everything through Google News' index. Free, no new dependency (`rss-parser` already handles this), and removes the Google-News-indexing bottleneck. Worth doing regardless of the Firecrawl decision — it's complementary, not competing.
- **Raw `fetch()` + a readability parser** (e.g. `@mozilla/readability`) as a free version of "get the full article text." This works for plain HTML pages but will fail against JS-rendered pages and the anti-bot protection some MENA financial sites run — which is exactly what you're already routing around in `resolveRedirect`'s GET-follow fallback. Firecrawl is the more reliable version of the same idea, at a cost of fractions of a cent/day for the volume you need.
- **Exa or Tavily** (LLM-native search-with-content APIs) — functionally similar to Firecrawl's search endpoint. Not evaluated in depth since Firecrawl's scrape endpoint alone already solves the actual bottleneck (§2) without needing a discovery-layer change at all.

## 6. Recommendation, in priority order

1. **Fix the snippet-starvation problem first.** After Stage 2 selects the anchor + supporting URLs, scrape their full text (Firecrawl scrape, or a fetch+readability fallback for sites Firecrawl can't reach) and pass that into the Stage 4 drafting prompt instead of the 250-char snippet. This is the change most directly tied to "fresh, high quality, human, jargon-free" — everything else in the prompt is already built to use real detail well, it just isn't getting any.
2. **Add direct RSS feeds for known-good Arabic/MENA financial outlets** alongside the existing Google News queries, so the Arabic-source differentiator doesn't depend on Google's indexing speed.
3. **Log and surface RSS feed failure counts** (per-run, e.g. in the admin email or a simple console metric) so degraded ingestion is visible instead of silent.
4. **Optional, later**: evaluate Firecrawl's `/search` with `sources: ["news"]` as a broader discovery layer alongside or instead of Google News RSS — bigger change, worth its own pass once #1 is validated.

I haven't made any code changes — this is diagnosis and recommendation only. Item #1 is a scoped, additive change (new step between Selection and Enrichment, one new env var for the Firecrawl API key) if you want me to build it next.
