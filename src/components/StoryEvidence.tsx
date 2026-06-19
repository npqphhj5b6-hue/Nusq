import type { StoryEvidence as StoryEvidenceData } from "@/lib/types";

interface Props {
  evidence: StoryEvidenceData;
}

const RELEVANCE_LABEL: Record<StoryEvidenceData["relevance"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const RELEVANCE_COLOUR: Record<StoryEvidenceData["relevance"], string> = {
  high: "text-emerald-400",
  medium: "text-[var(--c-amber)]",
  low: "text-[var(--c-text-3)]",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

// The per-story "Evidence bubble" (Part 5). Renders directly after a story body.
export default function StoryEvidence({ evidence }: Props) {
  const verified = evidence.verifiedAt ? timeAgo(evidence.verifiedAt) : null;
  const asOf = evidence.asOf ? timeAgo(evidence.asOf) : null;

  return (
    <div className="mt-6 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3.5">
      <p className="text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--c-amber)] mb-2.5">
        Evidence
      </p>

      {/* Sources reviewed · Verified · As of */}
      <div
        className="text-[11px] text-[var(--c-text-2)] mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <span>
          {evidence.sourcesReviewed} source{evidence.sourcesReviewed !== 1 ? "s" : ""} reviewed
        </span>
        {verified && <span className="text-[var(--c-text-3)]">· Verified {verified}</span>}
        {asOf && <span className="text-[var(--c-text-3)]">· As of {asOf}</span>}
      </div>

      {/* Market impact (directional clause) */}
      {evidence.marketImpact && (
        <p className="text-[11px] text-[var(--c-text-2)] leading-relaxed mb-1.5">
          <span className="text-[var(--c-text-3)] mr-1">Market impact:</span>
          {evidence.marketImpact}
        </p>
      )}

      {/* Relevance + reason */}
      {(evidence.relevance || evidence.relevanceReason) && (
        <p className="text-[11px] text-[var(--c-text-2)] leading-relaxed mb-2.5">
          <span className="text-[var(--c-text-3)] mr-1">Relevance:</span>
          <span className={`font-medium ${RELEVANCE_COLOUR[evidence.relevance]}`}>
            {RELEVANCE_LABEL[evidence.relevance]}
          </span>
          {evidence.relevanceReason && (
            <span className="text-[var(--c-text-3)]"> — {evidence.relevanceReason}</span>
          )}
        </p>
      )}

      {/* Geography + sector pills */}
      {(evidence.geographies.length > 0 || evidence.sectors.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {evidence.geographies.map((g) => (
            <span
              key={`g-${g}`}
              className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-amber)] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#F59E0B]/20"
            >
              {g}
            </span>
          ))}
          {evidence.sectors.map((s) => (
            <span
              key={`s-${s}`}
              className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[var(--c-text-3)] bg-[var(--c-bg)] px-2 py-0.5 rounded-full border border-[var(--c-border)]"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
