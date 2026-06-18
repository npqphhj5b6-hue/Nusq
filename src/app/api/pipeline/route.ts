import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSourceTier, getSourceTierByName, getSourceType, getSourceTypeByName, getPublisherName, getPublisherDomain, isPrimarySource, normalizePublisherName } from "@/lib/source-credibility";
import type { SourceRef, BriefingClaim, ValidationResult, BriefingIntelligence, Counterpoint } from "@/lib/types";

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

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the editorial voice of Nusq — a daily financial briefing for allocators, analysts, and investors focused on the MENA region.

═══ VOICE & STYLE ═══

You write like a sharp, well-read analyst who happens to write well. Not a wire service. Not a press release. Not a summary bot.

Study these reference passages carefully. This is the target register.

--- PASSAGE A: OPENING STYLE ---
"Walking through Wakalat al-Balah, a bustling clothes market in Cairo, I was surprised by the thousands of hangers filled with clothes priced between 50 and 250 EGP ($1 to $5). What caught my interest was that most of these clothes were not manufactured in Egypt. I saw uniforms for British supermarkets, workwear for an Australian construction company, American college T-shirts and hoodies."

Note: starts with a specific place, a specific observation, a specific price. No preamble. No "Today we explore..."

--- PASSAGE B: EVIDENCE + PIVOT STRUCTURE ---
"One study in The Economic Journal found that SHC imports were behind around 40% of the decline in African textile manufacturing between 1981 and 2000. That said, SHC was not the sole cause; the removal of trade barriers and an influx of cheap, newly made clothing from China did comparable damage. It was, nonetheless, a major factor."

Note: cites evidence with precision, then immediately pivots to the complication. The pivot ("That said...") does not take a whole paragraph — one clause. Then returns to the main finding. No hand-wringing, no balance for balance's sake.

--- PASSAGE C: STRUCTURAL CONCLUSION ---
"That a modest American export interest was enough for Washington to threaten trade access for African nations should raise real questions."

Note: the conclusion is a fact that implies its own significance. No editorial announcement. No "This shows us that..." Just the fact, let to land.

--- PASSAGE D: INVESTOR FRAMING (FINIMIZE REGISTER) ---
"Saudi Arabia's non-oil revenues now cover roughly 38% of government spending, up from 10% a decade ago. For investors watching Vision 2030 commitments, that shift matters more than any quarterly GDP print — it tells you whether the diversification story has actual fiscal legs, or whether it remains contingent on $80-a-barrel oil."

Note: reports a specific figure, then draws a direct investment implication. Not abstract ("this is positive for markets") but specific ("this tells you whether X is true"). One beat of reporting, one beat of so-what. Never more than that.

═══ THE THREE RULES OF THIS VOICE ═══

RULE 1 — CITATION NUMBERS ARE SILENT. The [N] citation markers handle sourcing. They are reference numbers, not invitations to name the publisher in prose. Write "Saudi Arabia posted a 3.0% GDP expansion in Q1 [7]" — not "According to Arab News [7], Saudi Arabia posted...". Name a source in prose only when it IS a primary source (a central bank, a government ministry, the IMF, a company's investor relations) AND naming it strengthens the credibility of the claim. News outlets are almost never named in prose. The source list at the bottom of the briefing does that job.

RULE 2 — REPORT, THEN CONNECT. Every story needs at least one analytical beat: a sentence that connects the facts to an implication. Use the pivot structure: state the dominant finding, then complicate it in one clause ("That said..." / "The tension is..." / "What this does not resolve is..."), then land on the so-what for an investor or allocator. The so-what must be concrete and specific, not a vague positive or negative.

RULE 3 — SPECIFICITY OVER GENERALITY. Always use: named entities (the Saudi Economic Affairs Council, not "authorities"), precise figures (3.0%, not "around 3%"), exact dates (9 June, not "recently"), specific amounts ($33.5bn, not "billions"). If a number is not in the sources, do not estimate — write "the figure was not disclosed".

═══ ACCESSIBILITY & CLARITY ═══

THE FLOOR READER: Write for an educated professional with no finance background — a doctor, lawyer, or engineer who reads quality journalism. They understand what GDP is. They do not know what a repo rate, a CDS spread, or a basis point is. If they have to re-read a sentence to understand it, the sentence has failed.

THE FINIMIZE STANDARD: Every story should be readable by that person without confusion. Warm, direct, unhurried. Not dumbed down — made clear. There is a difference.

REPHRASE JARGON ENTIRELY. Do not define terms in parentheses. Do not use the term and then explain it. Just use the plain English version from the start:

| Instead of... | Write... |
|---|---|
| repo rate / policy rate | the rate at which the central bank lends money to banks |
| basis points | percentage points (25 basis points = 0.25%) — just write the percentage |
| CDS spreads | the cost of insuring against the country's debt going bad |
| sovereign debt / bonds | government borrowing / government bonds |
| current account deficit | the country is importing more than it exports |
| fiscal deficit | the government is spending more than it earns in tax |
| PMI | a monthly survey of businesses that tracks whether activity is expanding or contracting |
| FDI | foreign investment |
| equity / equities | shares / the stock market |
| liquidity | available cash / ease of borrowing |
| yield curve | the relationship between short-term and long-term borrowing costs |
| quantitative easing | the central bank creating money to buy assets |
| non-performing loans | loans that borrowers are failing to repay |

SENTENCE CLARITY TEST: Before writing a sentence, ask: could a non-finance professional follow this in one read? If not, break it into two sentences or rephrase. Long sentences are fine — dense sentences are not. The difference is whether the logic is easy to follow.

CAUSE AND EFFECT: Always make the mechanism explicit. Not "oil prices fell and the deficit widened" — write "oil prices fell, cutting the government's main source of income, which widened the gap between what it earns and what it spends." The reader should never have to infer the connection.

═══ PROHIBITED LANGUAGE — NON-NEGOTIABLE ═══

These phrases will be flagged and removed. Do not write them under any circumstances:

STRUCTURAL FILLER: "it's important to understand that", "to put this in context", "what makes this significant is", "the bottom line is", "in short", "the honest read", "what this tells us", "the point is", "what's clear is", "this is significant because".

ARTIFICIAL FRAMING: "bull case / bear case", "on one hand / on the other hand", "the X bet versus the Y warning", "the [country] paradox", "two readings of the same data". Do not construct symmetrical debates. State what the evidence shows.

ABSTRACT FINANCE LANGUAGE: "capital deployment", "risk-on sentiment", "macro headwinds", "tailwinds", "growth story", "investment momentum", "fiscal pressure", "long-term thesis", "macro narrative", "structural shift", "underlying fundamentals", "constructive outlook". Replace with concrete prose: "banks are lending more aggressively", "investors moved into equities", "oil revenues fell as prices dropped", "the government is spending faster than it is earning".

OVER-ATTRIBUTION IN PROSE: "According to Reuters...", "Bloomberg reported...", "Arab News said...", "Al Jazeera noted...", "as reported by [outlet]", "as mentioned by [outlet]" — never name a news outlet in the body. Use [N] instead.

MARKET SENTIMENT WITHOUT DATA: "markets are pricing in", "markets are betting on", "market confidence is rising", "investor sentiment has shifted", "the market has responded". These are prohibited unless your cited sources include specific index levels, bond yields, CDS spreads, or fund flow figures. If sources are media sentiment only, write "analysts have described the mood as cautious" or "commentary in regional media has emphasised the de-escalation angle" — not a market fact.

STYLISTIC TICS: em dashes (—), staccato fragments, and neat symmetrical conclusions that manufacture balance. Write varied, medium-length sentences. If the evidence points one way, say so.

═══ ANTI-HALLUCINATION RULES — NON-NEGOTIABLE ═══

1. ONLY write facts directly supported by the numbered sources provided. Do not invent figures, dates, company names, people, deal values, or statistics.
2. Every [N] in the body must correspond to a real source from the numbered list. Do not invent citation numbers.
3. If a claim comes from only one source, place [N] after it. Do not additionally name the outlet in prose (the number is the citation).
4. If sources conflict, state both: "Source [N] reports X. Source [M] puts the figure at Y."
5. If a value, stake, or date is not in the sources, write "undisclosed" or "the figure was not disclosed".
6. Use specific dates from sources. Write "on 9 June" not "recently" or "this week" unless a source from within the last 7 days explicitly confirms it.
7. Do not describe an event as current if the most recent source is more than 30 days old — label it as background or historical context.
8. Do not use impressive-sounding claims that go beyond what the sources say. Prefer "significant" over an invented magnitude.
9. Never fabricate sources or URLs.
10. BEFORE WRITING EACH STORY: scan the full source list for evidence that contradicts or materially qualifies your main claim. If a credible source presents a different picture — a risk, a contradiction, a failure mode, a conflicting figure — the pivot structure is mandatory. Do not present a one-sided story when the source list contains material counter-evidence on the same topic.

═══ DATE DISCIPLINE ═══

- Distinguish clearly between: (a) today's new development, (b) a developing story from the past week, (c) background context or historical fact.
- Use exact dates when sources provide them.
- Do not use: "today", "this morning", "just announced", "closed this week", "new deal" — unless a source published in the last 7 days explicitly says so.
- For background context more than 30 days old, phrase as: "...which was first announced in [month/year]..." or "...part of a broader initiative launched in..."

═══ SOURCE ATTRIBUTION REQUIREMENTS ═══

For every source index in sources_used, provide a corresponding entry in source_annotations (keyed by the source number as a string):
- "is_primary": true if the source is an official body directly releasing information (central bank, exchange, gov ministry, IMF, company IR). False for wire services and media reports about those institutions.
- "is_background": true if the source provides historical or contextual information rather than breaking/current news.
- "claims_supported": array of the specific, verifiable claims from the briefing body that this source directly supports. Copy the exact key fact/figure from the body text — e.g. "Saudi inflation reached 1.8% in May 2026", not vague summaries.
- "summary": one sentence explaining why this source was cited and what it contributes.
- "event_date": ISO date (YYYY-MM-DD) of the event described, if precisely known from the source. Null if ongoing, approximate, or unclear.

Also output a "claims" array with the 5–10 most important verifiable claims in the briefing:
- "claim": the exact claim text — a specific fact, figure, date, or entity statement
- "sources": array of source indices from sources_used that directly support this claim
- "confidence": "high" (multiple T1/T2 sources agree), "medium" (single T2 source), or "low" (uncertain or single source)
- "requires_attribution": true if this is a single-source claim needing "according to [N]" framing in the body

═══ OUTPUT FORMAT ═══

Output ONLY a valid JSON object — no prose before or after, no markdown code fences.

The briefing is structured as 3–4 independent numbered stories. Each story covers a distinct development, deal, or theme from today's sources. Do NOT write one long connected essay — write separate, self-contained stories. Keep each story tight.

GEOGRAPHIC STRUCTURE — FOLLOW THIS HIERARCHY:

DEFAULT STRUCTURE (4 stories):
1. Gulf story — strongest Gulf story available; no country preference within the Gulf (Saudi Arabia, UAE, Qatar, Kuwait, Oman, Bahrain all compete equally on newsworthiness)
2. Gulf story — second-best Gulf story, different country from story 1
3. North Africa story — Egypt or Morocco preferred; Jordan, Lebanon, or Iraq if North Africa material is thin; Tunisia, Algeria, or Libya if that is the strongest available
4. Wildcard — best remaining story from anywhere in MENA (Levant, Iraq, North Africa, or a Gulf country not yet covered)

THIN DAY RULE: If there is no North Africa or Levant story worth writing, run 3 Gulf stories instead. Do NOT manufacture a weak story to hit geographic targets. Quality beats geography on thin days.

WITHIN THE GULF — no country has automatic priority. Saudi Arabia, UAE, Qatar, Kuwait, Oman, and Bahrain all compete on the strength of the story. Pick the two most newsworthy.

NON-GULF PRIORITY ORDER (when multiple non-Gulf stories are available):
Egypt first (largest Arab economy, IMF programme, major reform story), then Morocco, then Jordan or Lebanon, then Iraq, then Tunisia/Algeria/Libya.

RULES THAT APPLY REGARDLESS:
- No two stories may cover the same country.
- Assign each story's "location" field to the specific country, not "MENA" or "GCC".
- No country appears more than once per briefing.

{
  "title": "A compelling headline for today's overall briefing — max 12 words, no full stop",
  "summary": "2–3 sentences. A hook that sets up the main theme and makes the reader want more.",
  "tldr_bullets": [
    "First key takeaway — one short sharp sentence, max 15 words, citing the specific figure or development",
    "Second key takeaway",
    "Third key takeaway",
    "Fourth key takeaway (optional)",
    "Fifth key takeaway (optional)"
  ],
  "tags": ["3 to 5 relevant tags for the whole briefing"],
  "stories": [
    {
      "number": 1,
      "headline": "Short story headline — max 8 words, no full stop",
      "location": "Saudi Arabia",
      "city": "Riyadh",
      "body": "The full story. Add [N] citation markers inline after facts. Do NOT bold anything — no **bold**, no emphasis markers. Write 2–3 tight paragraphs, no bullet lists, 100–150 words. Structure: (1) open with a specific figure, date, or named event — never a thesis or preamble; (2) develop with connected facts and one analytical pivot ('That said...' / 'The tension is...'); (3) close with a concrete investor implication or the structural stakes — specific, not abstract. Do not name news outlets in the body.",
      "image_query": "A 4–7 word Unsplash query specific to this story's subject and location. Moody and cinematic preferred.",
      "chart": {
        "type": "ONE of the predefined types: brent_price, gold, fx_egp, fx_sar, gdp_growth, inflation — OR use 'bar' to provide inline data — OR null if no chart fits",
        "country": "2-letter ISO required only for gdp_growth or inflation: SA, AE, EG, QA, KW, OM, BH, JO. Otherwise null.",
        "title": "Required only for type='bar': descriptive chart title",
        "labels": ["Required only for type='bar': x-axis labels, e.g. quarters or countries"],
        "values": [0, 0, 0],
        "unit": "Required only for type='bar': e.g. 'AED billion' or '%' or 'USD/barrel'",
        "source": "Required only for type='bar': the specific source this data comes from, matching a cited [N] source"
      }
    },
    {
      "number": 2,
      "headline": "Second story headline",
      "location": "UAE",
      "city": "Dubai",
      "body": "...",
      "image_query": "...",
      "chart": null
    }
  ],
  "tickers": ["Array of up to 3 TradingView symbols from this exact list only: TVC:UKOIL, TVC:NGAS, TVC:GOLD, TVC:SILVER, FOREXCOM:SPXUSD, TVC:DXY. Empty array if nothing fits well."],
  "sources_used": [1, 3, 5],
  "source_annotations": {
    "1": {
      "is_primary": false,
      "is_background": false,
      "claims_supported": ["Saudi GDP grew 4.6% in Q1 2026"],
      "summary": "Provides official GDP data cited as the headline figure",
      "event_date": "2026-03-31"
    }
  },
  "claims": [
    {
      "claim": "Saudi GDP grew 4.6% in Q1 2026",
      "sources": [1, 3],
      "confidence": "high",
      "requires_attribution": false
    }
  ],
  "intelligence": {
    "market_impact": "positive|negative|mixed|neutral|unclear",
    "market_impact_detail": "One specific sentence describing what the impact means for investors.",
    "investor_relevance": "high|medium|low",
    "relevance_reason": "A short clause (5–10 words) explaining why allocators should care.",
    "time_horizon": "immediate|3-6 months|long-term|unclear",
    "affected_sectors": ["energy", "banking", "real estate", "logistics", "technology", "sovereign funds", "tourism", "defence", "infrastructure"],
    "affected_geographies": ["Saudi Arabia", "UAE", "Qatar", "Egypt", "Kuwait", "Oman", "Bahrain", "Jordan", "GCC", "MENA"],
    "confidence_note": "One sentence on what you are most and least certain about in this briefing.",
    "freshness_status": "fresh|developing|background|stale-risk",
    "conflicting_sources": false
  }
}

CHART RULES FOR 'bar' TYPE:
- Only use numbers that are explicitly stated in the cited sources. Do not invent or estimate values.
- Include the source name as the "source" field (e.g. "UAE Federal Competitiveness Authority", "Saudi Vision 2030 report").
- Use 4–8 labels maximum. Keep labels short (e.g. "Q1 2025", "Saudi Arabia", "Jan 2026").
- Good candidates: trade volumes by quarter, country comparison of a single metric, year-over-year figures, sector breakdown percentages.`;

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
    // Gulf
    { url: "https://news.google.com/rss/search?q=Saudi+Arabia+economy+oil+finance&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=UAE+economy+investment+trade&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Qatar+economy+LNG+finance&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Kuwait+Oman+Bahrain+economy&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
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
          // Fallback: extract publisher from contentSnippet "headline  Publisher" (Google News uses NBSP pairs)
          if (!publisher) {
            const snip = (item.contentSnippet ?? "").trim();
            const sep = "  ";
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

  // Resolve Google News redirect URLs to actual publisher domains for accurate tier scoring.
  // Only update URL/publisher when the redirect actually leaves news.google.com — if it stays
  // on Google's domain (a different Google News path), getPublisherName returns "news.google.com"
  // which is truthy and would silently overwrite the publisher name extracted from the RSS title.
  await Promise.allSettled(
    sorted.map(async (s) => {
      const resolved = await resolveRedirect(s.url);
      if (resolved !== s.url && !resolved.includes("news.google.com")) {
        s.url = resolved;
        s.publisher = getPublisherName(resolved) || s.publisher;
      }
    })
  );

  // Score articles for investor/allocator relevance and drop weak ones
  const relevant = await filterForRelevance(sorted);

  // Build the numbered source list for the prompt
  const numbered = relevant.map((s, i) => {
    const dateStr = s.pubDate
      ? new Date(s.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "date unknown";
    const langLabel = s.lang === "ar" ? " [AR]" : "";
    return `[${i + 1}] "${s.title}" | ${s.publisher}${langLabel} | ${dateStr} | ${s.url}\n    ${s.snippet}`;
  });

  const text = `Numbered sources — cite by [N] number in the briefing body:\n\n${numbered.join("\n\n")}`;

  return { text, rawSources: relevant };
}

// ── Relevance filter ──────────────────────────────────────────────────────────

// Score every collected article for investor/allocator relevance to the MENA
// region using a single fast Haiku call. Articles scoring below the threshold
// are dropped before the expensive Opus generation step.
async function filterForRelevance(items: RawSourceItem[]): Promise<RawSourceItem[]> {
  if (items.length === 0) return items;

  const client = new Anthropic();

  // Build a compact list: index + title + snippet (no URLs needed for scoring)
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
        content: `You are scoring news articles for a MENA financial briefing read by institutional allocators, HNW private investors, and senior business professionals operating in the region.

Score each article 0–10:

SCORE 8–10 (strong signal — always include):
- Macro & policy: GDP, inflation, PMI, central bank decisions, interest rates, fiscal budgets, IMF/World Bank programmes, sovereign credit ratings
- Capital markets: IPOs, equity/bond issuance, exchange news, fund flows, index changes, asset prices
- Deals & investment: M&A, joint ventures, FDI announcements, privatisations, major contract awards with disclosed values
- Energy & commodities: oil/gas production, OPEC decisions, LNG contracts, refinery/pipeline news, renewable energy projects
- Geopolitics: elections, conflicts, diplomatic shifts, sanctions, trade route disruptions — always relevant regardless of direct economic link; political context matters to anyone operating in the region

SCORE 5–7 (useful context — include):
- National strategy announcements (Vision 2030, Egypt Vision, Morocco New Development Model) even without concrete figures
- Government spending plans, subsidy changes, labour market reforms
- Social or religious policy with economic dimension (tourism, gender policy, expat rules)
- Corporate earnings, leadership changes at major regional companies
- Regulatory changes affecting a sector

SCORE 2–4 (weak — exclude):
- Sub-national and city-level stories with no national economic significance (municipal tenders, local infrastructure with no disclosed value, city-level administrative news)
- Minor ceremonial or protocol events (state visits with no deal announced, ribbon-cuttings)
- Opinion pieces and editorials without new factual content

SCORE 0–1 (irrelevant — always exclude):
- Sports, entertainment, celebrity, lifestyle, fashion, food
- Crime and security incidents with no economic/geopolitical dimension
- Weather and natural disasters unless causing significant economic disruption

Output ONLY a JSON array of integers in the same order as the input. Example for 4 articles: [8,3,9,1]

Articles:
${list}`,
      }],
    });

    const text = res.content.find((b) => b.type === "text")?.text?.trim() ?? "[]";
    const match = text.match(/\[[\d,\s]+\]/);
    if (match) scores = JSON.parse(match[0]) as number[];
  } catch {
    // If scoring fails, pass all items through rather than blocking the pipeline
    return items;
  }

  // Keep articles scoring 5 or above; fall back to all items if scores are mismatched
  if (scores.length !== items.length) return items;

  const THRESHOLD = 5;
  const filtered = items.filter((_, i) => (scores[i] ?? 0) >= THRESHOLD);

  // Safety: always return at least 10 items so Claude has enough to pick from
  return filtered.length >= 10 ? filtered : items.slice(0, Math.max(filtered.length, 10));
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
      // See if any referenced source is within the last 7 days
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
        // Blocks publish when a tier-1 or tier-2 source directly contradicts or
        // provides official data contradicting the claim at high severity
        const counterTiers = (r.counter_source_indices ?? []).map((i) => {
          const s = rawSources[i - 1];
          if (!s) return 3 as const;
          // Mirror buildSourceRefs: unresolved Google News URLs always score
          // tier 3 by URL, so fall back to publisher-name tier in that case.
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

// ── Photo generation ──────────────────────────────────────────────────────────

interface PhotoResult {
  url: string;
  credit: string;
  creditLink: string | null;
}

const LOCATION_VISUALS: Record<string, string> = {
  "Saudi Arabia": "Riyadh skyline, desert dunes, oil refinery infrastructure",
  "UAE": "Dubai or Abu Dhabi financial district, glass towers, Arabian Gulf",
  "Qatar": "Doha West Bay skyline, LNG terminal, Pearl-Qatar island",
  "Kuwait": "Kuwait City skyline, oil fields, Liberation Tower",
  "Bahrain": "Manama financial harbour, King Fahd Causeway, Pearl Roundabout",
  "Oman": "Muscat coastline, Sultan Qaboos Grand Mosque, Hajar Mountains",
  "Egypt": "Cairo skyline, Nile River, modern business district",
  "Morocco": "Casablanca Hassan II Mosque, Atlantic coastline, business district",
  "Jordan": "Amman modern skyline, ancient citadel, desert landscape",
  "Iraq": "Baghdad Tigris River, modern development, oil infrastructure",
  "Lebanon": "Beirut Mediterranean coastline, urban skyline",
  "Libya": "Tripoli Mediterranean port, oil infrastructure",
  "Tunisia": "Tunis medina and modern skyline, Mediterranean coast",
  "Algeria": "Algiers Mediterranean bay, modern district",
};

function buildImagePrompt(query: string, location?: string): string {
  const place = location
    ? (LOCATION_VISUALS[location] ?? `${location} cityscape and modern infrastructure`)
    : "Gulf financial district, glass towers, Arabian Gulf coastline";
  return `Dramatic cinematic aerial editorial photography, ${place}, ${query}, golden hour warm amber light rays, deep dark atmospheric sky, long exposure, photorealistic, ultra detailed, 8k, no text, no logos, no people`;
}

async function generateFalPhoto(query: string, location?: string): Promise<PhotoResult | null> {
  const key = process.env.FAL_API_KEY;
  if (!key) return null;
  try {
    const prompt = buildImagePrompt(query, location);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: { "Authorization": `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, image_size: "landscape_16_9", num_inference_steps: 4, num_images: 1, enable_safety_checker: true }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const errText = await res.text().catch(() => "(empty)");
      console.error(`[fal.ai] ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }
    const text = await res.text();
    if (!text) { console.error("[fal.ai] empty response body"); return null; }
    const data = JSON.parse(text) as { images?: Array<{ url: string }> };
    const url = data.images?.[0]?.url;
    if (!url) return null;
    return { url, credit: "AI-generated image", creditLink: null };
  } catch (err) {
    console.error("[fal.ai] fetch error:", err);
    return null;
  }
}

interface UnsplashPhoto {
  id: string;
  urls: { raw: string; small: string };
  user: { name: string; links: { html: string } };
  likes: number;
}

async function fetchUnsplashPhoto(query: string): Promise<PhotoResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { results: UnsplashPhoto[] };
    const photo = (data.results ?? []).sort((a, b) => b.likes - a.likes)[0];
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

async function fetchStoryPhoto(query: string, location?: string): Promise<PhotoResult | null> {
  return (await generateFalPhoto(query, location)) ?? (await fetchUnsplashPhoto(query));
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
  /** Story headlines from the last N briefings */
  recentHeadlines: string[];
  /** Source URLs already used in the last N briefings */
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
  const rawSources = rawSourcesAll.filter(
    (s) => !usedSourceUrls.has(s.url)
  );

  // Re-number the filtered source list
  const numbered = rawSources.map((s, i) => {
    const dateStr = s.pubDate
      ? new Date(s.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "date unknown";
    const langLabel = s.lang === "ar" ? " [AR]" : "";
    return `[${i + 1}] "${s.title}" | ${s.publisher}${langLabel} | ${dateStr} | ${s.url}\n    ${s.snippet}`;
  });
  const sourceText = `Numbered sources — cite by [N] number in the briefing body:\n\n${numbered.join("\n\n")}`;

  // Build "do not repeat" block from recent briefings
  const noRepeatBlock = recentHeadlines.length > 0
    ? `\n\nSTORIES ALREADY COVERED IN RECENT BRIEFINGS — do NOT write about these topics again, even from a different angle:\n${recentHeadlines.map((h) => `• ${h}`).join("\n")}\n\nChoose entirely different stories from today's sources.`
    : "";

  if (rawSources.length === 0) {
    return NextResponse.json({ error: "No new sources after deduplication — try again later" }, { status: 503 });
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 10000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Today's date: ${date}\n\n${sourceText}${noRepeatBlock}\n\nWrite today's Nusq briefing. Cite sources by their [N] number. Follow all anti-hallucination rules.`,
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

  interface RawStory {
    number?: number;
    headline?: string;
    location?: string;
    city?: string;
    body?: string;
    image_query?: string;
    chart?: StoryChartSpec | null;
  }

  const generated = JSON.parse(jsonText) as {
    title: string;
    summary: string;
    tldr_bullets?: string[];
    tags: string[];
    body?: string;
    stories?: RawStory[];
    image_queries?: { mena: string; topic: string; cinematic: string };
    tickers: string[];
    chart?: { type: string | null; country?: string | null } | null;
    sources_used?: number[];
    source_annotations?: Record<string, RawSourceAnnotation>;
    claims?: RawClaim[];
    intelligence?: RawIntelligence | null;
  };

  const rawStories = generated.stories ?? [];
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

  // Fetch per-story images, charts, and run counter-evidence detection in parallel
  const [storyPhotos, storyCharts, counterpoints] = await Promise.all([
    Promise.all(rawStories.map((s) => fetchStoryPhoto(s.image_query ?? generated.title, s.location ?? undefined))),
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

  // Assemble stories with images and charts
  const stories = rawStories.map((s, i) => {
    const photo = storyPhotos[i];
    return {
      number: s.number ?? i + 1,
      headline: s.headline ?? "",
      location: s.location ?? "",
      city: s.city ?? "",
      body: s.body ?? "",
      imageUrl: photo?.url ?? null,
      imageCredit: photo?.credit ?? null,
      imageCreditLink: photo?.creditLink ?? null,
      chartData: storyCharts[i] ?? null,
    };
  });

  // Cover image: use first story's photo for multi-story; fetch separately for single-article
  const coverPhoto = storyPhotos[0] ?? (rawStories.length === 0 ? await fetchStoryPhoto(generated.title) : null);
  const image = coverPhoto
    ? { url: coverPhoto.url, credit: coverPhoto.credit, creditLink: coverPhoto.creditLink }
    : null;

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
    validationWarnings: validation.warnings.length,
    needsReview: validation.needsReview,
  });
}
