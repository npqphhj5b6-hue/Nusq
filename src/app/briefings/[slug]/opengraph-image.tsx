import { ImageResponse } from "next/og";
import { getBriefingBySlug } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#080E1C";
const SURFACE = "#0D1525";
const BORDER = "#1A2D45";
const TEXT_1 = "#EEF2FF";
const TEXT_2 = "#6B82A0";
const TEXT_3 = "#334560";
const ACCENT = "#38BDF8";
const POSITIVE = "#34D399";
const NEGATIVE = "#FB923C";
const WATCH = "#94A3B8";

function directionColor(impact: string): string {
  if (impact === "positive") return POSITIVE;
  if (impact === "negative") return NEGATIVE;
  return WATCH;
}

function directionLabel(impact: string): string {
  if (impact === "positive") return "POSITIVE";
  if (impact === "negative") return "NEGATIVE";
  if (impact === "mixed") return "MIXED";
  return "WATCHING";
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const briefing = await getBriefingBySlug(slug);

  const title = briefing?.title ?? "MENA markets, explained.";
  const summary = briefing?.summary ?? "One daily briefing. Plain language. No finance degree needed.";
  const date = briefing?.date
    ? new Date(briefing.date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const impact = briefing?.intelligence?.marketImpact ?? "neutral";
  const sectors = briefing?.intelligence?.affectedSectors?.slice(0, 4) ?? [];
  const accentColor = directionColor(impact);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: NAVY,
          display: "flex",
          flexDirection: "column",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow at top from direction colour */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: accentColor,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 160,
            background: `linear-gradient(to bottom, ${accentColor}18, transparent)`,
          }}
        />

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "52px 64px 48px",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 48,
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  color: TEXT_1,
                }}
              >
                nusq
              </span>
              <span style={{ fontSize: 16, color: TEXT_3 }}>نسق</span>
            </div>

            {/* Direction chip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 18px",
                borderRadius: 999,
                border: `1px solid ${accentColor}40`,
                background: `${accentColor}12`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: accentColor,
                  boxShadow: `0 0 10px ${accentColor}`,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: accentColor,
                }}
              >
                {directionLabel(impact)}
              </span>
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 60 ? 38 : 46,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: TEXT_1,
              marginBottom: 20,
              maxWidth: 900,
            }}
          >
            {title}
          </div>

          {/* Summary */}
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: TEXT_2,
              maxWidth: 820,
              flex: 1,
            }}
          >
            {summary.length > 140 ? summary.slice(0, 140) + "…" : summary}
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 28,
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            {/* Sector tags */}
            <div style={{ display: "flex", gap: 8 }}>
              {sectors.map((s) => (
                <div
                  key={s}
                  style={{
                    fontSize: 12,
                    padding: "5px 14px",
                    borderRadius: 8,
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    color: TEXT_3,
                    fontWeight: 500,
                  }}
                >
                  {s}
                </div>
              ))}
            </div>

            {/* Date */}
            <span style={{ fontSize: 13, color: TEXT_3, letterSpacing: "0.05em" }}>
              {date}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
