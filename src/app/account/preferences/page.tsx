"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { MARKETS, SECTORS } from "@/lib/preferences";

export default function PreferencesPage() {
  const [markets, setMarkets] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSavedState] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/auth"); return; }
      const { data } = await supabase
        .from("user_preferences")
        .select("markets, sectors")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setMarkets(data.markets ?? []);
        setSectors(data.sectors ?? []);
      }
      setLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    setSavedState(false);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_preferences").upsert(
        { user_id: user.id, markets, sectors, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }
    setSaving(false);
    setSavedState(true);
  }

  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#F59E0B]/30 border-t-[#F59E0B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-8">
        <Link href="/account" className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors mb-6 block">
          ← My Account
        </Link>
        <h1
          className="text-[2rem] leading-[1.1] text-[var(--c-text-1)]"
          style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
        >
          Preferences
        </h1>
        <p className="text-sm text-[var(--c-text-3)] mt-2">
          Briefings that match your interests will be tagged "For You".
        </p>
      </div>

      {/* Markets */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-text-3)] mb-4">Markets</p>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((m) => (
            <button
              key={m}
              onClick={() => toggle(m, markets, setMarkets)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                markets.includes(m)
                  ? "bg-[var(--c-amber)] border-[var(--c-amber)] text-[#040C1A]"
                  : "border-[var(--c-border)] text-[var(--c-text-2)] hover:border-[var(--c-amber)]/50"
              }`}
              style={{ color: markets.includes(m) ? "#040C1A" : undefined }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Sectors */}
      <div className="mb-10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-text-3)] mb-4">Sectors</p>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => toggle(s, sectors, setSectors)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                sectors.includes(s)
                  ? "bg-[var(--c-amber)] border-[var(--c-amber)] text-[#040C1A]"
                  : "border-[var(--c-border)] text-[var(--c-text-2)] hover:border-[var(--c-amber)]/50"
              }`}
              style={{ color: sectors.includes(s) ? "#040C1A" : undefined }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="h-11 px-8 rounded-lg bg-[var(--c-amber)] hover:bg-[var(--c-amber-2)] transition-colors text-[#040C1A] text-sm font-bold disabled:opacity-50 flex items-center gap-2"
          style={{ color: "#040C1A" }}
        >
          {saving ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#040C1A" strokeOpacity="0.3" strokeWidth="2"/>
              <path d="M8 2a6 6 0 016 6" stroke="#040C1A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : "Save preferences"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-500">Saved ✓</span>
        )}
      </div>
    </div>
  );
}
