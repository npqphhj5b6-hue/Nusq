import { getAllBriefings } from "@/lib/db";
import { extractSignals } from "@/lib/signals";
import IsharaBlock from "@/components/IsharaBlock";
import SignalsFilter from "@/components/SignalsFilter";

export const dynamic = "force-dynamic";

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; direction?: string }>;
}) {
  const params = await searchParams;
  const briefings = await getAllBriefings();
  const allSignals = extractSignals(briefings);

  const sectors = Array.from(new Set(allSignals.flatMap(s => s.sectors))).sort();

  const filtered = allSignals.filter(s => {
    if (params.sector && !s.sectors.includes(params.sector)) return false;
    if (params.direction && s.direction !== params.direction) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-7">
        <span className="eyebrow block mb-2">Ishara feed</span>
        <h1
          className="font-bold mb-1.5"
          style={{
            fontSize: "clamp(1.7rem, 5vw, 2.5rem)",
            letterSpacing: "-0.04em",
            color: "var(--c-text-1)",
          }}
        >
          The market Ishara feed
        </h1>
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
          Ishara total: {allSignals.length} — scored reads from MENA and global macro
        </p>
      </div>

      {/* Filters */}
      <div
        className="p-4 rounded-2xl mb-5"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      >
        <SignalsFilter
          sectors={sectors}
          directions={["positive", "watch", "negative"]}
          active={params}
        />
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
          Ishara total: {filtered.length}
          {(params.sector || params.direction) && " matching filters"}
        </p>
        {(params.sector || params.direction) && (
          <a href="/signals" className="text-xs" style={{ color: "var(--c-accent)" }}>
            Clear filters
          </a>
        )}
      </div>

      {/* Ishara list */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
              No Ishara matches your filters.
            </p>
          </div>
        ) : (
          filtered.map(signal => <IsharaBlock key={signal.id} signal={signal} />)
        )}
      </div>
    </div>
  );
}
