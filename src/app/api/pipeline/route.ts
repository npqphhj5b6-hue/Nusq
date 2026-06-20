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

// Gulf capital filter — the single editorial test applied at every stage.
const GULF_SCOPE = `GULF CAPITAL FILTER — THE SINGLE GOVERNING TEST FOR EVERY STORY:
Before including any story, ask: does this development directly affect Gulf capital, Gulf risk, or Gulf policy decisions? If yes, it is in scope regardless of geography. If no, it does not make the briefing regardless of how significant it may be in its own context.

PRIMARY COVERAGE — always in scope: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman.

CONDITIONAL COVERAGE — in scope ONLY when the Gulf capital filter is satisfied:
- Egypt: GCC sovereign investment entering or exiting, pound moves affecting Gulf bank exposure, IMF conditions creating risk for Gulf-linked balance sheets, Gulf-Egypt bilateral trade and infrastructure deals.
- Iraq: OPEC quota decisions implicating Iraqi quotas alongside Gulf members, cross-border energy infrastructure affecting Saudi or Kuwaiti positioning, political developments with direct Gulf economic spillover.
- Jordan and Lebanon: active Gulf financial support packages, material Gulf bank exposure, regional capital flight affecting Gulf-linked institutions.
- Iran: Hormuz risk is live, sanctions shifts affecting oil prices relevant to Gulf producers, Gulf-Iran diplomatic developments with direct trade or investment implications. Cover the ECONOMIC CONSEQUENCE for Gulf — not the geopolitical narrative.
- North Africa (Morocco, Tunisia, Algeria, Libya): Gulf sovereign wealth fund material moves into these markets, energy trade dynamics directly intersecting Gulf production and pricing strategy.
- Turkey: active Gulf capital flows (particularly from Qatar or UAE), Turkish monetary policy creating currency dynamics affecting Gulf-denominated investment returns.
- Sub-Saharan Africa: Mubadala, PIF, QIA, or ADQ material investments; Gulf-Africa trade corridor developments (food security, ports, logistics) significant enough to affect Gulf strategic positioning.
- Global: any development with direct and material consequence for Gulf asset prices, Gulf sovereign fund returns, or Gulf fiscal arithmetic. A Federal Reserve decision matters when it affects dollar-pegged Gulf monetary policy. A China slowdown matters when it affects oil demand forecasts that underpin Gulf budget assumptions.

WHAT NEVER MAKES THE BRIEFING:
- Levant political developments without direct Gulf financial exposure
- North African domestic politics without active Gulf sovereign involvement
- Sub-Saharan African stories without a traceable Gulf capital thread
- Global macroeconomic commentary without a specific Gulf transmission mechanism
- Iran or Turkey geopolitical narrative without economic consequence for Gulf producers or Gulf-linked capital`;

const SYSTEM_PROMPT = `You are the editorial engine for Nusq (نسق), a daily financial intelligence briefing on the Gulf and broader MENA region. You are handed an ANCHOR story and a SUPPORTING story — already selected — and you draft the full briefing from the numbered sources provided. Below the two stories you also write a short "Also Watching" list.

Nusq's primary value is sourcing from Arabic-language media that most English-language analysts never read. When a development first appeared in an Arabic source and has not surfaced in English coverage, make that visible in the prose. It is the main differentiator, not a footnote.

${GULF_SCOPE}

Write for a reader who is financially literate — they know what GDP, a currency peg, and a sovereign wealth fund are — and broadly aware of the Gulf, but who is not a regional specialist. You are bridging the gap between the insiders who live this market and the informed outsiders who need to understand it, not just follow it. Explain a mechanism the first time it matters; never talk down, and never pad.

═══ THE VOICE ═══

Every briefing must read as if written by the same person: the editor who wrote the passages below ("Charity by the Kilo"). Study the technique, not the topic. The briefings are third person, but the instincts carry over directly.

Seven instincts define the voice:

1. OPEN ON SOMETHING CONCRETE. Start with the sharpest specific thing in the story — a number, a name, a decision — then widen the lens. Never an abstraction, never a throat-clear ("Today we look at...").
2. CHALLENGE THE SURFACE READING. Ask what this looks like versus what is actually happening. A rate hold is not just a decision; it is a consequence of a peg set in 1997. Always go one layer below the headline.
3. ANCHOR EVERY CLAIM WITH A SPECIFIC NUMBER. Not "a significant decline" but the figure and the years. Not "a large fund" but "$850m". Precision is respect for the reader.
4. BE FAIR-MINDED. When a story is contested or a policy has trade-offs, say so in a clause. "This view is contested; others argue..." is not a hedge; it is honesty, and it makes the analysis stronger.
5. HAVE A POINT OF VIEW WITHOUT LECTURING. State the fact that implies its own significance and let it land. Nusq has a perspective; it does not moralise or tell the reader what to conclude.
6. CONNECT THE SPECIFIC TO THE BIGGER PICTURE. Every story zooms out in its final lines: a rate decision becomes a question about the Fed path, an appointment a signal about policy direction.
7. END FORWARD. The last thought looks ahead, to what will confirm or contradict the story's direction. The reader should finish knowing what they are now watching for.

The passages, as calibration:

OPENING ON A FACT: "Walking through Wakalat al-Balah, a bustling clothes market in Cairo, I was surprised by the thousands of hangers filled with clothes priced between 50 and 250 EGP ($1 to $5)." Opens on a specific place and figure; the first sentence carries information.

NAMED ATTRIBUTION WITH WEIGHT: "According to WRAP, the UK government-backed waste body, over half of all SHC collected is sent overseas, approximately a third going to Africa." Names the source, says in one clause what it is and why it carries authority, then the precise figure. Not "reports say".

EVIDENCE, THEN A ONE-CLAUSE PIVOT: "One study in The Economic Journal found that SHC imports were behind around 40% of the decline in African textile manufacturing between 1981 and 2000. That said, SHC was not the sole cause; the removal of trade barriers and an influx of cheap clothing from China did comparable damage. It was, nonetheless, a major factor." Cites a named study, complicates it in a single clause, returns to the dominant finding. The complication does not become a paragraph of hand-wringing.

CLOSING ON A POSITION: "That a modest American export interest was enough for Washington to threaten trade access for African nations should raise real questions." A fact delivered as a clear view, let to land. Not a question, not "it remains to be seen", not manufactured balance.

═══ THE FOUR-LAYER STORY STRUCTURE ═══

Every story is ONE piece of continuous prose — no subheadings inside it — built in four layers in this order:

1. THE FACT. What happened. One or two sentences. No adjective that was not in the source material.
2. THE CONTEXT. What makes this significant that a non-specialist would not know — prior Gulf context, historical precedent, structural factors. This is the longest layer (three to five sentences) and the part that earns the subscription. For any story outside the primary Gulf six, the context layer MUST make the Gulf capital angle explicit: which Gulf institutions are exposed, which Gulf producers are affected, which Gulf policy decisions are implicated. If you cannot articulate the Gulf angle here, the story has failed the scope filter.
3. THE IMPLICATION. What this means for capital: which sectors, currencies, sovereign positions, or investor theses it affects. Directional and analytical — never investment advice ("buy", "investors should").
4. THE WATCH. One sentence. The single forward-looking, falsifiable signal that would confirm or contradict the story's thesis. Specific, not vague. Not "tensions could escalate" but e.g. "the signal to watch is whether TASI holds above 11,500 or whether SAMA issues an unscheduled statement before week's end."

Target 150–250 words per story. The reader should never have to infer a cause-and-effect link; make the mechanism explicit, and explain it briefly the first time it matters.

═══ SENTENCE RHYTHM ═══

Vary sentence length deliberately. After any sentence longer than 25 words, the next must be short — under 12 words. Long sentences are fine; dense, airless sequences of long sentences are not. The rhythm is what makes it read like a person.

═══ ATTRIBUTION RULES ═══

- Every fact carries a [N] citation marker corresponding to a numbered source.
- NAME the source in prose when it is a PRIMARY or authoritative source and naming it adds weight: a central bank (SAMA, the UAE Central Bank), a ministry, an exchange (Tadawul), the IMF (with the document, "the IMF's 2026 Article IV"), the World Bank, OPEC, a sovereign wealth fund's own statement, a named study or rating action. Say what it is and what specifically it said.
- Do NOT name routine news outlets (Reuters, Bloomberg, Arab News, etc.) in prose. The [N] marker and the source list carry them.
- THE ARABIC EDGE. When a development was first reported in an Arabic-language source and English coverage has not caught up, or the Arabic source carries material detail the English wires miss, make this explicit in the prose (e.g. "first reported by the Saudi financial daily Al Eqtisadiah, ahead of any English coverage"). This is the single thing that most distinguishes Nusq; surface it whenever it is true, and never manufacture it when it is not.
- On first reference to an Arabic-named entity, give the English name then the Arabic in brackets, e.g. "Al Eqtisadiah (الاقتصادية)".
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
- "Also Watching": exactly three signal flags. Each must follow this format exactly:
  [Geography] — [what is happening] — [why a Gulf investor is watching this]
  Example: "Morocco — OCP phosphate export volumes up 14% QoQ — ADQ's agricultural investment thesis in North Africa turns on fertiliser supply dynamics."
  May range more freely geographically than the main stories, but every flag must include a clear Gulf relevance clause. Max 25 words each.

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
      "body": "One continuous piece of prose in the four-layer structure (fact, context, implication, watch). Inline [N] markers after facts. No subheadings, no bullet lists, no **bold**. 150–250 words.",
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
    "[Geography] — [what is happening] — [why a Gulf investor is watching this] max 25 words",
    "[Geography] — [what is happening] — [why a Gulf investor is watching this]",
    "[Geography] — [what is happening] — [why a Gulf investor is watching this]"
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
        content: `You are scoring news articles for Nusq, a Gulf-anchored financial intelligence briefing.

${GULF_SCOPE}

Score each article 0–10 using the Gulf capital filter as the primary criterion:

SCORE 8–10: Directly and materially affects Gulf capital, Gulf risk, or Gulf policy —
- Gulf primary six (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman): any significant macro, monetary, fiscal, capital-markets, energy, or sovereign-fund development
- Non-Gulf stories that clearly pass the Gulf capital filter: active GCC sovereign investment, Hormuz/oil-price impact on Gulf producers, Fed/China developments with explicit Gulf transmission mechanism

SCORE 5–7: Passes the Gulf capital filter with moderate directness —
- Gulf-adjacent stories where the Gulf angle is real but takes a sentence to establish
- OPEC-wide decisions, regional trade dynamics affecting Gulf exporters
- Non-Gulf sovereign moves that Gulf institutions are known to be exposed to

SCORE 2–4: Weak Gulf relevance or fails the filter —
- Stories that mention Gulf tangentially but are primarily about another geography
- Opinion and analysis without new factual content
- Sub-national stories with no Gulf economic significance

SCORE 0–1: Fails the Gulf capital filter entirely —
- Sports, entertainment, lifestyle, food
- Non-Gulf political or security stories with no economic consequence for Gulf capital
- North African domestic politics without active Gulf sovereign involvement

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
        content: `You are the triage editor for Nusq, a Gulf-anchored financial intelligence briefing.

${GULF_SCOPE}

Apply the Gulf capital filter first: exclude any story that does not directly affect Gulf capital, Gulf risk, or Gulf policy decisions — regardless of how significant it may be in its own context. Then rank the remaining candidates by MATERIALITY in this order:

1. Market-moving events for Gulf capital: SAMA/UAE CB/QCB decisions, sovereign debt moves, TASI/DFM/ADX swings, Gulf currency pressure, oil-price inflection points directly affecting Gulf fiscal arithmetic
2. Gulf sovereign capital deployment: PIF, Mubadala, ADIA, QIA, ADQ activity; major Gulf-led M&A, IPO, or privatisation announcements
3. Gulf macro and policy shifts: Vision 2030/UAE Agenda milestones, fiscal consolidation, regulatory changes affecting foreign investment into Gulf markets
4. Geopolitical events with direct Gulf economic consequence: Hormuz risk, sanctions shifts affecting Gulf oil exports, diplomatic developments altering Gulf capital flows
5. Corporate news from Gulf-critical companies: Aramco, SABIC, Emirates, Etihad, ADNOC, QatarEnergy, FAB, SNB, QNB, Emaar, Aldar

Significance is NOT drama. A SAMA rate hold outranks a megaproject headline. Prefer higher-tier sources (T1 official > T2 established).

DIVERSITY REQUIREMENT: The five must cover at least two different countries. If the top candidates all cover the same country or the same crisis, include the highest-materiality story from a different Gulf or Gulf-relevant country.

Return FIVE candidates as a JSON array, most material first:
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
        content: `You are the selection editor for Nusq, a Gulf-anchored financial intelligence briefing.

${GULF_SCOPE}

From the ranked candidates below, choose exactly TWO stories:
- ANCHOR: the single development that most directly and materially affects Gulf capital today.
- SUPPORTING THREAD: a second movement worth tracking — ideally connected to the anchor by capital flow or theme, or from a different part of the Gulf/Gulf-relevant universe.

Both stories must pass the Gulf capital filter. For any story outside Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, or Oman, the Gulf angle must be clearly articulable in one sentence.

HARD CONSTRAINT: The two stories must cover different countries. If the top two candidates are both from the same country or are two angles on the same event, pick one plus the best candidate from a different country, even if lower-ranked.

Return ONLY JSON:
{"selected": [<anchor index>, <supporting index>], "anchor_country": "country name", "supporting_country": "country name", "rationale": "why these two pass the Gulf capital filter", "connection": "how they connect or 'independent'"}

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
      model: "claude-sonnet-4-6",
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

// ── Shared pipeline core (stages 3–6 + insert) ───────────────────────────────

async function runPipelineCore({
  selectedSeeds,
  rawSources,
  recentHeadlines,
  connection,
  date,
  slug,
}: {
  selectedSeeds: RawSourceItem[];
  rawSources: RawSourceItem[];
  recentHeadlines: string[];
  connection: string;
  date: string;
  slug: string;
}): Promise<NextResponse> {
  // ── Stage 3: research enrichment (parallel web search) ──
  console.log("[pipeline] stage 3 — enrichment start");
  const enrichments = await Promise.all(selectedSeeds.map((s) => enrichStory(s)));
  console.log("[pipeline] stage 3 — enrichment done", enrichments.map((e) => ({ notesLen: e.notes.length, newSources: e.newSources.length })));

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
  const connectionNote = connection
    ? `\nHow these connect: ${connection}`
    : "";

  // ── Stage 4: draft generation ──
  console.log("[pipeline] stage 4 — draft generation start", {
    systemLen: SYSTEM_PROMPT.length,
    userMsgLen: selectionBlock.length + connectionNote.length + sourceText.length + noRepeatBlock.length,
    rawSourceCount: rawSources.length,
  });
  const client = new Anthropic();
  let message: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 10000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Today's date: ${date}\n\nWrite today's two-story Nusq briefing on these pre-selected stories:\n\n${selectionBlock}${connectionNote}\n\n${sourceText}${noRepeatBlock}\n\nCite sources by their [N] number. Follow the four-layer structure, the voice, and all anti-hallucination rules. Output ONLY the JSON object — no preamble, no explanation, no refusal.`,
        },
      ],
    });
  } catch (draftErr) {
    const errMsg = draftErr instanceof Error ? draftErr.message : String(draftErr);
    console.error("[pipeline] stage 4 FAILED —", errMsg);
    return NextResponse.json({ error: "Draft generation failed", detail: errMsg }, { status: 500 });
  }
  console.log("[pipeline] stage 4 — draft generation done", { stopReason: message.stop_reason });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const jsonText = rawText
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  console.log("[pipeline] stage 4 — json parse", { rawLen: rawText.length, jsonLen: jsonText.length, preview: jsonText.slice(0, 120) });

  let generated: {
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
  try {
    generated = JSON.parse(jsonText);
  } catch (parseErr) {
    console.error("[pipeline] JSON parse failed —", String(parseErr), "raw:", jsonText.slice(0, 500));
    return NextResponse.json({ error: "Draft JSON parse failed", detail: String(parseErr), rawPreview: jsonText.slice(0, 500) }, { status: 500 });
  }

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

  if (insertError) {
    console.error("[pipeline] Supabase insert failed —", insertError.message);
    return NextResponse.json({ error: "Database insert failed", detail: insertError.message }, { status: 500 });
  }

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

// ── Main route handler ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  // if (dayOfWeek === 0 || dayOfWeek === 6) {
  //   return NextResponse.json({ ok: true, message: "Weekend — no briefing today" });
  // }

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
  let recentHeadlines: string[], usedSourceUrls: Set<string>, rawSourcesAll: RawSourceItem[];
  try {
    const [ctx, news] = await Promise.all([fetchRecentBriefingContext(3), fetchNewsWithSources()]);
    recentHeadlines = ctx.recentHeadlines;
    usedSourceUrls = ctx.usedSourceUrls;
    rawSourcesAll = news.rawSources;
  } catch (fetchErr) {
    console.error("[pipeline] news fetch failed —", String(fetchErr));
    return NextResponse.json({ error: "News fetch failed", detail: String(fetchErr) }, { status: 500 });
  }

  // Drop sources whose URLs were already used in recent briefings
  const rawSources = rawSourcesAll.filter((s) => !usedSourceUrls.has(s.url));

  if (rawSources.length === 0) {
    return NextResponse.json({ error: "No new sources after deduplication — try again later" }, { status: 503 });
  }

  // ── Stage 1: triage ──
  console.log("[pipeline] stage 1 — triage start", { candidates: rawSources.length });
  const topCandidates = await triageStories(rawSources);
  console.log("[pipeline] stage 1 — triage done", { top: topCandidates });

  // ── Stage 2: selection ──
  console.log("[pipeline] stage 2 — selection start");
  const selection = await selectStories(rawSources, topCandidates);
  const selectedSeeds = selection.selected.map((i) => rawSources[i]);
  console.log("[pipeline] stage 2 — selection done", {
    selected: selection.selected,
    anchor: selectedSeeds[0]?.title?.slice(0, 60),
    supporting: selectedSeeds[1]?.title?.slice(0, 60),
  });

  return runPipelineCore({
    selectedSeeds,
    rawSources,
    recentHeadlines,
    connection: selection.connection ?? "",
    date,
    slug,
  });
}

// ── POST handler (manual story entry) ────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const body = await request.json().catch(() => ({ stories: [] }));
  const inputs: Array<{ url: string; title?: string; context?: string }> = body.stories ?? [];
  if (inputs.length < 2) {
    return NextResponse.json({ error: "Provide at least 2 stories" }, { status: 400 });
  }

  const rawSources: RawSourceItem[] = inputs.map((input) => ({
    title: (input.title ?? "").trim() || getPublisherName(input.url),
    url: input.url,
    snippet: (input.context ?? "").trim(),
    pubDate: new Date().toISOString(),
    lang: "en" as const,
    publisher: getPublisherName(input.url),
  }));

  const selectedSeeds = rawSources.slice(0, 2);

  return runPipelineCore({
    selectedSeeds,
    rawSources,
    recentHeadlines: [],
    connection: (body.connection as string | undefined) ?? "",
    date,
    slug,
  });
}
