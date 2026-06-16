"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(null);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) { setError(error.message); setLoading(null); }
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
            {/* Social buttons */}
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-[#132030] bg-[#091422] hover:bg-[#0D1F35] hover:border-[#1E3A52] transition-colors text-[#F0ECE5] text-sm font-medium disabled:opacity-50"
            >
              {loading === "google" ? (
                <Spinner />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth("apple")}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-[#132030] bg-[#091422] hover:bg-[#0D1F35] hover:border-[#1E3A52] transition-colors text-[#F0ECE5] text-sm font-medium disabled:opacity-50"
            >
              {loading === "apple" ? (
                <Spinner />
              ) : (
                <AppleIcon />
              )}
              Continue with Apple
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-[#132030]" />
              <span className="text-[#2A3F55] text-xs uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-[#132030]" />
            </div>

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
                {loading === "email" ? <Spinner dark /> : "Send magic link"}
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
      <path d="M13.769 9.559c-.02-2.103 1.718-3.117 1.796-3.166--.977-1.43-2.496-1.626-3.039-1.647-1.297-.131-2.529.762-3.184.762-.655 0-1.672-.742-2.747-.722-1.415.02-2.72.824-3.447 2.094C1.45 9.401 2.4 13.483 4.06 15.697c.816 1.082 1.785 2.295 3.054 2.248 1.228-.049 1.69-.784 3.173-.784 1.483 0 1.896.784 3.191.761 1.316-.02 2.15-1.101 2.958-2.189.934-1.257 1.317-2.474 1.337-2.534-.03-.01-2.565-.982-2.585-3.9-.02-2.44 1.994-3.617 2.084-3.676-1.139-1.676-2.917-1.862-3.543-1.903zM11.44 2.53c.677-.82 1.134-1.956.01-3.092-1.098.044-2.426.733-3.123 1.554-.624.731-1.17 1.905-.966 3.02 1.22.094 2.47-.619 3.08-1.482z" fill="#F0ECE5"/>
    </svg>
  );
}
