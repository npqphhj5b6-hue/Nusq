"use client";

const MARKETS = [
  { name: "EGX 30",   value: "30,812", change: "+0.8%", up: true },
  { name: "Tadawul",  value: "11,204", change: "+0.3%", up: true },
  { name: "DFM",      value: "4,956",  change: "-0.2%", up: false },
  { name: "ADX",      value: "9,743",  change: "+0.5%", up: true },
  { name: "Gold",     value: "$2,438", change: "+0.6%", up: true },
  { name: "Brent",    value: "$83.4",  change: "-0.4%", up: false },
  { name: "USD/EGP",  value: "48.90",  change: "+0.1%", up: true },
  { name: "EUR/USD",  value: "1.088",  change: "-0.1%", up: false },
];

export default function MarketBar() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ borderBottom: "1px solid var(--c-border)" }}
    >
      <div className="flex items-center gap-0 overflow-x-auto py-2.5 px-1 no-scrollbar">
        {MARKETS.map((m, i) => (
          <div
            key={m.name}
            className="flex items-center shrink-0"
          >
            {i > 0 && (
              <span className="w-px h-3 mx-4" style={{ background: "var(--c-border)" }} />
            )}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--c-text-3)" }}>
                {m.name}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: "var(--c-text-1)", fontFamily: "var(--font-mono)" }}
              >
                {m.value}
              </span>
              <span
                className="text-[10px] font-semibold tabular-nums"
                style={{
                  color: m.up ? "var(--c-positive)" : "var(--c-negative)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Fade edges */}
      <div
        className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, var(--c-bg))" }}
      />
    </div>
  );
}
