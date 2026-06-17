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
  }, []);

  if (!user) {
    return (
      <Link
        href="/auth"
        className="text-xs font-semibold tracking-[0.08em] uppercase text-[#040C1A] bg-[#F59E0B] hover:bg-[#D97706] transition-colors duration-200 px-3 py-1.5 rounded-md"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="text-xs font-semibold tracking-[0.08em] uppercase text-[#040C1A] bg-[#F59E0B] hover:bg-[#D97706] transition-colors duration-200 px-3 py-1.5 rounded-md"
    >
      My Account
    </Link>
  );
}
