import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { formatDate } from "@/lib/db";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

function getInitials(user: { email?: string | null; user_metadata?: { full_name?: string } }): string {
  const name = user.user_metadata?.full_name;
  if (name) {
    return name.split(" ").slice(0, 2).map((s: string) => s[0]?.toUpperCase() ?? "").join("");
  }
  return (user.email ?? "?")[0].toUpperCase();
}

type HistoryRow = {
  id: string;
  read_at: string;
  briefings: { id: string; slug: string; title: string; date: string; reading_time: number } | null;
};

type SavedRow = {
  id: string;
  saved_at: string;
  briefings: { id: string; slug: string; title: string; date: string; reading_time: number; summary: string } | null;
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [historyResult, savedResult, prefsResult] = await Promise.all([
    supabase
      .from("reading_history")
      .select("id, read_at, briefings(id, slug, title, date, reading_time)")
      .eq("user_id", user.id)
      .order("read_at", { ascending: false })
      .limit(20),
    supabase
      .from("saved_briefings")
      .select("id, saved_at, briefings(id, slug, title, date, reading_time, summary)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("user_preferences")
      .select("markets, sectors")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const history = (historyResult.data ?? []) as unknown as HistoryRow[];
  const saved = (savedResult.data ?? []) as unknown as SavedRow[];
  const prefs = prefsResult.data;

  const initials = getInitials({ email: user.email, user_metadata: user.user_metadata });
  const provider = user.app_metadata?.provider ?? "email";
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-[1px] bg-[var(--c-amber)]" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-[var(--c-amber)] uppercase">Account</span>
        </div>
        <h1
          className="text-[2.5rem] leading-[1.06] text-[var(--c-text-1)]"
          style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
        >
          My Account
        </h1>
      </div>

      {/* Profile card */}
      <div className="border border-[var(--c-border)] rounded-xl p-6 mb-8">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[var(--c-border)]">
          <div
            className="w-14 h-14 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] text-xl font-bold flex-shrink-0"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[var(--c-text-1)] font-medium">{user.user_metadata?.full_name ?? user.email}</p>
            <p className="text-xs text-[var(--c-text-3)] mt-0.5">{user.email}</p>
            <p className="text-xs text-[var(--c-text-3)] mt-0.5" style={{ fontFamily: "var(--font-geist-mono)" }}>
              Member since {joined}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)]">Sign-in method</span>
            <span className="text-sm text-[var(--c-text-2)] capitalize">{provider === "google" ? "Google" : "Email & password"}</span>
          </div>
          {provider === "email" && (
            <>
              <div className="h-px bg-[var(--c-border)]" />
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)]">Password</span>
                <Link href="/auth/reset-password" className="text-sm text-[var(--c-amber)] hover:opacity-80 transition-opacity">
                  Change password
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Saved Briefings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-text-3)]">
            Saved Briefings
          </p>
          <span className="text-[10px] text-[var(--c-text-3)]">{saved.length}</span>
        </div>
        {saved.length === 0 ? (
          <div className="rounded-xl border border-[var(--c-border)] p-6 text-center">
            <p className="text-sm text-[var(--c-text-3)]">No saved briefings yet.</p>
            <Link href="/briefings" className="inline-block mt-2 text-xs text-[var(--c-amber)] hover:opacity-80">
              Browse briefings →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {saved.map((row) => {
              const b = row.briefings;
              if (!b) return null;
              return (
                <Link
                  key={row.id}
                  href={`/briefings/${b.slug}`}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[var(--c-border)] hover:border-[var(--c-amber)]/40 transition-colors bg-[var(--c-surface)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--c-text-1)] leading-snug line-clamp-2 mb-1">{b.title}</p>
                    <p className="text-xs text-[var(--c-text-3)]">{formatDate(b.date)} · {b.reading_time} min read</p>
                  </div>
                  <span className="text-xs text-[var(--c-amber)] shrink-0 mt-0.5">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Reading History */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-text-3)]">
            Reading History
          </p>
          <span className="text-[10px] text-[var(--c-text-3)]">{history.length}</span>
        </div>
        {history.length === 0 ? (
          <div className="rounded-xl border border-[var(--c-border)] p-6 text-center">
            <p className="text-sm text-[var(--c-text-3)]">Start reading to build your history.</p>
            <Link href="/briefings" className="inline-block mt-2 text-xs text-[var(--c-amber)] hover:opacity-80">
              Read today&apos;s briefing →
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            {history.map((row) => {
              const b = row.briefings;
              if (!b) return null;
              const readDate = new Date(row.read_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
              return (
                <Link
                  key={row.id}
                  href={`/briefings/${b.slug}`}
                  className="flex items-center justify-between gap-4 py-3 border-b border-[var(--c-border)] last:border-b-0 hover:text-[var(--c-amber)] transition-colors group"
                >
                  <p className="text-sm text-[var(--c-text-1)] group-hover:text-[var(--c-amber)] transition-colors line-clamp-1 flex-1">{b.title}</p>
                  <span className="text-[10px] text-[var(--c-text-3)] shrink-0" style={{ fontFamily: "var(--font-geist-mono)" }}>
                    {readDate}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="mb-8 p-5 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-text-3)]">Preferences</p>
          <Link href="/account/preferences" className="text-xs text-[var(--c-amber)] hover:opacity-80 transition-opacity">
            Edit
          </Link>
        </div>
        {prefs && (prefs.markets.length > 0 || prefs.sectors.length > 0) ? (
          <div className="space-y-2">
            {prefs.markets.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {prefs.markets.map((m: string) => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--c-green-bg)] text-[var(--c-green)] font-medium">{m}</span>
                ))}
              </div>
            )}
            {prefs.sectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {prefs.sectors.map((s: string) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--c-text-3)]">
            No preferences set.{" "}
            <Link href="/account/preferences" className="text-[var(--c-amber)] hover:opacity-80">
              Set up your feed →
            </Link>
          </p>
        )}
      </div>

      <SignOutButton />
    </div>
  );
}
