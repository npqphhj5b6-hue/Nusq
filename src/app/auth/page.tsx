"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 text-center">
          <span
            className="text-[2rem] font-bold text-[#F59E0B]"
            style={{ fontFamily: "var(--font-barlow)", letterSpacing: "-0.02em" }}
          >
            NUSQ
          </span>
          <p className="text-[#2A3F55] text-sm mt-2">
            Sign in to access your account
          </p>
        </div>

        {sent ? (
          <div className="text-center py-8 px-6 border border-[#132030] rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 10l5 5 10-10" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[#F0ECE5] font-medium mb-1">Check your inbox</p>
            <p className="text-[#2A3F55] text-sm">
              We sent a sign-in link to <span className="text-[#4E6880]">{email}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Magic link */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-[#132030] bg-[#091422] text-[#F0ECE5] placeholder-[#2A3F55] text-sm outline-none focus:border-[#F59E0B]/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!!loading || !email}
                className="w-full h-11 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] transition-colors text-[#040C1A] text-sm font-bold tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner dark /> : "Send magic link"}
              </button>
            </form>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <p className="text-[#2A3F55] text-xs text-center pt-1">
              No password needed — we'll email you a sign-in link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={dark ? "#040C1A" : "#F0ECE5"} strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M8 2a6 6 0 016 6" stroke={dark ? "#040C1A" : "#F59E0B"} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

