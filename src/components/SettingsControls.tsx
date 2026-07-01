"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useTheme } from "./ThemeProvider";

const NOTIFY_KEY = "nusq-notify-email";

export default function SettingsControls() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(NOTIFY_KEY);
    if (stored !== null) setNotify(stored === "true");
  }, []);

  function toggleNotify() {
    const next = !notify;
    setNotify(next);
    localStorage.setItem(NOTIFY_KEY, String(next));
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const lightActive = theme === "light";
  const darkActive = theme === "dark";

  return (
    <>
      {/* Appearance */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--c-text-3)", marginBottom: 12 }}>
          APPEARANCE
        </div>
        <div style={{ display: "inline-flex", padding: 4, borderRadius: 100, background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          <button
            onClick={() => { if (theme !== "light") toggle(); }}
            style={{
              cursor: "pointer",
              padding: "8px 20px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              background: lightActive ? "var(--c-accent)" : "transparent",
              color: lightActive ? "var(--c-accent-ink)" : "var(--c-text-2)",
              transition: "background 0.3s ease, color 0.3s ease",
            }}
          >
            Light
          </button>
          <button
            onClick={() => { if (theme !== "dark") toggle(); }}
            style={{
              cursor: "pointer",
              padding: "8px 20px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              background: darkActive ? "var(--c-accent)" : "transparent",
              color: darkActive ? "var(--c-accent-ink)" : "var(--c-text-2)",
              transition: "background 0.3s ease, color 0.3s ease",
            }}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ marginBottom: 36, paddingTop: 28, borderTop: "1px solid var(--c-border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--c-text-3)", marginBottom: 16 }}>
          NOTIFICATIONS
        </div>
        <div className="flex items-center justify-between">
          <div style={{ fontSize: 14.5, color: "var(--c-text-1)" }}>Daily briefing email</div>
          <button
            onClick={toggleNotify}
            aria-label="Toggle daily briefing email"
            style={{
              cursor: "pointer",
              width: 44,
              height: 26,
              borderRadius: 100,
              background: notify ? "var(--c-accent)" : "var(--c-border)",
              position: "relative",
              transition: "background 0.3s ease, box-shadow 0.3s ease",
              boxShadow: notify ? "0 0 0 4px var(--c-accent-glow)" : "0 0 0 0 transparent",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: notify ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.3s cubic-bezier(.34,1.56,.64,1)",
                boxShadow: "0 1px 3px rgba(0,0,0,.25)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Account */}
      <div style={{ paddingTop: 28, borderTop: "1px solid var(--c-border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--c-text-3)", marginBottom: 16 }}>
          ACCOUNT
        </div>
        <button
          onClick={signOut}
          className="signout-pill"
          style={{
            cursor: "pointer",
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 100,
            border: "1px solid var(--c-border)",
            color: "var(--c-text-1)",
            fontSize: 13.5,
            fontWeight: 600,
            background: "transparent",
            transition: "border-color 0.25s ease, color 0.25s ease, background 0.25s ease",
          }}
        >
          Sign out
        </button>
      </div>
    </>
  );
}
