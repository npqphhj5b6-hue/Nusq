interface FeaturedCoverProps {
  issueNumber: number;
  title: string;
  tags: string[];
  coverImageUrl?: string | null;
}

/* ── Featured "type-poster" cover ──
   Headline-led hero for the top story in the feed: a giant faint ghost number
   behind, mono region eyebrow + big headline on top, and an emerald-tinted
   photo band across the bottom. Meant to be wrapped in the feed's <Link>
   (which supplies the .glass-card shell, click-to-open, hover lift and load-in
   animation) — this renders only the three internal layers. */
export default function FeaturedCover({ issueNumber, title, tags, coverImageUrl }: FeaturedCoverProps) {
  const numStr = String(issueNumber).padStart(2, "0");
  const regionTags = tags.slice(0, 3);
  const imgSrc = coverImageUrl
    ? coverImageUrl.includes("images.unsplash.com")
      ? `${coverImageUrl}&w=1100&h=520&fit=crop&crop=entropy&auto=format&q=80`
      : coverImageUrl
    : null;

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* 1 · Ghost number */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "clamp(-22px, -5vw, -38px)",
          right: 12,
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(88px, 24vw, 210px)",
          lineHeight: 1,
          color: "var(--c-accent-glow)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {numStr}
      </span>

      {/* 2 · Text block */}
      <div style={{ position: "relative", padding: "clamp(22px, 6vw, 34px) clamp(20px, 6vw, 34px) 0" }}>
        {regionTags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--c-accent)",
            }}
          >
            {regionTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(1.5rem, 4vw + 1rem, 2.375rem)",
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
            color: "var(--c-text-1)",
            maxWidth: 560,
          }}
        >
          {title}
        </h2>
      </div>

      {/* 3 · Image band */}
      <div
        style={{
          position: "relative",
          margin: "clamp(16px, 5vw, 22px) clamp(20px, 6vw, 24px)",
          aspectRatio: "2.4 / 1",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            aria-hidden="true"
            className="transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            className="transition-transform duration-500 ease-out group-hover:scale-105"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, var(--c-accent-glow), var(--c-secondary-soft))",
            }}
          />
        )}
        {/* emerald tint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "oklch(45% 0.13 155 / 0.28)",
            mixBlendMode: "multiply",
          }}
        />
        {/* bottom scrim */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 48%, rgba(8,12,16,0.5) 100%)",
          }}
        />
      </div>
    </div>
  );
}
