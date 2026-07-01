"use client";

import { useState, useEffect } from "react";
import IsharaBlock from "@/components/IsharaBlock";
import type { Signal } from "@/lib/signals";

const STORAGE_KEY = "nusq-portfolio-holdings";

const SECTOR_OPTIONS = [
  "Banking", "Energy", "Real Estate", "Technology",
  "Consumer Staples", "Industrials", "Gold & Commodities", "FX / Currency",
];

const MARKET_OPTIONS = ["EGX", "Tadawul", "DFM", "ADX", "QSE", "US", "Other"];

interface Holding {
  name: string;
  sector: string;
  market: string;
}

export default function PortfolioClient({ allSignals }: { allSignals: Signal[] }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [name, setName] = useState("");
  const [sector, setSector] = useState(SECTOR_OPTIONS[0]);
  const [market, setMarket] = useState(MARKET_OPTIONS[0]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHoldings(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  function persist(next: Holding[]) {
    setHoldings(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function addHolding() {
    if (!name.trim()) return;
    persist([...holdings, { name: name.trim(), sector, market }]);
    setName("");
    setAdding(false);
  }

  const mySectors = new Set(holdings.map(h => h.sector));
  const relevant = allSignals.filter(s => s.sectors.some(sec => mySectors.has(sec)));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-7">
        <span className="eyebrow block mb-2">Portfolio</span>
        <h1
          className="font-bold mb-1.5"
          style={{ fontSize: "clamp(1.7rem,5vw,2.5rem)", letterSpacing: "-0.04em", color: "var(--c-text-1)" }}
        >
          Your holdings
        </h1>
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
          Add positions — we&apos;ll surface only Ishara coverage that touches them.
        </p>
      </div>

      {/* Holdings card */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--c-text-3)" }}>
            Holdings · {holdings.length}
          </span>
          <button
            onClick={() => setAdding(v => !v)}
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all duration-150"
            style={{ background: "var(--c-accent)", color: "var(--c-bg)" }}
          >
            {adding ? "Cancel" : "+ Add"}
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div
            className="mb-4 p-4 rounded-2xl"
            style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
          >
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ticker or name (e.g. CIB, ARAMCO)"
              autoFocus
              className="w-full text-sm px-3.5 py-2.5 rounded-xl mb-2.5 outline-none transition-all"
              style={{
                background: "var(--c-bg)",
                border: "1px solid var(--c-border-2)",
                color: "var(--c-text-1)",
              }}
              onKeyDown={e => e.key === "Enter" && addHolding()}
            />
            <div className="flex gap-2 mb-3">
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border-2)", color: "var(--c-text-2)" }}
              >
                {SECTOR_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select
                value={market}
                onChange={e => setMarket(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl outline-none"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border-2)", color: "var(--c-text-2)" }}
              >
                {MARKET_OPTIONS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <button
              onClick={addHolding}
              className="w-full text-sm font-semibold py-2.5 rounded-xl transition-all duration-150"
              style={{ background: "var(--c-accent)", color: "var(--c-bg)" }}
            >
              Add holding
            </button>
          </div>
        )}

        {/* Holdings list */}
        {holdings.length === 0 && !adding ? (
          <div className="py-8 text-center">
            <p className="text-sm mb-1" style={{ color: "var(--c-text-2)" }}>No holdings yet.</p>
            <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
              Add a position to see tailored Ishara coverage below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {holdings.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text-1)" }}>{h.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}>
                    {h.sector} · {h.market}
                  </p>
                </div>
                <button
                  onClick={() => persist(holdings.filter((_, idx) => idx !== i))}
                  className="text-xs w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-100 opacity-40"
                  style={{ color: "var(--c-text-3)", background: "var(--c-surface-3)" }}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relevant Isharas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="eyebrow">
            {holdings.length > 0 ? "Ishara feed — your portfolio" : "Recent Ishara feed"}
          </span>
          {relevant.length > 0 && (
            <span className="text-xs" style={{ color: "var(--c-text-3)" }}>
              {relevant.length} relevant
            </span>
          )}
        </div>

        {holdings.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Add a holding to see Ishara coverage.</p>
            <p className="text-xs mt-1" style={{ color: "var(--c-text-3)" }}>
              We filter by sector to show only what matters to you.
            </p>
          </div>
        ) : relevant.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
              No recent Ishara activity touches your holdings — check back soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {relevant.map(s => <IsharaBlock key={s.id} signal={s} compact />)}
          </div>
        )}
      </div>

      <p className="text-[11px] mt-8 text-center" style={{ color: "var(--c-text-3)" }}>
        Holdings stored in your browser only · Not investment advice
      </p>
    </div>
  );
}
