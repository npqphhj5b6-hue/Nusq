interface BriefingCoverProps {
  issueNumber: number;
  coverImageUrl?: string | null;
}

export default function BriefingCover({ issueNumber, coverImageUrl }: BriefingCoverProps) {
  const numStr = String(issueNumber).padStart(2, "0");
  const uid = `bc${issueNumber}`;
  const imgSrc = coverImageUrl
    ? coverImageUrl.includes("images.unsplash.com")
      ? `${coverImageUrl}&w=900&h=600&fit=crop&crop=entropy&auto=format&q=80`
      : coverImageUrl
    : null;

  return (
    <div className="relative w-full h-full" style={{ background: "#040C1A" }}>
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}

      <svg
        viewBox="0 0 600 400"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${uid}-orb`} cx="78%" cy="18%" r="55%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity={coverImageUrl ? "0.06" : "0.13"} />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D1A2A" />
            <stop offset="100%" stopColor="#040C1A" />
          </linearGradient>
          <linearGradient id={`${uid}-fade`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#040C1A" stopOpacity={coverImageUrl ? "0.92" : "0.82"} />
            <stop offset="38%" stopColor="#040C1A" stopOpacity={coverImageUrl ? "0.38" : "0.08"} />
            <stop offset="100%" stopColor="#040C1A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {!coverImageUrl && <rect width="600" height="400" fill={`url(#${uid}-bg)`} />}
        <rect width="600" height="400" fill={`url(#${uid}-fade)`} />
        <rect width="600" height="400" fill={`url(#${uid}-orb)`} />

        <rect x="30" y="0" width="50" height="2.5" fill="#F59E0B" />

        <text
          x="30"
          y="240"
          style={{
            fontFamily: "var(--font-barlow), sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            fill: "#F59E0B",
            letterSpacing: "4px",
          }}
        >
          ISSUE
        </text>

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
    </div>
  );
}
