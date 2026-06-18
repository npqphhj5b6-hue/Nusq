import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { approveBriefing, deleteBriefing } from "../../actions";
import { formatDate } from "@/lib/db";
import type { SourceRef, BriefingClaim, ValidationResult, BriefingIntelligence, Counterpoint } from "@/lib/types";
import { TIER_LABELS, SOURCE_TYPE_LABELS } from "@/lib/source-credibility";

export const dynamic = "force-dynamic";

const TIER_BADGE_COLOURS: Record<number, string> = {
  1: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25",
  2: "bg-amber-500/10 text-amber-600 border border-amber-500/25",
  3: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};

const COUNTERPOINT_TYPE_LABELS: Record<Counterpoint["type"], string> = {
  direct_contradiction: "Direct contradiction",
  time_horizon_difference: "Time horizon",
  scope_difference: "Scope difference",
  official_vs_media_difference: "Official vs media",
  risk_factor: "Risk factor",
};

const COUNTERPOINT_TYPE_COLOURS: Record<Counterpoint["type"], string> = {
  direct_contradiction: "bg-red-50 text-red-700 border border-red-200",
  time_horizon_difference: "bg-blue-50 text-blue-700 border border-blue-200",
  scope_difference: "bg-purple-50 text-purple-700 border border-purple-200",
  official_vs_media_difference: "bg-orange-50 text-orange-700 border border-orange-200",
  risk_factor: "bg-amber-50 text-amber-700 border border-amber-200",
};

const IMPACT_COLOURS: Record<string, string> = {
  positive: "text-emerald-600",
  negative: "text-red-500",
  mixed:    "text-amber-600",
  neutral:  "text-zinc-500",
  unclear:  "text-zinc-400",
};

export default async function DraftReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: draft } = await supabaseAdmin
    .from("briefings")
    .select("*")
    .eq("id", id)
    .single();

  if (!draft) notFound();

  const bodyParagraphs = draft.body
    .split("\n\n")
    .filter((p: string) => p.trim().length > 0);

  const sources: SourceRef[] = (draft.sources as SourceRef[] | null) ?? [];
  const validation: ValidationResult | null = (draft.validation as ValidationResult | null) ?? null;
  const intelligence: BriefingIntelligence | null = (draft.intelligence as BriefingIntelligence | null) ?? null;
  const claims: BriefingClaim[] = (draft.claims as BriefingClaim[] | null) ?? [];
  const counterpoints: Counterpoint[] = (draft.counterpoints as Counterpoint[] | null) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Admin controls */}
      <div className="flex items-center justify-between mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Draft</span>
          <span className="text-xs text-amber-600">— review before publishing</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/briefings/${id}/edit`}
            className="px-3 py-1.5 text-xs font-medium text-[#737373] bg-white border border-[#E5E2DC] rounded-lg hover:border-[#1B4F72]/40 transition-colors"
          >
            Edit
          </Link>
          <form action={deleteBriefing.bind(null, id)}>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Delete
            </button>
          </form>
          <form action={approveBriefing.bind(null, id)}>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-[#1B4F72] rounded-lg hover:bg-[#154060] transition-colors">
              Approve &amp; publish
            </button>
          </form>
        </div>
      </div>

      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1C1C1C] transition-colors mb-8">
        <span>←</span>
        <span>Back to drafts</span>
      </Link>

      {/* ── Validation panel ── */}
      {validation && (
        <div className={`mb-8 p-4 rounded-xl border text-sm ${validation.passed && !validation.needsReview ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-300"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold uppercase tracking-wide ${validation.passed && !validation.needsReview ? "text-emerald-700" : "text-amber-700"}`}>
              {validation.passed && !validation.needsReview ? "✓ Validation passed" : "⚠ Needs review"}
            </span>
            {validation.checkedAt && (
              <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                {new Date(validation.checkedAt).toLocaleString("en-GB")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 mb-2">
            <span>Sources: <strong>{validation.sourceCount}</strong></span>
            <span>Has URLs: <strong>{validation.hasUrls ? "yes" : "no"}</strong></span>
            <span>Freshness OK: <strong>{validation.freshnessOk ? "yes" : "no"}</strong></span>
          </div>
          {validation.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {validation.warnings.map((w, i) => (
                <li key={i} className="text-[11px] text-amber-700 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">›</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
          {validation.staleSentinelWords.length > 0 && (
            <p className="mt-2 text-[11px] text-red-600">
              Stale language detected: {validation.staleSentinelWords.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* ── Intelligence panel ── */}
      {intelligence && (
        <div className="mb-8 p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Intelligence</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
            <span className="text-zinc-500">Market impact: <span className={`font-medium capitalize ${IMPACT_COLOURS[intelligence.marketImpact] ?? ""}`}>{intelligence.marketImpact}</span></span>
            <span className="text-zinc-500">Investor relevance: <strong className="text-zinc-700 capitalize">{intelligence.investorRelevance}</strong></span>
            <span className="text-zinc-500">Time horizon: <strong className="text-zinc-700 capitalize">{intelligence.timeHorizon}</strong></span>
            <span className="text-zinc-500">Freshness: <strong className="text-zinc-700 capitalize">{intelligence.freshnessStatus}</strong></span>
            {intelligence.conflictingSourcesDetected && (
              <span className="col-span-2 text-amber-600 font-medium">⚠ Conflicting sources detected</span>
            )}
          </div>
          {intelligence.affectedSectors.length > 0 && (
            <p className="mt-2 text-[11px] text-zinc-500">Sectors: {intelligence.affectedSectors.join(", ")}</p>
          )}
          {intelligence.affectedGeographies.length > 0 && (
            <p className="mt-1 text-[11px] text-zinc-500">Geographies: {intelligence.affectedGeographies.join(", ")}</p>
          )}
          {intelligence.confidenceNote && (
            <p className="mt-2 text-[11px] text-zinc-400 italic">{intelligence.confidenceNote}</p>
          )}
        </div>
      )}

      {/* Article preview */}
      <div className="flex flex-wrap gap-2 mb-5">
        {draft.tags?.map((tag: string) => (
          <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#EBF4FB] text-[#1B4F72]">
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-2xl font-bold text-[#1C1C1C] leading-snug mb-4">{draft.title}</h1>

      <p className="text-[#737373] leading-relaxed mb-6 text-base border-l-2 border-[#1B4F72]/30 pl-4">
        {draft.summary}
      </p>

      <div className="flex items-center gap-3 text-xs text-[#A8A8A8] mb-10 pb-10 border-b border-[#E5E2DC]">
        <span>{formatDate(draft.date)}</span>
        <span>·</span>
        <span>{draft.reading_time} min read</span>
        {sources.length > 0 && (
          <>
            <span>·</span>
            <span>{sources.length} sources</span>
          </>
        )}
      </div>

      <div className="prose-nusq">
        {bodyParagraphs.map((para: string, i: number) => {
          if (para.startsWith("## ")) {
            return <h2 key={i}>{para.replace("## ", "")}</h2>;
          }
          const withBold = para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
          return <p key={i} dangerouslySetInnerHTML={{ __html: withBold }} />;
        })}
      </div>

      {/* ── Sources panel ── */}
      {sources.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[#E5E2DC]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Sources ({sources.length})</p>
          <div className="space-y-3">
            {sources.map((s) => {
              const pubDate = s.publishedAt
                ? new Date(s.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : null;
              const eventDate = s.eventDate
                ? new Date(s.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : null;
              return (
                <div key={s.index} className="flex items-start gap-3 pb-3 border-b border-zinc-100 last:border-b-0">
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0 w-6 text-right pt-0.5">[{s.index}]</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1B4F72] hover:underline font-medium leading-snug block"
                    >
                      {s.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-zinc-500">{s.publisher}</span>
                      {pubDate && (
                        <>
                          <span className="text-zinc-300 text-[10px]">·</span>
                          <span className="text-[10px] font-mono text-zinc-400">{pubDate}</span>
                        </>
                      )}
                      {s.language === "ar" && (
                        <>
                          <span className="text-zinc-300 text-[10px]">·</span>
                          <span className="text-[10px] text-zinc-400">Arabic</span>
                        </>
                      )}
                      <span className={`text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded ${TIER_BADGE_COLOURS[s.tier]}`}>
                        {TIER_LABELS[s.tier]}
                      </span>
                      {s.isPrimarySource && (
                        <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Primary
                        </span>
                      )}
                      {s.sourceType && s.sourceType !== "unknown" && (
                        <span className="text-[9px] text-zinc-400 tracking-wide uppercase">
                          {SOURCE_TYPE_LABELS[s.sourceType]}
                        </span>
                      )}
                      {s.isBackgroundContext && (
                        <span className="text-[9px] text-zinc-400 italic">background</span>
                      )}
                    </div>
                    {s.summaryOfRelevance && (
                      <p className="mt-1 text-[10px] text-zinc-500 italic">{s.summaryOfRelevance}</p>
                    )}
                    {s.claimsSupported && s.claimsSupported.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {s.claimsSupported.map((c, ci) => (
                          <li key={ci} className="text-[10px] text-zinc-500 flex gap-1">
                            <span className="text-zinc-300 shrink-0">›</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {eventDate && (
                      <p className="mt-1 text-[10px] font-mono text-zinc-400">Event: {eventDate}</p>
                    )}
                    {s.snippet && (
                      <p className="mt-1 text-[10px] text-zinc-400 line-clamp-2">{s.snippet}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Claims panel ── */}
      {claims.length > 0 && (
        <div className="mt-8 pt-8 border-t border-[#E5E2DC]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Structured Claims ({claims.length})</p>
          <div className="space-y-2.5">
            {claims.map((c, i) => (
              <div key={i} className="p-3 rounded-lg border border-zinc-100 bg-zinc-50">
                <p className="text-[11px] text-zinc-700 font-medium leading-snug">{c.claim}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-400">
                    Sources: {c.sourceIndices.map(n => `[${n}]`).join(", ")}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    c.confidence === "high" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : c.confidence === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                  }`}>
                    {c.confidence}
                  </span>
                  {c.requiresAttribution && (
                    <span className="text-[9px] text-zinc-400 italic">requires attribution</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Counterpoints panel ── */}
      {counterpoints.length > 0 && (
        <div className="mt-8 pt-8 border-t border-[#E5E2DC]">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Counter-evidence ({counterpoints.length})</p>
            {counterpoints.some((cp) => cp.blocksPublish) && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                ⚠ Blocks publish
              </span>
            )}
          </div>
          <div className="space-y-3">
            {counterpoints.map((cp, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${cp.blocksPublish ? "border-red-200 bg-red-50/50" : "border-zinc-100 bg-zinc-50"}`}
              >
                <p className="text-[11px] text-zinc-600 leading-snug mb-1.5">
                  <span className="font-medium text-zinc-800">Claim:</span> {cp.claim}
                </p>
                <p className="text-[11px] text-zinc-700 leading-snug">
                  <span className="font-medium">Counter:</span> {cp.counterEvidence}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-400">
                    Claim sources: {cp.claimSourceIndices.map((n) => `[${n}]`).join(", ")}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Counter sources: {cp.counterSourceIndices.map((n) => `[${n}]`).join(", ")}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${COUNTERPOINT_TYPE_COLOURS[cp.type]}`}>
                    {COUNTERPOINT_TYPE_LABELS[cp.type]}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    cp.severity === "high" ? "bg-red-50 text-red-700 border border-red-200"
                    : cp.severity === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}>
                    {cp.severity}
                  </span>
                  {cp.blocksPublish && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                      Blocks publish
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
