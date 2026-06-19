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
  "Iran": [32.0, 53.0],
  "Tehran": [35.7, 51.4],
  "Turkey": [39.0, 35.0],
  "Istanbul": [41.0, 28.96],
  "Ankara": [39.93, 32.86],
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
        <svg viewBox="-67 55 723 292" width="100%" className="block">
          <rect width={W} height={H} fill="#04101E" />

          {/* Filled countries — muted slate land on dark ocean */}
          {COUNTRY_SHAPES.map(({ name, d }) => (
            <path key={name} d={d} fill="#0d2137" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" strokeLinejoin="round" />
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

// Country shapes generated from Natural Earth 110m GeoJSON via d3-geo equirectangular
// projection (bounds: lng -10→65, lat 10→45, W=700, H=320).
const COUNTRY_SHAPES: { name: string; d: string }[] = [
  { name: "Sudan", d: "M323.2,336.2L316.2,332.2L313.1,329.6L312.5,326.7L313.9,322.9L313.9,319.2L308.6,313.5L307.6,309.6L307.7,307.3L304.4,304.6L304.3,299.3L302.4,295.8L299.1,296.3L300.1,293L302.4,289.2L301.4,285.4L304.4,282.6L302.5,280.4L304.9,274.8L309.1,268.1L317,268.7L316.5,232.4L316.6,228.6L327.1,228.5L327.1,210.3L363.9,210.3L399.4,210.3L435.6,210.3L438.6,219.3L436.6,220.9L437.9,230.3L441.3,241.2L444.8,243.5L449.8,246.9L445.1,252.1L438.4,253.6L435.5,256.4L434.6,262.5L430.7,275.9L431.7,279.6L430.2,287.4L426.5,296.4L421,301L417,307.9L416.1,311.7L411.8,314.2L409.1,323.8L409.2,332L409.1,324.9L407.8,324.7L408,320.2L406.9,317L402.2,313.4L401.1,306.8L402.2,300.1L397.9,299.4L397.3,301.5L391.8,302L394,304.6L394.8,310.1L389.8,315.1L385.2,321.7L380.5,322.7L372.8,317.3L369.4,319.2L368.4,321.9L363.7,323.6L363.4,325.5L354.3,325.5L353.1,323.6L346.5,323.3L343.2,324.9L340.6,324.1L335.9,318.8L334.4,316.2L327.8,317.5L325.3,321.7L322.9,329.9L319.8,331.6L317,332.6Z" },
  { name: "Lebanon", d: "M426.1,107.2L423.6,107.3L422.8,108.9L419.7,108.9L423,101.4L427.5,95L427.7,94.7L431.8,95.1L433.3,98.7L428.3,102.2Z" },
  { name: "Israel", d: "M422.2,123.5L422.4,127.1L417.9,141.7L417,139.3L411.9,126L414.5,123L413.9,122.5L416.3,118.2L418.2,111.3L419.5,109L419.7,108.9L422.8,108.9L423.6,107.3L426.1,107.2L426.2,110.9L425,112.3L425.2,112.4L423.6,115.3L423.6,120.9Z" },
  { name: "Tunisia", d: "M185.3,134.3L181.4,117.9L175.7,114.2L175.6,112L168.2,106.6L167.4,99.7L173,94.6L175.1,87L173.7,78.3L175.6,73.6L185.5,69.9L191.9,71L191.6,75.7L199.4,72.3L200.1,74.1L195.5,78.5L195.4,82.8L198.6,85L197.4,93L191.4,97.5L193.1,102.5L197.8,102.7L200.1,107L203.6,108.5L203.1,115.5L198.6,118.1L195.8,121L189.5,124.6L190.5,128.3L189.7,132.2Z" },
  { name: "Algeria", d: "M19.2,160.9L19.4,159.2L19.3,158.6L19.3,147.7L34,141L43.2,139.6L50.6,137.1L54.2,132.6L64.8,128.9L65.2,122.2L70.5,121.4L74.7,118L86.6,116.5L88.3,112.9L85.9,111L82.7,101.3L82.2,95.8L78.7,89.9L87.5,84.9L97.4,83.3L103.2,79.5L112,76.7L127.5,75.1L142.6,74.4L147.2,75.7L155.8,72.1L165.6,72.1L169.3,74.2L175.6,73.6L173.7,78.3L175.1,87L173,94.6L167.4,99.7L168.2,106.6L175.6,112L175.7,114.2L181.4,117.9L185.3,134.3L188.2,142.4L188.7,146.6L187.1,154.1L187.8,158.3L186.6,163.3L187.4,169L183.8,172.8L189.2,179.5L189.5,183.4L192.8,188.5L197.1,186.9L204.3,191.1L208.3,196.8L177,214.3L150.5,232.2L137.6,236.3L127.5,237.2L127.4,231.4L123.1,229.9L117.4,227.3L115.2,223L84.4,203L53.6,183.1Z" },
  { name: "Jordan", d: "M423.6,115.3L425.2,112.4L435.3,116L453.2,106.2L456.9,117.4L455.2,118.8L436.9,123.3L446,132.5L443,134.1L441.5,137.1L434.5,138.4L432.3,141.7L428.4,144.5L418.2,143L417.9,141.7L422.4,127.1L422.2,123.5L423.6,120.9Z" },
  { name: "UAE", d: "M570.2,189.8L571.8,189.3L572.1,191.8L579.3,190.4L586.8,190.6L592.4,190.9L598.6,184.7L605.4,178.8L611.2,173.2L612.9,176.3L614.2,183.5L609.5,183.6L608.8,189.5L610.4,190.8L606.3,192.6L606.2,196.3L603.6,200.1L603.3,203.8L601.5,205.7L574,201.1L570.5,191.9Z" },
  { name: "Qatar", d: "M563.1,185.1L562.5,178.5L565,173.7L567.5,172.7L570.3,175.5L570.4,180.9L568.4,186.3L565.9,186.9Z" },
  { name: "Kuwait", d: "M537.2,137.4L539.1,141.4L538.3,143.5L541.2,150.4L534.8,150.6L532.5,146.3L524.3,145.4L531.1,136.6Z" },
  { name: "Iraq", d: "M456.9,117.4L453.2,106.2L473.5,96.7L476.9,85.7L476.1,79L481.1,76.7L485.8,71L489.7,69.6L500.3,70.8L503.5,73.1L507.9,71.6L513.8,82.5L519.8,85.2L520.5,90.6L515.9,93.7L513.8,100.9L520.2,109.6L531.3,114.6L536.1,121.5L534.5,128.1L537.5,128.1L537.6,133L542.6,137.8L537.2,137.4L531.1,136.6L524.3,145.4L507.4,144.7L481.5,126.3L468,119.9Z" },
  { name: "Oman", d: "M603.3,203.8L603.6,200.1L606.2,196.3L606.3,192.6L610.4,190.8L608.8,189.5L609.5,183.6L614.2,183.5L618.3,189.8L623.4,193.1L630.1,194.3L635.5,196L639.6,201.2L642.1,204.2L645.4,205.4L645.4,207.5L642,212.9L640.6,215.5L636.7,218.4L633.3,224.6L629.2,224.2L627.3,226.3L625.8,231L626.9,237.1L626.1,238.2L621.9,238.2L616.1,241.6L615.2,246.1L613.2,248L607.5,247.9L603.9,250.2L603.9,253.9L599.5,256.5L594.5,255.6L588.4,258.7L584.1,259.2L581.1,252.8L574,237.7L601.4,228.6L607.5,210.3ZM612.9,176.3L611.2,173.2L613.9,170.1L615,170.9L614.2,174.7Z" },
  { name: "Syria", d: "M425.2,112.4L425,112.3L426.2,110.9L426.1,107.2L428.3,102.2L433.3,98.7L431.8,95.1L427.7,94.7L426.8,87.7L429.1,83.9L431.5,81.9L434,79.9L434.5,74.8L437.5,76.6L447.5,74L452.4,75.8L459.9,75.7L470.5,72.3L475.4,72.5L485.8,71L481.1,76.7L476.1,79L476.9,85.7L473.5,96.7L453.2,106.2L435.3,116Z" },
  { name: "Yemen", d: "M574,237.7L581.1,252.8L584.1,259.2L577.5,261.6L575.8,265.7L575.6,268.8L566.4,272.7L551.8,276.9L543.6,283.4L539.6,283.9L536.9,283.4L531.5,287.2L525.7,288.9L518,289.4L515.7,289.9L513.7,292.3L511.3,293L509.9,295.3L505.4,295.1L502.5,296.4L496.1,295.9L493.8,290.5L494,285.6L492.5,282.9L490.7,276.1L488.1,272.3L489.9,271.9L489,267.7L490.1,265.9L489.7,262L493.7,259L492.8,255.2L495.2,250.7L499,253.1L501.4,252.2L512,252L513.6,252.9L522.5,253.9L526,253.4L528.3,256.5L532.6,254.9L539.1,245.3L547.6,241.2Z" },
  { name: "Saudi Arabia", d: "M418.2,143L428.4,144.5L432.3,141.7L434.5,138.4L441.5,137.1L443,134.1L446,132.5L436.9,123.3L455.2,118.8L456.9,117.4L468,119.9L481.5,126.3L507.4,144.7L524.3,145.4L532.5,146.3L534.8,150.6L541.2,150.4L544.8,158.3L549.3,160.4L550.9,163.6L557.1,167.4L557.6,171.2L556.8,174.2L557.9,177.3L560.5,179.9L561.8,182.9L563.1,185.1L565.9,186.9L568.4,186.3L570.2,189.8L570.5,191.9L574,201.1L601.5,205.7L603.3,203.8L607.5,210.3L601.4,228.6L574,237.7L547.6,241.2L539.1,245.3L532.6,254.9L528.3,256.5L526,253.4L522.5,253.9L513.6,252.9L512,252L501.4,252.2L499,253.1L495.2,250.7L492.8,255.2L493.7,259L489.7,262L488.5,258.1L485.8,255.3L485,251.7L480.3,248.4L475.5,240.7L472.9,233.3L466.5,227L462.5,225.5L456.4,216.8L455.3,210.4L455.7,205L450.5,194.9L446.2,191.3L441.3,189.4L438.3,184.1L438.8,182.1L436.2,177.4L433.6,175.3L430,168.5L424.4,161.1L419.8,154.9L415.2,154.9L416.6,149.9L417,146.7Z" },
  { name: "Morocco", d: "M78.7,89.9L82.2,95.8L82.7,101.3L85.9,111L88.3,112.9L86.6,116.5L74.7,118L70.5,121.4L65.2,122.2L64.8,128.9L54.2,132.6L50.6,137.1L43.2,139.6L34,141L19.3,147.7L19.3,158.6L17.9,158.6L18.2,163.5L12.5,163.8L9.6,165.8L5.4,165.8L2.1,164.7L-5.6,165.6L-8.6,172.8L-11.4,173.4L-15.7,185L-28.4,194.8L-31.5,207.5L-35.2,211.6L-36.3,214.8L-56.9,215.6L-57,215.6L-56.6,211.3L-53.1,208.8L-50.1,204.1L-50.7,201L-47.6,194.5L-42.5,188.7L-39.4,187.2L-37,181.9L-36.8,177L-33.5,171.4L-27.4,168.1L-21.5,158.7L-21.4,158.6L-16.8,155.1L-8.3,154.1L-1.1,147.8L3.5,145.4L11.1,137.8L8.8,126.4L12.3,118.5L13.5,113.7L19.4,107.5L28.6,103.3L35.4,99.6L41.5,90.1L44.3,84.5L51.1,84.5L56.6,88.4L65.3,87.8L74.8,89.8Z" },
  { name: "Egypt", d: "M435.6,210.3L399.4,210.3L363.9,210.3L327.1,210.3L327.1,176.6L327.1,144.1L324.4,136.7L326.8,131.1L325.3,127.2L328.7,122.8L340.8,122.6L349.6,125.1L358.7,127.8L362.9,129.2L370,126.3L373.7,123.7L381.8,122.9L388.3,124.1L390.8,128.6L392.9,125.6L400.2,127.8L407.4,128.3L411.9,126L417,139.3L417.9,141.7L415.3,145.4L413.3,152.3L410.8,157L408.7,158.6L405.6,155.7L401.5,151.6L395,138.5L394.1,139.3L397.8,149L403.5,158.2L410.4,172.4L413.7,177.4L416.7,182.6L424.9,192.7L423.1,194.3L423.4,200.2L434,208.4Z" },
  { name: "Libya", d: "M327.1,210.3L327.1,228.5L316.6,228.6L316.5,232.4L280,214.9L243.6,197.4L234.4,202.4L227.9,205.8L222.7,200.8L208.3,196.8L204.3,191.1L197.1,186.9L192.8,188.5L189.5,183.4L189.2,179.5L183.8,172.8L187.4,169L186.6,163.3L187.8,158.3L187.1,154.1L188.7,146.6L188.2,142.4L185.3,134.3L189.7,132.2L190.5,128.3L189.5,124.6L195.8,121L198.6,118.1L203.1,115.5L203.6,108.5L214.3,111.6L218.2,110.8L225.8,112.3L237.9,116.4L242.2,124.6L250.5,126.3L263.3,130.2L273.1,134.7L277.5,132.3L281.9,128.1L279.8,121.1L282.6,116.7L289.2,112.4L295.5,111.2L307.9,113L311,117.1L314.4,117.1L317.3,118.7L326.4,119.8L328.7,122.8L325.3,127.2L326.8,131.1L324.4,136.7L327.1,144.1L327.1,176.6Z" },
];
