"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/account");
    router.refresh();
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
          <p className="text-[var(--c-text-3)] text-sm mt-2">Choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-11 px-4 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text-1)] placeholder-[var(--c-text-3)] text-sm outline-none focus:border-[#F59E0B]/60 transition-colors"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full h-11 px-4 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text-1)] placeholder-[var(--c-text-3)] text-sm outline-none focus:border-[#F59E0B]/60 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full h-11 rounded-lg bg-[var(--c-amber)] hover:bg-[var(--c-amber-2)] transition-colors text-[#040C1A] text-sm font-bold tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ color: "#040C1A" }}
          >
            {loading ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#040C1A" strokeOpacity="0.3" strokeWidth="2"/>
                <path d="M8 2a6 6 0 016 6" stroke="#040C1A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : "Update password"}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-xs text-center mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
