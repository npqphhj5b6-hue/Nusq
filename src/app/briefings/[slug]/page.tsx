import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug, formatDate } from "@/lib/db";
import TradingViewChart from "@/components/TradingViewChart";
import DataChart from "@/components/DataChart";
import ShareButtons from "@/components/ShareButtons";
import ScrollReveal from "@/components/ScrollReveal";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

// Only tickers supported by the free TradingView mini-widget
const VALID_TICKERS = new Set([
  "TVC:UKOIL", "TVC:NGAS", "TVC:GOLD", "TVC:SILVER",
  "FX:USDSAR", "FX:USDAED", "FX:USDKWD", "FX:USDQAR",
  "FOREXCOM:SPXUSD", "TVC:DXY",
]);

function isValidTicker(t: string) {
  return VALID_TICKERS.has(t);
}

function unsplashUrl(raw: string, w: number, h: number) {
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}

function unsplashUrlFull(raw: string, w: number) {
  return `${raw}&w=${w}&auto=format&q=80`;
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
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Back */}
      <Link
        href="/briefings"
        className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.1em] uppercase text-[#2A3F55] hover:text-[#F59E0B] transition-colors mb-10 cursor-pointer"
      >
        ← Briefings
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {briefing.tags.map((tag) => (
          <span
            key={tag}
            className="text-[9px] font-bold tracking-[0.14em] text-[#15A06E] uppercase bg-[#0A1F15] px-2.5 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Headline */}
      <h1
        className="text-[2.75rem] md:text-[3.5rem] leading-[1.06] text-[#F0ECE5] mb-5"
        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
      >
        {briefing.title}
      </h1>

      {/* Summary deck */}
      <p className="text-[1.125rem] text-[#4E6880] leading-[1.7] mb-6 font-light">
        {briefing.summary}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#132030]">
        <div
          className="flex items-center gap-3 text-xs text-[#2A3F55]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          <span>{formatDate(briefing.date)}</span>
          <span>·</span>
          <span>{briefing.readingTime} min read</span>
        </div>
        <ShareButtons title={briefing.title} url={pageUrl} />
      </div>

      {/* Cover image */}
      {briefing.coverImageUrl && (
        <ScrollReveal>
          <div className="relative w-full mb-12 overflow-hidden rounded-xl">
            <img
              src={unsplashUrlFull(briefing.coverImageUrl, 1400)}
              alt={briefing.title}
              className="w-full h-auto block"
            />
            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(4,12,26,0.5) 0%, transparent 40%)",
              }}
            />
            {briefing.coverImageCredit && (
              <a
                href={briefing.coverImageCreditLink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-3 text-[10px] text-white/40 hover:text-white/70 transition-colors"
              >
                {briefing.coverImageCredit}
              </a>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Body */}
      <div className="prose-nusq">
        {bodyParagraphs.map((para, i) => {
          if (para.startsWith("## ")) {
            return (
              <ScrollReveal key={i} delay={0}>
                <h2>{para.replace("## ", "")}</h2>
              </ScrollReveal>
            );
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
      <div className="mt-10 pt-8 border-t border-[#132030] flex items-center justify-between">
        <Link
          href="/briefings"
          className="text-xs font-bold tracking-[0.1em] uppercase text-[#2A3F55] hover:text-[#F59E0B] transition-colors cursor-pointer"
        >
          ← All briefings
        </Link>
        <ShareButtons title={briefing.title} url={pageUrl} />
      </div>

      {/* Data chart */}
      {briefing.chartData && (
        <ScrollReveal>
          <DataChart data={briefing.chartData} />
        </ScrollReveal>
      )}

      {/* Markets */}
      {briefing.tickers && briefing.tickers.length > 0 && (
        <ScrollReveal>
          <div className="mt-10 pt-10 border-t border-[#132030]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-5 h-[1px] bg-[#F59E0B] gold-line" />
              <span className="eyebrow">Markets</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {briefing.tickers.filter(isValidTicker).map((ticker) => (
                <TradingViewChart key={ticker} ticker={ticker} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
