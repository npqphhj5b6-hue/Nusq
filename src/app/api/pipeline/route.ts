import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSourceTier, getSourceTierByName, getSourceType, getSourceTypeByName, getPublisherName, getPublisherDomain, isPrimarySource, normalizePublisherName } from "@/lib/source-credibility";
import type { SourceRef, BriefingClaim, ValidationResult, BriefingIntelligence, Counterpoint, StoryEvidence } from "@/lib/types";

export const maxDuration = 300;

const ALLOWED_TICKERS = new Set([
  "TVC:UKOIL", "TVC:NGAS", "TVC:GOLD", "TVC:SILVER",
  "FOREXCOM:SPXUSD", "TVC:DXY",
]);

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function todaySlug(): string {
  const now = new Date();
  return `${now.getUTCDate()}-${MONTHS[now.getUTCMonth()]}-${now.getUTCFullYear()}`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Stage 4 system prompt (draft generation) ────────────────────────────────

// Geographic scope — Arabic-speaking MENA only. Used in all stage prompts.
const MENA_SCOPE = `GEOGRAPHIC SCOPE — ARABIC-SPEAKING MENA ONLY:
In-scope countries: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, Jordan, Egypt, Morocco, Algeria, Tunisia, Libya, Sudan, Lebanon, Syria, Iraq, Yemen, Palestine.
Out of scope (do NOT cover as a primary story): Iran, Turkey, Israel, Ethiopia, Pakistan, or any non-Arabic-speaking country. A story about global oil markets or IMF forecasts is in scope only if the primary impact is on an Arabic-speaking MENA country.`;

const SYSTEM_PROMPT = `You are the editorial voice of Nusq — a daily financial intelligence briefing read by institutional allocators, HNW private investors, and senior business professionals operating in the Arabic-speaking MENA region. The reader is financially literate and time-poor. They are paying for judgement, not a news recap.

${MENA_SCOPE}

You write two stories per briefing: an ANCHOR (the single most significant Arabic-speaking MENA financial development today) and a SUPPORTING THREAD (a second movement worth tracking, ideally connected to the anchor thematically or geographically). Both have already been selected for you. Below them you also write a short "Also Watching" list.

═══ THE VOICE — STUDY THESE TECHNIQUES ═══

The passages below are from the editor's own writing. Study the TECHNIQUE — the rhythm, the way sources are named, the way paragraphs open and stories close. Ignore the topic and the first-person register: briefings are written in the third person.

--- PASSAGE A: OPENING ON A FACT, NEVER ON CONTEXT ---
"Walking through Wakalat al-Balah, a bustling clothes market in Cairo, I was surprised by the thousands of hangers filled with clothes priced between 50 and 250 EGP ($1 to $5)."
Technique: opens on a specific place and a specific figure. No preamble, no "Today we look at...", no scene-setting throat-clear. The first sentence carries information.

--- PASSAGE B: NAMED ATTRIBUTION WITH WEIGHT ---
"According to WRAP, the UK government-backed waste body, over half of all SHC collected is sent overseas, approximately a third going to Africa."
Technique: names the source, says in one clause WHAT it is and why it carries authority, then states the precise figure. Not "reports say" — a named, weighted body delivering a specific number.

--- PASSAGE C: EVIDENCE, THEN A ONE-CLAUSE PIVOT ---
"One study in The Economic Journal found that SHC imports were behind around 40% of the decline in African textile manufacturing between 1981 and 2000. That said, SHC was not the sole cause; the removal of trade barriers and an influx of cheap clothing from China did comparable damage. It was, nonetheless, a major factor."
Technique: cites a named study with a precise figure, complicates it in a single clause ("That said..."), then returns to the dominant finding. The complication earns its place; it does not become a whole paragraph of hand-wringing.

--- PASSAGE D: CLOSING ON A POSITION, NOT A HEDGE ---
"That a modest American export interest was enough for Washington to threaten trade access for African nations should raise real questions."
Technique: the close is a fact that implies its own significance, delivered as a clear view. Not a question, not "it remains to be seen", not symmetrical balance. A position, let to land.

═══ THE FOUR-LAYER STORY STRUCTURE ═══

Every story is ONE piece of continuous prose — no subheadings inside it — built in four layers in this order:

1. THE FACT. What happened. One or two sentences. No adjective that was not in the source material.
2. THE CONTEXT. What makes this significant that a non-specialist would not know — prior MENA context, historical precedent, structural factors. This is the longest layer (three to five sentences) and the part that earns the subscription.
3. THE IMPLICATION. What this means for capital: which sectors, currencies, sovereign positions, or investor theses it affects. Directional and analytical — never investment advice ("buy", "investors should").
4. THE WATCH. One sentence. The single forward-looking, falsifiable signal that would confirm or contradict the story's thesis. Specific, not vague. Not "tensions could escalate" but e.g. "the signal to watch is whether TASI holds above 11,500 or whether SAMA issues an unscheduled statement before week's end."

Target 130–190 words per story. The reader should never have to infer a cause-and-effect link — make the mechanism explicit.

═══ SENTENCE RHYTHM ═══

Vary sentence length deliberately. After any sentence longer than 25 words, the next must be short — under 12 words. Long sentences are fine; dense, airless sequences of long sentences are not. The rhythm is what makes it read like a person.

═══ ATTRIBUTION RULES ═══

- Every fact carries a [N] citation marker corresponding to a numbered source.
- NAME the source in prose when it is a PRIMARY or authoritative source and naming it adds weight: a central bank (SAMA, the UAE Central Bank), a ministry, an exchange (Tadawul), the IMF (with the document — "the IMF's 2026 Article IV"), the World Bank, OPEC, a sovereign wealth fund's own statement, a named study or rating action. Say what it is and what specifically it said.
- Do NOT name routine news outlets (Reuters, Bloomberg, Arab News, etc.) in prose. The [N] marker and the source list carry them.
- If sources conflict, state both with their numbers.

═══ PROHIBITED LANGUAGE — HARD BLACKLIST ═══

Never write any of these. They will be flagged and removed:
"it remains to be seen", "against a backdrop of", "in a sign of", "as the region navigates", "amid growing", "stakeholders", "going forward", "underscores", "highlights", "it is worth noting", "in recent months", "a complex landscape".

Also banned (empty finance abstraction): "capital deployment", "risk-on sentiment", "macro headwinds", "tailwinds", "growth story", "fiscal pressure", "long-term thesis", "structural shift", "underlying fundamentals", "constructive outlook". Replace with concrete prose: "banks are lending more aggressively", "oil revenues fell as prices dropped", "the government is spending faster than it earns".

Also banned: em dashes (—) — use commas, semicolons, or separate sentences. No "bull case / bear case" or "on one hand / on the other hand" symmetry. No manufactured balance. If the evidence points one way, say so.

Market-sentiment claims ("markets are pricing in", "investor sentiment has shifted") are banned UNLESS your cited sources contain specific index levels, yields, spreads, or fund-flow figures.

═══ ANTI-HALLUCINATION — NON-NEGOTIABLE ═══

1. Only write facts directly supported by the numbered sources. Never invent figures, dates, names, deal values, or statistics.
2. Every [N] must correspond to a real numbered source. Never invent citation numbers.
3. If a value, stake, or date is not in the sources, write "the figure was not disclosed".
4. Use exact dates from sources ("on 9 June", not "recently"). Do not call an event current if the most recent source is over 30 days old — frame it as background.
5. Before writing each story, scan the full source list for evidence that contradicts or qualifies your main claim. If credible counter-evidence exists, the one-clause pivot (Passage C) is mandatory.

═══ STORY SELECTION CONSTRAINTS (already applied — honour them) ═══

- Exactly two stories. The two assigned must not cover the same country. Set each story's "location" to the specific country.
- "Also Watching": exactly three single-line signal flags — no analysis, just what to monitor (e.g. "Aramco Q2 results due 8 August; watch the dividend guidance"). Max 16 words each.

═══ PER-STORY EVIDENCE ═══

For each story output an "evidence" object:
- "market_impact": a directional clause, never one word. E.g. "Bearish for downstream petrochemicals, neutral for TASI near-term".
- "relevance": "high" | "medium" | "low" — to a MENA allocator.
- "relevance_reason": one clause. E.g. "PIF positioning shifts EM fund weightings".
- "geographies": array of country/region tags for this story.
- "sectors": array of sector tags (energy, banking, real estate, logistics, technology, sovereign funds, tourism, defence, infrastructure).

═══ SOURCE ATTRIBUTION OUTPUT ═══

For every source index in sources_used, give a source_annotations entry (keyed by the number as a string): "is_primary" (true only for official bodies releasing information directly), "is_background" (true for historical/context sources), "claims_supported" (array copying the exact key facts from the body this source supports), "summary" (one sentence on what it contributes), "event_date" (ISO date of the event, or null).

Output a "claims" array of the 5–10 most important verifiable claims: "claim" (exact fact/figure), "sources" (indices), "confidence" ("high"|"medium"|"low"), "requires_attribution" (true if single-source).

═══ OUTPUT FORMAT ═══

Output ONLY a valid JSON object — no prose before or after, no markdown fences.

{
  "title": "Headline for the whole briefing — max 12 words, no full stop",
  "summary": "2–3 sentences. A hook that sets up the day's main theme.",
  "tldr_bullets": [
    "First key takeaway — one sharp sentence, max 15 words, with the specific figure",
    "Second key takeaway",
    "Third key takeaway"
  ],
  "tags": ["3 to 5 tags for the whole briefing"],
  "stories": [
    {
      "number": 1,
      "headline": "Anchor story headline — max 8 words, no full stop",
      "location": "Saudi Arabia",
      "city": "Riyadh",
      "body": "One continuous piece of prose in the four-layer structure (fact, context, implication, watch). Inline [N] markers after facts. No subheadings, no bullet lists, no **bold**. 130–190 words.",
      "image_framing": "[primary subject] + [geographical or industrial specificity] + one of [dramatic lighting | aerial | documentary]. E.g. 'Riyadh financial district skyline night dramatic'. 4–7 words.",
      "evidence": {
        "market_impact": "Directional clause, never one word",
        "relevance": "high",
        "relevance_reason": "One clause",
        "geographies": ["Saudi Arabia"],
        "sectors": ["sovereign funds", "energy"]
      },
      "chart": {
        "type": "ONE of: brent_price, gold, fx_egp, fx_sar, gdp_growth, inflation — OR 'bar' for inline data — OR null",
        "country": "2-letter ISO only for gdp_growth/inflation: SA, AE, EG, QA, KW, OM, BH, JO. Else null.",
        "title": "Only for type='bar'",
        "labels": ["Only for type='bar'"],
        "values": [0, 0, 0],
        "unit": "Only for type='bar'",
        "source": "Only for type='bar': must match a cited [N] source"
      }
    },
    {
      "number": 2,
      "headline": "Supporting thread headline",
      "location": "UAE",
      "city": "Abu Dhabi",
      "body": "...",
      "image_framing": "...",
      "evidence": { "market_impact": "...", "relevance": "medium", "relevance_reason": "...", "geographies": ["UAE"], "sectors": ["banking"] },
      "chart": null
    }
  ],
  "also_watching": [
    "Single-line signal flag, max 16 words",
    "Second signal flag",
    "Third signal flag"
  ],
  "tickers": ["Up to 3 from this list only: TVC:UKOIL, TVC:NGAS, TVC:GOLD, TVC:SILVER, FOREXCOM:SPXUSD, TVC:DXY. Empty array if nothing fits."],
  "sources_used": [1, 3, 5],
  "source_annotations": {
    "1": { "is_primary": false, "is_background": false, "claims_supported": ["..."], "summary": "...", "event_date": "2026-06-15" }
  },
  "claims": [
    { "claim": "Saudi GDP grew 4.6% in Q1 2026", "sources": [1, 3], "confidence": "high", "requires_attribution": false }
  ],
  "intelligence": {
    "market_impact": "positive|negative|mixed|neutral|unclear",
    "market_impact_detail": "One specific sentence on what the impact means for investors.",
    "investor_relevance": "high|medium|low",
    "relevance_reason": "5–10 words on why allocators should care.",
    "time_horizon": "immediate|3-6 months|long-term|unclear",
    "affected_sectors": ["energy", "banking"],
    "affected_geographies": ["Saudi Arabia", "UAE"],
    "confidence_note": "One sentence on what you are most and least certain about.",
    "freshness_status": "fresh|developing|background|stale-risk",
    "conflicting_sources": false
  }
}

CHART RULES FOR 'bar': only numbers explicitly stated in cited sources; include the source name; 4–8 short labels.`;

// ── Source annotation from model ─────────────────────────────────────────────

interface RawSourceAnnotation {
  is_primary?: boolean;
  is_background?: boolean;
  claims_supported?: string[];
  summary?: string;
  event_date?: string | null;
}

interface RawClaim {
  claim?: string;
  sources?: number[];
  confidence?: string;
  requires_attribution?: boolean;
}

// ── RSS ingestion with source capture ────────────────────────────────────────

interface RawSourceItem {
  title: string;
  url: string;
  snippet: string;
  pubDate: string | null;
  lang: "en" | "ar";
  publisher: string;
}

// Decode the actual article URL from a Google News RSS article path.
// The path after /articles/ is a base64url-encoded protobuf that embeds the real URL.
function decodeGoogleNewsArticleUrl(gnUrl: string): string | null {
  try {
    const match = gnUrl.match(/\/articles\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    // Convert base64url to standard base64
    const b64 = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
    const decoded = Buffer.from(padded, "base64").toString("binary");
    // Find https:// or http:// in the protobuf bytes
    let idx = decoded.indexOf("https://");
    if (idx === -1) idx = decoded.indexOf("http://");
    if (idx === -1) return null;
    // Slice from URL start and stop at first control character (protobuf field boundary)
    const raw = decoded.substring(idx);
    const end = raw.search(/[\x00-\x1f]/);
    return end === -1 ? raw : raw.substring(0, end);
  } catch {
    return null;
  }
}

// Follow Google News redirect to get the real publisher URL for accurate tier scoring.
// Strategy: (1) try to decode the URL from the base64 path, (2) fall back to GET redirect follow.
async function resolveRedirect(url: string): Promise<string> {
  if (!url.includes("news.google.com")) return url;

  // Try base64 decode first — fast, no network call
  const decoded = decodeGoogleNewsArticleUrl(url);
  if (decoded && !decoded.includes("news.google.com")) return decoded;

  // Fall back to GET (not HEAD — Google News requires GET to trigger redirects)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Nusq/1.0)" },
    });
    clearTimeout(timeout);
    const resolved = res.url || url;
    return resolved.includes("news.google.com") ? url : resolved;
  } catch {
    return url;
  }
}

async function fetchNewsWithSources(): Promise<{ text: string; rawSources: RawSourceItem[] }> {
  const parser = new Parser({ timeout: 10000 });

  const queries = [
    // Gulf — general
    { url: "https://news.google.com/rss/search?q=Saudi+Arabia+economy+oil+finance&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=UAE+economy+investment+trade&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Qatar+economy+LNG+finance&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Kuwait+Oman+Bahrain+economy&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    // Tier-1-targeted — central banks, exchanges, sovereign funds, multilaterals
    { url: "https://news.google.com/rss/search?q=SAMA+OR+%22Saudi+Central+Bank%22+interest+rate+OR+reserves&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Tadawul+OR+%22Saudi+Exchange%22+OR+ADX+OR+DFM+listing+OR+IPO&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=PIF+OR+Mubadala+OR+ADIA+OR+QIA+investment+stake+acquisition&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=IMF+OR+%22World+Bank%22+OR+OPEC+Gulf+OR+MENA+forecast+OR+report&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=%22UAE+Central+Bank%22+OR+%22Qatar+Central+Bank%22+rate+OR+policy&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    // North Africa
    { url: "https://news.google.com/rss/search?q=Egypt+economy+IMF+pound+investment&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Morocco+economy+trade+industry&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Tunisia+Algeria+Libya+economy&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    // Levant & Iraq
    { url: "https://news.google.com/rss/search?q=Jordan+Iraq+Lebanon+economy+finance&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    // Broad MENA
    { url: "https://news.google.com/rss/search?q=MENA+economy+markets+investment+2026&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    // Arabic — North Africa
    { url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D9%85%D8%B5%D8%B1&hl=ar&gl=EG&ceid=EG:ar", lang: "ar" as const },
    { url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8&hl=ar&gl=MA&ceid=MA:ar", lang: "ar" as const },
    // Arabic — Gulf
    { url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9&hl=ar&gl=SA&ceid=SA:ar", lang: "ar" as const },
    { url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D8%A7%D9%84%D8%A5%D9%85%D8%A7%D8%B1%D8%A7%D8%AA&hl=ar&gl=AE&ceid=AE:ar", lang: "ar" as const },
  ];

  const collected: RawSourceItem[] = [];
  const seen = new Set<string>();

  await Promise.allSettled(
    queries.map(async ({ url, lang }) => {
      try {
        const feed = await parser.parseURL(url);
        for (const item of feed.items.slice(0, 8)) {
          const title = (item.title ?? "").trim();
          if (!title || seen.has(title)) continue;
          seen.add(title);

          // Extract publisher: Google News RSS uses "Headline - Publisher" (English)
          // or "Headline  Publisher" double-space (Arabic). Try both.
          const titleDashParts = title.split(" - ");
          let publisher = titleDashParts.length > 1
            ? titleDashParts[titleDashParts.length - 1].trim()
            : "";
          const cleanTitle = titleDashParts.length > 1
            ? titleDashParts.slice(0, -1).join(" - ").trim()
            : title;
          // Fallback: extract publisher from contentSnippet "headline  Publisher" (Google News uses NBSP pairs)
          if (!publisher) {
            const snip = (item.contentSnippet ?? "").trim();
            const sep = "  ";
            const dblIdx = snip.lastIndexOf(sep);
            if (dblIdx > 0) publisher = snip.substring(dblIdx + sep.length).trim();
          }
          if (!publisher) publisher = item.creator ?? "";

          const itemUrl = (item.link ?? item.guid ?? "").trim();
          const snippet = (item.contentSnippet ?? item.content ?? title).substring(0, 250).trim();

          // Parse pub date
          let pubDate: string | null = null;
          if (item.pubDate || item.isoDate) {
            try {
              pubDate = new Date(item.isoDate ?? item.pubDate ?? "").toISOString();
            } catch {
              pubDate = null;
            }
          }

          const resolvedPublisher = normalizePublisherName(publisher || getPublisherName(itemUrl));
          // Drop unrecognised (Tier 3) sources — only ingest established outlets
          if (getSourceTierByName(resolvedPublisher) === 3) continue;

          collected.push({
            title: cleanTitle,
            url: itemUrl,
            snippet,
            pubDate,
            lang,
            publisher: resolvedPublisher,
          });
        }
      } catch {
        // skip failed feeds silently
      }
    })
  );

  if (collected.length === 0) {
    throw new Error("No news fetched from any RSS feed");
  }

  // Sort: most recent first, then by order of collection
  const sorted = collected.sort((a, b) => {
    if (a.pubDate && b.pubDate) return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    if (a.pubDate) return -1;
    if (b.pubDate) return 1;
    return 0;
  });

  // Keep only articles from the last 72 hours. Fall back to 7 days if too few remain.
  // Items with no pubDate pass through so we never lose undated sources entirely.
  const nowMs = Date.now();
  const within72h = sorted.filter(
    (s) => !s.pubDate || nowMs - new Date(s.pubDate).getTime() <= 72 * 60 * 60 * 1000
  );
  const dateFiltered =
    within72h.length >= 10
      ? within72h
      : sorted.filter(
          (s) => !s.pubDate || nowMs - new Date(s.pubDate).getTime() <= 7 * 24 * 60 * 60 * 1000
        );

  // Resolve Google News redirect URLs to actual publisher domains for accurate tier scoring.
  await Promise.allSettled(
    dateFiltered.map(async (s) => {
      const resolved = await resolveRedirect(s.url);
      if (resolved !== s.url && !resolved.includes("news.google.com")) {
        s.url = resolved;
        s.publisher = getPublisherName(resolved) || s.publisher;
      }
    })
  );

  // Score articles for investor/allocator relevance and drop weak ones
  const relevant = await filterForRelevance(dateFiltered);

  const text = numberSources(relevant);
  return { text, rawSources: relevant };
}

// Build the numbered source list block for prompts.
function numberSources(items: RawSourceItem[]): string {
  const numbered = items.map((s, i) => {
    const dateStr = s.pubDate
      ? new Date(s.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "date unknown";
    const langLabel = s.lang === "ar" ? " [AR]" : "";
    return `[${i + 1}] "${s.title}" | ${s.publisher}${langLabel} | ${dateStr} | ${s.url}\n    ${s.snippet}`;
  });
  return `Numbered sources — cite by [N] number in the briefing body:\n\n${numbered.join("\n\n")}`;
}

// Mirror buildSourceRefs tier logic: unresolved Google News URLs score by publisher name.
function tierOf(s: RawSourceItem): 1 | 2 | 3 {
  return s.url.includes("news.google.com") ? getSourceTierByName(s.publisher) : getSourceTier(s.url);
}

// ── Relevance filter ──────────────────────────────────────────────────────────

// Score every collected article for investor/allocator relevance to the MENA
// region using a single fast Haiku call. Articles scoring below the threshold
// are dropped before the expensive generation step.
async function filterForRelevance(items: RawSourceItem[]): Promise<RawSourceItem[]> {
  if (items.length === 0) return items;

  const client = new Anthropic();

  const list = items
    .map((s, i) => `${i}: ${s.title} — ${s.snippet.slice(0, 120)}`)
    .join("\n");

  let scores: number[] = [];

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are scoring news articles for a MENA financial briefing focused on the Arabic-speaking world.

${MENA_SCOPE}

Score each article 0–10. Any article primarily about Iran, Turkey, Israel or other out-of-scope countries scores 0–2 regardless of financial significance:

SCORE 8–10 (strong signal — always include):
- Macro & policy: GDP, inflation, PMI, central bank decisions, interest rates, fiscal budgets, IMF/World Bank programmes, sovereign credit ratings
- Capital markets: IPOs, equity/bond issuance, exchange news, fund flows, index changes, asset prices
- Deals & investment: M&A, joint ventures, FDI announcements, privatisations, major contract awards with disclosed values
- Energy & commodities: oil/gas production, OPEC decisions, LNG contracts, refinery/pipeline news, renewable energy projects
- Geopolitics: elections, conflicts, diplomatic shifts, sanctions, trade route disruptions — always relevant regardless of direct economic link

SCORE 5–7 (useful context — include):
- National strategy announcements (Vision 2030, etc.) even without concrete figures
- Government spending plans, subsidy changes, labour market reforms
- Social or religious policy with economic dimension (tourism, expat rules)
- Corporate earnings, leadership changes at major regional companies
- Regulatory changes affecting a sector

SCORE 2–4 (weak — exclude):
- Sub-national and city-level stories with no national economic significance
- Minor ceremonial or protocol events
- Opinion pieces and editorials without new factual content

SCORE 0–1 (irrelevant — always exclude):
- Sports, entertainment, celebrity, lifestyle, fashion, food
- Crime and security incidents with no economic/geopolitical dimension

Output ONLY a JSON array of integers in the same order as the input. Example for 4 articles: [8,3,9,1]

Articles:
${list}`,
      }],
    });

    const text = res.content.find((b) => b.type === "text")?.text?.trim() ?? "[]";
    const match = text.match(/\[[\d,\s]+\]/);
    if (match) scores = JSON.parse(match[0]) as number[];
  } catch {
    return items;
  }

  if (scores.length !== items.length) return items;

  const THRESHOLD = 5;
  const filtered = items.filter((_, i) => (scores[i] ?? 0) >= THRESHOLD);

  // Safety: always return at least 10 items so triage has enough to pick from
  return filtered.length >= 10 ? filtered : items.slice(0, Math.max(filtered.length, 10));
}

// ── Stage 1: triage (rank candidates by materiality hierarchy) ───────────────

async function triageStories(rawSources: RawSourceItem[]): Promise<number[]> {
  if (rawSources.length <= 5) return rawSources.map((_, i) => i);

  const client = new Anthropic();
  const list = rawSources
    .map((s, i) => `${i}: [T${tierOf(s)}] ${s.title} (${s.publisher}) — ${s.snippet.slice(0, 120)}`)
    .join("\n");

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are the triage editor for a MENA financial intelligence briefing focused on the Arabic-speaking world.

${MENA_SCOPE}

Stories primarily about Iran, Turkey, Israel, or other out-of-scope countries must be excluded — do not include them in the top five regardless of their financial significance. Rank the remaining candidates by MATERIALITY, applying this hierarchy strictly, in order:

1. Market-moving events: central bank decisions, sovereign debt moves, major equity swings, currency pressure, oil-price inflection points
2. Capital deployment: PIF, ADIA, Mubadala, QIA or other sovereign-wealth-fund activity; major M&A or IPO announcements
3. Macro policy shifts: fiscal policy changes, Vision 2030 milestones, regulatory announcements affecting foreign investment
4. Geopolitical events with direct economic consequence: sanctions, trade-route disruption, diplomatic shifts affecting Gulf capital flows
5. Corporate earnings or operational news from regionally significant companies (Aramco, SABIC, Emirates, FAB, SNB, QNB, Emaar, etc.)

Significance is NOT drama. A quiet rate hold from SAMA outranks a splashy megaproject headline. Prefer higher-tier sources (T1 official > T2 established).

DIVERSITY REQUIREMENT: The returned five must cover at least two different countries or regions. If the top candidates are all about the same country or the same crisis (e.g. five Iran/Hormuz angles), include the highest-materiality story from a different country even if it ranks lower overall.

Return the FIVE most material as a JSON array of objects, most material first:
[{"index": 12, "country": "Saudi Arabia", "materiality": "one-line rationale"}, ...]
Output ONLY the JSON array.

Candidates:
${list}`,
      }],
    });

    const text = res.content.find((b) => b.type === "text")?.text?.trim() ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("no JSON");
    const ranked = JSON.parse(match[0]) as Array<{ index: number }>;
    const indices = ranked
      .map((r) => r.index)
      .filter((i) => Number.isInteger(i) && i >= 0 && i < rawSources.length);
    return indices.length >= 2 ? indices.slice(0, 5) : rawSources.map((_, i) => i).slice(0, 5);
  } catch {
    return rawSources.map((_, i) => i).slice(0, 5);
  }
}

// ── Stage 2: selection (pick anchor + supporting thread) ─────────────────────

interface Selection {
  selected: number[];      // indices into rawSources — [anchor, supporting]
  anchorCountry: string;
  supportingCountry: string;
  rationale: string;
  connection: string;
}

async function selectStories(rawSources: RawSourceItem[], top: number[]): Promise<Selection> {
  const fallback: Selection = {
    selected: top.slice(0, 2),
    anchorCountry: "",
    supportingCountry: "",
    rationale: "Selected the two highest-materiality candidates.",
    connection: "",
  };
  if (top.length < 2) return fallback;

  const client = new Anthropic();
  const list = top
    .map((i) => `${i}: [T${tierOf(rawSources[i])}] ${rawSources[i].title} (${rawSources[i].publisher}) — ${rawSources[i].snippet.slice(0, 140)}`)
    .join("\n");

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `From these ranked candidates, choose exactly TWO stories for today's briefing. Both must be from Arabic-speaking MENA countries (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, Jordan, Egypt, Morocco, Algeria, Tunisia, Libya, Sudan, Lebanon, Syria, Iraq, Yemen, Palestine). Do not select stories primarily about Iran, Turkey, or Israel.


- An ANCHOR: the single most significant development.
- A SUPPORTING THREAD: a second movement worth tracking, ideally connected to the anchor thematically or geographically.

HARD CONSTRAINT: The two stories MUST cover different countries. If both top candidates are about the same country or are two angles on the same event (e.g. two Hormuz/Iran stories, two Saudi stories), you MUST pick one of them plus the best candidate from a different country, even if that candidate ranks lower on materiality. Country diversity is non-negotiable.

Return ONLY JSON:
{"selected": [<anchor index>, <supporting index>], "anchor_country": "country name", "supporting_country": "country name", "rationale": "why these two", "connection": "how they connect (or 'independent' if not)"}

Candidates:
${list}`,
      }],
    });

    const text = res.content.find((b) => b.type === "text")?.text?.trim() ?? "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON");
    const parsed = JSON.parse(match[0]) as { selected?: number[]; anchor_country?: string; supporting_country?: string; rationale?: string; connection?: string };
    const sel = (parsed.selected ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < rawSources.length);
    if (sel.length < 2) return fallback;
    return {
      selected: sel.slice(0, 2),
      anchorCountry: parsed.anchor_country ?? "",
      supportingCountry: parsed.supporting_country ?? "",
      rationale: parsed.rationale ?? "",
      connection: parsed.connection ?? "",
    };
  } catch {
    return fallback;
  }
}

// ── Stage 3: research enrichment (Sonnet + server-side web search) ───────────

interface Enrichment {
  notes: string;
  newSources: RawSourceItem[];
}

async function enrichStory(seed: RawSourceItem): Promise<Enrichment> {
  const empty: Enrichment = { notes: "", newSources: [] };
  const client = new Anthropic();

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
      messages: [{
        role: "user",
        content: `You are the research desk for a MENA financial briefing. Story under development:

"${seed.title}" (${seed.publisher})
${seed.snippet}

Use web search to find the SINGLE most relevant supporting data point that deepens this story for an institutional allocator — a specific price move, an IMF/World Bank/central-bank figure, a prior official statement, or a directly comparable historical event. Prefer primary and established financial sources. Be precise with figures and dates.

Then output ONLY a JSON object (after any searching):
{"notes": "1–3 sentences of specific supporting facts, with exact figures and dates", "new_sources": [{"title": "...", "url": "https://...", "publisher": "...", "date": "YYYY-MM-DD or empty"}]}

Include in new_sources only pages you actually found and would cite. Output nothing but the JSON.`,
      }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return empty;
    const parsed = JSON.parse(match[0]) as {
      notes?: string;
      new_sources?: Array<{ title?: string; url?: string; publisher?: string; date?: string }>;
    };

    const newSources: RawSourceItem[] = (parsed.new_sources ?? [])
      .filter((s) => s.url && s.url.startsWith("http"))
      .map((s) => {
        const url = s.url!;
        let publisher = (s.publisher ?? "").trim();
        if (!publisher) publisher = getPublisherName(url);
        let pubDate: string | null = null;
        if (s.date && /^\d{4}-\d{2}-\d{2}/.test(s.date)) {
          try { pubDate = new Date(s.date).toISOString(); } catch { pubDate = null; }
        }
        return {
          title: (s.title ?? "").trim() || publisher,
          url,
          snippet: (parsed.notes ?? "").slice(0, 250),
          pubDate,
          lang: "en" as const,
          publisher,
        };
      });

    return { notes: (parsed.notes ?? "").trim(), newSources };
  } catch {
    return empty;
  }
}

// ── Validation layer ──────────────────────────────────────────────────────────

const STALE_RECENCY_WORDS = [
  "today", "yesterday", "this morning", "this week", "this month",
  "just announced", "just closed", "just signed", "closed today",
  "announced today", "signed today", "new deal", "fresh deal",
  "hours ago", "moments ago",
];

function validateBriefing(
  body: string,
  sourcesUsed: number[],
  rawSources: RawSourceItem[],
  briefingDate: string
): ValidationResult {
  const warnings: string[] = [];
  const briefingMs = new Date(briefingDate).getTime();
  const sourceCount = sourcesUsed.length;

  // 1. Source count
  if (sourceCount === 0) {
    warnings.push("No sources referenced — high hallucination risk. Publish with caution.");
  } else if (sourceCount === 1) {
    warnings.push("Only one source referenced — label claims as single-source.");
  }

  // 2. Check for stale recency language vs actual source dates
  const bodyLower = body.toLowerCase();
  const staleSentinelWords: string[] = [];
  for (const word of STALE_RECENCY_WORDS) {
    if (bodyLower.includes(word)) {
      const recentSourceExists = sourcesUsed.some((i) => {
        const s = rawSources[i - 1];
        if (!s?.pubDate) return false;
        const ageDays = (briefingMs - new Date(s.pubDate).getTime()) / (1000 * 60 * 60 * 24);
        return ageDays <= 7;
      });
      if (!recentSourceExists) {
        staleSentinelWords.push(word);
      }
    }
  }
  if (staleSentinelWords.length > 0) {
    warnings.push(
      `Recency language detected without recent sources: "${staleSentinelWords.join('", "')}" — verify event dates.`
    );
  }

  // 3. Check for old sources being referenced
  const oldSourceCount = sourcesUsed.filter((i) => {
    const s = rawSources[i - 1];
    if (!s?.pubDate) return false;
    const ageMonths = (briefingMs - new Date(s.pubDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    return ageMonths > 3;
  }).length;
  if (oldSourceCount > 0) {
    warnings.push(`${oldSourceCount} referenced source(s) older than 3 months — check for background vs current framing.`);
  }

  // 4. URL validity
  const sourcesWithUrls = sourcesUsed.filter((i) => {
    const s = rawSources[i - 1];
    return s?.url?.startsWith("http");
  }).length;
  const hasUrls = sourcesWithUrls > 0;
  if (!hasUrls && sourceCount > 0) {
    warnings.push("Referenced sources have no valid URLs.");
  }

  const freshnessOk = staleSentinelWords.length === 0;
  const needsReview = warnings.length > 0;

  return {
    passed: !needsReview,
    sourceCount,
    hasUrls,
    freshnessOk,
    warnings,
    staleSentinelWords,
    needsReview,
    checkedAt: new Date().toISOString(),
  };
}

// ── Counter-evidence detection ───────────────────────────────────────────────

interface RawCounterpoint {
  claim_index: number;
  counter_evidence: string;
  counter_source_indices: number[];
  type: Counterpoint["type"];
  severity: Counterpoint["severity"];
}

async function detectCounterEvidence(
  claims: BriefingClaim[],
  rawSources: RawSourceItem[]
): Promise<Counterpoint[]> {
  if (claims.length === 0 || rawSources.length === 0) return [];

  const claimsList = claims
    .map((c, i) => `${i}: [Sources: ${c.sourceIndices.map((n) => `[${n}]`).join(",")}] ${c.claim}`)
    .join("\n");

  const sourcesList = rawSources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.publisher}): ${s.snippet.slice(0, 150)}`)
    .join("\n");

  const client = new Anthropic();
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Scan these briefing claims against the full source list for material counter-evidence.

Counter-evidence types:
- direct_contradiction: a source says the opposite of the claim
- risk_factor: a credible source highlights a risk or failure mode that significantly qualifies a positive claim
- official_vs_media_difference: official data or statements differ materially from media reports
- time_horizon_difference: a source shows different data for a different but directly relevant time period
- scope_difference: a source shows a meaningfully different picture for a closely related geography or sector

Only flag counter-evidence that would materially change how an investor reads the claim. Ignore minor qualifications, distant analogies, or tangentially related topics. Output [] if nothing material is found.

For each claim with material counter-evidence, output one JSON object with these exact keys:
{"claim_index": 0, "counter_evidence": "one sentence summarising the counter-evidence", "counter_source_indices": [1, 4], "type": "risk_factor", "severity": "high"}

Severity: "high" = strongly undermines the claim, "medium" = adds important nuance, "low" = minor qualification.

Output ONLY a JSON array — no prose.

Claims:
${claimsList}

Sources:
${sourcesList}`,
      }],
    });

    const text = res.content.find((b) => b.type === "text")?.text?.trim() ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const raw = JSON.parse(match[0]) as RawCounterpoint[];

    return raw
      .filter((r) => typeof r.claim_index === "number" && r.claim_index >= 0 && r.claim_index < claims.length)
      .map((r) => {
        const originalClaim = claims[r.claim_index];
        const counterTiers = (r.counter_source_indices ?? []).map((i) => {
          const s = rawSources[i - 1];
          if (!s) return 3 as const;
          return s.url.includes("news.google.com")
            ? getSourceTierByName(s.publisher)
            : getSourceTier(s.url);
        });
        const hasHighTierCounter = counterTiers.some((t) => t <= 2);
        const blocksPublish =
          r.severity === "high" &&
          hasHighTierCounter &&
          (r.type === "direct_contradiction" || r.type === "official_vs_media_difference");

        return {
          claim: originalClaim.claim,
          claimSourceIndices: originalClaim.sourceIndices,
          counterEvidence: r.counter_evidence ?? "",
          counterSourceIndices: r.counter_source_indices ?? [],
          type: r.type,
          severity: r.severity,
          blocksPublish,
        } satisfies Counterpoint;
      });
  } catch {
    return [];
  }
}

// ── Build structured SourceRef array ─────────────────────────────────────────

function buildSourceRefs(
  rawSources: RawSourceItem[],
  sourcesUsed: number[],
  annotations: Record<string, RawSourceAnnotation>
): SourceRef[] {
  const accessedAt = new Date().toISOString();
  return sourcesUsed
    .filter((i) => i >= 1 && i <= rawSources.length)
    .map((i) => {
      const s = rawSources[i - 1];
      const resolvedUrl = s.url || "";
      const isGoogleNews = resolvedUrl.includes("news.google.com");
      const tier = isGoogleNews
        ? getSourceTierByName(s.publisher)
        : getSourceTier(resolvedUrl);
      const publisher = isGoogleNews
        ? s.publisher
        : (getPublisherName(resolvedUrl) || s.publisher);
      const domain = isGoogleNews
        ? getPublisherDomain(publisher)
        : ((() => { try { return new URL(resolvedUrl).hostname.replace(/^www\./, ""); } catch { return ""; } })());
      const sourceType = isGoogleNews
        ? getSourceTypeByName(publisher)
        : getSourceType(resolvedUrl);
      const annotation = annotations[String(i)] ?? {};
      const primary = annotation.is_primary ?? isPrimarySource(tier, sourceType);
      const confidence = tier === 1 ? "high" : tier === 2 ? "medium" : "low";
      return {
        index: i,
        title: s.title,
        url: resolvedUrl,
        publisher,
        domain,
        publishedAt: s.pubDate,
        language: s.lang,
        tier,
        snippet: s.snippet,
        originalUrl: isGoogleNews ? null : resolvedUrl,
        googleNewsUrl: isGoogleNews ? resolvedUrl : null,
        accessedAt,
        sourceType,
        claimsSupported: annotation.claims_supported ?? [],
        eventDate: annotation.event_date ?? null,
        isPrimarySource: primary,
        isBackgroundContext: annotation.is_background ?? false,
        summaryOfRelevance: annotation.summary ?? "",
        confidence,
        notes: "",
      };
    });
}

// ── Build intelligence from model output ─────────────────────────────────────

interface RawIntelligence {
  market_impact?: string;
  market_impact_detail?: string;
  investor_relevance?: string;
  relevance_reason?: string;
  time_horizon?: string;
  affected_sectors?: string[];
  affected_geographies?: string[];
  confidence_note?: string;
  freshness_status?: string;
  conflicting_sources?: boolean;
}

function buildIntelligence(
  raw: RawIntelligence | null | undefined,
  sources: SourceRef[]
): BriefingIntelligence {
  const tiers = sources.map((s) => s.tier);
  const highestTier = (tiers.length > 0 ? Math.min(...tiers) : 3) as 1 | 2 | 3;

  return {
    marketImpact: (raw?.market_impact ?? "unclear") as BriefingIntelligence["marketImpact"],
    marketImpactDetail: raw?.market_impact_detail ?? "",
    investorRelevance: (raw?.investor_relevance ?? "medium") as BriefingIntelligence["investorRelevance"],
    relevanceReason: raw?.relevance_reason ?? "",
    timeHorizon: (raw?.time_horizon ?? "unclear") as BriefingIntelligence["timeHorizon"],
    affectedSectors: raw?.affected_sectors ?? [],
    affectedGeographies: raw?.affected_geographies ?? [],
    confidenceNote: raw?.confidence_note ?? "",
    freshnessStatus: (raw?.freshness_status ?? "fresh") as BriefingIntelligence["freshnessStatus"],
    highestSourceTier: highestTier,
    conflictingSourcesDetected: raw?.conflicting_sources ?? false,
  };
}

// ── Photo generation (Unsplash only) ─────────────────────────────────────────

interface PhotoResult {
  url: string;
  credit: string;
  creditLink: string | null;
}

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  urls: { raw: string; small: string };
  user: { name: string; links: { html: string } };
  likes: number;
}

// Reject obvious non-photography. An absent image is editorially preferable to a weak one.
const ILLUSTRATION_RE = /illustration|render|3d|vector|drawing|cartoon|clip ?art|sketch|abstract|concept art/i;

// Search Unsplash with the finalised story framing, apply quality filters, and
// return the strongest landscape photo — or null if nothing clears the bar.
async function fetchStoryPhoto(query: string): Promise<PhotoResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query.trim()) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { results: UnsplashPhoto[] };
    const candidates = (data.results ?? []).filter((p) => {
      const desc = `${p.description ?? ""} ${p.alt_description ?? ""}`;
      if (ILLUSTRATION_RE.test(desc)) return false;
      return true;
    });
    const photo = candidates.sort((a, b) => b.likes - a.likes)[0];
    if (!photo) return null;
    return {
      url: photo.urls.raw,
      credit: `Photo by ${photo.user.name} on Unsplash`,
      creditLink: `${photo.user.links.html}?utm_source=nusq&utm_medium=referral`,
    };
  } catch {
    return null;
  }
}

// ── Chart data ────────────────────────────────────────────────────────────────

const FRED_SERIES: Record<string, string> = {
  brent_price: "MCOILBRENTEU",
  gold: "GOLDPMGBD228NLBM",
  fx_egp: "EXEGUS",
  fx_sar: "EXSAUS",
};
const WB_INDICATORS: Record<string, string> = {
  gdp_growth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
};
const CHART_TITLES: Record<string, string> = {
  brent_price: "Brent Crude Oil (USD/barrel)",
  gold: "Gold Price (USD/troy oz)",
  fx_egp: "USD/EGP Exchange Rate",
  fx_sar: "USD/SAR Exchange Rate",
  gdp_growth: "GDP Growth Rate (%)",
  inflation: "Inflation Rate (CPI, %)",
};

interface FredObservation { date: string; value: string }

async function fetchFredSeries(seriesId: string, limit = 24): Promise<{ labels: string[]; values: number[] }> {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY not set");
  const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`);
  if (!res.ok) throw new Error(`FRED error ${res.status}`);
  const data = await res.json() as { observations: FredObservation[] };
  const obs = data.observations.filter((o) => o.value !== "." && !isNaN(parseFloat(o.value))).reverse();
  return { labels: obs.map((o) => o.date.slice(0, 7)), values: obs.map((o) => parseFloat(parseFloat(o.value).toFixed(2))) };
}

async function fetchWorldBankSeries(countryCode: string, indicator: string, limit = 10): Promise<{ labels: string[]; values: number[] }> {
  const res = await fetch(`https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=${limit}&mrv=${limit}`);
  if (!res.ok) throw new Error(`World Bank error ${res.status}`);
  const data = await res.json() as [unknown, Array<{ date: string; value: number | null }>];
  const rows = (data[1] ?? []).filter((r) => r.value !== null).reverse();
  return { labels: rows.map((r) => r.date), values: rows.map((r) => parseFloat((r.value as number).toFixed(2))) };
}

interface ChartSpec { type: string | null; country?: string | null }

async function buildChartData(spec: ChartSpec): Promise<import("@/lib/types").ChartData | null> {
  if (!spec.type) return null;
  try {
    let series: { labels: string[]; values: number[] };
    if (spec.type in FRED_SERIES) {
      series = await fetchFredSeries(FRED_SERIES[spec.type]);
    } else if (spec.type in WB_INDICATORS && spec.country) {
      series = await fetchWorldBankSeries(spec.country, WB_INDICATORS[spec.type]);
    } else {
      return null;
    }
    if (series.labels.length < 3) return null;
    return {
      type: spec.type,
      title: CHART_TITLES[spec.type] ?? spec.type,
      labels: series.labels,
      values: series.values,
      unit: spec.type.startsWith("fx_") ? "rate" : spec.type === "brent_price" || spec.type === "gold" ? "USD" : "%",
      source: spec.type in FRED_SERIES ? "FRED / St. Louis Fed" : "World Bank Open Data",
    };
  } catch {
    return null;
  }
}

interface StoryChartSpec {
  type?: string | null;
  country?: string | null;
  title?: string;
  labels?: string[];
  values?: number[];
  unit?: string;
  source?: string;
}

async function buildStoryChartData(spec: StoryChartSpec | null | undefined): Promise<import("@/lib/types").ChartData | null> {
  if (!spec?.type) return null;
  if (spec.type === "bar" && Array.isArray(spec.labels) && Array.isArray(spec.values) && spec.labels.length > 0) {
    return {
      type: "bar",
      title: spec.title ?? "Data",
      labels: spec.labels,
      values: spec.values.map((v) => parseFloat(String(v))),
      unit: spec.unit ?? "",
      source: spec.source ?? "",
    };
  }
  return buildChartData({ type: spec.type, country: spec.country ?? null });
}

// ── Recent briefing deduplication ────────────────────────────────────────────

interface RecentBriefingContext {
  recentHeadlines: string[];
  usedSourceUrls: Set<string>;
}

async function fetchRecentBriefingContext(limit = 3): Promise<RecentBriefingContext> {
  try {
    const { data } = await supabaseAdmin
      .from("briefings")
      .select("stories, sources")
      .order("date", { ascending: false })
      .limit(limit);

    if (!data || data.length === 0) return { recentHeadlines: [], usedSourceUrls: new Set() };

    const recentHeadlines: string[] = [];
    const usedSourceUrls = new Set<string>();

    for (const row of data) {
      const stories = (row.stories ?? []) as Array<{ headline?: string }>;
      for (const s of stories) {
        if (s.headline) recentHeadlines.push(s.headline);
      }
      const sources = (row.sources ?? []) as Array<{ url?: string; googleNewsUrl?: string }>;
      for (const src of sources) {
        if (src.url) usedSourceUrls.add(src.url);
        if (src.googleNewsUrl) usedSourceUrls.add(src.googleNewsUrl);
      }
    }

    return { recentHeadlines, usedSourceUrls };
  } catch {
    return { recentHeadlines: [], usedSourceUrls: new Set() };
  }
}

// ── Stage 5: quality pass (separate Opus read + auto-revise) ─────────────────

interface RawStory {
  number?: number;
  headline?: string;
  location?: string;
  city?: string;
  body?: string;
  image_framing?: string;
  image_query?: string;
  chart?: StoryChartSpec | null;
  evidence?: {
    market_impact?: string;
    relevance?: string;
    relevance_reason?: string;
    geographies?: string[];
    sectors?: string[];
  } | null;
}

async function qualityPass(
  stories: RawStory[],
  sourceText: string
): Promise<{ revised: Map<number, string>; editsApplied: string[] }> {
  const revised = new Map<number, string>();
  if (stories.length === 0) return { revised, editsApplied: [] };

  const client = new Anthropic();
  const storiesBlock = stories
    .map((s) => `--- STORY ${s.number} (${s.location}) ---\n${s.body ?? ""}`)
    .join("\n\n");

  try {
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are the copy desk for a MENA financial briefing. Read each story below and FIX any of these problems, returning a clean revised body for every story:

1. Blacklist phrases — remove and rewrite: "it remains to be seen", "against a backdrop of", "in a sign of", "as the region navigates", "amid growing", "stakeholders", "going forward", "underscores", "highlights", "it is worth noting", "in recent months", "a complex landscape". Also empty finance abstraction ("macro headwinds", "tailwinds", "growth story", "structural shift", etc.) and em dashes (—).
2. Sentence rhythm — any sentence longer than 30 words MUST be followed by one under 12 words. Break up airless runs of long sentences.
3. Traceability — every factual claim must have a [N] citation marker tied to a numbered source below. If a claim has no support in the sources, soften it or cut it. Do NOT invent citation numbers or facts.
4. Analysis — every paragraph must do more than summarise. If a paragraph only restates facts, add the analytical beat (what it means for capital).
5. Forward-looking close — each story must end on a clear, falsifiable forward-looking position (not a hedge, not a question).

Keep the author's voice and the four-layer structure. Make the MINIMUM changes needed. Do not lengthen materially.

Return ONLY JSON:
{"stories": [{"number": 1, "body": "revised body"}, {"number": 2, "body": "revised body"}], "edits_applied": ["short description of each fix made, or 'no changes' per story"]}

${sourceText}

STORIES TO CHECK:
${storiesBlock}`,
      }],
    });

    const text = res.content.find((b) => b.type === "text")?.text?.trim() ?? "{}";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return { revised, editsApplied: [] };
    const parsed = JSON.parse(match[0]) as {
      stories?: Array<{ number?: number; body?: string }>;
      edits_applied?: string[];
    };
    for (const s of parsed.stories ?? []) {
      if (typeof s.number === "number" && typeof s.body === "string" && s.body.trim().length > 0) {
        revised.set(s.number, s.body.trim());
      }
    }
    return { revised, editsApplied: (parsed.edits_applied ?? []).filter(Boolean) };
  } catch {
    return { revised, editsApplied: [] };
  }
}

// ── Per-story evidence assembly ──────────────────────────────────────────────

function buildStoryEvidence(
  body: string,
  rawEvidence: RawStory["evidence"],
  rawSources: RawSourceItem[],
  verifiedAt: string
): StoryEvidence {
  // Count distinct [N] citations in this story's body and find the freshest source
  const cited = new Set<number>();
  for (const m of body.matchAll(/\[(\d+)\]/g)) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= rawSources.length) cited.add(n);
  }
  let asOf: string | null = null;
  for (const n of cited) {
    const pd = rawSources[n - 1]?.pubDate;
    if (pd && (!asOf || new Date(pd).getTime() > new Date(asOf).getTime())) asOf = pd;
  }

  const rel = rawEvidence?.relevance;
  const relevance: StoryEvidence["relevance"] =
    rel === "high" || rel === "medium" || rel === "low" ? rel : "medium";

  return {
    sourcesReviewed: cited.size,
    verifiedAt,
    marketImpact: rawEvidence?.market_impact ?? "",
    asOf,
    relevance,
    relevanceReason: rawEvidence?.relevance_reason ?? "",
    geographies: rawEvidence?.geographies ?? [],
    sectors: rawEvidence?.sectors ?? [],
  };
}

// ── Main route handler ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ ok: true, message: "Weekend — no briefing today" });
  }

  const slug = todaySlug();
  const date = todayISO();

  const { data: existing } = await supabaseAdmin
    .from("briefings")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, message: "Already generated today", slug });
  }

  // Fetch recent briefing context and news in parallel
  const [{ recentHeadlines, usedSourceUrls }, { rawSources: rawSourcesAll }] =
    await Promise.all([fetchRecentBriefingContext(3), fetchNewsWithSources()]);

  // Drop sources whose URLs were already used in recent briefings
  const rawSources = rawSourcesAll.filter((s) => !usedSourceUrls.has(s.url));

  if (rawSources.length === 0) {
    return NextResponse.json({ error: "No new sources after deduplication — try again later" }, { status: 503 });
  }

  // ── Stage 1: triage ──
  const topCandidates = await triageStories(rawSources);

  // ── Stage 2: selection ──
  const selection = await selectStories(rawSources, topCandidates);
  const selectedSeeds = selection.selected.map((i) => rawSources[i]);

  // ── Stage 3: research enrichment (parallel web search) ──
  const enrichments = await Promise.all(selectedSeeds.map((s) => enrichStory(s)));

  // Fold any newly discovered sources into the numbered list (dedup by URL)
  const existingUrls = new Set(rawSources.map((s) => s.url));
  for (const e of enrichments) {
    for (const ns of e.newSources) {
      if (!existingUrls.has(ns.url)) {
        rawSources.push(ns);
        existingUrls.add(ns.url);
      }
    }
  }

  const sourceText = numberSources(rawSources);

  // Build "do not repeat" block from recent briefings
  const noRepeatBlock = recentHeadlines.length > 0
    ? `\n\nSTORIES ALREADY COVERED IN RECENT BRIEFINGS — do NOT write about these topics again, even from a different angle:\n${recentHeadlines.map((h) => `• ${h}`).join("\n")}\n\nChoose entirely different stories from today's sources.`
    : "";

  // Build the selection + enrichment block for the drafting stage
  const selectionBlock = selectedSeeds
    .map((s, i) => {
      const role = i === 0 ? "ANCHOR" : "SUPPORTING THREAD";
      const enr = enrichments[i]?.notes ? `\n  Enrichment (verified facts to weave in): ${enrichments[i].notes}` : "";
      return `${role}: "${s.title}" (${s.publisher})\n  ${s.snippet}${enr}`;
    })
    .join("\n\n");
  const connectionNote = selection.connection
    ? `\nHow these connect: ${selection.connection}`
    : "";

  // ── Stage 4: draft generation ──
  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 10000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Today's date: ${date}\n\nWrite today's two-story Nusq briefing on these pre-selected stories:\n\n${selectionBlock}${connectionNote}\n\n${sourceText}${noRepeatBlock}\n\nCite sources by their [N] number. Follow the four-layer structure, the voice, and all anti-hallucination rules.`,
      },
    ],
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const jsonText = rawText
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  const generated = JSON.parse(jsonText) as {
    title: string;
    summary: string;
    tldr_bullets?: string[];
    tags: string[];
    body?: string;
    stories?: RawStory[];
    also_watching?: string[];
    tickers: string[];
    chart?: { type: string | null; country?: string | null } | null;
    sources_used?: number[];
    source_annotations?: Record<string, RawSourceAnnotation>;
    claims?: RawClaim[];
    intelligence?: RawIntelligence | null;
  };

  const rawStories = generated.stories ?? [];

  // ── Stage 5: quality pass (revise bodies) ──
  const { revised, editsApplied } = await qualityPass(rawStories, sourceText);
  for (const s of rawStories) {
    if (typeof s.number === "number" && revised.has(s.number)) {
      s.body = revised.get(s.number)!;
    }
  }

  const combinedBody = rawStories.map((s) => `## ${s.headline ?? ""}\n\n${s.body ?? ""}`).join("\n\n") || (generated.body ?? "");
  const wordCount = combinedBody.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  // Build structured sources
  const sourcesUsed = generated.sources_used ?? [];
  const sourceAnnotations = generated.source_annotations ?? {};
  const sourceRefs = buildSourceRefs(rawSources, sourcesUsed, sourceAnnotations);

  // Map raw claims to BriefingClaim[]
  const briefingClaims: BriefingClaim[] = (generated.claims ?? [])
    .filter((c): c is Required<RawClaim> => !!c.claim && Array.isArray(c.sources))
    .map((c) => ({
      claim: c.claim,
      sourceIndices: c.sources,
      confidence: (c.confidence ?? "medium") as BriefingClaim["confidence"],
      requiresAttribution: c.requires_attribution ?? false,
    }));

  // Build intelligence metadata
  const intelligence = buildIntelligence(generated.intelligence ?? null, sourceRefs);

  // Run validation against combined body
  const validation = validateBriefing(combinedBody, sourcesUsed, rawSources, date);
  if (editsApplied.length > 0) validation.editsApplied = editsApplied;

  // ── Stage 6: images + charts + counter-evidence (parallel) ──
  const [storyPhotos, storyCharts, counterpoints] = await Promise.all([
    Promise.all(rawStories.map((s) => fetchStoryPhoto(s.image_framing ?? s.image_query ?? s.headline ?? generated.title))),
    Promise.all(rawStories.map((s) => buildStoryChartData(s.chart))),
    detectCounterEvidence(briefingClaims, rawSources),
  ]);

  // Promote blocking counter-evidence into validation warnings
  for (const cp of counterpoints) {
    if (cp.blocksPublish) {
      validation.warnings.push(
        `Counter-evidence [${cp.type}]: "${cp.claim.slice(0, 80)}${cp.claim.length > 80 ? "…" : ""}" — ${cp.counterEvidence} (sources ${cp.counterSourceIndices.map((n) => `[${n}]`).join(", ")})`
      );
      validation.needsReview = true;
      validation.passed = false;
    }
  }

  const verifiedAt = validation.checkedAt;

  // Assemble stories with images, charts, and per-story evidence
  const stories = rawStories.map((s, i) => {
    const photo = storyPhotos[i];
    const body = s.body ?? "";
    return {
      number: s.number ?? i + 1,
      headline: s.headline ?? "",
      location: s.location ?? "",
      city: s.city ?? "",
      body,
      imageUrl: photo?.url ?? null,
      imageCredit: photo?.credit ?? null,
      imageCreditLink: photo?.creditLink ?? null,
      chartData: storyCharts[i] ?? null,
      evidence: buildStoryEvidence(body, s.evidence, rawSources, verifiedAt),
    };
  });

  // Cover image: first story's photo
  const coverPhoto = storyPhotos[0] ?? (rawStories.length === 0 ? await fetchStoryPhoto(generated.title) : null);
  const image = coverPhoto
    ? { url: coverPhoto.url, credit: coverPhoto.credit, creditLink: coverPhoto.creditLink }
    : null;

  // Also Watching (max 3 single-line items)
  const alsoWatching = (generated.also_watching ?? []).filter(Boolean).slice(0, 3);

  // Legacy single chart (kept for backwards compat)
  const chartData = generated.chart ? await buildChartData(generated.chart) : null;

  // Insert with all new fields
  const { data: briefing, error: insertError } = await supabaseAdmin
    .from("briefings")
    .insert({
      slug,
      title: generated.title,
      summary: generated.summary,
      tags: generated.tags,
      body: combinedBody,
      reading_time: readingTime,
      date,
      status: "draft",
      cover_image_url: image?.url ?? null,
      cover_image_credit: image?.credit ?? null,
      cover_image_credit_link: image?.creditLink ?? null,
      tickers: (generated.tickers ?? []).filter((t: string) => ALLOWED_TICKERS.has(t)).slice(0, 3),
      chart_data: chartData ?? null,
      sources: sourceRefs.length > 0 ? sourceRefs : null,
      validation,
      intelligence,
      claims: briefingClaims.length > 0 ? briefingClaims : null,
      counterpoints: counterpoints.length > 0 ? counterpoints : null,
      stories: stories.length > 0 ? stories : null,
      tldr_bullets: (generated.tldr_bullets ?? []).filter(Boolean).slice(0, 5),
      also_watching: alsoWatching.length > 0 ? alsoWatching : null,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";
  const reviewUrl = `${siteUrl}/admin/drafts/${briefing.id}`;

  const warningBadge = validation.warnings.length > 0
    ? `<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#92400E;">
        <strong>⚠ ${validation.warnings.length} validation warning(s)</strong><br>
        ${validation.warnings.map((w) => `• ${w}`).join("<br>")}
      </div>`
    : `<div style="background:#D1FAE5;border:1px solid #10B981;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:13px;color:#065F46;">
        ✓ Validation passed — ${sourceRefs.length} source(s) referenced
      </div>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: "nusq <onboarding@resend.dev>",
    to: "yousefquaba@icloud.com",
    subject: `nusq draft ready: ${generated.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;color:#1C1C1C;">
        ${warningBadge}
        <p style="color:#737373;font-size:13px;margin:0 0 16px;">Today's briefing is ready for review.</p>
        <h2 style="font-size:18px;margin:0 0 8px;">${generated.title}</h2>
        <p style="color:#555;font-size:14px;margin:0 0 8px;">${generated.summary}</p>
        <p style="color:#999;font-size:12px;margin:0 0 20px;">Sources: ${sourceRefs.length} · Market impact: ${intelligence.marketImpact} · Freshness: ${intelligence.freshnessStatus}</p>
        <a href="${reviewUrl}" style="display:inline-block;padding:10px 20px;background:#1B4F72;color:white;text-decoration:none;border-radius:8px;font-size:14px;">Review and publish →</a>
      </div>
    `,
  });
  if (emailError) console.warn(`Resend error (non-fatal): ${emailError.message}`);

  return NextResponse.json({
    ok: true,
    slug,
    id: briefing.id,
    sourceCount: sourceRefs.length,
    storiesGenerated: stories.length,
    editsApplied: editsApplied.length,
    validationWarnings: validation.warnings.length,
    needsReview: validation.needsReview,
  });
}
