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
  { name: "QE Index", value: "10,521", change: "+0.2%", up: true },
  { name: "KSE All",  value: "7,284",  change: "+0.4%", up: true },
];

/* Duplicate for seamless infinite loop */
const LOOP = [...MARKETS, ...MARKETS];

export default function MarketBar() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ borderBottom: "1px solid var(--c-border)" }}
    >
      {/* Fixed INDICATIVE label */}
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-[9px] font-bold tracking-widest uppercase select-none"
        style={{ color: "var(--c-text-3)" }}
      >
        Indicative
      </span>

      {/* Animated ticker */}
      <div className="ticker-track py-2.5">
        {LOOP.map((m, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span className="w-px h-3 mx-4" style={{ background: "var(--c-border)" }} />
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-medium whitespace-nowrap"
                style={{ color: "var(--c-text-3)" }}
              >
                {m.name}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums whitespace-nowrap"
                style={{ color: "var(--c-text-1)", fontFamily: "var(--font-mono)" }}
              >
                {m.value}
              </span>
              <span
                className="text-[10px] font-semibold tabular-nums whitespace-nowrap"
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

      {/* Left fade (covers INDICATIVE label) */}
      <div
        className="absolute top-0 left-0 bottom-0 w-24 pointer-events-none z-[5]"
        style={{ background: "linear-gradient(to right, var(--c-bg) 45%, transparent)" }}
      />
      {/* Right fade */}
      <div
        className="absolute top-0 right-0 bottom-0 w-16 pointer-events-none"
        style={{ background: "linear-gradient(to left, var(--c-bg), transparent)" }}
      />
    </div>
  );
}
