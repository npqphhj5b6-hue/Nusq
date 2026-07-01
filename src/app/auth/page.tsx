"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
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
    router.push("/");
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
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "110px 32px 90px" }} className="page-enter">
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 27, letterSpacing: "-0.02em", color: "var(--c-text-1)", marginBottom: 10 }}>
          {isSignIn ? "Welcome back" : "Create your account"}
        </div>
        <div style={{ fontSize: 14, color: "var(--c-text-2)" }}>
          {isSignIn ? "Sign in to keep your streak going." : "Join Nusq for the daily MENA markets brief."}
        </div>
      </div>

      <form
        onSubmit={isSignIn ? handleSignIn : handleSignUp}
        className="glass-card"
        style={{ display: "flex", flexDirection: "column", gap: 14, padding: 28 }}
      >
        {/* Tabs */}
        <div className="flex" style={{ padding: 4, borderRadius: 100, background: "var(--c-bg)", border: "1px solid var(--c-border)", marginBottom: 4 }}>
          <button
            type="button"
            onClick={() => { setTab("signin"); setError(null); setSuccessMessage(null); }}
            style={{
              flex: 1,
              cursor: "pointer",
              padding: "8px 0",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              background: isSignIn ? "var(--c-accent)" : "transparent",
              color: isSignIn ? "var(--c-accent-ink)" : "var(--c-text-2)",
              transition: "background 0.3s ease, color 0.3s ease",
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setError(null); setSuccessMessage(null); }}
            style={{
              flex: 1,
              cursor: "pointer",
              padding: "8px 0",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              background: !isSignIn ? "var(--c-accent)" : "transparent",
              color: !isSignIn ? "var(--c-accent-ink)" : "var(--c-text-2)",
              transition: "background 0.3s ease, color 0.3s ease",
            }}
          >
            Create account
          </button>
        </div>

        {successMessage && (
          <div style={{ padding: 12, borderRadius: 10, background: "var(--c-accent-glow)", color: "var(--c-accent)", fontSize: 12.5 }}>
            {successMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="input-nusq"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", fontWeight: 600, opacity: googleLoading ? 0.5 : 1 }}
        >
          {googleLoading ? <Spinner /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
          <span style={{ fontSize: 11, color: "var(--c-text-3)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-nusq"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="input-nusq"
        />

        {isSignIn && (
          <div style={{ textAlign: "right" }}>
            <Link href="/auth/reset-password" style={{ fontSize: 12, color: "var(--c-text-3)" }}>
              Forgot password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="btn-gradient"
          style={{
            cursor: "pointer",
            marginTop: 6,
            padding: "14px 16px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-2))",
            color: "var(--c-accent-ink)",
            fontSize: 14.5,
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 4px 14px var(--c-accent-glow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: loading || !email || !password ? 0.5 : 1,
          }}
        >
          {loading ? <Spinner /> : isSignIn ? "Sign in" : "Create account"}
        </button>

        {error && (
          <p style={{ color: "var(--c-negative)", fontSize: 12, textAlign: "center" }}>{error}</p>
        )}
      </form>

      <Link
        href="/"
        className="back-link"
        style={{ display: "block", textAlign: "center", marginTop: 22, fontSize: 13, color: "var(--c-text-3)" }}
      >
        ← Back to briefings
      </Link>
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

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
