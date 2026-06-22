import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "nusq <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

interface RawStory {
  number?: number;
  headline?: string;
  body?: string;
}

function renderBriefingHtml(params: {
  title: string;
  summary: string;
  date: string;
  tldrBullets: string[];
  stories: RawStory[];
  alsoWatching: string[];
  slug: string;
  unsubscribeToken: string;
}): string {
  const { title, summary, date, tldrBullets, stories, alsoWatching, slug, unsubscribeToken } = params;

  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const tldrHtml = tldrBullets.length > 0
    ? `<div style="background:#E3F5EE;border-radius:10px;padding:20px 24px;margin:0 0 8px;">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0A5C3B;margin:0 0 12px;">Key takeaways</p>
        ${tldrBullets.map(b => `<p style="font-size:14px;color:#0f0f0f;margin:0 0 8px;line-height:1.5;">→ ${b}</p>`).join("")}
      </div>`
    : "";

  const storiesHtml = stories.map((s, i) =>
    `<div style="padding:24px 0;border-top:1px solid #ebebeb;">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ababab;margin:0 0 10px;">Story ${i + 1}</p>
      <h2 style="font-size:18px;font-weight:700;letter-spacing:-0.02em;line-height:1.25;color:#0f0f0f;margin:0 0 14px;">${s.headline ?? ""}</h2>
      <p style="font-size:14px;color:#333;line-height:1.7;margin:0;">${s.body ?? ""}</p>
    </div>`
  ).join("");

  const alsoWatchingHtml = alsoWatching.length > 0
    ? `<div style="padding:20px 0;border-top:1px solid #ebebeb;">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ababab;margin:0 0 12px;">Also watching</p>
        ${alsoWatching.map(w => `<p style="font-size:13px;color:#696969;margin:0 0 6px;line-height:1.5;">→ ${w}</p>`).join("")}
      </div>`
    : "";

  const briefingUrl = `${SITE_URL}/briefings/${slug}`;
  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f3;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ebebeb;">

    <!-- Header -->
    <div style="padding:24px 32px;border-bottom:1px solid #ebebeb;">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:10px;">
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.04em;color:#0f0f0f;">nusq</span>
        <span style="font-size:12px;color:#ababab;letter-spacing:0.01em;">MENA financial intelligence</span>
      </div>
      <p style="font-size:11px;color:#ababab;letter-spacing:0.07em;text-transform:uppercase;margin:0;">${formattedDate}</p>
    </div>

    <!-- Title + summary -->
    <div style="padding:28px 32px 0;">
      <h1 style="font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1.15;color:#0f0f0f;margin:0 0 14px;">${title}</h1>
      <p style="font-size:15px;color:#696969;line-height:1.65;margin:0 0 24px;">${summary}</p>
      ${tldrHtml}
    </div>

    <!-- Stories -->
    <div style="padding:0 32px;">
      ${storiesHtml}
    </div>

    <!-- Also Watching -->
    <div style="padding:0 32px;">
      ${alsoWatchingHtml}
    </div>

    <!-- CTA -->
    <div style="padding:28px 32px;border-top:1px solid #ebebeb;text-align:center;">
      <a href="${briefingUrl}" style="display:inline-block;background:#0f0f0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 28px;border-radius:8px;">
        Read the full briefing →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f5f5f3;border-top:1px solid #ebebeb;text-align:center;">
      <p style="font-size:12px;color:#ababab;margin:0 0 6px;">nusq · MENA financial intelligence</p>
      <p style="font-size:11px;color:#d4d4d4;margin:0;">
        <a href="${unsubscribeUrl}" style="color:#ababab;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function sendBriefingToSubscribers(briefingId: string): Promise<void> {
  const { data: b, error: fetchError } = await supabaseAdmin
    .from("briefings")
    .select("title, summary, date, slug, tldr_bullets, stories, also_watching")
    .eq("id", briefingId)
    .single();

  if (fetchError || !b) {
    console.error("[email] could not fetch briefing for subscriber blast:", fetchError?.message);
    return;
  }

  const { data: subs, error: subError } = await supabaseAdmin
    .from("subscribers")
    .select("email, unsubscribe_token")
    .eq("active", true);

  if (subError || !subs || subs.length === 0) {
    if (subError) console.error("[email] could not fetch subscribers:", subError.message);
    else console.log("[email] no active subscribers — skipping blast");
    return;
  }

  const stories: RawStory[] = Array.isArray(b.stories) ? b.stories : [];
  const tldrBullets: string[] = Array.isArray(b.tldr_bullets) ? b.tldr_bullets : [];
  const alsoWatching: string[] = Array.isArray(b.also_watching) ? b.also_watching : [];

  const BATCH_SIZE = 100;
  for (let i = 0; i < subs.length; i += BATCH_SIZE) {
    const batch = subs.slice(i, i + BATCH_SIZE).map((sub) => ({
      from: FROM,
      to: sub.email,
      subject: b.title,
      html: renderBriefingHtml({
        title: b.title,
        summary: b.summary,
        date: b.date,
        tldrBullets,
        stories,
        alsoWatching,
        slug: b.slug,
        unsubscribeToken: sub.unsubscribe_token,
      }),
    }));

    const { error: batchError } = await resend.batch.send(batch);
    if (batchError) {
      console.error(`[email] batch ${i / BATCH_SIZE + 1} failed:`, batchError);
    } else {
      console.log(`[email] sent batch ${i / BATCH_SIZE + 1} (${batch.length} emails)`);
    }
  }
}
