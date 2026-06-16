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
        {/* Brand statement — large, centred */}
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <p className="text-[10px] tracking-[0.18em] text-[#A8A8A8] uppercase mb-8">{today}</p>
          <h1
            className="text-[3.5rem] md:text-[5.5rem] leading-[1.0] text-[#111111] mb-6"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            MENA markets,<br />
            <span className="text-[#1A4731]">made clear.</span>
          </h1>
          <p className="text-[#737373] text-lg leading-relaxed max-w-md mx-auto mb-10">
            A daily briefing on what moved the Gulf and why — written for
            people who need to know, not just want to know.
          </p>
          {featured && (
            <Link
              href={`/briefings/${featured.slug}`}
              className="inline-flex items-center gap-2 bg-[#1A4731] text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-[#143829] transition-colors btn-press"
            >
              Read today&apos;s briefing →
            </Link>
          )}
        </div>

        {/* Featured briefing card below tagline */}
        {featured && (
          <div className="max-w-5xl mx-auto px-6 pb-16">
            <Link href={`/briefings/${featured.slug}`} className="group block">
              {featured.coverImageUrl && (
                <div className="w-full overflow-hidden rounded-xl mb-7" style={{ aspectRatio: "21/9" }}>
                  <img
                    src={unsplashUrl(featured.coverImageUrl, 1600, 686)}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-700"
                  />
                </div>
              )}
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2 mb-4">
                  {featured.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold tracking-[0.12em] text-[#1A4731] uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2
                  className="text-[2rem] md:text-[2.75rem] leading-[1.1] text-[#111111] mb-4 group-hover:text-[#1A4731] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  {featured.title}
                </h2>
                <p className="text-[#555555] text-[1.05rem] leading-relaxed mb-5 max-w-2xl">
                  {featured.summary}
                </p>
                <div className="flex items-center gap-4 text-sm text-[#A8A8A8]">
                  <span>{formatDate(featured.date)}</span>
                  <span>·</span>
                  <span>{featured.readingTime} min read</span>
                  <span className="text-[#1A4731] font-medium group-hover:underline ml-1">Read →</span>
                </div>
              </div>
            </Link>
          </div>
        )}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentBriefings.map((b) => (
              <Link key={b.slug} href={`/briefings/${b.slug}`} className="group block">
                <div className="flex flex-col h-full card-lift">
                  {/* Image */}
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

                  {/* Category */}
                  {b.tags[0] && (
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-[#1A4731] uppercase mb-2">
                      {b.tags[0]}
                    </span>
                  )}

                  {/* Headline */}
                  <h3
                    className="text-xl leading-[1.25] text-[#111111] mb-3 group-hover:text-[#1A4731] transition-colors flex-1"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {b.title}
                  </h3>

                  <span className="text-xs text-[#A8A8A8] mt-auto">{formatDateShort(b.date)}</span>
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
                      {e.tags[0] && (
                        <span className="text-[10px] font-semibold tracking-[0.12em] text-[#1A4731] uppercase block mb-2">
                          {e.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-lg text-[#111111] mb-1.5 group-hover:text-[#1A4731] transition-colors leading-snug"
                        style={{ fontFamily: "var(--font-dm-serif)" }}
                      >
                        {e.title}
                      </h3>
                      <p className="text-sm text-[#737373] leading-relaxed line-clamp-2">{e.summary}</p>
                    </div>
                    <div className="shrink-0 text-right pt-1">
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
