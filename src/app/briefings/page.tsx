import Link from "next/link";
import { getAllBriefings, formatDate, formatDateShort } from "@/lib/db";

export const dynamic = "force-dynamic";

function unsplashUrl(raw: string, w: number, h: number) {
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}

export default async function BriefingsPage() {
  const briefings = await getAllBriefings();
  const [featured, ...rest] = briefings;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-[2px] bg-[#1A4731]" />
          <span className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
            Archive
          </span>
        </div>
        <h1
          className="text-4xl text-[#111111] mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Briefings
        </h1>
        <p className="text-sm text-[#737373]">
          Daily summaries of what moved in MENA markets and why it matters.
        </p>
      </div>

      {/* Featured — latest briefing, large */}
      {featured && (
        <Link href={`/briefings/${featured.slug}`} className="group block mb-14">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            {featured.coverImageUrl && (
              <div className="md:col-span-3 overflow-hidden rounded-xl" style={{ aspectRatio: "16/10" }}>
                <img
                  src={unsplashUrl(featured.coverImageUrl, 900, 562)}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            )}
            <div className="md:col-span-2 md:pt-2">
              {featured.tags[0] && (
                <span className="text-[10px] font-semibold tracking-[0.12em] text-[#8C1C13] uppercase block mb-3">
                  Latest
                </span>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {featured.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold tracking-[0.1em] text-[#1A4731] uppercase">
                    {tag}
                  </span>
                ))}
              </div>
              <h2
                className="text-[2rem] md:text-[2.25rem] leading-[1.1] text-[#111111] mb-4 group-hover:text-[#1A4731] transition-colors"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                {featured.title}
              </h2>
              <p className="text-[#555555] leading-relaxed mb-5 line-clamp-3">
                {featured.summary}
              </p>
              <div className="flex items-center gap-4 text-xs text-[#A8A8A8]">
                <span>{formatDate(featured.date)}</span>
                <span>·</span>
                <span>{featured.readingTime} min read</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Divider */}
      {rest.length > 0 && (
        <div className="border-t border-[#E8E5E0] mb-10" />
      )}

      {/* Grid of older briefings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {rest.map((b) => (
          <Link key={b.slug} href={`/briefings/${b.slug}`} className="group block">
            <div className="flex flex-col h-full card-lift">
              {b.coverImageUrl ? (
                <div className="overflow-hidden rounded-lg mb-4 shrink-0" style={{ aspectRatio: "3/2" }}>
                  <img
                    src={unsplashUrl(b.coverImageUrl, 600, 400)}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-[#E8F0EC] mb-4 shrink-0" style={{ aspectRatio: "3/2" }} />
              )}

              {b.tags[0] && (
                <span className="text-[10px] font-semibold tracking-[0.12em] text-[#1A4731] uppercase mb-2">
                  {b.tags[0]}
                </span>
              )}

              <h3
                className="text-xl leading-[1.25] text-[#111111] mb-3 group-hover:text-[#1A4731] transition-colors flex-1"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                {b.title}
              </h3>

              <div className="flex items-center gap-3 text-xs text-[#A8A8A8] mt-auto">
                <span>{formatDateShort(b.date)}</span>
                <span>·</span>
                <span>{b.readingTime} min read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
