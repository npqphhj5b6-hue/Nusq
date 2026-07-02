import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBriefingBySlug } from "@/lib/db";
import { createClient } from "@/lib/supabase-server";
import BriefingBody from "@/components/BriefingBody";
import SubscribeForm from "@/components/SubscribeForm";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

function unsplashUrl(raw: string, w: number, h: number) {
  if (!raw.includes("images.unsplash.com")) return raw;
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const briefing = await getBriefingBySlug(slug);
  if (!briefing) return {};
  const ogImage = briefing.coverImageUrl
    ? unsplashUrl(briefing.coverImageUrl, 1200, 630)
    : undefined;
  return {
    title: `${briefing.title} — Nusq`,
    description: briefing.summary,
    openGraph: {
      title: briefing.title,
      description: briefing.summary,
      url: `${SITE_URL}/briefings/${slug}`,
      siteName: "Nusq",
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: briefing.title,
      description: briefing.summary,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const briefing = await getBriefingBySlug(slug);
  if (!briefing) notFound();

  const pageUrl = `${SITE_URL}/briefings/${slug}`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let initialSaved = false;
  if (user && briefing.id) {
    const { data } = await supabase
      .from("saved_briefings")
      .select("id")
      .eq("user_id", user.id)
      .eq("briefing_id", briefing.id)
      .maybeSingle();
    initialSaved = !!data;
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 32px 90px" }} className="page-enter">
      <BriefingBody
        briefing={briefing}
        pageUrl={pageUrl}
        userId={user?.id ?? null}
        initialSaved={initialSaved}
      />

      {/* ── Post-read conversion: highest-intent moment ── */}
      <div className="glass-card" style={{ padding: "28px 30px 32px", marginTop: 48, maxWidth: 680 }}>
        <div
          style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "var(--c-text-1)", marginBottom: 6 }}
        >
          Get this every weekday morning
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.6, color: "var(--c-text-2)", maxWidth: 440 }}>
          One free briefing, straight to your inbox — plain language, Arabic sources included.
        </p>
        <SubscribeForm variant="inline" />
      </div>
    </div>
  );
}
