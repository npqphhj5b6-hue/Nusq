"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="w-full h-11 rounded-lg border border-[var(--c-border)] text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-2)] hover:text-[var(--c-text-1)] hover:border-[var(--c-border-2)] transition-colors"
    >
      Sign out
    </button>
  );
}
