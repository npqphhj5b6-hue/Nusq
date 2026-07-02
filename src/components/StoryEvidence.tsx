import type { StoryEvidence as StoryEvidenceData } from "@/lib/types";

interface Props {
  evidence: StoryEvidenceData;
}

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
    <div className="mt-6 card-glow px-4 py-3.5">
      <p className="text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--c-amber)] mb-2.5">
        Evidence
      </p>

      {/* Sources reviewed · Verified · As of */}
      <div
        className="text-[11px] text-[var(--c-text-2)] flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <span>
          {evidence.sourcesReviewed} source{evidence.sourcesReviewed !== 1 ? "s" : ""} reviewed
        </span>
        {verified && <span className="text-[var(--c-text-3)]">· Verified {verified}</span>}
        {asOf && <span className="text-[var(--c-text-3)]">· As of {asOf}</span>}
      </div>
    </div>
  );
}
