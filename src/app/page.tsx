import Link from "next/link";
import { getAllBriefings, getAllEssays, formatDate, formatDateShort } from "@/lib/db";

export const dynamic = "force-dynamic";

function unsplashUrl(raw: string, w: number, h: number) {
  return `${raw}&w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}

export default async function Home() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const briefings = await getAllBriefings();
  const essays = await getAllEssays();
  const [featured, ...rest] = briefings;
  const recentBriefings = rest.slice(0, 3);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="border-b border-[#E8E5E0]">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-14">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 items-center">

            {/* Left: brand statement */}
            <div className="md:col-span-3">
              <p className="text-[10px] tracking-[0.18em] text-[#A8A8A8] uppercase mb-8">
                {today}
              </p>
              <h1
                className="text-[3.25rem] leading-[1.1] text-[#111111] mb-6"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                MENA markets,<br />
                <span className="text-[#1A4731]">made clear.</span>
              </h1>
              <p className="text-[#737373] text-base leading-[1.7] mb-10 max-w-sm">
                A daily briefing on what moved the Gulf and why — written for
                people who need to know, not just want to know.
              </p>
              <div className="flex items-center gap-4">
                {featured && (
                  <Link
                    href={`/briefings/${featured.slug}`}
                    className="inline-flex items-center gap-2 bg-[#1A4731] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#143829] transition-colors btn-press"
                  >
                    Read today&apos;s briefing →
                  </Link>
                )}
                <Link
                  href="/briefings"
                  className="text-sm text-[#737373] hover:text-[#1A4731] transition-colors"
                >
                  Browse archive
                </Link>
              </div>
            </div>

            {/* Right: today's briefing card */}
            {featured && (
              <div className="md:col-span-2">
                <Link href={`/briefings/${featured.slug}`} className="group block">
                  <div className="border border-[#E8E5E0] rounded-2xl overflow-hidden hover:border-[#1A4731]/40 transition-all card-lift">
                    {/* Thumbnail image */}
                    {featured.coverImageUrl ? (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={unsplashUrl(featured.coverImageUrl, 600, 300)}
                          alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-3 bg-[#1A4731]" />
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-[2px] bg-[#8C1C13]" />
                        <span className="text-[10px] font-medium tracking-[0.14em] text-[#8C1C13] uppercase">
                          Today&apos;s briefing
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {featured.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#E8F0EC] text-[#1A4731]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2
                        className="text-[1.1rem] leading-[1.35] text-[#111111] mb-3 group-hover:text-[#1A4731] transition-colors"
                        style={{ fontFamily: "var(--font-dm-serif)" }}
                      >
                        {featured.title}
                      </h2>
                      <p className="text-sm text-[#737373] leading-relaxed line-clamp-2 mb-4">
                        {featured.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[#A8A8A8]">
                        <span>{formatDate(featured.date)}</span>
                        <span>{featured.readingTime} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Recent Briefings ── */}
      {recentBriefings.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-[2px] bg-[#1A4731]" />
              <h2 className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
                Recent Briefings
              </h2>
            </div>
            <Link href="/briefings" className="text-xs text-[#737373] hover:text-[#1A4731] transition-colors">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentBriefings.map((b, i) => (
              <Link key={b.slug} href={`/briefings/${b.slug}`} className="group block">
                <div className="border border-[#E8E5E0] rounded-xl overflow-hidden h-full hover:border-[#1A4731]/40 transition-all flex flex-col card-lift">
                  {/* Thumbnail */}
                  {b.coverImageUrl ? (
                    <div className="h-28 overflow-hidden shrink-0">
                      <img
                        src={unsplashUrl(b.coverImageUrl, 400, 200)}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-1.5 bg-[#E8F0EC] shrink-0" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-[#1A4731] mb-3 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className="text-[0.95rem] leading-snug text-[#111111] mb-3 group-hover:text-[#1A4731] transition-colors flex-1"
                      style={{ fontFamily: "var(--font-dm-serif)" }}
                    >
                      {b.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F0EDE8]">
                      <span className="text-xs text-[#A8A8A8]">{formatDateShort(b.date)}</span>
                      {b.tags[0] && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#1A4731]">
                          {b.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Essays ── */}
      {essays.length > 0 && (
        <section className="border-t border-[#E8E5E0]">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-[2px] bg-[#1A4731]" />
                <h2 className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
                  Essays
                </h2>
              </div>
              <Link href="/essays" className="text-xs text-[#737373] hover:text-[#1A4731] transition-colors">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {essays.slice(0, 4).map((e) => (
                <Link key={e.slug} href={`/essays/${e.slug}`} className="group block py-5 border-b border-[#E8E5E0] last:border-b-0">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {e.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#1A4731]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3
                        className="text-base text-[#111111] mb-1.5 group-hover:text-[#1A4731] transition-colors"
                        style={{ fontFamily: "var(--font-dm-serif)" }}
                      >
                        {e.title}
                      </h3>
                      <p className="text-sm text-[#737373] leading-relaxed line-clamp-2">{e.summary}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs text-[#A8A8A8]">{formatDateShort(e.date)}</span>
                      <p className="text-xs text-[#A8A8A8] mt-1">{e.readingTime} min</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
