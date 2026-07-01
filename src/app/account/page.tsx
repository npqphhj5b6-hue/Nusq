import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { formatDate } from "@/lib/db";
import SettingsControls from "@/components/SettingsControls";

export const dynamic = "force-dynamic";

type SavedRow = {
  id: string;
  saved_at: string;
  briefings: { id: string; slug: string; title: string; date: string; reading_time: number; summary: string } | null;
};

type HistoryRow = {
  id: string;
  read_at: string;
  briefings: { id: string; slug: string; title: string; date: string; reading_time: number } | null;
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [savedResult, historyResult, prefsResult] = await Promise.all([
    supabase
      .from("saved_briefings")
      .select("id, saved_at, briefings(id, slug, title, date, reading_time, summary)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("reading_history")
      .select("id, read_at, briefings(id, slug, title, date, reading_time)")
      .eq("user_id", user.id)
      .order("read_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_preferences")
      .select("markets, sectors")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const saved = (savedResult.data ?? []) as unknown as SavedRow[];
  const history = (historyResult.data ?? []) as unknown as HistoryRow[];
  const prefs = prefsResult.data;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 32px 90px" }} className="page-enter">
      <Link
        href="/"
        className="back-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--c-text-2)] cursor-pointer"
        style={{ marginBottom: 28 }}
      >
        ← Back to briefings
      </Link>

      <h1
        style={{ margin: "0 0 32px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--c-text-1)" }}
      >
        Settings
      </h1>

      <SettingsControls />

      {/* Saved briefings — kept as an additional section beyond the base spec */}
      <div style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid var(--c-border)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--c-text-3)" }}>
            SAVED BRIEFINGS
          </div>
          <span style={{ fontSize: 12, color: "var(--c-text-3)" }}>{saved.length}</span>
        </div>
        {saved.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
            No saved briefings yet.{" "}
            <Link href="/briefings" style={{ color: "var(--c-accent)" }}>Browse briefings →</Link>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {saved.map((row) => {
              const b = row.briefings;
              if (!b) return null;
              return (
                <Link
                  key={row.id}
                  href={`/briefings/${b.slug}`}
                  className="card-glow"
                  style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", gap: 16 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p className="text-sm line-clamp-2" style={{ fontWeight: 600, color: "var(--c-text-1)", marginBottom: 4 }}>{b.title}</p>
                    <p className="text-xs" style={{ color: "var(--c-text-3)" }}>{formatDate(b.date)} · {b.reading_time} min read</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Reading history */}
      <div style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid var(--c-border)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--c-text-3)" }}>
            READING HISTORY
          </div>
          <span style={{ fontSize: 12, color: "var(--c-text-3)" }}>{history.length}</span>
        </div>
        {history.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
            Start reading to build your history.
          </p>
        ) : (
          <div className="flex flex-col">
            {history.map((row) => {
              const b = row.briefings;
              if (!b) return null;
              const readDate = new Date(row.read_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
              return (
                <Link
                  key={row.id}
                  href={`/briefings/${b.slug}`}
                  className="flex items-center justify-between gap-4 group"
                  style={{ padding: "10px 0", borderBottom: "1px solid var(--c-border)" }}
                >
                  <p className="text-sm line-clamp-1 flex-1 group-hover:text-[var(--c-accent)] transition-colors" style={{ color: "var(--c-text-1)" }}>{b.title}</p>
                  <span style={{ fontSize: 11, color: "var(--c-text-3)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                    {readDate}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid var(--c-border)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--c-text-3)" }}>
            PREFERENCES
          </div>
          <Link href="/account/preferences" style={{ fontSize: 12, color: "var(--c-accent)" }}>Edit</Link>
        </div>
        {prefs && (prefs.markets.length > 0 || prefs.sectors.length > 0) ? (
          <div className="flex flex-wrap gap-1.5">
            {[...prefs.markets, ...prefs.sectors].map((p: string) => (
              <span key={p} className="tag-pill">{p}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
            No preferences set.{" "}
            <Link href="/account/preferences" style={{ color: "var(--c-accent)" }}>Set up your feed →</Link>
          </p>
        )}
      </div>
    </div>
  );
}
