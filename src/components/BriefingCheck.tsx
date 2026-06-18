"use client";
import { useState } from "react";
import type { BriefingIntelligence, SourceRef, Counterpoint, ValidationResult } from "@/lib/types";

interface Props {
  intel: BriefingIntelligence | null;
  sources: SourceRef[];
  validation?: ValidationResult | null;
  counterpoints?: Counterpoint[] | null;
  checkedAt?: string | null;
}

const IMPACT_COLOUR: Record<string, string> = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  mixed:    "text-amber-400",
  neutral:  "text-[var(--c-text-3)]",
  unclear:  "text-[var(--c-text-3)]",
};

function timeAgoStr(checkedAt: string): string {
  const diff = Date.now() - new Date(checkedAt).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

export default function BriefingCheck({ intel, sources, validation, counterpoints, checkedAt }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!intel && sources.length === 0) return null;

  const officialCount    = sources.filter((s) => s.tier === 1).length;
  const establishedCount = sources.filter((s) => s.tier === 2).length;
  const otherCount       = sources.filter((s) => s.tier === 3).length;
  const timeAgo          = checkedAt ? timeAgoStr(checkedAt) : null;

  const geos    = intel?.affectedGeographies ?? [];
  const sectors = intel?.affectedSectors     ?? [];

  const hasExpandedContent =
    !!(intel?.marketImpactDetail) ||
    !!(intel?.relevanceReason) ||
    !!(intel?.confidenceNote) ||
    sources.length > 0 ||
    (counterpoints && counterpoints.length > 0) ||
    !!checkedAt;

  return (
    <div className="mb-10 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] overflow-hidden">
      {/* ── Compact summary ── */}
      <div className="px-4 pt-3.5 pb-3">
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--c-amber)] mb-2.5">
          Briefing check
        </p>

        {/* Source count + verified */}
        <div
          className="text-[11px] text-[var(--c-text-2)] mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {sources.length > 0 && (
            <span>
              {sources.length} source{sources.length !== 1 ? "s" : ""}
              {officialCount > 0 && (
                <span className="text-[var(--c-text-3)]"> · {officialCount} official ref{officialCount !== 1 ? "s" : ""}</span>
              )}
            </span>
          )}
          {timeAgo && (
            <span className="text-[var(--c-text-3)]">
              {sources.length > 0 && "· "}Verified {timeAgo}
            </span>
          )}
        </div>

        {/* Impact + relevance */}
        {intel && (intel.marketImpact || intel.investorRelevance) && (
          <div
            className="text-[11px] text-[var(--c-text-3)] mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {intel.marketImpact && (
              <span>
                Impact:{" "}
                <span className={`font-medium capitalize ${IMPACT_COLOUR[intel.marketImpact] ?? ""}`}>
                  {intel.marketImpact}
                </span>
              </span>
            )}
            {intel.marketImpact && intel.investorRelevance && (
              <span className="text-[var(--c-border-2)]">·</span>
            )}
            {intel.investorRelevance && (
              <span>
                Relevance:{" "}
                <span className="font-medium text-[var(--c-text-1)] capitalize">{intel.investorRelevance}</span>
              </span>
            )}
          </div>
        )}

        {/* Geographies */}
        {geos.length > 0 && (
          <p className="text-[10px] text-[var(--c-text-3)] mb-1 leading-relaxed">
            {geos.join(" · ")}
          </p>
        )}

        {/* Sectors */}
        {sectors.length > 0 && (
          <p className="text-[10px] text-[var(--c-text-3)] leading-relaxed capitalize mb-2">
            {sectors.join(" · ")}
          </p>
        )}

        {/* One-liner */}
        {intel?.marketImpactDetail && (
          <p className="text-[11px] text-[var(--c-text-2)] leading-relaxed mt-2">
            <span className="text-[var(--c-text-3)] mr-1">Why this matters:</span>
            {intel.marketImpactDetail}
          </p>
        )}
      </div>

      {/* ── Expand toggle ── */}
      {hasExpandedContent && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2 border-t border-[var(--c-border)] text-[10px] font-medium tracking-[0.06em] text-[var(--c-text-3)] hover:text-[var(--c-amber)] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-geist-mono)" }}
          aria-expanded={expanded}
        >
          <span>Evidence notes</span>
          <span
            className="inline-block transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ↓
          </span>
        </button>
      )}

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="border-t border-[var(--c-border)] px-4 py-3.5 space-y-3">
          {intel?.marketImpactDetail && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] mb-1">
                Market impact
              </p>
              <p className="text-[11px] text-[var(--c-text-2)] leading-relaxed">
                {intel.marketImpactDetail}
              </p>
            </div>
          )}

          {intel?.relevanceReason && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] mb-1">
                Allocator relevance
              </p>
              <p className="text-[11px] text-[var(--c-text-2)] leading-relaxed">
                {intel.relevanceReason}
              </p>
            </div>
          )}

          {sources.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] mb-1">
                Source quality
              </p>
              <p className="text-[11px] text-[var(--c-text-2)] leading-relaxed" style={{ fontFamily: "var(--font-geist-mono)" }}>
                {[
                  officialCount    > 0 ? `${officialCount} official`                   : null,
                  establishedCount > 0 ? `${establishedCount} established media`        : null,
                  otherCount       > 0 ? `${otherCount} other`                          : null,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
          )}

          {intel?.confidenceNote && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] mb-1">
                Confidence note
              </p>
              <p className="text-[11px] text-[var(--c-text-2)] leading-relaxed">
                {intel.confidenceNote}
              </p>
            </div>
          )}

          {counterpoints && counterpoints.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] mb-1.5">
                Counterpoints ({counterpoints.length})
              </p>
              <ul className="space-y-1.5">
                {counterpoints.map((cp, i) => (
                  <li key={i} className="text-[11px] text-[var(--c-text-2)] leading-relaxed flex items-start gap-1.5">
                    <span className="text-[var(--c-text-3)] shrink-0 mt-0.5">›</span>
                    <span>{cp.counterEvidence}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation?.warnings && validation.warnings.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] mb-1.5">
                Validation notes
              </p>
              <ul className="space-y-1">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="text-[11px] text-amber-400/80 leading-relaxed flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {checkedAt && (
            <p className="text-[10px] text-[var(--c-text-3)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
              Last verified: {new Date(checkedAt).toLocaleString("en-GB")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
