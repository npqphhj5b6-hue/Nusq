import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug, formatDate } from "@/lib/db";
import TradingViewChart from "@/components/TradingViewChart";
import DataChart from "@/components/DataChart";
import ShareButtons from "@/components/ShareButtons";
import ScrollReveal from "@/components/ScrollReveal";
import BookmarkButton from "@/components/BookmarkButton";
import ReadTracker from "@/components/ReadTracker";
import { createClient } from "@/lib/supabase-server";
import type { SourceRef, BriefingIntelligence } from "@/lib/types";
import { getPublisherDomain, SOURCE_TYPE_LABELS } from "@/lib/source-credibility";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

const VALID_TICKERS = new Set([
  "TVC:UKOIL", "TVC:NGAS", "TVC:GOLD", "TVC:SILVER",
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

  // User context for bookmark + read tracking
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

  const checkedAt = briefing.validation?.checkedAt ?? null;
  const checkedDate = checkedAt
    ? new Date(checkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const timeAgo = (() => {
    if (!checkedAt) return null;
    const diff = Date.now() - new Date(checkedAt).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${mins}m ago`;
  })();

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

      {/* Read tracker — fires silently on mount */}
      <ReadTracker briefingId={briefing.id} userId={user?.id ?? null} />

      {/* Meta row */}
      <div className="flex items-center justify-between mb-5 pb-5 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-3 text-xs text-[var(--c-text-3)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
          <span>{formatDate(briefing.date)}</span>
          <span>·</span>
          <span>{briefing.readingTime} min read</span>
        </div>
        <div className="flex items-center gap-2">
          <BookmarkButton briefingId={briefing.id} initialSaved={initialSaved} />
          <ShareButtons title={briefing.title} url={pageUrl} />
        </div>
      </div>

      {/* ── Intelligence box ── */}
      {(hasSources || intel) && (
        <div className="mb-10 flex rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
          <div className="w-[3px] shrink-0 bg-[var(--c-amber)]" />
          <div className="flex-1 p-4 min-w-0">
            <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--c-amber)] mb-3">Intelligence</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {/* Left: primary signals */}
              <div className="space-y-2.5" style={{ fontFamily: "var(--font-geist-mono)" }}>
                {hasSources && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] text-[var(--c-text-3)] uppercase tracking-[0.06em] shrink-0">Sources reviewed</span>
                    <span className="text-[11px] text-[var(--c-text-1)] font-medium">
                      {sources.length}
                      {(() => {
                        const t1 = sources.filter(s => s.tier === 1).length;
                        const primary = sources.filter(s => s.isPrimarySource).length;
                        if (t1 > 0 || primary > 0) {
                          const parts: string[] = [];
                          if (primary > 0) parts.push(`${primary} primary`);
                          else if (t1 > 0) parts.push(`${t1} official`);
                          return <span className="text-[var(--c-text-3)] ml-1">({parts.join(", ")})</span>;
                        }
                        return null;
                      })()}
                    </span>
                  </div>
                )}
                {checkedDate && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] text-[var(--c-text-3)] uppercase tracking-[0.06em] shrink-0">Verified</span>
                    <span className="text-[11px] text-[var(--c-text-1)] font-medium">
                      {checkedDate}{timeAgo ? ` · ${timeAgo}` : ""}
                    </span>
                  </div>
                )}
                {intel?.marketImpact && (
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] text-[var(--c-text-3)] uppercase tracking-[0.06em] shrink-0">Market impact</span>
                      <span className={`text-[11px] font-medium capitalize ${IMPACT_COLOURS[intel.marketImpact] ?? ""}`}>{intel.marketImpact}</span>
                    </div>
                    {intel.marketImpactDetail && (
                      <p className="text-[10px] text-[var(--c-text-3)] mt-1 leading-relaxed">{intel.marketImpactDetail}</p>
                    )}
                  </div>
                )}
                {intel?.investorRelevance && (
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] text-[var(--c-text-3)] uppercase tracking-[0.06em] shrink-0">Relevance to allocators</span>
                      <span className="text-[11px] text-[var(--c-text-1)] font-medium capitalize">{intel.investorRelevance}</span>
                    </div>
                    {intel.relevanceReason && (
                      <p className="text-[10px] text-[var(--c-text-3)] mt-1 leading-relaxed">{intel.relevanceReason}</p>
                    )}
                  </div>
                )}
              </div>
              {/* Right: tag groups */}
              <div className="mt-4 sm:mt-0 space-y-3">
                {intel?.affectedGeographies && intel.affectedGeographies.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-1.5" style={{ fontFamily: "var(--font-geist-mono)" }}>Geographies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intel.affectedGeographies.map((g) => (
                        <span key={g} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--c-border-2)] text-[var(--c-text-2)]">{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {intel?.affectedSectors && intel.affectedSectors.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-1.5" style={{ fontFamily: "var(--font-geist-mono)" }}>Sectors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intel.affectedSectors.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--c-border-2)] text-[var(--c-text-2)]">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                const typeLabel = s.sourceType && s.sourceType !== "news_report" && s.sourceType !== "unknown"
                  ? SOURCE_TYPE_LABELS[s.sourceType]
                  : null;
                return (
                  <a
                    key={s.index}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 py-2.5 border-b border-[var(--c-border)] last:border-b-0 hover:bg-[var(--c-surface)] -mx-3 px-3 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-[var(--c-text-2)] group-hover:text-[var(--c-amber)] transition-colors">
                          {s.publisher}
                        </span>
                        {s.isPrimarySource && (
                          <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-[var(--c-amber)] opacity-80">Primary</span>
                        )}
                        {typeLabel && !s.isPrimarySource && (
                          <span className="text-[9px] font-semibold tracking-[0.06em] uppercase text-[var(--c-text-3)]">{typeLabel}</span>
                        )}
                        {pubDate && (
                          <span className="text-[10px] text-[var(--c-text-3)] ml-auto shrink-0" style={{ fontFamily: "var(--font-geist-mono)" }}>
                            {pubDate}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--c-text-3)] truncate mt-0.5" dir="auto">{s.title}</p>
                      {s.summaryOfRelevance && (
                        <p className="text-[10px] text-[var(--c-text-3)] opacity-70 mt-0.5 leading-relaxed line-clamp-1">{s.summaryOfRelevance}</p>
                      )}
                    </div>
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
