import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "nusq <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

// ── Shared template primitives ────────────────────────────────────────────────

const NAVY = "#080E1C";
const ACCENT = "#38BDF8";
const POSITIVE = "#34D399";
const TEXT_DARK = "#0f172a";
const TEXT_MID = "#475569";
const TEXT_LIGHT = "#94a3b8";
const BORDER = "#e2e8f0";
const BG_PAGE = "#f1f5f9";
const BG_CARD = "#ffffff";
const BG_TEAL = "#ecfdf5";
const TEXT_TEAL = "#065f46";

function emailShell(bodyHtml: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>nusq</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BG_PAGE};-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BG_PAGE};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${NAVY};border-radius:12px 12px 0 0;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <span style="font-size:20px;font-weight:700;letter-spacing:-0.04em;color:#ffffff;">nusq</span>
                <span style="font-size:11px;color:${TEXT_LIGHT};margin-left:10px;letter-spacing:0.05em;">نسق</span>
              </td>
              <td align="right">
                <span style="font-size:10px;color:${TEXT_LIGHT};letter-spacing:0.08em;text-transform:uppercase;">MENA Markets</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body card -->
        <tr><td style="background:${BG_CARD};border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${BG_PAGE};border-radius:0 0 12px 12px;border:1px solid ${BORDER};border-top:none;padding:20px 32px;text-align:center;">
          <p style="font-size:11px;color:${TEXT_LIGHT};margin:0 0 6px;">nusq · MENA financial intelligence · Not investment advice</p>
          <p style="font-size:11px;color:${TEXT_LIGHT};margin:0;">
            <a href="${SITE_URL}" style="color:${TEXT_LIGHT};text-decoration:underline;">nusq.app</a>
            &nbsp;·&nbsp;
            __UNSUBSCRIBE_LINK__
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function unsubscribeLink(token: string): string {
  const url = `${SITE_URL}/api/unsubscribe?token=${token}`;
  return `<a href="${url}" style="color:${TEXT_LIGHT};text-decoration:underline;">Unsubscribe</a>`;
}

// ── Briefing email ────────────────────────────────────────────────────────────

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

  const briefingUrl = `${SITE_URL}/briefings/${slug}`;

  const tldrHtml = tldrBullets.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BG_TEAL};border-radius:10px;margin:0 0 24px;">
        <tr><td style="padding:18px 22px;">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT_TEAL};margin:0 0 12px;">Key takeaways</p>
          ${tldrBullets.map(b => `<p style="font-size:13px;color:${TEXT_DARK};margin:0 0 8px;line-height:1.55;">→ ${b}</p>`).join("")}
        </td></tr>
      </table>`
    : "";

  const storiesHtml = stories.map((s, i) =>
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid ${BORDER};margin-top:4px;">
      <tr><td style="padding:24px 0 20px;">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT_LIGHT};margin:0 0 10px;">Story ${i + 1}</p>
        <h2 style="font-size:18px;font-weight:700;letter-spacing:-0.02em;line-height:1.25;color:${TEXT_DARK};margin:0 0 14px;">${s.headline ?? ""}</h2>
        <p style="font-size:14px;color:${TEXT_MID};line-height:1.75;margin:0;">${s.body ?? ""}</p>
      </td></tr>
    </table>`
  ).join("");

  const alsoWatchingHtml = alsoWatching.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid ${BORDER};">
        <tr><td style="padding:20px 0 4px;">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT_LIGHT};margin:0 0 12px;">Also watching</p>
          ${alsoWatching.map(w => `<p style="font-size:13px;color:${TEXT_MID};margin:0 0 8px;line-height:1.55;">→ ${w}</p>`).join("")}
        </td></tr>
      </table>`
    : "";

  const bodyHtml = `
    <!-- Date bar -->
    <div style="padding:16px 32px;border-bottom:1px solid ${BORDER};background:#f8fafc;">
      <p style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${TEXT_LIGHT};margin:0;">${formattedDate}</p>
    </div>

    <!-- Title + summary -->
    <div style="padding:28px 32px 0;">
      <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.03em;line-height:1.2;color:${TEXT_DARK};margin:0 0 14px;">${title}</h1>
      <p style="font-size:15px;color:${TEXT_MID};line-height:1.7;margin:0 0 22px;">${summary}</p>
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
    <div style="padding:28px 32px 32px;border-top:1px solid ${BORDER};margin-top:24px;text-align:center;">
      <a href="${briefingUrl}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 30px;border-radius:8px;letter-spacing:-0.01em;">
        Read the full briefing →
      </a>
      <p style="font-size:12px;color:${TEXT_LIGHT};margin:14px 0 0;">
        Or view all signals at <a href="${SITE_URL}/signals" style="color:${ACCENT};text-decoration:none;">${SITE_URL}/signals</a>
      </p>
    </div>
  `;

  return emailShell(bodyHtml, summary)
    .replace("__UNSUBSCRIBE_LINK__", unsubscribeLink(unsubscribeToken));
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
      subject: `nusq · ${b.title}`,
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

// ── Welcome email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, unsubscribeToken: string): Promise<void> {
  const bodyHtml = `
    <!-- Welcome heading -->
    <div style="padding:36px 32px 0;">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${ACCENT};margin:0 0 16px;">Welcome to nusq</p>
      <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.03em;line-height:1.2;color:${TEXT_DARK};margin:0 0 16px;">
        MENA markets, explained.
      </h1>
      <p style="font-size:15px;color:${TEXT_MID};line-height:1.7;margin:0 0 28px;">
        Every weekday morning you'll get one briefing — plain language, no jargon. Two stories that moved MENA markets overnight, scored signals, and a quick scan of what else is worth watching.
      </p>
    </div>

    <!-- What to expect -->
    <div style="padding:0 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid ${BORDER};">
        <tr><td style="padding:24px 0 8px;">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT_LIGHT};margin:0 0 16px;">What you'll get</p>

          ${[
            ["📰", "One daily briefing", "Two stories. Plain English. No finance degree needed."],
            ["⚡", "Scored signals", "Every development rated positive, watch, or negative — with a one-sentence explanation of why it matters."],
            ["🗺️", "The full MENA picture", "Egypt, Saudi, UAE, Qatar, Kuwait — not just the Western markets everyone else covers."],
          ].map(([icon, label, sub]) => `
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
            <tr>
              <td width="36" valign="top" style="padding-top:2px;">${icon}</td>
              <td>
                <p style="font-size:14px;font-weight:600;color:${TEXT_DARK};margin:0 0 3px;">${label}</p>
                <p style="font-size:13px;color:${TEXT_MID};line-height:1.55;margin:0;">${sub}</p>
              </td>
            </tr>
          </table>`).join("")}

        </td></tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:24px 32px 32px;text-align:center;border-top:1px solid ${BORDER};margin-top:8px;">
      <a href="${SITE_URL}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 30px;border-radius:8px;letter-spacing:-0.01em;">
        See today's signals →
      </a>
      <p style="font-size:12px;color:${TEXT_LIGHT};margin:14px 0 0;">Your first briefing arrives on the next weekday morning.</p>
    </div>
  `;

  const html = emailShell(bodyHtml, "MENA markets, explained in plain English. Your first briefing arrives on the next weekday morning.")
    .replace("__UNSUBSCRIBE_LINK__", unsubscribeLink(unsubscribeToken));

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to nusq — MENA markets, explained.",
    html,
  });

  if (error) console.error("[email] welcome email failed:", error.message);
}
