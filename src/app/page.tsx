import Link from "next/link";
import { getAllBriefings, getAllEssays, formatDate, formatDateShort } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";

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
      <section className="relative min-h-[92vh] flex flex-col justify-center border-b border-[#132030] overflow-hidden">
        {/* Ambient orbs — Visuvate-style */}
        <div
          className="orb w-[700px] h-[500px]"
          style={{
            background: "radial-gradient(ellipse, rgba(245,158,11,0.13) 0%, transparent 70%)",
            top: "-10%",
            left: "-15%",
            animationDelay: "0s",
          }}
        />
        <div
          className="orb w-[500px] h-[400px]"
          style={{
            background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
            bottom: "0%",
            right: "-10%",
            animationDelay: "5s",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-20 w-full">
          {/* Date eyebrow */}
          <p className="hero-fade eyebrow mb-8" style={{ animationDelay: "400ms" }}>
            {today}
          </p>

          {/* Massive condensed headline */}
          <h1 className="font-display mb-10" style={{ fontSize: "clamp(4.5rem, 11vw, 9.5rem)" }}>
            <span
              className="hero-word text-[#F0ECE5] block"
              style={{ animationDelay: "0ms" }}
            >
              MENA
            </span>
            <span
              className="hero-word text-[#F0ECE5] block"
              style={{ animationDelay: "100ms" }}
            >
              MARKETS,
            </span>
            <span
              className="hero-word text-[#F59E0B] text-glow block"
              style={{ animationDelay: "200ms" }}
            >
              MADE CLEAR.
            </span>
          </h1>

          <p
            className="hero-fade text-[#4E6880] text-base leading-relaxed max-w-xs mb-10 tracking-wide"
            style={{ animationDelay: "550ms" }}
          >
            A daily briefing on what moved the Gulf and why — written for
            people who need to know, not just want to know.
          </p>

          {featured && (
            <div
              className="hero-fade flex items-center gap-5"
              style={{ animationDelay: "700ms" }}
            >
              <Link
                href={`/briefings/${featured.slug}`}
                className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#040C1A] text-xs font-bold tracking-[0.1em] uppercase px-7 py-3.5 rounded-full hover:bg-[#FCD34D] transition-colors btn-press cursor-pointer"
              >
                Read today&apos;s briefing →
              </Link>
              <Link
                href="/briefings"
                className="text-xs font-semibold tracking-[0.08em] uppercase text-[#4E6880] hover:text-[#F0ECE5] transition-colors duration-200 cursor-pointer"
              >
                All briefings
              </Link>
            </div>
          )}
        </div>

        {/* Bottom fade into next section */}
        <div
          className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #040C1A)" }}
        />
      </section>

      {/* ── Featured briefing ── */}
      {featured && (
        <section className="max-w-5xl mx-auto px-6 py-16 border-b border-[#132030]">
          <ScrollReveal>
            <Link href={`/briefings/${featured.slug}`} className="group block cursor-pointer">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start">
                {featured.coverImageUrl && (
                  <div
                    className="md:col-span-3 img-wrap rounded-xl overflow-hidden"
                    style={{ aspectRatio: "16/10" }}
                  >
                    <img
                      src={unsplashUrl(featured.coverImageUrl, 900, 562)}
                      alt={featured.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="md:col-span-2 md:pt-3">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-5 h-[1px] bg-[#F59E0B] gold-line" />
                    <span className="eyebrow">Latest</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featured.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold tracking-[0.14em] text-[#15A06E] uppercase bg-[#0A1F15] px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2
                    className="text-[1.75rem] md:text-[2rem] leading-[1.1] text-[#F0ECE5] mb-4 group-hover:text-[#F59E0B] transition-colors duration-300"
                    style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-[#4E6880] leading-relaxed mb-5 line-clamp-3 text-sm">
                    {featured.summary}
                  </p>
                  <div
                    className="flex items-center gap-3 text-xs text-[#2A3F55]"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    <span>{formatDate(featured.date)}</span>
                    <span>·</span>
                    <span>{featured.readingTime} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </section>
      )}

      {/* ── Recent Briefings ── */}
      {recentBriefings.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16 border-b border-[#132030]">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-5 h-[1px] bg-[#F59E0B] gold-line" />
                <span className="eyebrow">Recent Briefings</span>
              </div>
              <Link
                href="/briefings"
                className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#2A3F55] hover:text-[#F59E0B] transition-colors cursor-pointer"
              >
                View all →
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentBriefings.map((b, i) => (
              <ScrollReveal key={b.slug} delay={i * 90}>
                <Link href={`/briefings/${b.slug}`} className="group block h-full cursor-pointer">
                  <div className="flex flex-col h-full card-lift rounded-xl overflow-hidden bg-[#091422] border border-[#132030]">
                    {b.coverImageUrl ? (
                      <div className="img-wrap shrink-0" style={{ aspectRatio: "3/2" }}>
                        <img
                          src={unsplashUrl(b.coverImageUrl, 600, 400)}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 bg-[#0D1E30]" style={{ aspectRatio: "3/2" }} />
                    )}
                    <div className="flex flex-col flex-1 p-5">
                      {b.tags[0] && (
                        <span className="text-[9px] font-bold tracking-[0.14em] text-[#15A06E] uppercase mb-3">
                          {b.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-[1rem] leading-[1.35] text-[#F0ECE5] mb-4 group-hover:text-[#F59E0B] transition-colors duration-300 flex-1"
                        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
                      >
                        {b.title}
                      </h3>
                      <div
                        className="flex items-center gap-2 text-xs text-[#2A3F55] mt-auto"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        <span>{formatDateShort(b.date)}</span>
                        <span>·</span>
                        <span>{b.readingTime} min</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Essays ── */}
      {essays.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-5 h-[1px] bg-[#F59E0B] gold-line" />
                <span className="eyebrow">Essays</span>
              </div>
              <Link
                href="/essays"
                className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#2A3F55] hover:text-[#F59E0B] transition-colors cursor-pointer"
              >
                View all →
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {essays.slice(0, 4).map((e, i) => (
              <ScrollReveal key={e.slug} delay={i * 80}>
                <Link
                  href={`/essays/${e.slug}`}
                  className="group block py-5 border-b border-[#132030] last:border-b-0 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {e.tags[0] && (
                        <span className="text-[9px] font-bold tracking-[0.14em] text-[#15A06E] uppercase block mb-2">
                          {e.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-lg text-[#F0ECE5] mb-1.5 group-hover:text-[#F59E0B] transition-colors duration-300 leading-snug"
                        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
                      >
                        {e.title}
                      </h3>
                      <p className="text-sm text-[#4E6880] leading-relaxed line-clamp-2">
                        {e.summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right pt-1">
                      <span
                        className="text-xs text-[#2A3F55]"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatDateShort(e.date)}
                      </span>
                      <p
                        className="text-xs text-[#2A3F55] mt-1"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {e.readingTime} min
                      </p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
