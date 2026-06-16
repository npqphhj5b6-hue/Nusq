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
  "body": "The full briefing. Use ## for section headings. Use **bold** for key figures, company names, and important terms. Write 4–6 substantive sections in flowing paragraphs — no bullet lists. Minimum 500 words."
}`;

async function fetchNewsHeadlines(): Promise<string> {
  const parser = new Parser({ timeout: 10000 });

  const queries = [
    {
      url: "https://news.google.com/rss/search?q=GCC+economy+finance&hl=en-US&gl=US&ceid=US:en",
      lang: "EN",
    },
    {
      url: "https://news.google.com/rss/search?q=Saudi+Arabia+economy+oil&hl=en-US&gl=US&ceid=US:en",
      lang: "EN",
    },
    {
      url: "https://news.google.com/rss/search?q=UAE+economy+finance+investment&hl=en-US&gl=US&ceid=US:en",
      lang: "EN",
    },
    {
      url: "https://news.google.com/rss/search?q=MENA+economy+markets&hl=en-US&gl=US&ceid=US:en",
      lang: "EN",
    },
    {
      url: "https://news.google.com/rss/search?q=Aramco+SABIC+Saudi+stocks&hl=en-US&gl=US&ceid=US:en",
      lang: "EN",
    },
    {
      // Arabic: اقتصاد السعودية (Saudi economy)
      url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9&hl=ar&gl=SA&ceid=SA:ar",
      lang: "AR",
    },
    {
      // Arabic: اقتصاد الإمارات (UAE economy)
      url: "https://news.google.com/rss/search?q=%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF+%D8%A7%D9%84%D8%A5%D9%85%D8%A7%D8%B1%D8%A7%D8%AA&hl=ar&gl=AE&ceid=AE:ar",
      lang: "AR",
    },
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

  const total = enItems.length + arItems.length;
  if (total === 0) {
    throw new Error("No news fetched from any RSS feed");
  }

  const sections: string[] = [];
  if (enItems.length > 0) {
    sections.push(`## English headlines\n${enItems.join("\n")}`);
  }
  if (arItems.length > 0) {
    sections.push(
      `## Arabic headlines (translate relevant ones into your briefing)\n${arItems.join("\n")}`
    );
  }

  return sections.join("\n\n");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = todaySlug();
  const date = todayISO();

  // Prevent duplicate runs on the same day
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = (client.messages as any).stream({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here are today's MENA/GCC financial headlines (${date}):\n\n${newsText}\n\nWrite today's nusq briefing.`,
      },
    ],
  });
  const message = await stream.finalMessage();

  const rawText = message.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { type: string; text: string }) => block.text)
    .join("");

  // Strip code fences if the model wrapped the JSON
  const jsonText = rawText
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  const generated = JSON.parse(jsonText) as {
    title: string;
    summary: string;
    tags: string[];
    body: string;
  };

  const wordCount = generated.body.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

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
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";
  const reviewUrl = `${siteUrl}/admin/drafts/${briefing.id}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
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

  return NextResponse.json({ ok: true, slug, id: briefing.id });
}
