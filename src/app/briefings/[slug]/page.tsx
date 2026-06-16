import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug, formatDate } from "@/lib/db";
import TradingViewChart from "@/components/TradingViewChart";

export const dynamic = "force-dynamic";

function unsplashUrl(raw: string, w: number, h: number) {
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const briefing = await getBriefingBySlug(slug);
  if (!briefing) notFound();

  const bodyParagraphs = briefing.body
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/briefings"
        className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1A4731] transition-colors mb-10"
      >
        ← Briefings
      </Link>

      {/* Cover image — landscape */}
      {briefing.coverImageUrl && (
        <div className="relative w-full h-[340px] mb-8 rounded-2xl overflow-hidden">
          <img
            src={unsplashUrl(briefing.coverImageUrl, 1200, 680)}
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

      <div className="flex flex-wrap gap-2 mb-5">
        {briefing.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8F0EC] text-[#1A4731]"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1
        className="text-[2rem] leading-[1.2] text-[#111111] mb-5"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        {briefing.title}
      </h1>

      <p className="text-[#737373] leading-relaxed mb-6 text-base border-l-[3px] border-[#1A4731] pl-4">
        {briefing.summary}
      </p>

      <div className="flex items-center gap-3 text-xs text-[#A8A8A8] mb-10 pb-10 border-b border-[#E8E5E0]">
        <span>{formatDate(briefing.date)}</span>
        <span>·</span>
        <span>{briefing.readingTime} min read</span>
      </div>

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

      {/* Markets */}
      {briefing.tickers && briefing.tickers.length > 0 && (
        <div className="mt-14 pt-10 border-t border-[#E8E5E0]">
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

      <div className="mt-14 pt-8 border-t border-[#E8E5E0]">
        <Link
          href="/briefings"
          className="text-sm text-[#737373] hover:text-[#1A4731] transition-colors"
        >
          ← All briefings
        </Link>
      </div>
    </div>
  );
}
