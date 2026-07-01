import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug } from "@/lib/db";
import { createClient } from "@/lib/supabase-server";
import BriefingBody from "@/components/BriefingBody";

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
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 32px 90px" }} className="page-enter">
      {/* Back */}
      <Link
        href="/briefings"
        className="back-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--c-text-2)] cursor-pointer"
        style={{ marginBottom: 28 }}
      >
        ← Back to briefings
      </Link>

      <BriefingBody
        briefing={briefing}
        pageUrl={pageUrl}
        userId={user?.id ?? null}
        initialSaved={initialSaved}
      />
    </div>
  );
}
