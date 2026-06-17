"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

function formatJoined(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#F59E0B]/30 border-t-[#F59E0B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.email ?? "?")[0].toUpperCase();
  const joined = user.created_at ? formatJoined(user.created_at) : "—";

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-[1px] bg-[var(--c-amber)]" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-[var(--c-amber)] uppercase">
            Account
          </span>
        </div>
        <h1
          className="text-[2.5rem] leading-[1.06] text-[var(--c-text-1)]"
          style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
        >
          My Account
        </h1>
      </div>

      {/* Profile card */}
      <div className="border border-[var(--c-border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[var(--c-border)]">
          <div
            className="w-14 h-14 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] text-xl font-bold flex-shrink-0"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[var(--c-text-1)] font-medium">{user.email}</p>
            <p className="text-xs text-[var(--c-text-3)] mt-0.5" style={{ fontFamily: "var(--font-geist-mono)" }}>
              Member since {joined}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)]">Email</span>
            <span className="text-sm text-[var(--c-text-1)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
              {user.email}
            </span>
          </div>
          <div className="h-px bg-[var(--c-border)]" />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)]">Sign-in method</span>
            <span className="text-sm text-[var(--c-text-2)]">Magic link</span>
          </div>
          <div className="h-px bg-[var(--c-border)]" />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)]">Member since</span>
            <span className="text-sm text-[var(--c-text-2)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
              {joined}
            </span>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full h-11 rounded-lg border border-[var(--c-border)] text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-2)] hover:text-[var(--c-text-1)] hover:border-[var(--c-border-2)] transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
