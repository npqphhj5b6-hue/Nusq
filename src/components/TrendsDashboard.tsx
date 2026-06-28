import { getTrendsData } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";

const IMPACT_STYLES: Record<string, { bg: string; color: string }> = {
  positive: { bg: "#E3F5EE", color: "#0A5C3B" },
  mixed:    { bg: "#FEF3C7", color: "#92400E" },
  negative: { bg: "#FEE2E2", color: "#991B1B" },
  neutral:  { bg: "#F3F4F6", color: "#6B7280" },
  unclear:  { bg: "#F3F4F6", color: "#9CA3AF" },
};

function FreqBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.max(3, Math.round((count / max) * 100)) : 3;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[11px] text-[var(--c-text-2)] w-36 shrink-0 truncate capitalize">{label}</span>
      <div className="flex-1 h-[3px] bg-[var(--c-border)] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[var(--c-green)]" style={{ width: `${pct}%` }} />
      </div>
      <span
        className="text-[10px] text-[var(--c-text-3)] w-4 text-right shrink-0"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {count}
      </span>
    </div>
  );
}

export default async function TrendsDashboard() {
  const trends = await getTrendsData();
  if (!trends || trends.briefingCount === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 py-14 border-b border-[var(--c-border)]">
      <ScrollReveal>
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="eyebrow block mb-2">Intelligence pulse</span>
            <p className="text-sm text-[var(--c-text-3)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
              {trends.briefingCount} briefing{trends.briefingCount !== 1 ? "s" : ""} · past 30 days
            </p>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Coverage */}
        <ScrollReveal delay={40}>
          <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-5">Coverage</p>
            <div>
              {trends.topGeographies.map(({ name, count }) => (
                <FreqBar key={name} label={name} count={count} max={trends.topGeographies[0]?.count ?? 1} />
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Sectors */}
        <ScrollReveal delay={80}>
          <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-5">Sectors</p>
            <div>
              {trends.topSectors.map(({ name, count }) => (
                <FreqBar key={name} label={name} count={count} max={trends.topSectors[0]?.count ?? 1} />
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Market tone */}
        <ScrollReveal delay={120}>
          <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-5">Market tone</p>
            <div className="flex flex-wrap gap-3">
              {trends.marketImpact.map(({ label, count }) => {
                const style = IMPACT_STYLES[label] ?? IMPACT_STYLES.unclear;
                return (
                  <div
                    key={label}
                    className="rounded-xl px-4 py-3 flex flex-col items-center min-w-[80px]"
                    style={{ background: style.bg, color: style.color }}
                  >
                    <span
                      className="text-2xl font-bold leading-none"
                      style={{ fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}
                    >
                      {count}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] mt-1.5 capitalize">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Topics */}
        <ScrollReveal delay={160}>
          <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-5">Topics</p>
            <div className="flex flex-wrap gap-2">
              {trends.topTags.map(({ name, count }) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--c-text-2)] bg-[var(--c-surface)] border border-[var(--c-border)] rounded-full px-3 py-1"
                >
                  {name}
                  <span
                    className="text-[10px] text-[var(--c-text-3)]"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
