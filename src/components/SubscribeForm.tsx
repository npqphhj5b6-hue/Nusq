"use client";

import { useState } from "react";

interface Props {
  variant?: "hero" | "inline";
}

export default function SubscribeForm({ variant = "hero" }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }

      setState("success");
      setMessage(
        data.status === "already_subscribed"
          ? "You're already on the list."
          : "You're in. Check your inbox to confirm."
      );
      setEmail("");
    } catch {
      setState("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-2.5" style={{ padding: variant === "hero" ? "16px 0" : 0 }}>
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--c-accent)", color: "var(--c-accent-ink)", fontSize: 11, fontWeight: 700 }}
        >
          ✓
        </span>
        <p style={{ fontSize: 14.5, color: "var(--c-text-1)" }}>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-stretch gap-2.5 flex-wrap">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        disabled={state === "loading"}
        aria-label="Email address"
        className="input-nusq"
        style={{ flex: "1 1 220px", minWidth: 0 }}
      />
      <button
        type="submit"
        disabled={state === "loading" || !email}
        className="btn-gradient"
        style={{
          flex: "none",
          padding: "0 22px",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-2))",
          color: "var(--c-accent-ink)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 3px 12px var(--c-accent-glow)",
          opacity: state === "loading" || !email ? 0.6 : 1,
          cursor: state === "loading" || !email ? "default" : "pointer",
        }}
      >
        {state === "loading" ? "Subscribing…" : "Get the free briefing"}
      </button>
      {state === "error" && (
        <p className="w-full" style={{ fontSize: 12.5, color: "var(--c-negative)", margin: 0 }}>{message}</p>
      )}
    </form>
  );
}
