interface BriefingCoverProps {
  issueNumber: number;
  coverImageUrl?: string | null;
  caption?: string;
}

export default function BriefingCover({ issueNumber, coverImageUrl, caption }: BriefingCoverProps) {
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
              color: "rgba(255,255,255,0.7)",
              fontFamily: "var(--font-mono)",
            }}
          >
            #{numStr}
          </span>
        </div>
      </div>
    );
  }

  /* ── Placeholder variant: diagonal accent-tinted gradient + mono caption ── */
  return (
    <div
      className="w-full h-full flex items-center justify-center text-center"
      style={{
        background: "linear-gradient(135deg, var(--c-accent-glow), var(--c-secondary-soft))",
        padding: "0 8%",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          letterSpacing: "0.04em",
          color: "var(--c-text-3)",
        }}
      >
        {caption ? caption.toUpperCase() : `ISSUE — #${numStr}`}
      </span>
    </div>
  );
}
