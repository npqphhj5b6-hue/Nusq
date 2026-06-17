import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug, formatDate } from "@/lib/db";
import TradingViewChart from "@/components/TradingViewChart";
import DataChart from "@/components/DataChart";
import ShareButtons from "@/components/ShareButtons";
import ScrollReveal from "@/components/ScrollReveal";
import type { SourceRef, BriefingIntelligence } from "@/lib/types";
import { getPublisherDomain } from "@/lib/source-credibility";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

const VALID_TICKERS = new Set([
  "TVC:UKOIL", "TVC:NGAS", "TVC:GOLD", "TVC:SILVER",
  "FX:USDSAR", "FX:USDAED", "FX:USDKWD", "FX:USDQAR",
  "FOREXCOM:SPXUSD", "TVC:DXY",
]);

function isValidTicker(t: string) { return VALID_TICKERS.has(t); }
function unsplashUrl(raw: string, w: number, h: number) {
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}
function unsplashUrlFull(raw: string, w: number) {
  return `${raw}&w=${w}&auto=format&q=80`;
}

// Render a paragraph: bold + inline citation [N] → superscript link
function renderParagraph(para: string, sourceMap: Map<number, SourceRef>): string {
  let html = para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[(\d+)\]/g, (_, n) => {
    const source = sourceMap.get(parseInt(n));
    if (source?.url) {
      return `<sup><a href="${source.url}" target="_blank" rel="noopener noreferrer" class="citation-link">${n}</a></sup>`;
    }
    return `<sup class="citation-ref">${n}</sup>`;
  });
  return html;
}

const IMPACT_COLOURS: Record<string, string> = {
  positive: "text-emerald-500",
  negative: "text-red-400",
  mixed:    "text-amber-400",
  neutral:  "text-[var(--c-text-3)]",
  unclear:  "text-[var(--c-text-3)]",
};

const FRESHNESS_COLOURS: Record<string, string> = {
  fresh:       "text-emerald-500",
  developing:  "text-amber-400",
  background:  "text-[var(--c-text-3)]",
  "stale-risk":"text-red-400",
};


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

  // Build source lookup map for citation rendering
  const sourceMap = new Map<number, SourceRef>(
    (briefing.sources ?? []).map((s) => [s.index, s])
  );

  // Keyword maps for inline chart/ticker injection
  const CHART_KEYWORDS: Record<string, RegExp> = {
    brent_price: /\b(oil|crude|brent|barrel|opec|aramco|petroleum|energy price)/i,
    gold:        /\b(gold|precious metal|safe.haven|bullion|xau)/i,
    fx_egp:      /\b(egypt|egyptian|pound|egp|piast)/i,
    fx_sar:      /\b(riyal|sar|saudi.+monetary|currency peg)/i,
    gdp_growth:  /\b(gdp|gross domestic|economic growth|non.oil|pif|economy grew|expansion)/i,
    inflation:   /\b(inflation|cpi|consumer price|cost of living|central bank|rate hold|rate cut|rate hike)/i,
  };
  const TICKER_KEYWORDS: Record<string, RegExp> = {
    "TVC:UKOIL":       /\b(oil|crude|brent|barrel|opec|aramco|petroleum|energy price)/i,
    "TVC:NGAS":        /\b(natural gas|lng|gas price)/i,
    "TVC:GOLD":        /\b(gold|precious metal|safe.haven|bullion)/i,
    "TVC:SILVER":      /\bsilver\b/i,
    "FX:USDSAR":       /\b(saudi.+riyal|riyal.+saudi|sar\b|saudi.+currency|saudi.+monetary)/i,
    "FX:USDAED":       /\b(dirham|aed\b|uae.+currency|uae.+monetary)/i,
    "FX:USDKWD":       /\b(dinar|kwd\b|kuwaiti)/i,
    "FX:USDQAR":       /\b(qatari|qar\b|qatar.+currency)/i,
    "FOREXCOM:SPXUSD": /\b(s&p|sp 500|us stocks|wall street|american market)/i,
    "TVC:DXY":         /\b(dollar index|dxy\b|usd strength|dollar strength)/i,
  };

  const usedIndices = new Set<number>();
  const findInsertIndex = (pattern: RegExp): number => {
    for (let i = 0; i < bodyParagraphs.length; i++) {
      if (!bodyParagraphs[i].startsWith("## ") && !usedIndices.has(i) && pattern.test(bodyParagraphs[i])) {
        return i;
      }
    }
    return -1;
  };

  const chartInsertAfter = (() => {
    if (!briefing.chartData) return -1;
    const pattern = CHART_KEYWORDS[briefing.chartData.type];
    if (!pattern) return -1;
    const idx = findInsertIndex(pattern);
    if (idx !== -1) usedIndices.add(idx);
    return idx;
  })();

  const tickerInsertMap = new Map<number, string>();
  for (const ticker of (briefing.tickers ?? []).filter(isValidTicker)) {
    const pattern = TICKER_KEYWORDS[ticker];
    if (!pattern) continue;
    const idx = findInsertIndex(pattern);
    if (idx !== -1) { tickerInsertMap.set(idx, ticker); usedIndices.add(idx); }
  }

  const intel: BriefingIntelligence | null = briefing.intelligence ?? null;
  const sources: SourceRef[] = briefing.sources ?? [];
  const hasSources = sources.length > 0;
  const checkedDate = briefing.validation?.checkedAt
    ? new Date(briefing.validation.checkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Back */}
      <Link
        href="/briefings"
        className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] hover:text-[var(--c-amber)] transition-colors mb-10 cursor-pointer"
      >
        ← Briefings
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {briefing.tags.map((tag) => (
          <span key={tag} className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-green)] uppercase bg-[var(--c-green-bg)] px-2.5 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* Headline */}
      <h1
        className="text-[2.75rem] md:text-[3.5rem] leading-[1.06] text-[var(--c-text-1)] mb-5"
        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
      >
        {briefing.title}
      </h1>

      {/* Summary */}
      <p className="text-[1.125rem] text-[var(--c-text-2)] leading-[1.7] mb-6 font-light">
        {briefing.summary}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between mb-5 pb-5 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-3 text-xs text-[var(--c-text-3)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
          <span>{formatDate(briefing.date)}</span>
          <span>·</span>
          <span>{briefing.readingTime} min read</span>
        </div>
        <ShareButtons title={briefing.title} url={pageUrl} />
      </div>

      {/* ── Evidence bar ── */}
      {(hasSources || intel) && (
        <div className="mb-10 p-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-[1px] bg-[var(--c-amber)]" />
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--c-amber)]">Evidence</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs" style={{ fontFamily: "var(--font-geist-mono)" }}>
            {hasSources && (
              <span className="text-[var(--c-text-3)]">
                Sources: <span className="text-[var(--c-text-1)] font-medium">{sources.length}</span>
              </span>
            )}
            {checkedDate && (
              <span className="text-[var(--c-text-3)]">
                Checked: <span className="text-[var(--c-text-1)] font-medium">{checkedDate}</span>
              </span>
            )}
            {intel?.marketImpact && (
              <span className="text-[var(--c-text-3)]">
                Market impact: <span className={`font-medium capitalize ${IMPACT_COLOURS[intel.marketImpact] ?? ""}`}>{intel.marketImpact}</span>
              </span>
            )}
            {intel?.freshnessStatus && (
              <span className="text-[var(--c-text-3)]">
                Freshness: <span className={`font-medium capitalize ${FRESHNESS_COLOURS[intel.freshnessStatus] ?? ""}`}>{intel.freshnessStatus}</span>
              </span>
            )}
            {intel?.investorRelevance && (
              <span className="text-[var(--c-text-3)]">
                Investor relevance: <span className="text-[var(--c-text-1)] font-medium capitalize">{intel.investorRelevance}</span>
              </span>
            )}
          </div>
          {intel?.affectedGeographies && intel.affectedGeographies.length > 0 && (
            <p className="mt-2 text-[10px] text-[var(--c-text-3)]">
              Geographies: {intel.affectedGeographies.join(" · ")}
            </p>
          )}
          {intel?.affectedSectors && intel.affectedSectors.length > 0 && (
            <p className="mt-0.5 text-[10px] text-[var(--c-text-3)]">
              Sectors: {intel.affectedSectors.join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* Cover image */}
      {briefing.coverImageUrl && (
        <ScrollReveal>
          <div className="relative w-full mb-12 overflow-hidden rounded-xl">
            <img
              src={unsplashUrlFull(briefing.coverImageUrl, 1400)}
              alt={briefing.title}
              className="w-full h-auto block"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(4,12,26,0.5) 0%, transparent 40%)" }} />
            {briefing.coverImageCredit && (
              <a href={briefing.coverImageCreditLink ?? "#"} target="_blank" rel="noopener noreferrer"
                className="absolute bottom-2 right-3 text-[10px] text-white/40 hover:text-white/70 transition-colors">
                {briefing.coverImageCredit}
              </a>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Body */}
      <div className="prose-nusq">
        {bodyParagraphs.map((para, i) => {
          let node: React.ReactNode;
          if (para.startsWith("## ")) {
            node = (
              <ScrollReveal key={i} delay={0}>
                <h2>{para.replace("## ", "")}</h2>
              </ScrollReveal>
            );
          } else if (para.startsWith("**") && para.endsWith("**")) {
            node = <p key={i}><strong>{para.slice(2, -2)}</strong></p>;
          } else {
            const html = renderParagraph(para, sourceMap);
            node = <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          }

          return (
            <React.Fragment key={i}>
              {node}
              {i === chartInsertAfter && briefing.chartData && (
                <ScrollReveal><DataChart data={briefing.chartData} /></ScrollReveal>
              )}
              {tickerInsertMap.has(i) && (
                <ScrollReveal>
                  <div className="my-6"><TradingViewChart ticker={tickerInsertMap.get(i)!} /></div>
                </ScrollReveal>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom share row */}
      <div className="mt-10 pt-8 border-t border-[var(--c-border)] flex items-center justify-between">
        <Link href="/briefings" className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] hover:text-[var(--c-amber)] transition-colors cursor-pointer">
          ← All briefings
        </Link>
        <ShareButtons title={briefing.title} url={pageUrl} />
      </div>

      {/* Markets */}
      {(() => {
        const inlinedTickers = new Set(tickerInsertMap.values());
        const remaining = (briefing.tickers ?? []).filter(isValidTicker).filter(t => !inlinedTickers.has(t));
        if (remaining.length === 0) return null;
        return (
          <ScrollReveal>
            <div className="mt-10 pt-10 border-t border-[var(--c-border)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
                <span className="eyebrow">Markets</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {remaining.map((ticker) => (<TradingViewChart key={ticker} ticker={ticker} />))}
              </div>
            </div>
          </ScrollReveal>
        );
      })()}

      {/* ── Sources section ── */}
      {hasSources && (
        <ScrollReveal>
          <div className="mt-10 pt-10 border-t border-[var(--c-border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
              <span className="eyebrow">Sources</span>
            </div>
            <div>
              {sources.map((s) => {
                const pubDate = s.publishedAt
                  ? new Date(s.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : null;
                const domain = s.domain || getPublisherDomain(s.publisher);
                const faviconUrl = domain
                  ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
                  : null;
                return (
                  <a
                    key={s.index}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 py-2.5 border-b border-[var(--c-border)] last:border-b-0 hover:bg-[var(--c-surface)] -mx-3 px-3 rounded-lg transition-colors group"
                  >
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        width={16}
                        height={16}
                        alt=""
                        className="rounded-sm shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-sm bg-[var(--c-border)] shrink-0" />
                    )}
                    <span className="text-[11px] font-semibold text-[var(--c-text-2)] shrink-0 group-hover:text-[var(--c-amber)] transition-colors">
                      {s.publisher}
                    </span>
                    <span className="text-[var(--c-border-2)] text-[10px] shrink-0">·</span>
                    <span
                      className="text-[11px] text-[var(--c-text-3)] truncate flex-1 min-w-0"
                      dir="auto"
                    >
                      {s.title}
                    </span>
                    {pubDate && (
                      <>
                        <span className="text-[var(--c-border-2)] text-[10px] shrink-0">·</span>
                        <span className="text-[10px] text-[var(--c-text-3)] shrink-0" style={{ fontFamily: "var(--font-geist-mono)" }}>
                          {pubDate}
                        </span>
                      </>
                    )}
                  </a>
                );
              })}
            </div>
            {intel?.confidenceNote && (
              <p className="mt-4 text-[11px] text-[var(--c-text-3)] leading-relaxed italic">
                {intel.confidenceNote}
              </p>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
