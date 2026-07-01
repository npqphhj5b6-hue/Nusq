"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <Link
        href="/auth"
        className="btn-gradient"
        style={{
          padding: "9px 20px",
          borderRadius: 100,
          fontSize: 13,
          fontWeight: 700,
          background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-2))",
          color: "var(--c-accent-ink)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 3px 12px var(--c-accent-glow)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          display: "inline-block",
        }}
      >
        Sign in
      </Link>
    );
  }

  const initials = (user.email ?? user.user_metadata?.full_name ?? "?")
    .split(/[@\s]/)
    .filter(Boolean)
    .slice(0, 1)
    .map((s: string) => s[0].toUpperCase())
    .join("")
    .slice(0, 1);

  return (
    <Link href="/account" aria-label="My account">
      <div
        className="avatar-lift"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-2))",
          color: "var(--c-accent-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "var(--font-display)",
          boxShadow: "0 2px 10px var(--c-accent-glow)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
        }}
      >
        {initials}
      </div>
    </Link>
  );
}
