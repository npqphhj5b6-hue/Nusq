import { getAllBriefings } from "@/lib/db";
import { createClient } from "@/lib/supabase-server";
import BriefingBody from "@/components/BriefingBody";
import ScrollReveal from "@/components/ScrollReveal";
import SubscribeForm from "@/components/SubscribeForm";
import StreakBadge from "@/components/StreakBadge";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

export default async function Home() {
  const now = new Date();
  const today = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isWeekend = [0, 6].includes(now.getUTCDay());

  const briefings = await getAllBriefings();
  const briefing = briefings[0] ?? null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let initialSaved = false;
  if (user && briefing?.id) {
    const { data } = await supabase
      .from("saved_briefings")
      .select("id")
      .eq("user_id", user.id)
      .eq("briefing_id", briefing.id)
      .maybeSingle();
    initialSaved = !!data;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* ── Minimal header: date + tagline ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <p
            className="text-[11px] font-medium tracking-[0.12em] uppercase"
            style={{ color: "var(--c-text-3)" }}
          >
            {today}
            {isWeekend && (
              <span className="ml-3" style={{ color: "var(--c-text-3)" }}>
                · Next briefing Monday
              </span>
            )}
          </p>
          <StreakBadge />
        </div>

        <h1
          className="font-bold leading-[1.05]"
          style={{
            fontSize: "clamp(1.7rem, 5vw, 2.5rem)",
            letterSpacing: "-0.04em",
          }}
        >
          <span style={{ color: "var(--c-accent)" }}>MENA</span>{" "}
          <span style={{ color: "var(--c-text-1)" }}>markets,</span>{" "}
          <span style={{ color: "var(--c-text-2)" }}>explained.</span>
        </h1>
      </div>

      {/* ── The day's full briefing ── */}
      {briefing ? (
        <BriefingBody
          briefing={briefing}
          pageUrl={SITE_URL}
          userId={user?.id ?? null}
          initialSaved={initialSaved}
          variant="home"
        />
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
            No briefing yet — briefings publish every weekday morning.
          </p>
        </div>
      )}

      {/* ── Email signup — once, at the end ── */}
      <ScrollReveal>
        <div className="mt-10 mb-6 glass-card px-6 py-6">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{ color: "var(--c-accent)" }}
          >
            Daily brief
          </p>
          <p
            className="font-semibold mb-1 leading-snug"
            style={{ color: "var(--c-text-1)", fontSize: "1rem", letterSpacing: "-0.02em" }}
          >
            Get it in your inbox every weekday morning.
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--c-text-2)" }}>
            Plain language. No jargon. Free.
          </p>
          <SubscribeForm />
        </div>
      </ScrollReveal>
    </div>
  );
}
