"use client";

export interface MapStory {
  number: number;
  headline: string;
  location: string;
  city?: string;
}

interface Props {
  stories: MapStory[];
}

// Approximate centre-point coordinates for MENA countries and cities
const GEO_LOOKUP: Record<string, [number, number]> = {
  // Countries
  "Saudi Arabia": [24.0, 45.0],
  "UAE": [24.2, 54.4],
  "United Arab Emirates": [24.2, 54.4],
  "Qatar": [25.35, 51.18],
  "Kuwait": [29.37, 47.97],
  "Bahrain": [26.07, 50.56],
  "Oman": [21.0, 57.0],
  "Jordan": [31.0, 36.5],
  "Egypt": [26.0, 30.0],
  "Iraq": [33.0, 44.0],
  "Iran": [32.0, 53.0],
  "Yemen": [15.5, 48.0],
  "Lebanon": [33.9, 35.5],
  "Syria": [35.0, 38.0],
  "Turkey": [39.0, 35.0],
  "Israel": [31.5, 34.8],
  "Palestine": [31.9, 35.2],
  "Libya": [27.0, 17.0],
  "Tunisia": [34.0, 9.0],
  "Algeria": [28.0, 2.0],
  "Morocco": [32.0, -5.0],
  "Sudan": [16.0, 30.0],
  "GCC": [24.0, 50.0],
  "MENA": [27.0, 40.0],
  "Gulf": [26.0, 51.0],
  // Cities
  "Riyadh": [24.69, 46.72],
  "Jeddah": [21.49, 39.19],
  "Dubai": [25.2, 55.27],
  "Abu Dhabi": [24.47, 54.37],
  "Doha": [25.29, 51.53],
  "Kuwait City": [29.37, 47.98],
  "Muscat": [23.59, 58.59],
  "Manama": [26.22, 50.59],
  "Amman": [31.95, 35.93],
  "Cairo": [30.06, 31.25],
  "Baghdad": [33.34, 44.4],
  "Tehran": [35.69, 51.39],
  "Beirut": [33.89, 35.5],
  "Istanbul": [41.01, 28.95],
};

function resolveCoords(location: string, city?: string): [number, number] | null {
  if (city && GEO_LOOKUP[city]) return GEO_LOOKUP[city];
  if (GEO_LOOKUP[location]) return GEO_LOOKUP[location];
  for (const [key, coords] of Object.entries(GEO_LOOKUP)) {
    if (location.toLowerCase().includes(key.toLowerCase())) return coords;
  }
  return null;
}

const MAP_BOUNDS = { minLng: -10, maxLng: 65, minLat: 10, maxLat: 45 };

function project(lat: number, lng: number, w: number, h: number): [number, number] {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * w;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * h;
  return [x, y];
}

export default function MenaMap({ stories }: Props) {
  const pins = stories
    .map((s) => ({ story: s, coords: resolveCoords(s.location, s.city) }))
    .filter((p): p is { story: MapStory; coords: [number, number] } => p.coords !== null);

  function scrollToStory(number: number) {
    const el = document.getElementById(`story-${number}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const W = 700;
  const H = 320;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[var(--c-border)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[var(--c-border)] bg-[var(--c-surface)]">
        <div className="w-5 h-[1px] bg-[var(--c-amber)]" />
        <span className="eyebrow text-[10px]">Stories in this briefing</span>
      </div>

      {/* Map SVG */}
      <div className="relative" style={{ background: "#04101E" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          className="block"
          style={{ maxHeight: "300px" }}
        >
          {/* Ocean background */}
          <rect width={W} height={H} fill="#04101E" />

          {/* Grid lines — barely visible */}
          {[15, 20, 25, 30, 35, 40].map((lat) => {
            const [, y] = project(lat, 0, W, H);
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />;
          })}
          {[0, 15, 30, 45, 60].map((lng) => {
            const [x] = project(0, lng, W, H);
            return <line key={`lng-${lng}`} x1={x} y1={0} x2={x} y2={H} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />;
          })}

          {/* Country fills + borders */}
          {COUNTRY_SHAPES.map(({ name, d }) => (
            <path key={name} d={d}
              fill="#0C1F38"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
          ))}

          {/* Pins */}
          {pins.map(({ story, coords }) => {
            const [lat, lng] = coords;
            const [x, y] = project(lat, lng, W, H);
            return (
              <g
                key={story.number}
                onClick={() => scrollToStory(story.number)}
                style={{ cursor: "pointer" }}
                className="group"
              >
                {/* Outer glow ring */}
                <circle cx={x} cy={y} r="14" fill="#F59E0B" fillOpacity="0.1" />
                {/* Mid ring */}
                <circle cx={x} cy={y} r="8" fill="#F59E0B" fillOpacity="0.18" />
                {/* Dot */}
                <circle cx={x} cy={y} r="6" fill="#F59E0B" stroke="#04101E" strokeWidth="1.5" />
                {/* Number */}
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: "7px", fontWeight: 700, fill: "#040C1A", fontFamily: "monospace", pointerEvents: "none" }}>
                  {story.number}
                </text>
                {/* Tooltip label — appears above pin on hover */}
                <g transform={`translate(${x}, ${y - 18})`} className="opacity-0 group-hover:opacity-100" style={{ transition: "opacity 0.15s" }}>
                  <rect x={-55} y={-18} width="110" height="16" rx="3" fill="#04101E" stroke="rgba(245,158,11,0.3)" strokeWidth="0.8" />
                  <text x={0} y={-7} textAnchor="middle"
                    style={{ fontSize: "8px", fill: "rgba(255,255,255,0.7)", fontFamily: "monospace", pointerEvents: "none" }}>
                    {story.headline.length > 26 ? story.headline.slice(0, 26) + "…" : story.headline}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Story index row */}
      <div className="px-5 py-3 flex flex-wrap gap-2 bg-[var(--c-surface)] border-t border-[var(--c-border)]">
        {stories.map((s) => (
          <button
            key={s.number}
            onClick={() => scrollToStory(s.number)}
            className="flex items-center gap-2 text-[10px] font-semibold tracking-wide text-[var(--c-text-2)] hover:text-[var(--c-amber)] transition-colors duration-200"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            <span className="w-4 h-4 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[8px] font-bold text-[var(--c-amber)]">
              {s.number}
            </span>
            {s.location}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildPath(points: [number, number][], w: number, h: number): string {
  return points.map((p, i) => {
    const [x, y] = project(p[0], p[1], w, h);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

const W = 700, H = 320;

const COUNTRY_SHAPES: { name: string; d: string }[] = [
  // ── North Africa ─────────────────────────────────────────────────────────────
  {
    name: "Morocco",
    d: buildPath([
      [35.9, -5.4], [35.5, -2.0], [34.8, -1.7], [33.5, -1.2], [29.0, -8.7],
      [27.6, -13.1], [27.9, -13.2], [30.0, -10.5], [33.5, -7.0], [35.8, -5.8],
    ], W, H),
  },
  {
    name: "Algeria",
    d: buildPath([
      [37.0, -1.5], [37.0, 8.0], [33.5, 8.5], [30.0, 8.0], [22.0, 8.5],
      [19.0, 5.5], [19.5, -2.0], [21.5, -5.5], [27.5, -8.5], [29.0, -8.5],
      [33.5, -1.2],
    ], W, H),
  },
  {
    name: "Tunisia",
    d: buildPath([
      [37.3, 8.2], [37.5, 10.5], [37.0, 11.5], [33.5, 11.5], [30.5, 9.5],
      [30.5, 8.0], [33.5, 8.5],
    ], W, H),
  },
  {
    name: "Libya",
    d: buildPath([
      [33.0, 11.5], [33.0, 25.0], [25.0, 25.0], [22.0, 25.0], [20.0, 20.5],
      [20.5, 14.0], [23.0, 11.5], [26.5, 10.0], [30.0, 9.5], [33.5, 11.5],
    ], W, H),
  },
  {
    name: "Egypt",
    d: buildPath([
      [22.0, 25.0], [31.5, 25.0], [31.5, 34.0], [30.0, 34.9],
      [29.9, 32.5], [28.0, 30.0], [25.0, 28.0], [22.0, 28.0],
    ], W, H),
  },
  {
    name: "Sudan",
    d: buildPath([
      [22.0, 25.0], [22.0, 37.0], [19.5, 37.0], [17.0, 38.5], [14.5, 36.5],
      [12.5, 36.0], [12.0, 33.0], [12.5, 30.0], [15.0, 27.5], [19.0, 27.0],
      [22.0, 28.0],
    ], W, H),
  },
  // ── Levant & Near East ────────────────────────────────────────────────────────
  {
    name: "Turkey",
    d: buildPath([
      [42.0, 26.5], [41.5, 36.5], [42.0, 40.5], [40.5, 43.5], [39.5, 44.5],
      [37.0, 44.5], [36.5, 42.0], [36.8, 36.5], [36.0, 36.0],
      [36.2, 29.5], [38.5, 26.5],
    ], W, H),
  },
  {
    name: "Syria",
    d: buildPath([
      [37.0, 36.5], [37.0, 42.0], [33.5, 42.0], [32.5, 38.5],
      [33.5, 36.5], [35.5, 36.0],
    ], W, H),
  },
  {
    name: "Lebanon",
    d: buildPath([
      [34.5, 35.1], [34.7, 36.6], [33.1, 35.6], [33.0, 35.1],
    ], W, H),
  },
  {
    name: "Jordan",
    d: buildPath([
      [32.5, 35.0], [33.5, 36.5], [33.5, 38.9], [29.5, 39.0],
      [29.2, 35.0], [29.9, 34.9], [31.0, 35.0],
    ], W, H),
  },
  // ── Arabian Peninsula ─────────────────────────────────────────────────────────
  {
    name: "Saudi Arabia",
    d: buildPath([
      [29.5, 35.0], [29.5, 39.2], [27.5, 41.5], [25.0, 44.5], [22.5, 46.0],
      [21.0, 47.5], [19.0, 51.0], [18.0, 50.5], [17.5, 47.0], [18.5, 45.5],
      [19.5, 42.0], [22.0, 38.5], [24.5, 37.0], [26.0, 37.5], [27.5, 36.5],
      [29.0, 36.5],
    ], W, H),
  },
  {
    name: "Kuwait",
    d: buildPath([
      [28.5, 46.5], [29.1, 46.7], [29.4, 47.4], [29.5, 48.4], [28.5, 48.5],
      [28.0, 47.5],
    ], W, H),
  },
  {
    name: "Qatar",
    d: buildPath([
      [24.5, 50.8], [25.0, 51.0], [26.2, 51.2], [26.1, 50.8], [25.5, 50.7],
    ], W, H),
  },
  {
    name: "Bahrain",
    d: buildPath([
      [25.9, 50.3], [26.3, 50.4], [26.3, 50.7], [25.9, 50.7],
    ], W, H),
  },
  {
    name: "UAE",
    d: buildPath([
      [24.1, 51.6], [24.5, 52.6], [25.1, 54.0], [25.6, 55.9], [25.8, 56.4],
      [24.2, 56.3], [23.6, 58.1], [22.9, 55.5], [23.0, 54.0], [24.0, 53.0],
    ], W, H),
  },
  {
    name: "Oman",
    d: buildPath([
      [22.0, 55.6], [23.0, 56.8], [22.6, 59.5], [21.0, 59.8],
      [19.5, 57.5], [18.0, 53.5], [19.0, 52.5], [21.5, 55.0],
    ], W, H),
  },
  {
    name: "Yemen",
    d: buildPath([
      [18.5, 42.5], [17.5, 44.0], [16.0, 47.5], [14.5, 50.5],
      [12.5, 44.0], [13.5, 45.5], [14.5, 49.5], [16.0, 52.5], [18.0, 54.0],
      [19.5, 52.0], [22.5, 55.0],
    ], W, H),
  },
  // ── Iraq & Iran ───────────────────────────────────────────────────────────────
  {
    name: "Iraq",
    d: buildPath([
      [37.0, 38.8], [37.0, 42.0], [34.5, 44.5], [33.5, 46.5],
      [30.0, 47.5], [29.5, 48.5], [29.5, 46.5], [30.5, 46.0],
      [31.0, 44.5], [31.0, 41.5], [29.5, 39.0],
    ], W, H),
  },
  {
    name: "Iran",
    d: buildPath([
      [39.5, 44.5], [38.0, 47.0], [37.5, 50.0], [37.5, 54.0],
      [36.5, 57.5], [35.0, 61.0], [31.0, 61.5], [26.5, 61.5],
      [25.0, 59.0], [23.5, 57.5], [25.0, 56.5], [26.5, 54.5],
      [27.5, 51.5], [29.0, 50.5], [29.5, 48.5], [30.0, 47.5],
      [33.5, 46.5], [34.5, 44.5], [37.0, 44.5],
    ], W, H),
  },
];
