"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/update-password`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            className="text-[2rem] font-bold text-[var(--c-amber)]"
            style={{ fontFamily: "var(--font-barlow)", letterSpacing: "-0.02em" }}
          >
            NUSQ
          </span>
          <p className="text-[var(--c-text-3)] text-sm mt-2">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center py-8 px-6 border border-[var(--c-border)] rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 10l5 5 10-10" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[var(--c-text-1)] font-medium mb-1">Check your inbox</p>
            <p className="text-[var(--c-text-3)] text-sm">
              We sent a reset link to <span className="text-[var(--c-text-2)]">{email}</span>
            </p>
            <a
              href="/auth"
              className="inline-block mt-6 text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors"
            >
              ← Back to sign in
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text-1)] placeholder-[var(--c-text-3)] text-sm outline-none focus:border-[#F59E0B]/60 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full h-11 rounded-lg bg-[var(--c-amber)] hover:bg-[var(--c-amber-2)] transition-colors text-[#040C1A] text-sm font-bold tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ color: "#040C1A" }}
              >
                {loading ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="#040C1A" strokeOpacity="0.3" strokeWidth="2"/>
                    <path d="M8 2a6 6 0 016 6" stroke="#040C1A" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : "Send reset link"}
              </button>
            </form>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <p className="text-center pt-1">
              <a
                href="/auth"
                className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors"
              >
                ← Back to sign in
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
