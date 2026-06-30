"use client";

import { useState, useMemo } from "react";

interface SectorData {
  name: string;
  positive: number;
  negative: number;
  watch: number;
  total: number;
  score: number;
}

type SortMode = "volume" | "bullish" | "bearish";

function sentiment(score: number, total: number) {
  if (total === 0) return { label: "No data", color: "var(--c-text-3)", bg: "transparent", border: "var(--c-border)" };
  if (score > 0.5)  return { label: "Strong buy",  color: "var(--c-positive)", bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.30)" };
  if (score > 0.2)  return { label: "Bullish",      color: "var(--c-positive)", bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.20)" };
  if (score > 0.05) return { label: "Positive",     color: "var(--c-positive)", bg: "rgba(52,211,153,0.04)", border: "rgba(52,211,153,0.12)" };
  if (score < -0.5) return { label: "Strong sell",  color: "var(--c-negative)", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.30)" };
  if (score < -0.2) return { label: "Bearish",      color: "var(--c-negative)", bg: "rgba(251,146,60,0.07)",  border: "rgba(251,146,60,0.20)" };
  if (score < -0.05) return { label: "Negative",   color: "var(--c-negative)", bg: "rgba(251,146,60,0.04)",  border: "rgba(251,146,60,0.12)" };
  return { label: "Neutral", color: "var(--c-watch)", bg: "var(--c-surface)", border: "var(--c-border)" };
}

function overallMood(score: number) {
  if (score > 0.25)  return { label: "Bullish", color: "var(--c-positive)" };
  if (score < -0.25) return { label: "Bearish", color: "var(--c-negative)" };
  return { label: "Mixed", color: "var(--c-watch)" };
}

function SectorCard({ s, rank }: { s: SectorData; rank: number }) {
  const sent = sentiment(s.score, s.total);
  const pct = (n: number) => s.total > 0 ? (n / s.total) * 100 : 0;

  return (
    <div
      className="rounded-2xl p-4 cursor-default transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: sent.bg,
        border: `1px solid ${sent.border}`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold leading-tight" style={{ color: "var(--c-text-1)", letterSpacing: "-0.02em" }}>
          {s.name}
        </p>
        <span className="text-[10px] tabular-nums shrink-0 mt-0.5" style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}>
          #{rank}
        </span>
      </div>

      <p className="text-xs font-semibold mb-3" style={{ color: sent.color }}>
        {sent.label}
      </p>

      {/* Stacked score bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden mb-3 flex gap-px" style={{ background: "var(--c-surface-2)" }}>
        {s.positive > 0 && (
          <div style={{ width: `${pct(s.positive)}%`, background: "var(--c-positive)", opacity: 0.8, borderRadius: "9999px 0 0 9999px", transition: "width 0.5s ease" }} />
        )}
        {s.watch > 0 && (
          <div style={{ width: `${pct(s.watch)}%`, background: "var(--c-watch)", opacity: 0.5, transition: "width 0.5s ease" }} />
        )}
        {s.negative > 0 && (
          <div style={{ width: `${pct(s.negative)}%`, background: "var(--c-negative)", opacity: 0.8, borderRadius: "0 9999px 9999px 0", transition: "width 0.5s ease" }} />
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
        <span style={{ color: "var(--c-positive)" }}>▲ {s.positive}</span>
        <span style={{ color: "var(--c-watch)" }}>◐ {s.watch}</span>
        <span style={{ color: "var(--c-negative)" }}>▼ {s.negative}</span>
        <span className="ml-auto" style={{ color: "var(--c-text-3)" }}>
          {s.total} signal{s.total !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default function SectorHeatmap({ sectors }: { sectors: SectorData[] }) {
  const [sort, setSort] = useState<SortMode>("volume");

  const sorted = useMemo(() => {
    const copy = [...sectors];
    if (sort === "bullish") copy.sort((a, b) => b.score - a.score);
    else if (sort === "bearish") copy.sort((a, b) => a.score - b.score);
    else copy.sort((a, b) => b.total - a.total);
    return copy;
  }, [sectors, sort]);

  const totalSignals  = sectors.reduce((s, x) => s + x.total, 0);
  const totalPositive = sectors.reduce((s, x) => s + x.positive, 0);
  const totalNegative = sectors.reduce((s, x) => s + x.negative, 0);
  const globalScore   = totalSignals > 0 ? (totalPositive - totalNegative) / totalSignals : 0;
  const mood          = overallMood(globalScore);
  const maxTotal      = Math.max(...sectors.map(s => s.total), 1);

  const SORT_BTNS: { mode: SortMode; label: string }[] = [
    { mode: "volume",  label: "Most active" },
    { mode: "bullish", label: "Most bullish" },
    { mode: "bearish", label: "Most bearish" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-7">
        <span className="eyebrow block mb-2">Sector heatmap</span>
        <h1 className="font-bold mb-1.5" style={{ fontSize: "clamp(1.7rem,5vw,2.5rem)", letterSpacing: "-0.04em", color: "var(--c-text-1)" }}>
          Market at a glance
        </h1>
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
          Signal sentiment across MENA sectors, derived from recent intelligence.
        </p>
      </div>

      {sectors.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>No sector data yet.</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { value: totalSignals.toString(), label: "Total signals", color: undefined },
              { value: sectors.length.toString(), label: "Sectors tracked", color: undefined },
              { value: mood.label, label: "Overall mood", color: mood.color },
            ].map(({ value, label, color }) => (
              <div key={label} className="rounded-2xl p-4 text-center" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                <p className="text-xl font-bold mb-0.5" style={{ color: color ?? "var(--c-text-1)", letterSpacing: "-0.03em" }}>
                  {value}
                </p>
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--c-text-3)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest font-semibold mr-1" style={{ color: "var(--c-text-3)" }}>
              Sort by
            </span>
            {SORT_BTNS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-150"
                style={{
                  background: sort === mode ? "var(--c-accent-glow)" : "var(--c-surface-2)",
                  color: sort === mode ? "var(--c-accent)" : "var(--c-text-3)",
                  border: `1px solid ${sort === mode ? "color-mix(in srgb, var(--c-accent) 25%, transparent)" : "var(--c-border)"}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sector grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {sorted.map((s, i) => (
              <SectorCard key={s.name} s={s} rank={i + 1} />
            ))}
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: "var(--c-text-3)" }}>
              Signal volume by sector
            </p>
            <div className="flex flex-col gap-3.5">
              {sorted.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs shrink-0 truncate" style={{ width: 120, color: "var(--c-text-2)" }}>
                    {s.name}
                  </span>
                  <div className="flex-1 flex h-3 rounded-full overflow-hidden gap-px" style={{ background: "var(--c-surface-2)" }}>
                    {s.positive > 0 && (
                      <div style={{ width: `${(s.positive / maxTotal) * 100}%`, background: "var(--c-positive)", opacity: 0.75, borderRadius: "9999px 0 0 9999px", transition: "width 0.5s ease" }} />
                    )}
                    {s.watch > 0 && (
                      <div style={{ width: `${(s.watch / maxTotal) * 100}%`, background: "var(--c-watch)", opacity: 0.5, transition: "width 0.5s ease" }} />
                    )}
                    {s.negative > 0 && (
                      <div style={{ width: `${(s.negative / maxTotal) * 100}%`, background: "var(--c-negative)", opacity: 0.75, borderRadius: "0 9999px 9999px 0", transition: "width 0.5s ease" }} />
                    )}
                  </div>
                  <span className="text-[10px] tabular-nums shrink-0" style={{ width: 20, textAlign: "right", color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}>
                    {s.total}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-5 mt-5 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
              {[
                { label: "Positive", color: "var(--c-positive)" },
                { label: "Watch",    color: "var(--c-watch)" },
                { label: "Negative", color: "var(--c-negative)" },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--c-text-3)" }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: color, opacity: 0.8 }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] mt-6 text-center" style={{ color: "var(--c-text-3)" }}>
        Derived from Nusq signal intelligence · Not investment advice
      </p>
    </div>
  );
}
