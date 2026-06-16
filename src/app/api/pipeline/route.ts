import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 300;

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
  "tickers": ["Array of up to 3 TradingView ticker symbols relevant to today's briefing. IMPORTANT: only use tickers from this supported list — anything else will not render. Commodities: 'TVC:UKOIL' (Brent crude), 'TVC:NGAS' (natural gas), 'TVC:GOLD', 'TVC:SILVER'. FX pairs: 'FX:USDSAR', 'FX:USDAED', 'FX:USDKWD', 'FX:USDQAR'. Global indices: 'FOREXCOM:SPXUSD' (S&P 500), 'TVC:DXY' (USD index). Pick only what is directly relevant. Empty array if nothing fits."]
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
      tickers: generated.tickers ?? [],
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
