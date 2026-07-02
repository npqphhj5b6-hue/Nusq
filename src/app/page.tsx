import Link from "next/link";
import { getAllBriefings, formatDateShort } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";
import StreakBadge from "@/components/StreakBadge";
import BriefingCover from "@/components/BriefingCover";
import FeaturedCover from "@/components/FeaturedCover";
import SubscribeForm from "@/components/SubscribeForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const isWeekend = [0, 6].includes(now.getUTCDay());

  const briefings = await getAllBriefings();
  const [featured, ...rest] = briefings;
  const moreArticles = rest.slice(0, 3);
  const issueNumbers = new Map(
    [...briefings].reverse().map((b, i) => [b.slug, i + 1])
  );

  // The eyebrow date must reflect the briefing actually being shown, not the
  // visitor's clock — otherwise a missed pipeline day silently presents
  // stale content as if it were today's. Compare in UTC since `date` is a
  // plain date column with no time component.
  const todayISO = now.toISOString().split("T")[0];
  const featuredISO = featured ? new Date(featured.date).toISOString().split("T")[0] : null;
  const isFresh = featuredISO === todayISO;
  const eyebrowDate = featured ? new Date(featured.date) : now;
  const eyebrowLabel = eyebrowDate
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })
    .toUpperCase();

  // The subhead used to hardcode "Four things" regardless of how many
  // stories the featured briefing actually contains — drive it from the
  // real story count so it can't drift out of sync with the content again.
  const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six"];
  const storyCount = featured?.stories?.length ?? 0;
  const storyCountLabel = storyCount > 0 && storyCount < NUMBER_WORDS.length
    ? NUMBER_WORDS[storyCount]
    : String(storyCount);

  return (
    <div className="relative overflow-hidden">
      <div className="bg-blob" />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px 90px", position: "relative", zIndex: 1 }}>
        {/* ── Eyebrow ── */}
        <div className="flex items-center gap-2.5 flex-wrap" style={{ marginBottom: 20 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--c-text-3)" }}>
            {!isFresh && !isWeekend && featured && "LATEST · "}
            {eyebrowLabel}
            {isWeekend && <span> · NEXT BRIEFING MONDAY</span>}
          </span>
          <StreakBadge />
        </div>

        {/* ── Hero H1 ── */}
        <h1
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 6vw, 46px)",
            lineHeight: 1.08,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: "var(--c-text-1)",
          }}
        >
          <span>MENA markets, </span>
          <span className="gradient-text">explained.</span>
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 15, lineHeight: 1.6, color: "var(--c-text-2)", maxWidth: 480 }}>
          {featured
            ? `${storyCountLabel} thing${storyCount === 1 ? "" : "s"} moving Gulf and North African markets today.`
            : "Briefings publish every weekday morning."}
        </p>

        {/* ── Primary CTA: email signup ── */}
        <div style={{ marginBottom: 44 }}>
          <SubscribeForm />
          <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--c-text-3)" }}>
            Free, every weekday morning. No spam — unsubscribe anytime.
          </p>
        </div>

        {/* ── Featured briefing card ── */}
        {featured && (
          <ScrollReveal>
            <Link href={`/briefings/${featured.slug}`} className="glass-card group block" style={{ overflow: "hidden", marginBottom: 48 }}>
              <FeaturedCover
                issueNumber={issueNumbers.get(featured.slug)!}
                title={featured.title}
                tags={featured.tags}
                coverImageUrl={featured.coverImageUrl}
              />
            </Link>
          </ScrollReveal>
        )}

        {/* ── More briefings list ── */}
        {moreArticles.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--c-text-3)", marginBottom: 6 }}>
              MORE BRIEFINGS
            </div>
            <div className="flex flex-col">
              {moreArticles.map((b, i) => (
                <ScrollReveal key={b.slug} delay={i * 100}>
                  <Link
                    href={`/briefings/${b.slug}`}
                    className="feed-row group"
                    style={{ borderTop: "1px solid var(--c-border)" }}
                  >
                    <div style={{ flex: "none", width: 76, height: 76, borderRadius: 14, overflow: "hidden" }}>
                      <BriefingCover issueNumber={issueNumbers.get(b.slug)!} coverImageUrl={b.coverImageUrl} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {b.tags[0] && (
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.03em", color: "var(--c-secondary)", marginBottom: 5 }}>
                          {b.tags[0]}
                        </div>
                      )}
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 16.5,
                          fontWeight: 700,
                          color: "var(--c-text-1)",
                          lineHeight: 1.3,
                          marginBottom: 4,
                        }}
                      >
                        {b.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--c-text-3)" }}>
                        {formatDateShort(b.date)} · {b.readingTime} min read
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </>
        )}

        {!featured && (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
              No briefing yet — briefings publish every weekday morning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
