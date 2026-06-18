import Link from "next/link";
import { getAllBriefings, getAllEssays, formatDate, formatDateShort } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";
import BriefingCover from "@/components/BriefingCover";
import { BlurFade } from "@/components/ui/blur-fade";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const today = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const todayIso = now.toISOString().split("T")[0];

  const briefings = await getAllBriefings();
  const essays = await getAllEssays();
  const [featured, ...rest] = briefings;
  const recentBriefings = rest.slice(0, 3);

  const issueNumbers = new Map(
    [...briefings].reverse().map((b, i) => [b.slug, i + 1])
  );

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center border-b border-[var(--c-border)] overflow-hidden">
        {/* Ambient orbs */}
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

        <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-16 md:pt-20 md:pb-20 w-full">
          <p className="hero-fade eyebrow mb-6 md:mb-8" style={{ animationDelay: "400ms" }}>
            {today}
          </p>

          <h1 className="font-display mb-8 md:mb-10" style={{ fontSize: "clamp(2.75rem, 11vw, 9.5rem)" }}>
            <BlurFade delay={0.25} duration={0.7} yOffset={20} blur="10px">
              <span className="text-[var(--c-text-1)] block">MENA</span>
              <span className="text-[var(--c-text-1)] block">MARKETS,</span>
            </BlurFade>
            <BlurFade delay={0.5} duration={0.7} yOffset={20} blur="10px">
              <span className="text-[var(--c-amber)] text-glow block">MADE CLEAR.</span>
            </BlurFade>
          </h1>

          <p
            className="hero-fade text-[var(--c-text-2)] text-base leading-relaxed max-w-xs mb-3 tracking-wide"
            style={{ animationDelay: "550ms" }}
          >
            A briefing on what moved the Gulf and why — written for
            people who need to know, not just want to know.
          </p>

          <p
            className="hero-fade text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--c-text-3)] mb-10"
            style={{ animationDelay: "600ms" }}
          >
            Published Monday – Friday
          </p>

          {featured && (
            <div className="hero-fade flex items-center gap-5" style={{ animationDelay: "700ms" }}>
              <Link
                href={`/briefings/${featured.slug}`}
                className="inline-flex items-center gap-2 bg-[var(--c-amber)] text-[#040C1A] text-xs font-bold tracking-[0.1em] uppercase px-7 py-3.5 rounded-full hover:bg-[var(--c-amber-2)] transition-colors btn-press cursor-pointer"
                style={{ color: "#040C1A" }}
              >
                {!isWeekend && featured.date === todayIso
                  ? "Read today’s briefing →"
                  : "Read latest briefing →"}
              </Link>
              <Link
                href="/briefings"
                className="text-xs font-semibold tracking-[0.08em] uppercase text-[var(--c-text-2)] hover:text-[var(--c-text-1)] transition-colors duration-200 cursor-pointer"
              >
                All briefings
              </Link>
            </div>
          )}

          {isWeekend && (
            <p
              className="hero-fade text-[10px] tracking-[0.1em] uppercase text-[var(--c-text-3)] mt-5"
              style={{ animationDelay: "800ms" }}
            >
              Next briefing: Monday
            </p>
          )}
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--c-bg))" }}
        />
      </section>

      {/* ── Featured briefing ── */}
      {featured && (
        <section className="max-w-5xl mx-auto px-6 py-16 border-b border-[var(--c-border)]">
          <ScrollReveal>
            <Link href={`/briefings/${featured.slug}`} className="group block cursor-pointer">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start">
                <div className="md:col-span-3 rounded-xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
                  <BriefingCover issueNumber={issueNumbers.get(featured.slug)!} />
                </div>
                <div className="md:col-span-2 md:pt-3">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
                    <span className="eyebrow">Latest</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featured.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-green)] uppercase bg-[var(--c-green-bg)] px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2
                    className="text-[1.75rem] md:text-[2rem] leading-[1.1] text-[var(--c-text-1)] mb-4 group-hover:text-[var(--c-amber)] transition-colors duration-300"
                    style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-[var(--c-text-2)] leading-relaxed mb-5 line-clamp-3 text-sm">
                    {featured.summary}
                  </p>
                  <div
                    className="flex items-center gap-3 text-xs text-[var(--c-text-3)]"
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
        <section className="max-w-5xl mx-auto px-6 py-16 border-b border-[var(--c-border)]">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
                <span className="eyebrow">Recent Briefings</span>
              </div>
              <Link
                href="/briefings"
                className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] hover:text-[var(--c-amber)] transition-colors cursor-pointer"
              >
                View all →
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {recentBriefings.map((b, i) => (
              <ScrollReveal key={b.slug} delay={i * 90}>
                <Link href={`/briefings/${b.slug}`} className="group block h-full cursor-pointer">
                  <div className="flex flex-col h-full card-lift rounded-xl overflow-hidden bg-[var(--c-surface)] border border-[var(--c-border)]">
                    <div className="shrink-0" style={{ aspectRatio: "3/2" }}>
                      <BriefingCover issueNumber={issueNumbers.get(b.slug)!} />
                    </div>
                    <div className="flex flex-col flex-1 p-3 md:p-5">
                      {b.tags[0] && (
                        <span className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-green)] uppercase mb-2 md:mb-3 hidden md:block">
                          {b.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-[0.8rem] md:text-[1rem] leading-[1.3] md:leading-[1.35] text-[var(--c-text-1)] mb-2 md:mb-4 group-hover:text-[var(--c-amber)] transition-colors duration-300 flex-1"
                        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
                      >
                        {b.title}
                      </h3>
                      <div
                        className="flex items-center gap-1.5 text-[10px] md:text-xs text-[var(--c-text-3)] mt-auto"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        <span>{formatDateShort(b.date)}</span>
                        <span>·</span>
                        <span className="hidden sm:inline">{b.readingTime} min</span>
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
                <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
                <span className="eyebrow">Research</span>
              </div>
              <Link
                href="/essays"
                className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--c-text-3)] hover:text-[var(--c-amber)] transition-colors cursor-pointer"
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
                  className="group block py-5 border-b border-[var(--c-border)] last:border-b-0 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {e.tags[0] && (
                        <span className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-green)] uppercase block mb-2">
                          {e.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-lg text-[var(--c-text-1)] mb-1.5 group-hover:text-[var(--c-amber)] transition-colors duration-300 leading-snug"
                        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
                      >
                        {e.title}
                      </h3>
                      <p className="text-sm text-[var(--c-text-2)] leading-relaxed line-clamp-2">
                        {e.summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right pt-1">
                      <span className="text-xs text-[var(--c-text-3)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
                        {formatDateShort(e.date)}
                      </span>
                      <p className="text-xs text-[var(--c-text-3)] mt-1" style={{ fontFamily: "var(--font-geist-mono)" }}>
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
