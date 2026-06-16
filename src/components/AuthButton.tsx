"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
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

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="text-xs font-semibold tracking-[0.08em] uppercase text-[#4E6880] hover:text-[#F0ECE5] transition-colors duration-200 px-3 py-1.5 border border-[#132030] rounded-md hover:border-[#1E3A52]"
      >
        Sign in
      </Link>
    );
  }

  const initials = (user.email ?? "?")[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/30 transition-colors"
      >
        {initials}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-52 rounded-xl border border-[#132030] bg-[#040C1A]/95 backdrop-blur-xl shadow-xl py-1">
            <div className="px-3 py-2 border-b border-[#132030]">
              <p className="text-[10px] text-[#2A3F55] uppercase tracking-widest mb-0.5">Signed in as</p>
              <p className="text-xs text-[#F0ECE5] truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full text-left px-3 py-2 text-xs text-[#4E6880] hover:text-[#F0ECE5] hover:bg-[#091422] transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
