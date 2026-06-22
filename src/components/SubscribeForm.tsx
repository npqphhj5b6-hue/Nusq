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
          ? "You're already subscribed."
          : "You're in. Expect the first brief on the next weekday morning."
      );
      setEmail("");
    } catch {
      setState("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (state === "success") {
    return (
      <p className="text-sm text-[var(--c-text-2)]">
        {message}
      </p>
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
        className="text-sm px-4 py-2.5 rounded-lg border border-[var(--c-border-2)] bg-white text-[var(--c-text-1)] placeholder:text-[var(--c-text-3)] focus:outline-none focus:border-[var(--c-green)] transition-colors w-56 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={state === "loading" || !email}
        className="text-sm font-medium px-5 py-2.5 rounded-lg bg-[var(--c-green)] text-white hover:bg-[var(--c-green-2)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Subscribing…" : "Get the brief"}
      </button>
      {state === "error" && (
        <p className="w-full text-xs text-red-600 mt-1">{message}</p>
      )}
    </form>
  );
}
