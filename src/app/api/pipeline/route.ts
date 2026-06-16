import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 300;

// Tickers supported by the free TradingView mini-widget
const ALLOWED_TICKERS = new Set([
  "TVC:UKOIL", "TVC:NGAS", "TVC:GOLD", "TVC:SILVER",
  "FX:USDSAR", "FX:USDAED", "FX:USDKWD", "FX:USDQAR",
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

const SYSTEM_PROMPT = `You are the editorial voice of nusq — a daily financial briefing for the MENA region, written in the style of Finimize.

Your writing voice:
- Direct and confident. No filler phrases ("it's worth noting", "in conclusion", "needless to say").
- Analytical, not just descriptive. Connect each story to what it means for the region.
- Warm and intelligent — you respect the reader's time and intelligence.
- You write for sophisticated readers in the Gulf: finance professionals, investors, entrepreneurs.

You will receive today's financial headlines from the MENA/GCC region. Synthesise them into a coherent daily briefing.

Output ONLY a valid JSON object — no prose before or after, no markdown code fences. The JSON must have exactly these fields:

{
  "title": "A compelling headline for today's briefing — max 12 words, no full stop",
  "summary": "2–3 sentences. A hook that sets up the main theme and makes the reader want more.",
  "tags": ["3 to 5 relevant tags — e.g. 'Saudi Arabia', 'Oil', 'Vision 2030', 'UAE', 'Markets'"],
  "body": "The full briefing. Use ## for section headings. Use **bold** for key figures, company names, and important terms. Write 4–6 substantive sections in flowing paragraphs — no bullet lists. Minimum 500 words.",
  "image_queries": {
    "mena": "A 4–7 word Unsplash query for a MENA-specific landscape photo. Must be geographically anchored — e.g. 'Riyadh skyline night aerial', 'Dubai creek dhow sunset', 'Doha West Bay dusk', 'Aramco refinery industrial'. Moody and cinematic preferred.",
    "topic": "A 4–7 word Unsplash query tied to today's specific economic topic — e.g. 'oil tanker sea horizon', 'gold bars vault close-up', 'container ship port aerial', 'solar panels desert Sahara', 'stock exchange trading floor'. Atmospheric over generic.",
    "cinematic": "A 4–7 word Unsplash query for a dramatic, abstract, or landscape image that captures the mood of today's story — e.g. 'desert dunes golden hour', 'stormy sea dramatic sky', 'city lights long exposure night'. No people, no text in frame."
  },
  "tickers": ["Array of up to 3 TradingView ticker symbols. CRITICAL: you MUST only use symbols from this exact list — any other symbol (including TADAWUL:, ADX:, DFM:, or any stock ticker) will fail to render and must never be used. Allowed symbols: 'TVC:UKOIL' (Brent crude), 'TVC:NGAS' (natural gas), 'TVC:GOLD', 'TVC:SILVER', 'FX:USDSAR' (Saudi riyal), 'FX:USDAED' (UAE dirham), 'FX:USDKWD' (Kuwaiti dinar), 'FX:USDQAR' (Qatari riyal), 'FOREXCOM:SPXUSD' (S&P 500), 'TVC:DXY' (USD index). Pick only what is directly relevant. Empty array if nothing fits well."],
  "chart": {
    "type": "Choose ONE or null: 'brent_price' (oil prices, OPEC, Gulf energy, Aramco), 'gold' (gold price, commodities, safe-haven), 'fx_egp' (Egypt, pound, EGP devaluation, IMF/Egypt), 'fx_sar' (Saudi monetary policy, riyal), 'gdp_growth' (country economic growth trajectory), 'inflation' (inflation, cost of living, rate decisions). Use null if none clearly fit.",
    "country": "2-letter ISO code — required only when type is gdp_growth or inflation. One of: SA, AE, EG, QA, KW, OM, BH, JO. Otherwise null."
  }
}`;

async function fetchNewsHeadlines(): Promise<string> {
  const parser = new Parser({ timeout: 10000 });

  const queries = [
    { url: "https://news.google.com/rss/search?q=GCC+economy+finance&hl=en-US&gl=US&ceid=US:en", lang: "EN" },
    { url: "https://news.google.com/rss/search?q=Saudi+Arabia+economy+oil&hl=en-US&gl=US&ceid=US:en", lang: "EN" },
    { url: "https://news.google.com/rss/search?q=UAE+economy+finance+investment&hl=en-US&gl=US&ceid=US:en", lang: "EN" },
    { url: "https://news.google.com/rss/search?q=MENA+economy+markets&hl=en-US&gl=US&ceid=US:en", lang: "EN" },
    { url: "https://news.google.com/rss/search?q=Aramco+SABIC+Saudi+stocks&hl=en-US&gl=US&ceid=US:en", lang: "EN" },
    { url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9&hl=ar&gl=SA&ceid=SA:ar", lang: "AR" },
    { url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D8%A7%D9%84%D8%A5%D9%85%D8%A7%D8%B1%D8%A7%D8%AA&hl=ar&gl=AE&ceid=AE:ar", lang: "AR" },
  ];

  const enItems: string[] = [];
  const arItems: string[] = [];

  await Promise.allSettled(
    queries.map(async ({ url, lang }) => {
      try {
        const feed = await parser.parseURL(url);
        for (const item of feed.items.slice(0, 8)) {
          const headline = item.title ?? "";
          const snippet = (item.contentSnippet ?? item.title ?? "").substring(0, 200);
          const line = `- ${headline}: ${snippet}`;
          if (lang === "AR") arItems.push(line);
          else enItems.push(line);
        }
      } catch {
        // skip failed feeds silently
      }
    })
  );

  if (enItems.length + arItems.length === 0) {
    throw new Error("No news fetched from any RSS feed");
  }

  const sections: string[] = [];
  if (enItems.length > 0) sections.push(`## English headlines\n${enItems.join("\n")}`);
  if (arItems.length > 0) sections.push(`## Arabic headlines (translate relevant ones)\n${arItems.join("\n")}`);
  return sections.join("\n\n");
}

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
          if (!seen.has(photo.id)) {
            seen.add(photo.id);
            all.push(photo);
          }
        }
      } catch {
        // skip failed queries
      }
    })
  );

  // Sort by likes (quality signal), keep best 8 for Claude to review
  return all.sort((a, b) => b.likes - a.likes).slice(0, 8);
}

async function selectBestPhoto(
  candidates: UnsplashPhoto[],
  title: string,
  summary: string
): Promise<UnsplashPhoto | null> {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const client = new Anthropic();

  // Build image blocks from each candidate's small URL
  const imageBlocks: Anthropic.ImageBlockParam[] = candidates.map((photo) => ({
    type: "image" as const,
    source: { type: "url" as const, url: photo.urls.small },
  }));

  const list = candidates
    .map((p, i) => `${i + 1}. ${p.alt_description ?? "no description"} (${p.likes} likes)`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 16,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `You are selecting a cover image for a MENA financial news briefing.

Briefing title: "${title}"
Summary: "${summary}"

The ${candidates.length} images above (numbered left-to-right, top-to-bottom) are:
${list}

Selection criteria (in order of priority):
1. Moody and cinematic — atmospheric, dramatic light, not flat or over-lit
2. MENA geography preferred (Gulf skylines, desert, Gulf waterways, regional infrastructure)
3. Relevant to the topic — oil/energy, finance, construction, trade where applicable
4. No faces dominating the frame; environment over portrait
5. Not generic stock imagery (no suits-and-handshakes, no clip-art style)

Reply with ONLY the number of the best image (1–${candidates.length}). No other text.`,
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")
    ?.text?.trim() ?? "1";
  const index = parseInt(text, 10) - 1;

  // Fallback to first (highest-liked) if response is unparseable
  if (isNaN(index) || index < 0 || index >= candidates.length) return candidates[0];
  return candidates[index];
}


// ── Chart data via FRED & World Bank ─────────────────────────────────────────

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
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED error ${res.status}`);
  const data = await res.json() as { observations: FredObservation[] };
  const obs = data.observations
    .filter((o) => o.value !== "." && !isNaN(parseFloat(o.value)))
    .reverse();
  return {
    labels: obs.map((o) => o.date.slice(0, 7)), // YYYY-MM
    values: obs.map((o) => parseFloat(parseFloat(o.value).toFixed(2))),
  };
}

async function fetchWorldBankSeries(countryCode: string, indicator: string, limit = 10): Promise<{ labels: string[]; values: number[] }> {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=${limit}&mrv=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank error ${res.status}`);
  const data = await res.json() as [unknown, Array<{ date: string; value: number | null }>];
  const rows = (data[1] ?? [])
    .filter((r) => r.value !== null)
    .reverse();
  return {
    labels: rows.map((r) => r.date),
    values: rows.map((r) => parseFloat((r.value as number).toFixed(2))),
  };
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


export async function GET(request: NextRequest) {
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

  const newsText = await fetchNewsHeadlines();

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here are today's MENA/GCC financial headlines (${date}):\n\n${newsText}\n\nWrite today's nusq briefing.`,
      },
    ],
  });

  const rawText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
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
  };

  const wordCount = generated.body.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  // Fetch candidates across all three query variants, pick best with vision
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

  const chartData = await buildChartData(generated.chart ?? { type: null });

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
      status: "draft",
      cover_image_url: image?.url ?? null,
      cover_image_credit: image?.credit ?? null,
      cover_image_credit_link: image?.creditLink ?? null,
      tickers: (generated.tickers ?? []).filter((t: string) =>
        ALLOWED_TICKERS.has(t)
      ).slice(0, 3),
      chart_data: chartData ?? null,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";
  const reviewUrl = `${siteUrl}/admin/drafts/${briefing.id}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: "nusq <onboarding@resend.dev>",
    to: "yousefquaba@icloud.com",
    subject: `nusq draft ready: ${generated.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 540px; color: #1C1C1C;">
        <p style="color: #737373; font-size: 13px; margin: 0 0 16px;">Today's briefing is ready for review.</p>
        <h2 style="font-size: 18px; margin: 0 0 8px;">${generated.title}</h2>
        <p style="color: #555; font-size: 14px; margin: 0 0 20px;">${generated.summary}</p>
        <a href="${reviewUrl}" style="display: inline-block; padding: 10px 20px; background: #1B4F72; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Review and publish →</a>
      </div>
    `,
  });
  if (emailError) throw new Error(`Resend error: ${emailError.message}`);

  return NextResponse.json({ ok: true, slug, id: briefing.id });
}
