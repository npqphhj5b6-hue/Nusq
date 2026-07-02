"use client";

import type { ChartData } from "@/lib/types";

interface Props {
  data: ChartData;
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function formatK(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return Number.isInteger(v) ? `${v}` : v.toFixed(1);
}

export default function BriefingRailChart({ data }: Props) {
  const { title, labels, values, unit } = data;
  // The caption already names the publisher; drop any raw [n] citation markers.
  const source = (data.source ?? "").replace(/\s*\[\d+\]/g, "").trim();

  const PLOT_H = 140; // px, drawable bar area
  const max = niceCeil(Math.max(...values, 0));
  const gridCount = 4;
  const gridlines = Array.from({ length: gridCount + 1 }, (_, i) => (max / gridCount) * i);

  return (
    <div className="rail-card">
      <div className="rail-card-head">
        <span className="rail-tick" />
        <span className="rail-eyebrow">Data</span>
      </div>

      <div style={{ padding: "16px 18px 18px" }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--c-text-1)",
            lineHeight: 1.35,
            marginBottom: 16,
          }}
        >
          {title}
          {unit ? (
            <span style={{ color: "var(--c-text-3)", fontWeight: 500 }}> · {unit}</span>
          ) : null}
        </p>

        {/* Plot */}
        <div style={{ position: "relative", height: PLOT_H }}>
          {/* Gridlines */}
          {gridlines.map((g, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: (g / max) * PLOT_H,
                height: 1,
                background: "var(--c-border)",
                opacity: 0.6,
              }}
            />
          ))}

          {/* Bars */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              gap: 8,
            }}
          >
            {values.map((v, i) => {
              const h = max > 0 ? (v / max) * PLOT_H : 0;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--c-text-2)",
                      marginBottom: 4,
                    }}
                  >
                    {formatK(v)}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 34,
                      height: Math.max(h, 2),
                      borderRadius: "4px 4px 0 0",
                      background:
                        "linear-gradient(180deg, var(--c-accent), var(--c-accent-2))",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Category labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            gap: 8,
            marginTop: 8,
          }}
        >
          {labels.map((l, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 9.5,
                lineHeight: 1.25,
                color: "var(--c-text-3)",
                minWidth: 0,
                wordBreak: "break-word",
              }}
            >
              {l}
            </span>
          ))}
        </div>

        {source ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              color: "var(--c-text-3)",
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid var(--c-border)",
            }}
          >
            {source}
          </p>
        ) : null}
      </div>
    </div>
  );
}
