import Link from "next/link";
import { getAllBriefings, formatDateShort } from "@/lib/db";
import ScrollReveal from "@/components/ScrollReveal";
import BriefingCover from "@/components/BriefingCover";
import FeaturedCover from "@/components/FeaturedCover";
import { createClient } from "@/lib/supabase-server";
import { matchesBriefing } from "@/lib/preferences";
import type { UserPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export default async function BriefingsPage() {
  const briefings = await getAllBriefings();

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
    <div>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-blob" />
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 relative">
          <span className="eyebrow block mb-4">Archive</span>
          <h1
            className="text-[var(--c-text-1)] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.75rem, 8vw, 5.5rem)", letterSpacing: "-0.02em", lineHeight: 0.98 }}
          >
            Briefings
          </h1>
          <p className="text-sm text-[var(--c-text-2)]">
            What moved the Gulf — and what Arabic sources were saying about it first.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-12">

      {/* Featured */}
      {featured && (
        <ScrollReveal>
          <Link
            href={`/briefings/${featured.slug}`}
            className="glass-card group block"
            style={{ overflow: "hidden", marginBottom: 48 }}
          >
            <FeaturedCover
              issueNumber={issueNumbers.get(featured.slug)!}
              title={featured.title}
              tags={featured.tags}
              coverImageUrl={featured.coverImageUrl}
            />
          </Link>
        </ScrollReveal>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rest.map((b, i) => (
          <ScrollReveal key={b.slug} delay={(i % 3) * 60}>
            <Link href={`/briefings/${b.slug}`} className="group block h-full cursor-pointer">
              <div className="flex flex-col h-full card-glow">
                <div className="shrink-0 img-wrap" style={{ aspectRatio: "3/2", borderRadius: "20px 20px 0 0" }}>
                  <BriefingCover issueNumber={issueNumbers.get(b.slug)!} coverImageUrl={b.coverImageUrl} />
                </div>
                <div className="flex flex-col flex-1 p-4">
                  {prefs && matchesBriefing(prefs, b.tags) && (
                    <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-accent)] bg-[var(--c-accent-glow)] px-2 py-0.5 rounded-full border border-[var(--c-accent)]/20 mb-2 block w-fit">
                      For You
                    </span>
                  )}
                  {b.tags[0] && (
                    <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--c-accent)] mb-2 hidden md:block">
                      {b.tags[0]}
                    </span>
                  )}
                  <h3
                    className="text-sm md:text-[0.95rem] leading-[1.3] text-[var(--c-text-1)] mb-3 group-hover:text-[var(--c-accent)] transition-colors duration-200 flex-1"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.01em" }}
                  >
                    {b.title}
                  </h3>
                  <div
                    className="flex items-center gap-1.5 text-[10px] text-[var(--c-text-3)] mt-auto"
                    style={{ fontFamily: "var(--font-mono)" }}
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
    </div>
  );
}
