import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug, formatDate } from "@/lib/db";
import TradingViewChart from "@/components/TradingViewChart";
import ReadingProgress from "@/components/ReadingProgress";
import ShareButtons from "@/components/ShareButtons";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

function unsplashUrl(raw: string, w: number, h: number) {
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

  const bodyParagraphs = briefing.body
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  return (
    <>
      <ReadingProgress />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/briefings"
          className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1A4731] transition-colors mb-10"
        >
          ← Briefings
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {briefing.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8F0EC] text-[#1A4731] transition-colors hover:bg-[#1A4731] hover:text-white cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1
          className="text-[2.25rem] leading-[1.15] text-[#111111] mb-4"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          {briefing.title}
        </h1>

        {/* Summary */}
        <p className="text-[#555555] leading-relaxed mb-5 text-[1.05rem]">
          {briefing.summary}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-xs text-[#A8A8A8]">
            <span>{formatDate(briefing.date)}</span>
            <span>·</span>
            <span>{briefing.readingTime} min read</span>
          </div>
          <ShareButtons title={briefing.title} url={pageUrl} />
        </div>

        {/* Cover image */}
        {briefing.coverImageUrl && (
          <div className="relative w-full mb-10 overflow-hidden" style={{ aspectRatio: "16/7" }}>
            <img
              src={unsplashUrl(briefing.coverImageUrl, 1400, 612)}
              alt={briefing.title}
              className="w-full h-full object-cover"
            />
            {briefing.coverImageCredit && (
              <a
                href={briefing.coverImageCreditLink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-3 text-[10px] text-white/60 hover:text-white/90 transition-colors"
              >
                {briefing.coverImageCredit}
              </a>
            )}
          </div>
        )}

        <div className="prose-nusq">
          {bodyParagraphs.map((para, i) => {
            if (para.startsWith("## ")) {
              return <h2 key={i}>{para.replace("## ", "")}</h2>;
            }
            if (para.startsWith("**") && para.endsWith("**")) {
              return (
                <p key={i}>
                  <strong>{para.slice(2, -2)}</strong>
                </p>
              );
            }
            const withBold = para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
            return <p key={i} dangerouslySetInnerHTML={{ __html: withBold }} />;
          })}
        </div>

        {/* Bottom share row */}
        <div className="mt-10 pt-8 border-t border-[#E8E5E0] flex items-center justify-between">
          <Link
            href="/briefings"
            className="text-sm text-[#737373] hover:text-[#1A4731] transition-colors"
          >
            ← All briefings
          </Link>
          <ShareButtons title={briefing.title} url={pageUrl} />
        </div>

        {/* Markets */}
        {briefing.tickers && briefing.tickers.length > 0 && (
          <div className="mt-10 pt-10 border-t border-[#E8E5E0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-5 h-[2px] bg-[#1A4731]" />
              <h2 className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
                Markets
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {briefing.tickers.map((ticker) => (
                <TradingViewChart key={ticker} ticker={ticker} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
