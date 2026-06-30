"use client";

import { useState } from "react";

export default function SubscribeForm() {
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
          : "You're in. Check your inbox — your welcome email is on its way."
      );
      setEmail("");
    } catch {
      setState("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-2.5">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--c-positive)", fontSize: 11 }}
        >
          ✓
        </span>
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        disabled={state === "loading"}
        className="text-sm px-4 py-2.5 rounded-xl outline-none transition-all w-52"
        style={{
          background: "var(--c-surface-2)",
          border: "1px solid var(--c-border-2)",
          color: "var(--c-text-1)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--c-accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--c-border-2)")}
      />
      <button
        type="submit"
        disabled={state === "loading" || !email}
        className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 disabled:opacity-50"
        style={{
          background: "var(--c-accent)",
          color: "var(--c-bg)",
        }}
      >
        {state === "loading" ? "Subscribing…" : "Get the brief"}
      </button>
      {state === "error" && (
        <p className="w-full text-xs mt-1" style={{ color: "var(--c-negative)" }}>{message}</p>
      )}
    </form>
  );
}
