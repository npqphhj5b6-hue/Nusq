import Link from "next/link";
import { getAllBriefings, getAllEssays, formatDate, formatDateShort } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";
import BriefingCover from "@/components/BriefingCover";
import SubscribeForm from "@/components/SubscribeForm";
import TrendsDashboard from "@/components/TrendsDashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const today = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dayOfWeek = now.getUTCDay();
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
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-14 border-b border-[var(--c-border)]">
        <p className="text-xs font-medium tracking-[0.07em] uppercase text-[var(--c-text-3)] mb-8">
          {today}
          {isWeekend && <span className="ml-3 text-[var(--c-text-3)]">· Next briefing Monday</span>}
        </p>

        <h1
          className="font-bold text-[var(--c-text-1)] mb-5"
          style={{ fontSize: "clamp(2.6rem, 8vw, 5.5rem)", letterSpacing: "-0.04em", lineHeight: 1.02 }}
        >
          The Gulf<br />in its own words.
        </h1>

        <p className="text-base leading-relaxed text-[var(--c-text-2)] max-w-sm mb-10">
          Two stories, every weekday morning. Arabic and English sources — before the wires catch up.
        </p>

        {featured && (
          <div className="flex items-center gap-4 mb-10">
            <Link
              href={`/briefings/${featured.slug}`}
              className="inline-flex items-center gap-2 bg-[var(--c-text-1)] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#222] transition-colors btn-press cursor-pointer"
            >
              {!isWeekend && featured.date === todayIso
                ? "Read today's briefing →"
                : "Read latest briefing →"}
            </Link>
            <Link
              href="/briefings"
              className="text-sm text-[var(--c-text-2)] hover:text-[var(--c-text-1)] transition-colors cursor-pointer"
            >
              Archive
            </Link>
          </div>
        )}

        <div className="border-t border-[var(--c-border)] pt-8">
          <p className="text-xs text-[var(--c-text-3)] mb-3 tracking-[0.04em] uppercase">
            Get it in your inbox · Free · Every weekday
          </p>
          <SubscribeForm />
        </div>
      </section>

      {/* ── Featured briefing ── */}
      {featured && (
        <section className="max-w-5xl mx-auto px-6 py-14 border-b border-[var(--c-border)]">
          <ScrollReveal>
            <Link href={`/briefings/${featured.slug}`} className="group block cursor-pointer">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start">
                <div className="md:col-span-3 rounded-xl overflow-hidden img-wrap" style={{ aspectRatio: "16/10" }}>
                  <BriefingCover issueNumber={issueNumbers.get(featured.slug)!} coverImageUrl={featured.coverImageUrl} />
                </div>
                <div className="md:col-span-2 md:pt-2">
                  <span className="eyebrow block mb-4">Latest</span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {featured.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-green)] bg-[var(--c-green-bg)] px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2
                    className="font-bold leading-[1.1] text-[var(--c-text-1)] mb-3 group-hover:text-[var(--c-green)] transition-colors duration-200"
                    style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.03em" }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-sm text-[var(--c-text-2)] leading-relaxed mb-5 line-clamp-3">
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
        <section className="max-w-5xl mx-auto px-6 py-14 border-b border-[var(--c-border)]">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-10">
              <span className="eyebrow">Recent</span>
              <Link
                href="/briefings"
                className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-1)] transition-colors cursor-pointer"
              >
                View all →
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recentBriefings.map((b, i) => (
              <ScrollReveal key={b.slug} delay={i * 70}>
                <Link href={`/briefings/${b.slug}`} className="group block h-full cursor-pointer">
                  <div className="flex flex-col h-full card-lift rounded-xl overflow-hidden bg-[var(--c-surface)] border border-[var(--c-border)]">
                    <div className="shrink-0 img-wrap" style={{ aspectRatio: "3/2" }}>
                      <BriefingCover issueNumber={issueNumbers.get(b.slug)!} coverImageUrl={b.coverImageUrl} />
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      {b.tags[0] && (
                        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-green)] mb-2 hidden md:block">
                          {b.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-sm md:text-[0.95rem] font-bold leading-[1.3] text-[var(--c-text-1)] mb-3 group-hover:text-[var(--c-green)] transition-colors duration-200 flex-1"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {b.title}
                      </h3>
                      <div
                        className="flex items-center gap-1.5 text-[10px] text-[var(--c-text-3)] mt-auto"
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

      {/* ── Trends ── */}
      <TrendsDashboard />

      {/* ── Essays ── */}
      {essays.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-14">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-10">
              <span className="eyebrow">Research</span>
              <Link
                href="/essays"
                className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-1)] transition-colors cursor-pointer"
              >
                View all →
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {essays.slice(0, 4).map((e, i) => (
              <ScrollReveal key={e.slug} delay={i * 60}>
                <Link
                  href={`/essays/${e.slug}`}
                  className="group block py-5 border-b border-[var(--c-border)] last:border-b-0 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {e.tags[0] && (
                        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-green)] block mb-1.5">
                          {e.tags[0]}
                        </span>
                      )}
                      <h3
                        className="text-base font-bold text-[var(--c-text-1)] mb-1.5 group-hover:text-[var(--c-green)] transition-colors duration-200 leading-snug"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {e.title}
                      </h3>
                      <p className="text-sm text-[var(--c-text-2)] leading-relaxed line-clamp-2">
                        {e.summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right pt-0.5">
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
