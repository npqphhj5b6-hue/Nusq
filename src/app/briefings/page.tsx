import Link from "next/link";
import { getAllBriefings, formatDate, formatDateShort } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";
import BriefingCover from "@/components/BriefingCover";
import { createClient } from "@/lib/supabase-server";
import { matchesBriefing } from "@/lib/preferences";
import type { UserPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export default async function BriefingsPage() {
  const briefings = await getAllBriefings();

  // Personalisation: fetch user prefs if logged in
  let prefs: UserPreferences | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_preferences")
        .select("markets, sectors")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) prefs = data;
    }
  } catch { /* non-blocking */ }
  const [featured, ...rest] = briefings;

  const issueNumbers = new Map(
    [...briefings].reverse().map((b, i) => [b.slug, i + 1])
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
          <span className="eyebrow">Archive</span>
        </div>
        <h1 className="font-display mb-3" style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}>
          <span className="text-[var(--c-text-1)]">BRIEFINGS</span>
        </h1>
        <p className="text-sm text-[var(--c-text-2)] tracking-wide">
          Daily summaries of what moved in MENA markets and why it matters.
        </p>
      </div>

      {/* Featured */}
      {featured && (
        <ScrollReveal>
          <Link
            href={`/briefings/${featured.slug}`}
            className="group block mb-16 pb-16 border-b border-[var(--c-border)] cursor-pointer"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
              <div className="md:col-span-3 rounded-xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
                <BriefingCover issueNumber={issueNumbers.get(featured.slug)!} coverImageUrl={featured.coverImageUrl} />
              </div>
              <div className="md:col-span-2 md:pt-2">
                <span className="eyebrow block mb-5">Latest</span>
                <div className="flex flex-wrap gap-2 mb-4">
                  {prefs && matchesBriefing(prefs, featured.tags) && (
                    <span className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-amber)] uppercase bg-[#F59E0B]/10 px-2.5 py-1 rounded-full border border-[#F59E0B]/25">
                      For You
                    </span>
                  )}
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
                  className="text-[2rem] md:text-[2.25rem] leading-[1.1] text-[var(--c-text-1)] mb-4 group-hover:text-[var(--c-amber)] transition-colors duration-300"
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
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {rest.map((b, i) => (
          <ScrollReveal key={b.slug} delay={(i % 3) * 80}>
            <Link href={`/briefings/${b.slug}`} className="group block h-full cursor-pointer">
              <div className="flex flex-col h-full card-lift rounded-xl overflow-hidden bg-[var(--c-surface)] border border-[var(--c-border)]">
                <div className="shrink-0" style={{ aspectRatio: "3/2" }}>
                  <BriefingCover issueNumber={issueNumbers.get(b.slug)!} coverImageUrl={b.coverImageUrl} />
                </div>
                <div className="flex flex-col flex-1 p-3 md:p-5">
                  {prefs && matchesBriefing(prefs, b.tags) && (
                    <span className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-amber)] uppercase bg-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#F59E0B]/25 mb-2 block w-fit">
                      For You
                    </span>
                  )}
                  {b.tags[0] && (
                    <span className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-green)] uppercase mb-2 hidden md:block">
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
    </div>
  );
}
