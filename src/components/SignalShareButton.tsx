"use client";

import { useState } from "react";

interface Props {
  headline: string;
  detail: string;
  slug: string;
}

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL ?? "https://nusq.vercel.app";

export default function SignalShareButton({ headline, detail, slug }: Props) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${SITE_URL}/briefings/${slug}`;
    const text = detail ? `${headline}\n\n${detail}` : headline;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: headline, text, url });
      } catch {
        // user cancelled — do nothing
      }
      return;
    }

    // Desktop fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share signal"
      title={state === "copied" ? "Link copied!" : "Share"}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 opacity-60 hover:opacity-100 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      style={{
        background: "var(--c-surface-2)",
        border: "1px solid var(--c-border)",
        color: state === "copied" ? "var(--c-positive)" : "var(--c-text-3)",
      }}
    >
      {state === "copied" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}
