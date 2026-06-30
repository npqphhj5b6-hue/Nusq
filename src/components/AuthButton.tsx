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
        className="text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all duration-150"
        style={{
          background: "var(--c-accent)",
          color: "var(--c-bg)",
          letterSpacing: "0.02em",
        }}
      >
        Sign in
      </Link>
    );
  }

  const initials = (user.email ?? user.user_metadata?.full_name ?? "?")
    .split(/[@\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0].toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <Link href="/account" aria-label="My account">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150"
        style={{
          background: "var(--c-accent-glow)",
          border: "1.5px solid var(--c-accent)",
          color: "var(--c-accent)",
        }}
      >
        {initials}
      </div>
    </Link>
  );
}
