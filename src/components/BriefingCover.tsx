interface BriefingCoverProps {
  issueNumber: number;
  coverImageUrl?: string | null;
}

export default function BriefingCover({ issueNumber, coverImageUrl }: BriefingCoverProps) {
  const numStr = String(issueNumber).padStart(2, "0");
  const imgSrc = coverImageUrl
    ? coverImageUrl.includes("images.unsplash.com")
      ? `${coverImageUrl}&w=900&h=600&fit=crop&crop=entropy&auto=format&q=80`
      : coverImageUrl
    : null;

  if (imgSrc) {
    return (
      <div className="relative w-full h-full">
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 80%)",
          }}
        />
        <div className="absolute bottom-0 left-0 p-4">
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "var(--font-mono)",
            }}
          >
            #{numStr}
          </span>
        </div>
      </div>
    );
  }

  /* ── Branded no-image variant — based on Claude Design candidate C ── */
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: "#0D1829" }}
    >
      {/* Top: label + rule */}
      <div style={{ padding: "8% 8% 0", flexShrink: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: "clamp(0.45rem, 1.1vw, 0.65rem)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase" as const,
            color: "#4B8ABF",
            fontFamily: "var(--font-mono)",
            marginBottom: "5%",
          }}
        >
          Nusq Intelligence
        </span>
        <div style={{ height: "1px", background: "rgba(55, 90, 140, 0.45)" }} />
      </div>

      {/* Center: large condensed-bold issue number */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "clamp(3.5rem, 9vw, 7rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#EDE3D5",
            fontFamily: "var(--font-geist-sans)",
          }}
        >
          {numStr}
        </span>
      </div>

      {/* Bottom: rule */}
      <div style={{ padding: "0 8% 8%", flexShrink: 0 }}>
        <div style={{ height: "1px", background: "rgba(55, 90, 140, 0.45)" }} />
      </div>
    </div>
  );
}
