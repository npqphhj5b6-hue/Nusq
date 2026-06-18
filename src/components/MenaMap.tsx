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

const GEO_LOOKUP: Record<string, [number, number]> = {
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
  "Yemen": [15.5, 48.0],
  "Lebanon": [33.9, 35.5],
  "Syria": [35.0, 38.0],
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
  "Beirut": [33.89, 35.5],
  "Casablanca": [33.59, -7.62],
  "Rabat": [34.01, -6.83],
  "Tunis": [36.82, 10.17],
  "Algiers": [36.74, 3.06],
  "Tripoli": [32.90, 13.18],
  "Khartoum": [15.55, 32.53],
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
const W = 700, H = 320;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * W;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * H;
  return [x, y];
}

// Spread offsets for clustered pins — radiates outward from the base coordinate.
// Index 0 = first story, index 1 = second, etc.
const CLUSTER_OFFSETS: [number, number][] = [
  [-13, -8],
  [13,   8],
  [-13,  8],
  [ 13, -8],
];

const PIN_R = 14; // Large, Semafor-scale

export default function MenaMap({ stories }: Props) {
  const resolved = stories
    .map((s) => ({ story: s, coords: resolveCoords(s.location, s.city) }))
    .filter((p): p is { story: MapStory; coords: [number, number] } => p.coords !== null);

  // Group stories that share the same projected pixel position into one cluster
  const pinGroups = new Map<string, { stories: MapStory[]; coords: [number, number] }>();
  for (const { story, coords } of resolved) {
    const key = `${coords[0].toFixed(1)},${coords[1].toFixed(1)}`;
    if (pinGroups.has(key)) {
      pinGroups.get(key)!.stories.push(story);
    } else {
      pinGroups.set(key, { stories: [story], coords });
    }
  }

  function scrollToStory(number: number) {
    const el = document.getElementById(`story-${number}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[var(--c-border)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[var(--c-border)] bg-[var(--c-surface)]">
        <div className="w-5 h-[1px] bg-[var(--c-amber)]" />
        <span className="eyebrow text-[10px]">Stories in this briefing</span>
      </div>

      {/* Map */}
      <div style={{ background: "#04101E" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block" style={{ maxHeight: "320px" }}>
          <rect width={W} height={H} fill="#04101E" />

          {/* Outline-only countries — no fill, minimal border lines */}
          {COUNTRY_SHAPES.map(({ name, d }) => (
            <path key={name} d={d} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.8" strokeLinejoin="round" />
          ))}

          {/* Clusters — draw connector lines first, then pins on top */}
          {Array.from(pinGroups.values()).map(({ stories: group, coords }) => {
            const [lat, lng] = coords;
            const [cx, cy] = project(lat, lng);
            const isCluster = group.length > 1;

            // Compute each pin's offset position
            const pinPositions = group.map((s, i) => {
              const [dx, dy] = isCluster ? (CLUSTER_OFFSETS[i] ?? [0, 0]) : [0, 0];
              return { story: s, px: cx + dx, py: cy + dy };
            });

            return (
              <g key={group.map((s) => s.number).join("-")}>
                {/* Connector dots between clustered pins */}
                {isCluster && pinPositions.map(({ px, py }, i) => (
                  i > 0 && (
                    <line
                      key={i}
                      x1={pinPositions[0].px} y1={pinPositions[0].py}
                      x2={px} y2={py}
                      stroke="rgba(245,158,11,0.35)" strokeWidth="1" strokeDasharray="2,2"
                    />
                  )
                ))}

                {/* Individual pins */}
                {pinPositions.map(({ story, px, py }) => (
                  <g
                    key={story.number}
                    onClick={() => scrollToStory(story.number)}
                    style={{ cursor: "pointer" }}
                    className="group/pin"
                  >
                    {/* Outer glow */}
                    <circle cx={px} cy={py} r={PIN_R + 5} fill="#F59E0B" fillOpacity="0.10" />
                    {/* Solid amber pin */}
                    <circle cx={px} cy={py} r={PIN_R} fill="#F59E0B" stroke="#04101E" strokeWidth="2" />
                    <text
                      x={px} y={py + 0.5}
                      textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: "10px", fontWeight: 800, fill: "#040C1A", fontFamily: "monospace", pointerEvents: "none" }}
                    >
                      {story.number}
                    </text>

                    {/* Hover tooltip */}
                    <g
                      transform={`translate(${px}, ${py - PIN_R - 8})`}
                      className="opacity-0 group-hover/pin:opacity-100"
                      style={{ transition: "opacity 0.15s" }}
                    >
                      <rect x={-66} y={-18} width="132" height="14" rx="3" fill="#040C1A" stroke="rgba(245,158,11,0.3)" strokeWidth="0.8" />
                      <text x={0} y={-8} textAnchor="middle"
                        style={{ fontSize: "7.5px", fill: "rgba(255,255,255,0.8)", fontFamily: "monospace", pointerEvents: "none" }}>
                        {story.headline.length > 30 ? story.headline.slice(0, 30) + "…" : story.headline}
                      </text>
                    </g>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Story index row */}
      <div className="px-5 py-3 flex flex-wrap gap-3 bg-[var(--c-surface)] border-t border-[var(--c-border)]">
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

// Country shapes pre-projected from Natural Earth 110m GeoJSON into our
// equirectangular viewport (bounds: lng -10→65, lat 10→45, W=700, H=320).
const COUNTRY_SHAPES: { name: string; d: string }[] = [
  { name: "Lebanon", d: "M421.0,108.9 L424.1,103.2 L424.4,101.5 L425.3,101.4 L426.0,100.6 L426.2,97.7 L427.5,96.3 L429.2,95.6 L429.1,94.6 L431.8,94.8 L432.2,94.3 L433.4,94.8 L432.3,95.9 L434.2,96.7 L435.0,98.8 L432.0,101.1 L432.8,102.1 L429.8,102.2 L428.6,103.9 L429.7,104.5 L425.6,107.5 L425.1,107.1 L424.5,108.9 L421.0,108.9 Z" },
  { name: "Syria", d: "M427.1,112.1 L428.3,110.2 L427.1,106.7 L429.7,104.5 L428.9,103.2 L432.7,102.2 L432.0,101.1 L435.0,98.8 L432.3,95.9 L433.4,94.8 L429.1,94.6 L428.6,87.6 L426.8,86.1 L427.5,83.7 L430.8,83.9 L432.8,80.2 L435.5,80.2 L434.3,77.9 L435.3,74.7 L439.2,76.6 L442.8,76.5 L450.1,74.0 L459.6,76.2 L473.3,72.2 L488.6,71.0 L488.9,72.6 L483.9,76.6 L479.6,77.6 L478.6,79.0 L479.4,85.4 L477.9,93.3 L475.7,96.9 L437.0,116.0 L433.0,115.4 L427.1,112.1 Z" },
  { name: "Morocco", d: "M11.0,158.5 L11.3,163.5 L1.7,165.9 L-7.1,164.4 L-13.0,165.6 L-16.0,172.8 L-19.2,173.8 L-22.7,184.4 L-36.3,194.8 L-39.4,207.5 L-44.3,214.9 L-65.5,215.6 L-53.9,192.8 L-55.4,194.1 L-45.7,185.5 L-41.7,171.9 L-33.2,166.9 L-27.6,156.1 L-13.9,152.5 L-2.3,143.5 L3.2,136.0 L3.6,133.4 L1.0,131.2 L1.4,124.3 L6.7,117.1 L6.9,113.6 L13.7,107.3 L29.7,100.2 L38.0,84.3 L42.9,83.0 L46.0,87.6 L52.5,90.0 L62.4,89.6 L65.6,87.3 L66.7,90.2 L72.1,90.4 L76.8,93.8 L77.7,107.5 L83.7,114.3 L82.0,118.0 L66.4,118.2 L66.9,120.7 L59.2,122.1 L57.5,126.4 L60.2,128.4 L59.3,130.6 L52.5,132.5 L41.6,141.5 L21.9,142.8 L12.4,148.9 L11.0,158.5 Z" },
  { name: "Oman", d: "M619.6,183.1 L626.7,192.4 L641.8,196.2 L648.8,205.2 L651.7,205.6 L651.6,208.1 L639.5,224.8 L636.6,224.9 L636.6,223.0 L633.3,226.2 L632.9,237.8 L623.5,240.0 L619.3,247.4 L610.8,248.3 L606.9,255.9 L598.1,255.9 L588.8,259.3 L578.5,237.8 L606.5,228.6 L612.6,210.5 L608.4,203.9 L610.9,192.3 L616.0,191.3 L613.7,189.9 L614.4,183.6 L616.9,185.3 L619.6,183.1 Z M616.7,173.2 L620.7,170.4 L618.6,177.1 L616.7,173.2 Z" },
  { name: "UAE", d: "M618.6,177.1 L619.6,183.1 L616.9,185.3 L615.8,183.1 L614.1,183.9 L613.7,189.9 L615.4,190.0 L616.0,191.3 L610.9,192.3 L611.7,194.1 L607.8,204.6 L583.9,201.7 L574.7,191.1 L574.9,188.5 L578.0,192.3 L581.9,191.9 L584.3,190.1 L596.2,191.4 L601.3,189.3 L602.7,187.9 L601.2,187.1 L603.3,185.2 L609.7,181.0 L611.8,177.6 L615.6,175.8 L616.7,173.2 L617.7,173.6 L617.4,176.7 L618.6,177.1 Z" },
  { name: "Libya", d: "M200.7,108.1 L235.0,115.2 L240.4,124.5 L259.9,128.7 L271.2,134.7 L280.9,128.6 L280.7,117.2 L295.2,110.3 L309.0,113.0 L310.9,117.4 L326.8,119.3 L323.8,135.8 L326.5,144.6 L326.5,228.6 L317.2,228.6 L317.2,233.2 L242.5,197.1 L226.0,204.7 L219.2,199.5 L205.0,196.4 L200.7,189.1 L189.1,186.7 L180.9,172.2 L185.3,168.9 L186.1,156.6 L185.0,145.1 L180.0,136.1 L188.5,130.5 L189.1,121.8 L201.1,114.9 L200.7,108.1 Z" },
  { name: "Tunisia", d: "M200.7,108.1 L201.1,114.9 L189.1,121.8 L187.7,124.1 L189.0,129.4 L185.5,133.9 L182.2,135.1 L177.8,118.2 L171.1,114.0 L168.8,108.9 L165.4,107.6 L163.2,101.9 L163.5,99.7 L170.2,94.7 L172.0,89.2 L170.3,83.9 L171.3,78.4 L173.6,73.7 L184.3,70.0 L196.5,72.4 L197.5,89.4 L192.2,95.6 L186.7,99.0 L189.7,103.3 L200.7,108.1 Z" },
  { name: "Sudan", d: "M306.7,311.6 L302.8,296.1 L296.9,294.5 L303.8,282.2 L307.1,269.3 L317.2,267.7 L317.2,228.6 L326.5,228.6 L326.5,210.3 L437.6,210.3 L442.7,239.0 L453.6,246.7 L438.4,255.4 L430.5,295.1 L411.3,325.0 L402.6,313.2 L403.3,299.8 L392.8,301.7 L396.0,310.1 L384.2,322.2 L373.5,317.5 L362.5,326.2 L341.8,324.7 L334.4,316.2 L318.4,332.1 L312.6,331.6 L306.7,311.6 Z" },
  { name: "Iraq", d: "M511.2,71.8 L516.3,82.3 L525.7,84.1 L524.1,90.4 L519.6,93.2 L516.9,100.8 L524.1,107.3 L535.8,115.2 L539.8,120.6 L538.3,128.0 L541.5,132.9 L546.6,137.6 L533.8,136.8 L527.6,145.4 L510.5,144.4 L486.0,127.3 L470.6,119.6 L458.7,117.8 L455.2,106.3 L475.7,96.9 L479.4,85.4 L478.6,79.0 L492.0,69.9 L504.8,70.3 L511.2,71.8 Z" },
  { name: "Qatar", d: "M567.5,185.2 L567.0,178.3 L569.2,173.9 L571.7,172.3 L574.7,174.8 L575.0,182.7 L572.5,186.8 L567.5,185.2 Z" },
  { name: "Saudi Arabia", d: "M567.5,185.2 L574.0,186.7 L571.9,189.2 L574.6,189.7 L583.9,201.7 L608.4,203.9 L612.6,210.5 L606.5,228.6 L578.5,237.8 L551.0,241.6 L542.8,245.5 L533.5,256.5 L503.2,253.2 L498.5,251.2 L496.3,259.1 L492.7,261.8 L480.6,244.8 L473.6,230.6 L464.4,225.4 L459.0,218.4 L452.2,194.0 L440.1,184.2 L422.0,154.9 L416.0,154.4 L419.5,143.1 L430.0,144.5 L447.8,132.6 L438.3,123.5 L458.8,117.7 L470.1,119.4 L486.0,127.3 L510.5,144.4 L545.9,150.9 L567.5,185.2 Z" },
  { name: "Kuwait", d: "M540.8,137.2 L543.0,141.3 L542.8,146.1 L545.4,150.5 L538.2,150.6 L536.1,146.3 L527.6,145.4 L533.4,137.1 L540.8,137.2 Z" },
  { name: "Algeria", d: "M48.3,182.9 L12.3,162.0 L12.3,149.1 L41.6,141.5 L52.5,132.5 L59.3,130.6 L82.0,118.0 L76.8,93.8 L105.9,77.3 L153.2,72.3 L173.6,73.7 L177.8,118.2 L182.2,135.1 L180.0,136.1 L185.0,145.1 L180.9,172.2 L205.0,196.4 L147.4,233.6 L123.2,230.2 L48.3,182.9 Z" },
  { name: "Jordan", d: "M425.7,112.6 L436.9,116.0 L455.2,106.3 L460.1,116.6 L438.3,123.5 L447.8,132.6 L443.1,137.2 L429.5,144.5 L419.5,143.1 L424.1,127.1 L425.7,112.6 Z" },
  { name: "Egypt", d: "M414.1,128.8 L418.9,141.8 L413.1,157.9 L395.2,140.9 L427.4,192.9 L426.5,201.8 L437.6,210.3 L326.5,210.3 L326.5,144.6 L323.8,135.5 L327.5,122.4 L414.1,128.8 Z" },
  { name: "Yemen", d: "M578.5,237.8 L588.8,259.3 L580.8,268.7 L499.0,295.5 L491.0,272.1 L492.7,261.8 L496.3,259.1 L497.5,251.8 L529.3,253.5 L533.5,256.5 L542.8,245.5 L551.0,241.6 L578.5,237.8 Z" },
  { name: "Bahrain", d: "M565.1,171.9 L565.6,172.2 L566.0,172.4 L565.6,175.0 L565.3,175.6 L564.4,174.1 L564.2,172.2 L565.5,171.5 L565.1,171.9 Z" },
];
