"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { MARKETS, SECTORS } from "@/lib/preferences";

type Step = 1 | 2;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [markets, setMarkets] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function toggle(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

  async function finish(finalSectors: string[]) {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_preferences").upsert(
        { user_id: user.id, markets, sectors: finalSectors, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }
    router.push("/briefings");
    router.refresh();
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <span
            className="text-[2rem] font-bold text-[var(--c-amber)]"
            style={{ fontFamily: "var(--font-barlow)", letterSpacing: "-0.02em" }}
          >
            NUSQ
          </span>
          <p className="text-[var(--c-text-3)] text-sm mt-2">
            Step {step} of 2 — Personalise your feed
          </p>

          {/* Progress */}
          <div className="flex gap-1.5 justify-center mt-4">
            <div className={`h-1 w-12 rounded-full transition-colors ${step >= 1 ? "bg-[var(--c-amber)]" : "bg-[var(--c-border)]"}`} />
            <div className={`h-1 w-12 rounded-full transition-colors ${step >= 2 ? "bg-[var(--c-amber)]" : "bg-[var(--c-border)]"}`} />
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--c-text-1)] mb-1">What markets do you follow?</h2>
            <p className="text-sm text-[var(--c-text-3)] mb-6">Select all that apply.</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggle(m, markets, setMarkets)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    markets.includes(m)
                      ? "bg-[var(--c-amber)] border-[var(--c-amber)] text-[#040C1A]"
                      : "border-[var(--c-border)] text-[var(--c-text-2)] hover:border-[var(--c-amber)]/50"
                  }`}
                  style={{ color: markets.includes(m) ? "#040C1A" : undefined }}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-lg bg-[var(--c-amber)] hover:bg-[var(--c-amber-2)] transition-colors text-[#040C1A] text-sm font-bold disabled:opacity-50"
                style={{ color: "#040C1A" }}
              >
                Continue →
              </button>
              <button
                onClick={() => setStep(2)}
                className="h-11 px-5 rounded-lg border border-[var(--c-border)] text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--c-text-1)] mb-1">Which sectors interest you?</h2>
            <p className="text-sm text-[var(--c-text-3)] mb-6">Select all that apply.</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(s, sectors, setSectors)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    sectors.includes(s)
                      ? "bg-[var(--c-amber)] border-[var(--c-amber)] text-[#040C1A]"
                      : "border-[var(--c-border)] text-[var(--c-text-2)] hover:border-[var(--c-amber)]/50"
                  }`}
                  style={{ color: sectors.includes(s) ? "#040C1A" : undefined }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => finish(sectors)}
                disabled={saving}
                className="flex-1 h-11 rounded-lg bg-[var(--c-amber)] hover:bg-[var(--c-amber-2)] transition-colors text-[#040C1A] text-sm font-bold disabled:opacity-50 flex items-center justify-center"
                style={{ color: "#040C1A" }}
              >
                {saving ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="#040C1A" strokeOpacity="0.3" strokeWidth="2"/>
                    <path d="M8 2a6 6 0 016 6" stroke="#040C1A" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : "Finish →"}
              </button>
              <button
                onClick={() => finish([])}
                disabled={saving}
                className="h-11 px-5 rounded-lg border border-[var(--c-border)] text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors disabled:opacity-50"
              >
                Skip
              </button>
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-4 text-xs text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors block mx-auto"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
