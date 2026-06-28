"use client";

import { useState, useEffect } from "react";
import type { TrendsData } from "@/lib/db";

type Period = "7d" | "30d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "all": "all time",
};

const IMPACT_STYLES: Record<string, { bg: string; color: string }> = {
  positive: { bg: "#E3F5EE", color: "#0A5C3B" },
  mixed:    { bg: "#FEF3C7", color: "#92400E" },
  negative: { bg: "#FEE2E2", color: "#991B1B" },
  neutral:  { bg: "#F3F4F6", color: "#6B7280" },
  unclear:  { bg: "#F3F4F6", color: "#9CA3AF" },
};

function AnimatedBar({ label, count, max, animKey }: { label: string; count: number; max: number; animKey: string }) {
  const pct = max > 0 ? Math.max(3, Math.round((count / max) * 100)) : 3;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(0);
    const t = setTimeout(() => setWidth(pct), 60);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, pct]);

  return (
    <div className="group flex items-center gap-3 py-2 rounded-lg px-2 -mx-2 hover:bg-[var(--c-surface)] transition-colors cursor-default">
      <span className="text-[11px] text-[var(--c-text-2)] w-36 shrink-0 truncate capitalize group-hover:text-[var(--c-text-1)] transition-colors">
        {label}
      </span>
      <div className="flex-1 h-[3px] bg-[var(--c-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--c-green)] transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <span
        className="text-[10px] text-[var(--c-text-3)] w-5 text-right shrink-0 group-hover:text-[var(--c-green)] transition-colors font-medium"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {count}
      </span>
    </div>
  );
}

export default function TrendsDashboardClient({ initial }: { initial: TrendsData }) {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<TrendsData>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (period === "30d") {
      setData(initial);
      return;
    }
    setLoading(true);
    fetch(`/api/trends?period=${period}`)
      .then((r) => r.json())
      .then((d: TrendsData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, initial]);

  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="eyebrow block mb-2">Intelligence pulse</span>
          <p className="text-sm text-[var(--c-text-3)] transition-opacity duration-200" style={{ fontFamily: "var(--font-geist-mono)", opacity: loading ? 0.4 : 1 }}>
            {data.briefingCount} briefing{data.briefingCount !== 1 ? "s" : ""} · {PERIOD_LABELS[period]}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 bg-[var(--c-surface)] rounded-lg p-1">
          {(["7d", "30d", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                period === p
                  ? "bg-white text-[var(--c-text-1)] shadow-sm"
                  : "text-[var(--c-text-3)] hover:text-[var(--c-text-2)]"
              }`}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>

        {/* Coverage */}
        <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-4">Coverage</p>
          {data.topGeographies.length > 0 ? data.topGeographies.map(({ name, count }) => (
            <AnimatedBar key={name} label={name} count={count} max={data.topGeographies[0]?.count ?? 1} animKey={period} />
          )) : <p className="text-xs text-[var(--c-text-3)]">No data</p>}
        </div>

        {/* Sectors */}
        <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-4">Sectors</p>
          {data.topSectors.length > 0 ? data.topSectors.map(({ name, count }) => (
            <AnimatedBar key={name} label={name} count={count} max={data.topSectors[0]?.count ?? 1} animKey={period} />
          )) : <p className="text-xs text-[var(--c-text-3)]">No data</p>}
        </div>

        {/* Market tone */}
        <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-4">Market tone</p>
          {data.marketImpact.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {data.marketImpact.map(({ label, count }) => {
                const s = IMPACT_STYLES[label] ?? IMPACT_STYLES.unclear;
                return (
                  <div
                    key={label}
                    className="rounded-xl px-4 py-3 flex flex-col items-center min-w-[80px] hover:scale-105 transition-transform cursor-default"
                    style={{ background: s.bg, color: s.color }}
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
          ) : <p className="text-xs text-[var(--c-text-3)]">No data</p>}
        </div>

        {/* Topics */}
        <div className="border border-[var(--c-border)] rounded-xl p-6 h-full">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] mb-4">Topics</p>
          {data.topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.topTags.map(({ name, count }) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--c-text-2)] bg-[var(--c-surface)] border border-[var(--c-border)] rounded-full px-3 py-1 hover:border-[var(--c-green)] hover:text-[var(--c-green)] transition-colors cursor-default"
                >
                  {name}
                  <span className="text-[10px] text-[var(--c-text-3)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
                    {count}
                  </span>
                </span>
              ))}
            </div>
          ) : <p className="text-xs text-[var(--c-text-3)]">No data</p>}
        </div>

      </div>
    </div>
  );
}
