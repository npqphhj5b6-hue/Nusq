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
      <section className="relative min-h-[90vh] flex flex-col justify-center border-b border-[#1A2B40]">
        {/* Ambient radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(201,169,103,0.06) 0%, transparent 65%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 w-full">
          <p className="hero-fade eyebrow mb-10" style={{ animationDelay: "500ms" }}>
            {today}
          </p>

          <h1
            className="text-[3.75rem] md:text-[6.5rem] leading-[0.93] mb-8"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            <span className="hero-word text-[#EDE8DF]" style={{ animationDelay: "0ms" }}>MENA</span>{" "}
            <span className="hero-word text-[#EDE8DF]" style={{ animationDelay: "130ms" }}>markets,</span>
            <br />
            <span className="hero-word text-[#EDE8DF]" style={{ animationDelay: "260ms" }}>made </span>
            <span className="hero-word text-[#C9A967]" style={{ animationDelay: "390ms" }}>clear.</span>
          </h1>

          <p
            className="hero-fade text-[#7A8FA6] text-lg leading-relaxed max-w-sm mb-10"
            style={{ animationDelay: "650ms" }}
          >
            A daily briefing on what moved the Gulf and why — written for
            people who need to know, not just want to know.
          </p>

          {featured && (
            <div
              className="hero-fade flex items-center gap-5"
              style={{ animationDelay: "800ms" }}
            >
              <Link
                href={`/briefings/${featured.slug}`}
                className="inline-flex items-center gap-2 bg-[#C9A967] text-[#070D1A] text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-[#E8C97A] transition-colors btn-press"
              >
                Read today&apos;s briefing →
              </Link>
              <Link
                href="/briefings"
                className="text-sm text-[#7A8FA6] hover:text-[#EDE8DF] transition-colors duration-200"
              >
                All briefings
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Featured briefing ── */}
      {featured && (
        <section className="max-w-5xl mx-auto px-6 py-16 border-b border-[#1A2B40]">
          <ScrollReveal>
            <Link href={`/briefings/${featured.slug}`} className="group block">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-5 h-[1px] bg-[#C9A967] gold-line" />
                    <span className="eyebrow">Latest</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {featured.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold tracking-[0.1em] text-[#15A06E] uppercase bg-[#0A1F15] px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2
                    className="text-[1.85rem] md:text-[2.1rem] leading-[1.1] text-[#EDE8DF] mb-4 group-hover:text-[#C9A967] transition-colors duration-300"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-[#7A8FA6] leading-relaxed mb-5 line-clamp-3 text-sm">
                    {featured.summary}
                  </p>
                  <div
                    className="flex items-center gap-3 text-xs text-[#3A4F66]"
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
        <section className="max-w-5xl mx-auto px-6 py-16 border-b border-[#1A2B40]">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-[1px] bg-[#C9A967] gold-line" />
                <span className="eyebrow">Recent Briefings</span>
              </div>
              <Link
                href="/briefings"
                className="text-xs text-[#3A4F66] hover:text-[#C9A967] transition-colors"
              >
                View all →
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentBriefings.map((b, i) => (
              <ScrollReveal key={b.slug} delay={i * 100}>
                <Link href={`/briefings/${b.slug}`} className="group block h-full">
                  <div className="flex flex-col h-full card-lift rounded-xl overflow-hidden bg-[#0F1B2D] border border-[#1A2B40]">
                    {b.coverImageUrl ? (
                      <div className="img-wrap shrink-0" style={{ aspectRatio: "3/2" }}>
                        <img
                          src={unsplashUrl(b.coverImageUrl, 600, 400)}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 bg-[#152338]" style={{ aspectRatio: "3/2" }} />
                    )}
                    <div className="flex flex-col flex-1 p-5">
                      {b.tags[0] && (
                        <span className="text-[10px] font-semibold tracking-[0.1em] text-[#15A06E] uppercase mb-3">
                          {b.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-[1.05rem] leading-[1.3] text-[#EDE8DF] mb-4 group-hover:text-[#C9A967] transition-colors duration-300 flex-1"
                        style={{ fontFamily: "var(--font-dm-serif)" }}
                      >
                        {b.title}
                      </h3>
                      <span
                        className="text-xs text-[#3A4F66] mt-auto"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatDateShort(b.date)}
                      </span>
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
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-[1px] bg-[#C9A967] gold-line" />
                <span className="eyebrow">Essays</span>
              </div>
              <Link
                href="/essays"
                className="text-xs text-[#3A4F66] hover:text-[#C9A967] transition-colors"
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
                  className="group block py-5 border-b border-[#1A2B40] last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {e.tags[0] && (
                        <span className="text-[10px] font-semibold tracking-[0.12em] text-[#15A06E] uppercase block mb-2">
                          {e.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-lg text-[#EDE8DF] mb-1.5 group-hover:text-[#C9A967] transition-colors duration-300 leading-snug"
                        style={{ fontFamily: "var(--font-dm-serif)" }}
                      >
                        {e.title}
                      </h3>
                      <p className="text-sm text-[#7A8FA6] leading-relaxed line-clamp-2">
                        {e.summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right pt-1">
                      <span
                        className="text-xs text-[#3A4F66]"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatDateShort(e.date)}
                      </span>
                      <p
                        className="text-xs text-[#3A4F66] mt-1"
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
