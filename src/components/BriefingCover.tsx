interface BriefingCoverProps {
  issueNumber: number;
}

export default function BriefingCover({ issueNumber }: BriefingCoverProps) {
  const numStr = String(issueNumber).padStart(2, "0");
  const uid = `bc${issueNumber}`;

  return (
    <svg
      viewBox="0 0 600 400"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`${uid}-orb`} cx="78%" cy="18%" r="55%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#091422" />
          <stop offset="100%" stopColor="#040C1A" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="600" height="400" fill={`url(#${uid}-bg)`} />
      <rect width="600" height="400" fill={`url(#${uid}-orb)`} />

      {/* Top-left amber accent bar */}
      <rect x="30" y="0" width="50" height="2.5" fill="#F59E0B" />

      {/* ISSUE eyebrow */}
      <text
        x="30"
        y="240"
        style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontWeight: 700,
          fontSize: "13px",
          fill: "#F59E0B",
          letterSpacing: "4px",
          textTransform: "uppercase",
        }}
      >
        ISSUE
      </text>

      {/* Large issue number — # in amber, digits in cream */}
      <text
        x="22"
        y="385"
        style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontWeight: 800,
          fontSize: "190px",
          letterSpacing: "-6px",
        }}
        dominantBaseline="auto"
      >
        <tspan style={{ fill: "#F59E0B" }}>#</tspan>
        <tspan style={{ fill: "#F0ECE5" }}>{numStr}</tspan>
      </text>
    </svg>
  );
}
