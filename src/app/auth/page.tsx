"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Tab = "signin" | "signup";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? "Sign-in failed. Please try again." : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/briefings");
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      // Email confirmation disabled — user is signed in immediately
      router.push("/onboarding");
      router.refresh();
    } else {
      setSuccessMessage("Check your inbox to confirm your email, then sign in.");
      setTab("signin");
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  const isSignIn = tab === "signin";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span
            className="text-[2rem] font-bold text-[var(--c-amber)]"
            style={{ fontFamily: "var(--font-barlow)", letterSpacing: "-0.02em" }}
          >
            NUSQ
          </span>
          <p className="text-[var(--c-text-3)] text-sm mt-2">
            {isSignIn ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg border border-[var(--c-border)] p-0.5 mb-6 bg-[var(--c-surface)]">
          <button
            onClick={() => { setTab("signin"); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              isSignIn
                ? "bg-white dark:bg-[var(--c-bg)] text-[var(--c-text-1)] shadow-sm"
                : "text-[var(--c-text-3)] hover:text-[var(--c-text-2)]"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => { setTab("signup"); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              !isSignIn
                ? "bg-white dark:bg-[var(--c-bg)] text-[var(--c-text-1)] shadow-sm"
                : "text-[var(--c-text-3)] hover:text-[var(--c-text-2)]"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full h-11 mb-4 flex items-center justify-center gap-2.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] hover:border-[var(--c-border-2)] transition-colors text-sm text-[var(--c-text-1)] font-medium disabled:opacity-50"
        >
          {googleLoading ? (
            <Spinner dark={false} />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[var(--c-border)]" />
          <span className="text-[11px] text-[var(--c-text-3)]">or</span>
          <div className="flex-1 h-px bg-[var(--c-border)]" />
        </div>

        {/* Email + Password form */}
        <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text-1)] placeholder-[var(--c-text-3)] text-sm outline-none focus:border-[#F59E0B]/60 transition-colors"
          />
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-11 px-4 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text-1)] placeholder-[var(--c-text-3)] text-sm outline-none focus:border-[#F59E0B]/60 transition-colors"
            />
          </div>

          {isSignIn && (
            <div className="text-right">
              <a
                href="/auth/reset-password"
                className="text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors"
              >
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-11 rounded-lg bg-[var(--c-amber)] hover:bg-[var(--c-amber-2)] transition-colors text-[#040C1A] text-sm font-bold tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ color: "#040C1A" }}
          >
            {loading ? <Spinner dark /> : isSignIn ? "Sign in" : "Create account"}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-xs text-center mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function Spinner({ dark }: { dark: boolean }) {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={dark ? "#040C1A" : "currentColor"} strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M8 2a6 6 0 016 6" stroke={dark ? "#040C1A" : "currentColor"} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
