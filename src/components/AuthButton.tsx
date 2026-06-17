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
        className="text-xs font-semibold tracking-[0.08em] uppercase text-[#040C1A] bg-[var(--c-amber)] hover:bg-[var(--c-amber-2)] transition-colors duration-200 px-3 py-1.5 rounded-md"
        style={{ color: "#040C1A" }}
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
    .join("");

  return (
    <Link href="/account" aria-label="My account">
      <div
        className="w-8 h-8 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/25 transition-colors"
        style={{ fontFamily: "var(--font-barlow)" }}
      >
        {initials.slice(0, 2)}
      </div>
    </Link>
  );
}
