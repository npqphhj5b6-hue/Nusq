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

  return (
    <div className="relative w-full h-full bg-[#F5F5F3]">
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}

      {/* Gradient overlay on images */}
      {imgSrc && (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)" }}
        />
      )}

      {/* Placeholder: no image */}
      {!imgSrc && (
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <span
            className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2"
            style={{ color: "#0A5C3B" }}
          >
            Issue
          </span>
          <span
            style={{
              fontSize: "clamp(3.5rem, 14vw, 6rem)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#D4D4D4",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            {numStr}
          </span>
        </div>
      )}

      {/* Issue badge on images */}
      {imgSrc && (
        <div className="absolute bottom-0 left-0 p-4">
          <span
            className="text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            #{numStr}
          </span>
        </div>
      )}
    </div>
  );
}
