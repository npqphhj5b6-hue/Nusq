"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  briefingId: string;
  initialSaved: boolean;
}

export default function BookmarkButton({ briefingId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (loading) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    setLoading(true);
    if (saved) {
      await supabase
        .from("saved_briefings")
        .delete()
        .eq("user_id", user.id)
        .eq("briefing_id", briefingId);
      setSaved(false);
    } else {
      await supabase
        .from("saved_briefings")
        .insert({ user_id: user.id, briefing_id: briefingId });
      setSaved(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove bookmark" : "Bookmark this briefing"}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--c-border)] hover:border-[var(--c-amber)]/50 transition-colors disabled:opacity-50"
    >
      {saved ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 1.5h8a.5.5 0 01.5.5v10.5l-4.5-2.5L2.5 12.5V2a.5.5 0 01.5-.5z" fill="var(--c-amber)" stroke="var(--c-amber)" strokeWidth="1.25" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 1.5h8a.5.5 0 01.5.5v10.5l-4.5-2.5L2.5 12.5V2a.5.5 0 01.5-.5z" stroke="var(--c-text-3)" strokeWidth="1.25" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}
