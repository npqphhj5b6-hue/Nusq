import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug, formatDate } from "@/lib/db";
import DataChart from "@/components/DataChart";
import ShareButtons from "@/components/ShareButtons";
import ScrollReveal from "@/components/ScrollReveal";
import BookmarkButton from "@/components/BookmarkButton";
import ReadTracker from "@/components/ReadTracker";
import MenaMap from "@/components/MenaMap";
import { createClient } from "@/lib/supabase-server";
import BriefingCheck from "@/components/BriefingCheck";
import StoryEvidence from "@/components/StoryEvidence";
import type { SourceRef, BriefingIntelligence, Counterpoint } from "@/lib/types";
import { getPublisherDomain } from "@/lib/source-credibility";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

function unsplashUrl(raw: string, w: number, h: number) {
  if (!raw.includes("images.unsplash.com")) return raw;
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}
function unsplashUrlFull(raw: string, w: number) {
  if (!raw.includes("images.unsplash.com")) return raw;
  return `${raw}&w=${w}&auto=format&q=80`;
}

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

  const sourceMap = new Map<number, SourceRef>(
    (briefing.sources ?? []).map((s) => [s.index, s])
  );

  const intel: BriefingIntelligence | null = briefing.intelligence ?? null;
  const sources: SourceRef[] = briefing.sources ?? [];
  const counterpoints: Counterpoint[] = (briefing.counterpoints as Counterpoint[] | null) ?? [];
  const hasSources = sources.length > 0;

  const checkedAt = briefing.validation?.checkedAt ?? null;

  const hasStories = Array.isArray(briefing.stories) && briefing.stories.length > 0;
  const hasTldr = Array.isArray(briefing.tldrBullets) && briefing.tldrBullets.length > 0;
  // New 2-story format carries per-story evidence; legacy briefings keep the top-level Briefing check.
  const hasStoryEvidence = hasStories && briefing.stories!.some((s) => s.evidence);
  const alsoWatching = Array.isArray(briefing.alsoWatching) ? briefing.alsoWatching : [];

  // ── Legacy body rendering (single-article format) ──────────────────────────
  const CHART_KEYWORDS: Record<string, RegExp> = {
    brent_price: /\b(oil|crude|brent|barrel|opec|aramco|petroleum|energy price)/i,
    gold:        /\b(gold|precious metal|safe.haven|bullion|xau)/i,
    fx_egp:      /\b(egypt|egyptian|pound|egp|piast)/i,
    fx_sar:      /\b(riyal|sar|saudi.+monetary|currency peg)/i,
    gdp_growth:  /\b(gdp|gross domestic|economic growth|non.oil|pif|economy grew|expansion)/i,
    inflation:   /\b(inflation|cpi|consumer price|cost of living|central bank|rate hold|rate cut|rate hike)/i,
  };
  const bodyParagraphs = briefing.body.split("\n\n").filter((p) => p.trim().length > 0);
  const usedIndices = new Set<number>();
  const findInsertIndex = (pattern: RegExp): number => {
    for (let i = 0; i < bodyParagraphs.length; i++) {
      if (!bodyParagraphs[i].startsWith("## ") && !usedIndices.has(i) && pattern.test(bodyParagraphs[i])) return i;
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

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Back */}
      <Link
        href="/briefings"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-1)] transition-colors mb-10 cursor-pointer"
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
        className="font-bold leading-[1.06] text-[var(--c-text-1)] mb-5"
        style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)", letterSpacing: "-0.035em" }}
      >
        {briefing.title}
      </h1>

      {/* Summary */}
      <p className="text-base md:text-[1.125rem] text-[var(--c-text-2)] leading-[1.7] mb-6 font-light">
        {briefing.summary}
      </p>

      <ReadTracker briefingId={briefing.id} userId={user?.id ?? null} />

      {/* Meta row */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--c-border)]">
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

      {/* ── TL;DR card ── */}
      {hasTldr && (
        <ScrollReveal>
          <div className="mb-8 rounded-xl border border-[var(--c-green)]/20 bg-[var(--c-green-bg)] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[var(--c-green)]/15">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--c-green)]" />
              <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--c-green)]">
                Key takeaways
              </span>
            </div>
            <ul className="px-5 py-4 space-y-2.5">
              {briefing.tldrBullets!.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--c-green)] mt-[3px] shrink-0 text-xs">→</span>
                  <span className="text-sm text-[var(--c-text-1)] leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      )}

      {/* ── Briefing check card (legacy briefings only — new format uses per-story evidence) ── */}
      {!hasStoryEvidence && (
        <BriefingCheck
          intel={intel}
          sources={sources}
          validation={briefing.validation ?? null}
          counterpoints={counterpoints}
          checkedAt={checkedAt}
        />
      )}

      {/* ── MENA Map (multi-story only) ── */}
      {hasStories && (
        <ScrollReveal>
          <div className="mb-10">
            <MenaMap
              stories={briefing.stories!.map((s) => ({
                number: s.number,
                headline: s.headline,
                location: s.location,
                city: s.city,
              }))}
            />
          </div>
        </ScrollReveal>
      )}

      {/* ── MULTI-STORY FORMAT ── */}
      {hasStories ? (
        <div className="space-y-0">
          {briefing.stories!.map((story, si) => {
            const storyParagraphs = (story.body ?? "").split("\n\n").filter((p) => p.trim().length > 0);
            return (
              <ScrollReveal key={story.number} delay={si * 60}>
                <article
                  id={`story-${story.number}`}
                  className="pt-10 pb-12 border-b border-[var(--c-border)] last:border-b-0 scroll-mt-20"
                >
                  {/* Story number + headline */}
                  <div className="flex items-start gap-5 mb-6">
                    <span
                      className="shrink-0 text-[3.5rem] leading-none font-black text-[var(--c-border-2)] select-none"
                      style={{ lineHeight: 0.9 }}
                      aria-hidden="true"
                    >
                      {story.number}
                    </span>
                    <div className="pt-1">
                      {story.location && (
                        <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-[var(--c-text-3)] mb-2" style={{ fontFamily: "var(--font-geist-mono)" }}>
                          {story.city ? `${story.city}, ${story.location}` : story.location}
                        </p>
                      )}
                      <h2
                        className="font-bold leading-[1.1] text-[var(--c-text-1)]"
                        style={{ fontSize: "clamp(1.25rem, 3vw, 1.6rem)", letterSpacing: "-0.03em" }}
                      >
                        {story.headline}
                      </h2>
                    </div>
                  </div>

                  {/* Story image */}
                  {story.imageUrl ? (
                    <div className="relative w-full mb-7 overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
                      <img
                        src={unsplashUrlFull(story.imageUrl, 1200)}
                        alt={story.headline}
                        className="w-full h-full object-cover block"
                      />
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
                      {story.imageCredit && (
                        <a
                          href={story.imageCreditLink ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-3 text-[10px] text-white/40 hover:text-white/70 transition-colors"
                        >
                          {story.imageCredit}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full mb-7 overflow-hidden rounded-xl flex items-center justify-center bg-[var(--c-surface)] border border-[var(--c-border)]" style={{ aspectRatio: "16/9" }}>
                      <span className="font-black select-none text-[var(--c-border-2)]" style={{ fontSize: "clamp(5rem, 15vw, 9rem)", lineHeight: 1 }} aria-hidden="true">
                        {story.number}
                      </span>
                    </div>
                  )}

                  {/* Story body */}
                  <div className="prose-nusq">
                    {storyParagraphs.map((para, pi) => {
                      if (para.startsWith("## ")) {
                        return <h3 key={pi} className="text-base font-bold uppercase tracking-wide text-[var(--c-text-1)] mt-5 mb-2">{para.replace("## ", "")}</h3>;
                      }
                      const html = renderParagraph(para, sourceMap);
                      return <p key={pi} dangerouslySetInnerHTML={{ __html: html }} />;
                    })}
                  </div>

                  {/* Story chart */}
                  {story.chartData && (
                    <ScrollReveal>
                      <DataChart data={story.chartData} />
                    </ScrollReveal>
                  )}

                  {/* Per-story evidence bubble */}
                  {story.evidence && <StoryEvidence evidence={story.evidence} />}
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      ) : (
        /* ── LEGACY SINGLE-ARTICLE FORMAT ── */
        <>
          {briefing.coverImageUrl && (
            <ScrollReveal>
              <div className="relative w-full mb-12 overflow-hidden rounded-xl">
                <img
                  src={unsplashUrlFull(briefing.coverImageUrl, 1400)}
                  alt={briefing.title}
                  className="w-full h-auto block"
                />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
                {briefing.coverImageCredit && (
                  <a href={briefing.coverImageCreditLink ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="absolute bottom-2 right-3 text-[10px] text-white/40 hover:text-white/70 transition-colors">
                    {briefing.coverImageCredit}
                  </a>
                )}
              </div>
            </ScrollReveal>
          )}
          <div className="prose-nusq">
            {bodyParagraphs.map((para, i) => {
              let node: React.ReactNode;
              if (para.startsWith("## ")) {
                node = <ScrollReveal key={i}><h2>{para.replace("## ", "")}</h2></ScrollReveal>;
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
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}

      {/* ── Also Watching ── */}
      {alsoWatching.length > 0 && (
        <ScrollReveal>
          <div className="mt-12 pt-8 border-t border-[var(--c-border)]">
            <span className="eyebrow block mb-4">Also Watching</span>
            <ul className="space-y-2.5">
              {alsoWatching.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--c-green)] mt-[3px] shrink-0 text-xs" aria-hidden="true">→</span>
                  <span className="text-sm text-[var(--c-text-2)] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      )}

      {/* Bottom share row */}
      <div className="mt-10 pt-8 border-t border-[var(--c-border)] flex items-center justify-between">
        <Link href="/briefings" className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-1)] transition-colors cursor-pointer">
          ← All briefings
        </Link>
        <ShareButtons title={briefing.title} url={pageUrl} />
      </div>

      {/* Sources */}
      {hasSources && (
        <ScrollReveal>
          <div className="mt-10 pt-10 border-t border-[var(--c-border)]">
            <span className="eyebrow block mb-4">Sources</span>
            <div>
              {sources.map((s) => {
                const pubDate = s.publishedAt
                  ? new Date(s.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : null;
                const domain = s.domain || getPublisherDomain(s.publisher);
                const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null;
                const isArabic = s.language === "ar";
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
                        <img src={faviconUrl} width={16} height={16} alt="" className="rounded-sm shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-4 h-4 rounded-sm bg-[var(--c-border)] shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-[var(--c-text-2)] group-hover:text-[var(--c-green)] transition-colors">
                          {s.publisher}
                        </span>
                        {pubDate && (
                          <span className="text-[10px] text-[var(--c-text-3)] ml-auto shrink-0" style={{ fontFamily: "var(--font-geist-mono)" }}>
                            {pubDate}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] text-[var(--c-text-3)] truncate mt-0.5 ${isArabic ? "text-right" : ""}`}
                        dir={isArabic ? "rtl" : "ltr"}
                      >
                        {s.title}
                      </p>
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
