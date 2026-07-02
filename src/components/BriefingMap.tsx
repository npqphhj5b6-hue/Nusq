"use client";

import {
  MENA_MAP_VIEWBOX,
  MENA_COUNTRY_PATHS,
  MENA_CAPITAL_PX,
} from "@/lib/mena-geo";

export interface MapStory {
  number: number;
  headline: string;
  location: string;
  city?: string;
}

interface Props {
  stories: MapStory[];
}

// Country-name aliases so a story's `location` resolves to the baked path name.
const NAME_ALIASES: Record<string, string> = {
  UAE: "United Arab Emirates",
  "U.A.E.": "United Arab Emirates",
  Emirates: "United Arab Emirates",
  KSA: "Saudi Arabia",
};

function resolveCountryName(location: string): string | null {
  if (NAME_ALIASES[location]) return NAME_ALIASES[location];
  const exact = MENA_COUNTRY_PATHS.find((c) => c.name === location);
  if (exact) return exact.name;
  const loose = MENA_COUNTRY_PATHS.find(
    (c) =>
      location.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(location.toLowerCase())
  );
  return loose?.name ?? null;
}

// Pixel coordinate for a pin — prefer the city, fall back to the country/location.
function resolvePin(location: string, city?: string): { x: number; y: number } | null {
  if (city && MENA_CAPITAL_PX[city]) return MENA_CAPITAL_PX[city];
  if (MENA_CAPITAL_PX[location]) return MENA_CAPITAL_PX[location];
  const alias = NAME_ALIASES[location];
  if (alias && MENA_CAPITAL_PX[alias]) return MENA_CAPITAL_PX[alias];
  for (const key of Object.keys(MENA_CAPITAL_PX)) {
    if (location.toLowerCase().includes(key.toLowerCase())) return MENA_CAPITAL_PX[key];
  }
  return null;
}

export default function BriefingMap({ stories }: Props) {
  // Countries to highlight (accent fill) — every country referenced by a story.
  const highlighted = new Set(
    stories
      .map((s) => resolveCountryName(s.location))
      .filter((n): n is string => n !== null)
  );

  // Resolve a pin position per story, skipping any that don't map.
  const pins = stories
    .map((s) => ({ story: s, px: resolvePin(s.location, s.city) }))
    .filter((p): p is { story: MapStory; px: { x: number; y: number } } => p.px !== null);

  function scrollToStory(number: number) {
    const el = document.getElementById(`story-${number}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="rail-card">
      <div className="rail-card-head">
        <span className="rail-tick" />
        <span className="rail-eyebrow">Stories in this briefing</span>
      </div>

      {/* Map */}
      <div
        style={{
          position: "relative",
          height: 170,
          overflow: "hidden",
          background: "var(--c-bg)",
        }}
      >
        <svg
          viewBox={MENA_MAP_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient id="menaHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0.24" />
            </linearGradient>
            <filter id="menaShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.16" />
            </filter>
          </defs>

          <g style={{ filter: "url(#menaShadow)" }}>
            {MENA_COUNTRY_PATHS.map((c) => {
              const on = highlighted.has(c.name);
              return (
                <path
                  key={c.id}
                  d={c.d}
                  fill={on ? "url(#menaHighlight)" : "var(--c-surface-3)"}
                  stroke={on ? "var(--c-accent-2)" : "var(--c-border-2)"}
                  strokeWidth={on ? 1.4 : 0.8}
                  strokeLinejoin="round"
                />
              );
            })}
          </g>

          {/* Pins */}
          {pins.map(({ story, px }) => (
            <g
              key={story.number}
              transform={`translate(${px.x},${px.y})`}
              onClick={() => scrollToStory(story.number)}
              style={{ cursor: "pointer" }}
            >
              <circle
                r="14"
                fill="var(--c-accent)"
                opacity="0.32"
                style={{
                  animation: "pulseSoft 2.4s ease-in-out infinite",
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              />
              <circle
                r="8"
                fill="var(--c-accent)"
                stroke="var(--c-accent-2)"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="0.5"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "9px",
                  fontWeight: 700,
                  fill: "var(--c-accent-ink)",
                  pointerEvents: "none",
                }}
              >
                {story.number}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          padding: "14px 18px",
          borderTop: "1px solid var(--c-border)",
        }}
      >
        {stories.map((s) => (
          <button
            key={s.number}
            onClick={() => scrollToStory(s.number)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 17,
                height: 17,
                borderRadius: "50%",
                background: "var(--c-accent-glow)",
                color: "var(--c-accent)",
                fontSize: 9.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
              }}
            >
              {s.number}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text-1)" }}>
              {s.location}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
