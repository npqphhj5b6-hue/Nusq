import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSourceTier, getSourceTierByName, getSourceType, getSourceTypeByName, getPublisherName, getPublisherDomain, isPrimarySource, normalizePublisherName } from "@/lib/source-credibility";
import type { SourceRef, BriefingClaim, ValidationResult, BriefingIntelligence } from "@/lib/types";

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

const SYSTEM_PROMPT = `You are the editorial voice of Nusq — a daily financial briefing for the MENA region.

═══ VOICE & STYLE ═══

Study these reference passages. Every briefing you write should sound like this:

--- REFERENCE PASSAGE A ---
"Walking through Wakalat al-Balah, a bustling clothes market in Cairo, I was surprised by the thousands of hangers filled with clothes priced between 50 and 250 EGP ($1 to $5). What caught my interest was that most of these clothes were not manufactured in Egypt. I saw uniforms for British supermarkets, workwear for an Australian construction company, American college T-shirts and hoodies. These items travelled a long way to get here, yet each seemed to have the same origin as someone's charity donation in a Western country."

--- REFERENCE PASSAGE B ---
"One study in The Economic Journal found that SHC imports were behind around 40% of the decline in African textile manufacturing between 1981 and 2000. That said, SHC was not the sole cause; the removal of trade barriers and an influx of cheap, newly made clothing from China did comparable damage. It was, nonetheless, a major factor. In Zimbabwe, an article in The Africa Report cites that the manufacturing industry's contribution to GDP dropped from 20% in 1990 to 7% in 2024."

--- REFERENCE PASSAGE C ---
"Rwanda refused, raising its tariffs in defiance, prompting the United States to suspend Rwanda's duty-free access for clothing exports in 2018, a penalty that still stands today. SHC imports from the United States were worth approximately $850 million in 2024, according to the World Bank, followed by China at $655 million. That a modest American export interest was enough for Washington to threaten trade access for African nations should raise real questions."

WHAT MAKES THIS VOICE WORK:
1. Opens with a concrete scene or specific fact. Never a thesis statement, never a scene-setting preamble.
2. Drops precise numbers early: exact figures, percentages, dollar amounts, dates. Not "significant" — the actual number.
3. Attributes specifically. "According to WRAP", "One study in The Economic Journal found" — not naked assertions.
4. Acknowledges complexity in one move: state the finding, then the caveat in one clause. "That said... It was, nonetheless, a major factor." Not a full paragraph of both sides.
5. Lets facts end the paragraph. The last sentence is the last fact, not an editorial kicker.
6. Section headings are direct and specific. Not metaphorical. Not clever.

DO NOT write:
- Em dashes (—). Use commas, parentheses, or a new sentence instead.
- "The honest read", "the whole point", "what this means", "sophisticated investors", "the bigger picture", "the bottom line", "in short".
- Symmetrical "on one hand / on the other hand" framing. State your finding, acknowledge the counter in one sentence, move on.
- A grand takeaway at the end of every paragraph. Some paragraphs simply end on the last fact.
- Explanatory filler: "it's important to understand that", "to put this in context", "what makes this significant is".
- Abstract finance language: "capital deployment", "risk-on sentiment", "macro headwinds", "tailwinds". Use concrete wording: "banks are lending more", "investors are buying equities", "oil prices are falling".
- Staccato sentence bursts. Use medium-length sentences with precise vocabulary — not breathless fragments.

═══ ANTI-HALLUCINATION RULES — NON-NEGOTIABLE ═══

1. ONLY write facts that are directly supported by the numbered sources provided. Do not invent figures, dates, company names, people, deal values, or statistics.
2. If only ONE source reports something material (a deal, a number, a policy change), write "according to [N]" or "reported by [N]" — do not state it as confirmed fact.
3. If sources CONFLICT, state both perspectives: "Source [N] reports X, while [M] suggests Y."
4. If a value, stake, or date is not in the sources, write "undisclosed" or "the figure was not disclosed".
5. Use SPECIFIC dates from sources rather than vague recency. Write "on 14 June" not "recently" or "this week" unless a source published within the last 7 days explicitly confirms it.
6. Do NOT describe an event as current if the most recent source discussing it is more than 30 days old — clearly label it as background or historical context.
7. Do NOT invent citation numbers. Every [N] in the body must correspond to a real source from the numbered list provided.
8. Do NOT use impressive-sounding but unsupported claims. Prefer "significant" over invented numbers.
9. If you are uncertain about something, write "reportedly" or mark it with [N].
10. Never fabricate sources or URLs.

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

{
  "title": "A compelling headline for today's briefing — max 12 words, no full stop",
  "summary": "2–3 sentences. A hook that sets up the main theme and makes the reader want more.",
  "tags": ["3 to 5 relevant tags"],
  "body": "The full briefing. Use ## for section headings. Use **bold** for key figures, company names, and important terms. Add [N] citation markers inline where you reference specific facts from the numbered sources. Write 4–6 substantive sections in flowing paragraphs — no bullet lists. Minimum 500 words.",
  "image_queries": {
    "mena": "A 4–7 word Unsplash query for a MENA-specific landscape photo. Moody and cinematic preferred.",
    "topic": "A 4–7 word Unsplash query tied to today's specific economic topic.",
    "cinematic": "A 4–7 word Unsplash query for a dramatic or atmospheric image."
  },
  "tickers": ["Array of up to 3 TradingView symbols from this exact list only: TVC:UKOIL, TVC:NGAS, TVC:GOLD, TVC:SILVER, FOREXCOM:SPXUSD, TVC:DXY. Empty array if nothing fits well."],
  "chart": {
    "type": "ONE of: brent_price, gold, fx_egp, fx_sar, gdp_growth, inflation — or null",
    "country": "2-letter ISO code required only for gdp_growth or inflation: SA, AE, EG, QA, KW, OM, BH, JO. Otherwise null."
  },
  "sources_used": [1, 3, 5],
  "source_annotations": {
    "1": {
      "is_primary": false,
      "is_background": false,
      "claims_supported": ["Saudi GDP grew 4.6% in Q1 2026"],
      "summary": "Provides official GDP data cited as the headline figure",
      "event_date": "2026-03-31"
    },
    "3": {
      "is_primary": true,
      "is_background": false,
      "claims_supported": ["SAMA held rates at 5.5% in June 2026"],
      "summary": "SAMA's official monetary policy statement",
      "event_date": "2026-06-17"
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
    "market_impact_detail": "One specific sentence describing what the impact means for investors — e.g. 'Bearish for energy equities given oil supply pressure; bullish for non-oil sectors and infrastructure spending.'",
    "investor_relevance": "high|medium|low",
    "relevance_reason": "A short clause (5–10 words) explaining why allocators should care — e.g. 'sovereign fund positioning and rate-sensitive sectors'",
    "time_horizon": "immediate|3-6 months|long-term|unclear",
    "affected_sectors": ["energy", "banking", "real estate", "logistics", "technology", "sovereign funds", "tourism", "defence", "infrastructure"],
    "affected_geographies": ["Saudi Arabia", "UAE", "Qatar", "Egypt", "Kuwait", "Oman", "Bahrain", "Jordan", "GCC", "MENA"],
    "confidence_note": "One sentence on what you are most and least certain about in this briefing.",
    "freshness_status": "fresh|developing|background|stale-risk",
    "conflicting_sources": false
  }
}`;

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

// Follow Google News redirect to get the real publisher URL for accurate tier scoring.
async function resolveRedirect(url: string): Promise<string> {
  if (!url.includes("news.google.com")) return url;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.url || url;
  } catch {
    return url;
  }
}

async function fetchNewsWithSources(): Promise<{ text: string; rawSources: RawSourceItem[] }> {
  const parser = new Parser({ timeout: 10000 });

  const queries = [
    { url: "https://news.google.com/rss/search?q=GCC+economy+finance&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Saudi+Arabia+economy+oil&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=UAE+economy+finance+investment&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=MENA+economy+markets&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
    { url: "https://news.google.com/rss/search?q=Aramco+SABIC+Saudi+stocks&hl=en-US&gl=US&ceid=US:en", lang: "en" as const },
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

  // Resolve Google News redirect URLs to actual publisher domains for accurate tier scoring
  await Promise.allSettled(
    sorted.map(async (s) => {
      const resolved = await resolveRedirect(s.url);
      if (resolved !== s.url) {
        s.url = resolved;
        s.publisher = getPublisherName(resolved) || s.publisher;
      }
    })
  );

  // Build the numbered source list for the prompt
  const numbered = sorted.map((s, i) => {
    const dateStr = s.pubDate
      ? new Date(s.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "date unknown";
    const langLabel = s.lang === "ar" ? " [AR]" : "";
    return `[${i + 1}] "${s.title}" | ${s.publisher}${langLabel} | ${dateStr} | ${s.url}\n    ${s.snippet}`;
  });

  const text = `Numbered sources — cite by [N] number in the briefing body:\n\n${numbered.join("\n\n")}`;

  return { text, rawSources: sorted };
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

// ── Unsplash ──────────────────────────────────────────────────────────────────

interface UnsplashPhoto {
  id: string;
  urls: { raw: string; small: string };
  user: { name: string; links: { html: string } };
  likes: number;
  alt_description?: string | null;
}

async function fetchUnsplashCandidates(queries: string[]): Promise<UnsplashPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const seen = new Set<string>();
  const all: UnsplashPhoto[] = [];
  await Promise.allSettled(
    queries.map(async (query) => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${key}` } }
        );
        if (!res.ok) return;
        const data = await res.json() as { results: UnsplashPhoto[] };
        for (const photo of data.results ?? []) {
          if (!seen.has(photo.id)) { seen.add(photo.id); all.push(photo); }
        }
      } catch { /* skip */ }
    })
  );
  return all.sort((a, b) => b.likes - a.likes).slice(0, 8);
}

async function selectBestPhoto(candidates: UnsplashPhoto[], title: string, summary: string): Promise<UnsplashPhoto | null> {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const client = new Anthropic();
  const imageBlocks: Anthropic.ImageBlockParam[] = candidates.map((p) => ({
    type: "image" as const,
    source: { type: "url" as const, url: p.urls.small },
  }));
  const list = candidates.map((p, i) => `${i + 1}. ${p.alt_description ?? "no description"} (${p.likes} likes)`).join("\n");
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 16,
    messages: [{
      role: "user",
      content: [
        ...imageBlocks,
        { type: "text", text: `Select the best cover image for a MENA financial briefing titled "${title}". The ${candidates.length} images are:\n${list}\n\nReply with ONLY the number (1–${candidates.length}).` },
      ],
    }],
  });
  const text = response.content.find((b) => b.type === "text")?.text?.trim() ?? "1";
  const index = parseInt(text, 10) - 1;
  return (isNaN(index) || index < 0 || index >= candidates.length) ? candidates[0] : candidates[index];
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

  // Fetch news with full source metadata
  const { text: sourceText, rawSources } = await fetchNewsWithSources();

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Today's date: ${date}\n\n${sourceText}\n\nWrite today's Nusq briefing. Cite sources by their [N] number. Follow all anti-hallucination rules.`,
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
    tags: string[];
    body: string;
    image_queries: { mena: string; topic: string; cinematic: string };
    tickers: string[];
    chart?: { type: string | null; country?: string | null } | null;
    sources_used?: number[];
    source_annotations?: Record<string, RawSourceAnnotation>;
    claims?: RawClaim[];
    intelligence?: RawIntelligence | null;
  };

  const wordCount = generated.body.split(/\s+/).length;
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

  // Run validation
  const validation = validateBriefing(generated.body, sourcesUsed, rawSources, date);

  // Fetch cover image
  const queries = Object.values(generated.image_queries).filter(Boolean);
  const candidates = await fetchUnsplashCandidates(queries);
  const photo = await selectBestPhoto(candidates, generated.title, generated.summary);
  const image = photo
    ? {
        url: photo.urls.raw,
        credit: `Photo by ${photo.user.name} on Unsplash`,
        creditLink: `${photo.user.links.html}?utm_source=nusq&utm_medium=referral`,
      }
    : null;

  // Fetch chart data
  const chartData = await buildChartData(generated.chart ?? { type: null });

  // Insert with all new fields
  const { data: briefing, error: insertError } = await supabaseAdmin
    .from("briefings")
    .insert({
      slug,
      title: generated.title,
      summary: generated.summary,
      tags: generated.tags,
      body: generated.body,
      reading_time: readingTime,
      date,
      status: validation.needsReview ? "draft" : "draft", // always draft; admin decides
      cover_image_url: image?.url ?? null,
      cover_image_credit: image?.credit ?? null,
      cover_image_credit_link: image?.creditLink ?? null,
      tickers: (generated.tickers ?? []).filter((t: string) => ALLOWED_TICKERS.has(t)).slice(0, 3),
      chart_data: chartData ?? null,
      sources: sourceRefs.length > 0 ? sourceRefs : null,
      validation,
      intelligence,
      claims: briefingClaims.length > 0 ? briefingClaims : null,
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
  if (emailError) throw new Error(`Resend error: ${emailError.message}`);

  return NextResponse.json({
    ok: true,
    slug,
    id: briefing.id,
    sourceCount: sourceRefs.length,
    validationWarnings: validation.warnings.length,
    needsReview: validation.needsReview,
  });
}
