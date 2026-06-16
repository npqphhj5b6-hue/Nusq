import Link from "next/link";
import { getAllBriefings, formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

function unsplashUrl(raw: string, w: number, h: number) {
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}

export default async function BriefingsPage() {
  const briefings = await getAllBriefings();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-[2px] bg-[#1A4731]" />
          <span className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
            Archive
          </span>
        </div>
        <h1
          className="text-3xl text-[#111111] mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Briefings
        </h1>
        <p className="text-sm text-[#737373]">
          Daily summaries of what moved in MENA markets and why it matters.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {briefings.map((b) => (
          <Link key={b.slug} href={`/briefings/${b.slug}`} className="group block">
            <div className="border border-[#E8E5E0] rounded-xl overflow-hidden hover:border-[#1A4731]/40 transition-all flex">
              {/* Thumbnail */}
              {b.coverImageUrl && (
                <div className="w-32 shrink-0 overflow-hidden">
                  <img
                    src={unsplashUrl(b.coverImageUrl, 200, 200)}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-5 flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {b.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#1A4731] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3
                  className="text-base text-[#111111] leading-snug mb-1.5 group-hover:text-[#1A4731] transition-colors"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  {b.title}
                </h3>
                <p className="text-sm text-[#737373] leading-relaxed line-clamp-2 mb-3">
                  {b.summary}
                </p>
                <div className="flex items-center gap-3 text-xs text-[#A8A8A8]">
                  <span>{formatDate(b.date)}</span>
                  <span>·</span>
                  <span>{b.readingTime} min read</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
