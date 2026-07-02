import React from "react";
import Link from "next/link";
import { formatDate } from "@/lib/db";
import DataChart from "@/components/DataChart";
import ShareButtons from "@/components/ShareButtons";
import ScrollReveal from "@/components/ScrollReveal";
import BookmarkButton from "@/components/BookmarkButton";
import ReadTracker from "@/components/ReadTracker";
import BriefingMap from "@/components/BriefingMap";
import BriefingRailChart from "@/components/BriefingRailChart";
import BriefingCheck from "@/components/BriefingCheck";
import StoryEvidence from "@/components/StoryEvidence";
import AnnotatedText from "@/components/AnnotatedText";
import { annotateParagraph, annotateCitations } from "@/lib/terms";
import type { SourceRef, BriefingIntelligence, Counterpoint, Briefing, ChartData } from "@/lib/types";
import { getPublisherDomain } from "@/lib/source-credibility";

interface Props {
  briefing: Briefing;
  pageUrl: string;
  userId: string | null;
  initialSaved: boolean;
}

function unsplashUrlFull(raw: string, w: number) {
  if (!raw.includes("images.unsplash.com")) return raw;
  return `${raw}&w=${w}&auto=format&q=80`;
}

export default function BriefingBody({ briefing, pageUrl, userId, initialSaved }: Props) {
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
  const hasStoryEvidence = hasStories && briefing.stories!.some((s) => s.evidence);
  const alsoWatching = Array.isArray(briefing.alsoWatching) ? briefing.alsoWatching : [];

  // Shared across every paragraph in this briefing so each glossary term is only
  // wrapped as click-to-define on its first appearance in the whole read.
  const usedTermSlugs = new Set<string>();

  const bodyParagraphs = briefing.body.split("\n\n").filter((p) => p.trim().length > 0);

  // Anchor-story rail: the rail chart is driven by the first story's chart
  // (falling back to the briefing-level chart). It is rendered in the rail, so
  // it must be skipped inline in the story loop below.
  const anchorChart: ChartData | null = hasStories
    ? briefing.stories![0].chartData ?? briefing.chartData ?? null
    : briefing.chartData ?? null;

  const mapStories = hasStories
    ? briefing.stories!.map((s) => ({
        number: s.number,
        headline: s.headline,
        location: s.location,
        city: s.city,
      }))
    : [];

  // Inline source references are intentionally omitted from the prose — the
  // Sources card and the per-story Evidence strip carry credibility instead
  // (see the reasoning behind removing academic-style footnotes). Strip any
  // [n] citation markers, cleaning the whitespace that precedes them.
  const stripCitations = (t?: string | null) => (t ?? "").replace(/\s*\[\d+\]/g, "");

  return (
    <>
      {/* ── Header row (full width): back link + share ── */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/briefings"
          className="back-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--c-text-2)] cursor-pointer"
        >
          ← Back to briefings
        </Link>
        <div className="flex items-center gap-2">
          <BookmarkButton briefingId={briefing.id} initialSaved={initialSaved} />
          <ShareButtons title={briefing.title} url={pageUrl} />
        </div>
      </div>

      <ReadTracker briefingId={briefing.id} userId={userId} />

      {/* ── Two-column dossier ── */}
      <div className="dossier">
        {/* ════════ LEFT: the story ════════ */}
        <div className="dossier-main">
          {/* Headline */}
          <h1
            className="text-[var(--c-text-1)] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.75rem, 4vw, 2.125rem)", lineHeight: 1.17, letterSpacing: "-0.02em" }}
          >
            {briefing.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[13px] text-[var(--c-text-3)] mb-8" style={{ fontFamily: "var(--font-mono)" }}>
            <span>{formatDate(briefing.date)}</span>
            <span>·</span>
            <span>{briefing.readingTime} min read</span>
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
                      <span className="text-sm text-[var(--c-text-1)] leading-relaxed">
                        <AnnotatedText tokens={annotateCitations(stripCitations(bullet), sourceMap)} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          )}

          {/* ── Briefing check card (legacy briefings only) ── */}
          {!hasStoryEvidence && (
            <BriefingCheck
              intel={intel}
              sources={sources}
              validation={briefing.validation ?? null}
              counterpoints={counterpoints}
              checkedAt={checkedAt}
            />
          )}

          {/* ── MULTI-STORY FORMAT ── */}
          {hasStories ? (
            <div className="space-y-0">
              {briefing.stories!.map((story, si) => {
                const storyParagraphs = (story.body ?? "").split("\n\n").filter((p) => p.trim().length > 0);
                // The anchor story's chart lives in the rail — skip it inline.
                const showInlineChart =
                  !!story.chartData && !(si === 0 && story.chartData === anchorChart);
                return (
                  <ScrollReveal key={story.number} delay={si * 60}>
                    <article
                      id={`story-${story.number}`}
                      className="pt-10 pb-12 border-b border-[var(--c-border)] last:border-b-0 scroll-mt-24"
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
                            <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-[var(--c-text-3)] mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                              {story.city ? `${story.city}, ${story.location}` : story.location}
                            </p>
                          )}
                          <h2
                            className="leading-[1.15] text-[var(--c-text-1)]"
                            style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.25rem, 3vw, 1.6rem)", letterSpacing: "-0.015em" }}
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
                          const tokens = annotateParagraph(stripCitations(para), sourceMap, usedTermSlugs);
                          return <p key={pi}><AnnotatedText tokens={tokens} /></p>;
                        })}
                      </div>

                      {/* Story chart (anchor story's chart is shown in the rail) */}
                      {showInlineChart && (
                        <ScrollReveal>
                          <DataChart data={story.chartData!} />
                        </ScrollReveal>
                      )}

                      {/* Why this matters — pulled from evidence.marketImpact */}
                      {story.evidence?.marketImpact && (
                        <div className="mt-6 rounded-r-lg bg-[var(--c-accent-glow)] border-l-[3px] border-[var(--c-accent)] px-4 py-3.5">
                          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--c-green)] mb-1.5">Why this matters</p>
                          <p className="text-sm text-[var(--c-text-1)] leading-relaxed">
                            <AnnotatedText tokens={annotateCitations(stripCitations(story.evidence.marketImpact), sourceMap)} />
                          </p>
                        </div>
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
            <div className="prose-nusq">
              {bodyParagraphs.map((para, i) => {
                if (para.startsWith("## ")) {
                  return <ScrollReveal key={i}><h2>{para.replace("## ", "")}</h2></ScrollReveal>;
                }
                if (para.startsWith("**") && para.endsWith("**")) {
                  return <p key={i}><strong>{para.slice(2, -2)}</strong></p>;
                }
                const tokens = annotateParagraph(stripCitations(para), sourceMap, usedTermSlugs);
                return <p key={i}><AnnotatedText tokens={tokens} /></p>;
              })}
            </div>
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
                      <span className="text-sm text-[var(--c-text-2)] leading-relaxed">
                        <AnnotatedText tokens={annotateCitations(stripCitations(item), sourceMap)} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* ════════ RIGHT: the dossier rail ════════ */}
        <aside className="dossier-rail">
          {/* Map card (multi-story only) */}
          {hasStories && <BriefingMap stories={mapStories} />}

          {/* Data card — anchor story's chart */}
          {anchorChart && <BriefingRailChart data={anchorChart} />}

          {/* Sources card */}
          {hasSources && (
            <div className="rail-card">
              <div className="rail-card-head">
                <span className="rail-tick" />
                <span className="rail-eyebrow">Sources</span>
              </div>
              <div style={{ padding: "8px 8px" }}>
                {sources.map((s) => {
                  const pubDate = s.publishedAt
                    ? new Date(s.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : null;
                  const domain = s.domain || getPublisherDomain(s.publisher);
                  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;
                  const isArabic = s.language === "ar";
                  const initial = (s.publisher || "?").trim().charAt(0).toUpperCase();
                  return (
                    <a
                      key={s.index}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-row group"
                    >
                      <span
                        className="shrink-0 flex items-center justify-center overflow-hidden"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: "var(--c-surface-3)",
                          border: "1px solid var(--c-border)",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--c-text-2)",
                        }}
                      >
                        {faviconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={faviconUrl} width={28} height={28} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initial
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-[var(--c-text-2)] group-hover:text-[var(--c-green)] transition-colors truncate">
                            {s.publisher}
                          </span>
                          {pubDate && (
                            <>
                              <span className="text-[10px] text-[var(--c-text-3)] shrink-0">·</span>
                              <span className="text-[10px] text-[var(--c-text-3)] shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
                                {pubDate}
                              </span>
                            </>
                          )}
                        </div>
                        <p
                          className={`text-[11px] text-[var(--c-text-3)] leading-snug mt-0.5 ${isArabic ? "text-right" : ""}`}
                          dir={isArabic ? "rtl" : "ltr"}
                          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                        >
                          {s.title}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
              {intel?.confidenceNote && (
                <p className="px-4 pb-4 pt-1 text-[10px] text-[var(--c-text-3)] leading-relaxed italic">
                  {intel.confidenceNote}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Bottom share row */}
      <div className="mt-12 pt-8 border-t border-[var(--c-border)] flex items-center justify-between">
        <Link href="/briefings" className="back-link inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--c-text-2)] cursor-pointer">
          ← All briefings
        </Link>
        <ShareButtons title={briefing.title} url={pageUrl} />
      </div>
    </>
  );
}
